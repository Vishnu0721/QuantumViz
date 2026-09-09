import streamlit as st
import numpy as np

try:
    # When running via `streamlit run app/app.py`
    from app.quantum import (
        load_circuit_from_qasm,
        get_statevector,
        compute_single_qubit_reductions,
        to_qasm2,
    )
    from app.visuals import create_bloch_figure
except Exception:
    # When running from within the `app` directory or other contexts
    from quantum import (
        load_circuit_from_qasm,
        get_statevector,
        compute_single_qubit_reductions,
        to_qasm2,
    )
    from visuals import create_bloch_figure


st.set_page_config(page_title="Qubit Bloch Visualizer", layout="wide")


def _example_qasm_samples():
    examples = {
        "2-qubit Bell (|Φ+⟩)": (
            """OPENQASM 2.0;\ninclude \"qelib1.inc\";\nqreg q[2];\nh q[0];\ncx q[0],q[1];\n"""
        ),
        "3-qubit GHZ": (
            """OPENQASM 2.0;\ninclude \"qelib1.inc\";\nqreg q[3];\nh q[0];\ncx q[0],q[1];\ncx q[1],q[2];\n"""
        ),
        "3-qubit product state (rotations)": (
            """OPENQASM 2.0;\ninclude \"qelib1.inc\";\nqreg q[3];\nrx(0.8) q[0];\nry(1.1) q[1];\nrz(1.6) q[2];\n"""
        ),
        "4-qubit entangled chain": (
            """OPENQASM 2.0;\ninclude \"qelib1.inc\";\nqreg q[4];\nh q[0];\ncx q[0],q[1];\ncx q[1],q[2];\ncx q[2],q[3];\n"""
        ),
    }
    return examples


def main():
    st.title("Single-Qubit Mixed States on the Bloch Sphere")
    st.caption(
        "Paste an OpenQASM 2.0 circuit or upload a .qasm file. "
        "We'll simulate the state, partial trace each qubit, and display its Bloch vector."
    )

    with st.sidebar:
        st.header("Inputs")
        examples = _example_qasm_samples()
        selected_example = st.selectbox("Example circuits", list(examples.keys()))
        example_qasm = examples[selected_example]

        uploaded = st.file_uploader("Upload .qasm file", type=["qasm"]) 
        st.markdown("Or paste/edit QASM below:")
    
    default_qasm = example_qasm
    qasm_text = st.text_area(
        "OpenQASM 2.0",
        value=default_qasm,
        height=220,
        help="Use OpenQASM 2.0 with qelib1.inc; measurements are ignored.",
    )

    if uploaded is not None:
        try:
            qasm_text = uploaded.read().decode("utf-8")
        except Exception as e:
            st.error(f"Failed to read uploaded file: {e}")

    col_run, col_info = st.columns([1, 3])
    with col_run:
        run = st.button("Simulate and Visualize", type="primary")
    with col_info:
        st.write(
            "Supports a common OpenQASM 2.0 subset: x,y,z,h,s,sdg,t,tdg,rx,ry,rz,cx,cz,swap."
        )

    if not run:
        st.stop()

    # Parse and simulate
    try:
        circuit = load_circuit_from_qasm(qasm_text)
    except Exception as e:
        st.error(f"Error parsing QASM: {e}")
        st.stop()

    try:
        statevector = get_statevector(circuit)
    except Exception as e:
        st.error(f"State simulation failed: {e}")
        st.stop()

    # Compute single-qubit reductions and Bloch vectors
    try:
        qubit_infos = compute_single_qubit_reductions(statevector)
    except Exception as e:
        st.error(f"Partial trace failed: {e}")
        st.stop()

    num_qubits = len(qubit_infos)
    st.subheader(f"Circuit: {num_qubits} qubit(s)")
    # With the lightweight parser, just echo the input QASM for now
    st.code(qasm_text, language="qasm")

    # Grid the Bloch spheres
    cols_per_row = 3 if num_qubits >= 3 else num_qubits
    rows = (num_qubits + cols_per_row - 1) // cols_per_row

    idx = 0
    for r in range(rows):
        cols = st.columns(cols_per_row)
        for c in range(cols_per_row):
            if idx >= num_qubits:
                break
            info = qubit_infos[idx]
            with cols[c]:
                st.markdown(f"**Qubit {idx}**")
                fig = create_bloch_figure(info["bloch_vector"], title=f"q[{idx}]")
                st.plotly_chart(fig, use_container_width=True, config={"displayModeBar": False})
                purity = info["purity"]
                r = np.linalg.norm(info["bloch_vector"])  # length of Bloch vector
                st.caption(
                    f"Bloch = ({info['bloch_vector'][0]:.3f}, {info['bloch_vector'][1]:.3f}, {info['bloch_vector'][2]:.3f})  |  "
                    f"‖r‖ = {r:.3f}  |  purity Tr(ρ²) = {purity:.3f}"
                )
                with st.expander("ρ (density matrix)"):
                    rho = info["rho"]
                    st.write(np.round(rho, 6))
            idx += 1

    st.success("Done.")


if __name__ == "__main__":
    main()


