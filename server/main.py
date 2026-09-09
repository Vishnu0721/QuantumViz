from __future__ import annotations

from typing import List, Dict, Any, Optional

from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

import numpy as np

from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector, DensityMatrix, partial_trace, Pauli


app = FastAPI(title="Live Bloch API", version="1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PrepareRequest(BaseModel):
    qasm: Optional[str] = None
    frames_per_step: int = 30


class FrameResponse(BaseModel):
    i: int
    n: int
    bloch: List[List[float]]


def bloch_vector(rho: DensityMatrix) -> List[float]:
    paulis = [Pauli("X"), Pauli("Y"), Pauli("Z")]
    vec = []
    for p in paulis:
        v = np.real(np.trace(rho.data @ p.to_matrix()))
        vec.append(float(v))
    return vec


def circuit_states(circuit: QuantumCircuit) -> List[Statevector]:
    """Return the sequence of statevectors after each instruction.

    Includes initial |0...0>, and the final state after all instructions.
    """
    states: List[Statevector] = [Statevector.from_label("0" * circuit.num_qubits)]
    running = QuantumCircuit(circuit.num_qubits)
    for instr, qargs, cargs in circuit.data:
        if instr.name in {"measure", "barrier", "reset", "snapshot", "delay", "initialize"}:
            continue
        running.append(instr, qargs, cargs)
        states.append(Statevector.from_instruction(running))
    return states


def interpolate(psi1: Statevector, psi2: Statevector, steps: int) -> List[Statevector]:
    """Simple linear interpolation of statevectors, re-normalized.
    Not unitary, but good for visualization between steps.
    """
    res: List[Statevector] = []
    v1 = np.asarray(psi1.data, dtype=complex)
    v2 = np.asarray(psi2.data, dtype=complex)
    for t in np.linspace(0.0, 1.0, steps, endpoint=False):
        vt = (1.0 - t) * v1 + t * v2
        vt = vt / np.linalg.norm(vt)
        res.append(Statevector(vt))
    return res


def single_qubit_rhos(psi: Statevector) -> List[DensityMatrix]:
    dm = DensityMatrix(psi)
    rhos: List[DensityMatrix] = []
    n = psi.num_qubits
    for target in range(n):
        traced = partial_trace(dm, [i for i in range(n) if i != target])
        rhos.append(DensityMatrix(traced))
    return rhos


def default_bell() -> QuantumCircuit:
    qc = QuantumCircuit(2)
    qc.h(0)
    qc.cx(0, 1)
    return qc


class FrameStore:
    def __init__(self):
        self.frames: List[List[List[float]]] = []  # [frame_idx][qubit_idx][xyz]
        self.i: int = 0

    def prepare(self, circuit: QuantumCircuit, frames_per_step: int = 30):
        states = circuit_states(circuit)
        interpolated: List[Statevector] = []
        for a, b in zip(states[:-1], states[1:]):
            interpolated.extend(interpolate(a, b, frames_per_step))
        # include the exact final state
        interpolated.append(states[-1])

        frames: List[List[List[float]]] = []
        for sv in interpolated:
            rhos = single_qubit_rhos(sv)
            blochs = [bloch_vector(rho) for rho in rhos]
            frames.append(blochs)

        self.frames = frames
        self.i = 0

    def frame(self, idx: Optional[int] = None) -> FrameResponse:
        if not self.frames:
            # lazy default
            self.prepare(default_bell(), frames_per_step=30)
        if idx is None:
            idx = self.i
            self.i = (self.i + 1) % len(self.frames)
        idx = max(0, min(idx, len(self.frames) - 1))
        return FrameResponse(i=idx, n=len(self.frames), bloch=self.frames[idx])


STORE = FrameStore()


@app.get("/api/frame", response_model=FrameResponse)
def get_frame(i: Optional[int] = None):
    return STORE.frame(i)


@app.post("/api/prepare", response_model=Dict[str, Any])
def post_prepare(req: PrepareRequest):
    if req.qasm:
        circ = QuantumCircuit.from_qasm_str(req.qasm)
    else:
        circ = default_bell()
    STORE.prepare(circ, frames_per_step=max(5, int(req.frames_per_step)))
    return {"frames": len(STORE.frames), "qubits": circ.num_qubits}


@app.get("/")
def root():
    return {"ok": True, "endpoints": ["GET /api/frame?i=0", "POST /api/prepare"]}


