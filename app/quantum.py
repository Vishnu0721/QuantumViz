from __future__ import annotations

import re
import numpy as np
from dataclasses import dataclass
from typing import Dict, Any, List, Tuple, Optional


# -----------------------------
# Minimal circuit representation
# -----------------------------

@dataclass
class Operation:
    name: str
    qubits: Tuple[int, ...]
    params: Tuple[float, ...] = ()


@dataclass
class SimpleCircuit:
    num_qubits: int
    ops: List[Operation]
    source_qasm: str


# -----------------------------
# QASM parsing (subset of OpenQASM 2.0)
# -----------------------------

_GATE_NO_PARAM = {
    "x", "y", "z", "h", "s", "sdg", "t", "tdg", "cx", "cz", "swap",
}
_GATE_WITH_PARAM = {
    "rx", "ry", "rz",
}


def _strip_comments(text: str) -> str:
    lines = []
    for line in text.splitlines():
        if "//" in line:
            line = line.split("//", 1)[0]
        lines.append(line)
    return "\n".join(lines)


def load_circuit_from_qasm(qasm_text: str) -> SimpleCircuit:
    text = _strip_comments(qasm_text)
    tokens = [t.strip() for t in text.split(";") if t.strip()]

    num_qubits: Optional[int] = None
    ops: List[Operation] = []

    qreg_pattern = re.compile(r"^qreg\\s+q\\[(\\d+)\\]$")
    qref = re.compile(r"q\\[(\\d+)\\]")

    for token in tokens:
        if token.startswith("OPENQASM") or token.startswith("include "):
            continue

        m = qreg_pattern.match(token)
        if m:
            num_qubits = int(m.group(1))
            continue

        if token.startswith("measure ") or token.startswith("barrier") or token.startswith("reset "):
            # ignore non-unitaries for state simulation
            continue

        # Parse gates
        # Handle parameterized: name(params) q[i]; or two-qubit: name q[i],q[j]
        gate_name = None
        params: Tuple[float, ...] = ()
        arg_str = None

        if "(" in token:
            # e.g., rx(0.5) q[0]
            gname, rest = token.split("(", 1)
            gate_name = gname.strip()
            pstr, rest2 = rest.split(")", 1)
            params = tuple(float(x.strip()) for x in pstr.split(",") if x.strip())
            arg_str = rest2.strip()
        else:
            # e.g., cx q[0],q[1] or h q[0]
            parts = token.split()
            if not parts:
                continue
            gate_name = parts[0]
            arg_str = " ".join(parts[1:])

        gate_name = gate_name.lower()
        if gate_name not in _GATE_NO_PARAM and gate_name not in _GATE_WITH_PARAM:
            raise ValueError(f"Unsupported gate: {gate_name}")

        qubit_ids = [int(m.group(1)) for m in qref.finditer(arg_str or "")]

        if num_qubits is None:
            raise ValueError("qreg must be declared before gates")
        if any(q < 0 or q >= num_qubits for q in qubit_ids):
            raise ValueError("Qubit index out of range")

        if gate_name in _GATE_WITH_PARAM:
            if len(params) != 1 or len(qubit_ids) != 1:
                raise ValueError(f"Gate {gate_name} expects 1 parameter and 1 qubit")
            ops.append(Operation(gate_name, (qubit_ids[0],), (params[0],)))
        else:
            # No-parameter gates
            if gate_name in {"cx", "cz", "swap"}:
                if len(qubit_ids) != 2:
                    raise ValueError(f"Gate {gate_name} expects 2 qubits")
                ops.append(Operation(gate_name, (qubit_ids[0], qubit_ids[1])))
            else:
                if len(qubit_ids) != 1:
                    raise ValueError(f"Gate {gate_name} expects 1 qubit")
                ops.append(Operation(gate_name, (qubit_ids[0],)))

    if num_qubits is None:
        raise ValueError("No qreg found in QASM")

    return SimpleCircuit(num_qubits=num_qubits, ops=ops, source_qasm=qasm_text)


# -----------------------------
# Fast statevector simulator
# -----------------------------

def _apply_single_qubit_unitary(state: np.ndarray, num_qubits: int, target: int, U: np.ndarray) -> None:
    # Iterate pairs differing at target bit
    bit = 1 << target
    size = state.size
    for i in range(0, size, bit << 1):
        for j in range(bit):
            i0 = i + j
            i1 = i0 + bit
            a0 = state[i0]
            a1 = state[i1]
            state[i0] = U[0, 0] * a0 + U[0, 1] * a1
            state[i1] = U[1, 0] * a0 + U[1, 1] * a1


def _apply_cx(state: np.ndarray, num_qubits: int, control: int, target: int) -> None:
    if control == target:
        return
    cbit = 1 << control
    tbit = 1 << target
    size = state.size
    # Iterate over all indices where control bit is 1, swap amplitudes at target bit
    for base in range(size):
        if (base & cbit) == 0:
            continue
        j = base ^ tbit
        if j > base:
            state[base], state[j] = state[j], state[base]


def _apply_cz(state: np.ndarray, num_qubits: int, control: int, target: int) -> None:
    if control == target:
        return
    cbit = 1 << control
    tbit = 1 << target
    size = state.size
    for idx in range(size):
        if (idx & cbit) and (idx & tbit):
            state[idx] = -state[idx]


