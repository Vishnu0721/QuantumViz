import sys
print('sys.path[0]:', sys.path[0])

try:
    import qiskit
    print('qiskit:', qiskit.__spec__)
    print('qiskit path:', getattr(qiskit, '__path__', None))
except Exception as e:
    print('import qiskit failed:', repr(e))

try:
    from qiskit.circuit import QuantumCircuit
    qc = QuantumCircuit(2)
    qc.h(0)
    qc.cx(0,1)
    print('QuantumCircuit OK, depth:', qc.depth())
except Exception as e:
    print('qiskit.circuit import failed:', repr(e))

try:
    import qiskit_qasm2 as qasm2
    print('qasm2 OK, dump size:', len(qasm2.dumps(QuantumCircuit(1))))
except Exception as e:
    print('qiskit_qasm2 import failed:', repr(e))