def _apply_swap(state: np.ndarray, num_qubits: int, q0: int, q1: int) -> None:
    if q0 == q1:
        return
    bit0 = 1 << q0
    bit1 = 1 << q1
    size = state.size
    for idx in range(size):
        j = idx ^ bit0 ^ bit1
        if j > idx and (((idx & bit0) >> q0) != ((idx & bit1) >> q1)):
            state[idx], state[j] = state[j], state[idx]


def get_statevector(circuit: SimpleCircuit) -> np.ndarray:
    num_qubits = circuit.num_qubits
    state = np.zeros(1 << num_qubits, dtype=complex)
    state[0] = 1.0

    X = np.array([[0, 1], [1, 0]], dtype=complex)
    Y = np.array([[0, -1j], [1j, 0]], dtype=complex)
    Z = np.array([[1, 0], [0, -1]], dtype=complex)
    H = (1 / np.sqrt(2)) * np.array([[1, 1], [1, -1]], dtype=complex)
    S = np.array([[1, 0], [0, 1j]], dtype=complex)
    SDG = np.array([[1, 0], [0, -1j]], dtype=complex)
    T = np.array([[1, 0], [0, np.exp(1j * np.pi / 4)]], dtype=complex)
    TDG = np.array([[1, 0], [0, np.exp(-1j * np.pi / 4)]], dtype=complex)

    for op in circuit.ops:
        name = op.name
        if name == "x":
            _apply_single_qubit_unitary(state, num_qubits, op.qubits[0], X)
        elif name == "y":
            _apply_single_qubit_unitary(state, num_qubits, op.qubits[0], Y)
        elif name == "z":
            _apply_single_qubit_unitary(state, num_qubits, op.qubits[0], Z)
        elif name == "h":
            _apply_single_qubit_unitary(state, num_qubits, op.qubits[0], H)
        elif name == "s":
            _apply_single_qubit_unitary(state, num_qubits, op.qubits[0], S)
        elif name == "sdg":
            _apply_single_qubit_unitary(state, num_qubits, op.qubits[0], SDG)
        elif name == "t":
            _apply_single_qubit_unitary(state, num_qubits, op.qubits[0], T)
        elif name == "tdg":
            _apply_single_qubit_unitary(state, num_qubits, op.qubits[0], TDG)
        elif name == "rx":
            theta = op.params[0]
            c = np.cos(theta / 2.0)
            s = -1j * np.sin(theta / 2.0)
            U = np.array([[c, s], [s, c]], dtype=complex)
            _apply_single_qubit_unitary(state, num_qubits, op.qubits[0], U)
        elif name == "ry":
            theta = op.params[0]
            c = np.cos(theta / 2.0)
            s = np.sin(theta / 2.0)
            U = np.array([[c, -s], [s, c]], dtype=complex)
            _apply_single_qubit_unitary(state, num_qubits, op.qubits[0], U)
        elif name == "rz":
            theta = op.params[0]
            U = np.array([[np.exp(-1j * theta / 2.0), 0], [0, np.exp(1j * theta / 2.0)]], dtype=complex)
            _apply_single_qubit_unitary(state, num_qubits, op.qubits[0], U)
        elif name == "cx":
            _apply_cx(state, num_qubits, op.qubits[0], op.qubits[1])
        elif name == "cz":
            _apply_cz(state, num_qubits, op.qubits[0], op.qubits[1])
        elif name == "swap":
            _apply_swap(state, num_qubits, op.qubits[0], op.qubits[1])
        else:
            raise ValueError(f"Unsupported gate at simulation: {name}")

    return state


def compute_single_qubit_reductions(statevector: np.ndarray) -> List[Dict[str, Any]]:
    amplitudes = np.asarray(statevector, dtype=complex)
    dimension = amplitudes.size
    num_qubits = int(np.log2(dimension))

    sx = np.array([[0, 1], [1, 0]], dtype=complex)
    sy = np.array([[0, -1j], [1j, 0]], dtype=complex)
    sz = np.array([[1, 0], [0, -1]], dtype=complex)

    results: List[Dict[str, Any]] = []

    for target in range(num_qubits):
        rho00 = 0.0 + 0.0j
        rho11 = 0.0 + 0.0j
        rho01 = 0.0 + 0.0j

        low_mask = (1 << target) - 1
        for r in range(dimension >> 1):
            i0 = ((r >> target) << (target + 1)) | (r & low_mask)
            i1 = i0 | (1 << target)
            a0 = amplitudes[i0]
            a1 = amplitudes[i1]
            rho00 += a0 * np.conjugate(a0)
            rho11 += a1 * np.conjugate(a1)
            rho01 += a0 * np.conjugate(a1)

        rho = np.array([[rho00, rho01], [np.conjugate(rho01), rho11]], dtype=complex)
        rho = np.where(np.abs(rho) < 1e-15, 0.0, rho)

        rx = float(np.real(np.trace(rho @ sx)))
        ry = float(np.real(np.trace(rho @ sy)))
        rz = float(np.real(np.trace(rho @ sz)))
        bloch = np.array([rx, ry, rz], dtype=float)

        purity = float(np.real(np.trace(rho @ rho)))

        results.append({
            "rho": rho,
            "bloch_vector": bloch,
            "purity": purity,
        })

    return results


