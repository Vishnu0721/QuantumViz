# Advanced Quantum Bloch Visualizer

This is an advanced quantum circuit simulator with 3D Bloch sphere visualization capabilities, built using React and Three.js.

## 🚀 Features

- **Multi-Qubit Support**: Simulate circuits with 1-5 qubits
- **Advanced Quantum Gates**: H, X, Y, Z, RX, RY, RZ, CNOT, SWAP
- **Real-time Simulation**: Instant quantum state calculation
- **Bloch Vector Visualization**: See qubit states in 3D space
- **Partial Trace Calculation**: Extract single-qubit reduced density matrices
- **Modern UI**: Beautiful, responsive interface with Tailwind CSS

## 🌐 Access URLs

### **React Quantum Visualizer (New):**
- **http://127.0.0.1:5500/web/react-quantum.html**

### **Original Web Interface:**
- **http://127.0.0.1:5500/web/index.html**

### **API Backend:**
- **http://127.0.0.1:8000/** (FastAPI)

## 🎯 How to Use

### 1. **Set Number of Qubits**
- Choose 1-5 qubits (recommended for performance)

### 2. **Enter Circuit Operations**
Each line should follow the format: `GATE_NAME qubit_index [control_qubit_index]`

**Examples:**
```
H 0                    # Hadamard gate on qubit 0
X 1                    # X gate on qubit 1
CNOT 0 1              # CNOT with control=0, target=1
RX 1.57 2             # Rotation X by 1.57 radians on qubit 2
RY 0.785 0            # Rotation Y by 0.785 radians on qubit 0
```

### 3. **Supported Gates**

| Gate | Description | Parameters | Example |
|------|-------------|------------|---------|
| H | Hadamard | None | `H 0` |
| X | Pauli-X | None | `X 1` |
| Y | Pauli-Y | None | `Y 2` |
| Z | Pauli-Z | None | `Z 0` |
| RX | Rotation X | Angle (radians) | `RX 1.57 1` |
| RY | Rotation Y | Angle (radians) | `RY 0.785 0` |
| RZ | Rotation Z | Angle (radians) | `RZ 2.356 2` |
| CNOT | Controlled NOT | Control, Target | `CNOT 0 1` |
| SWAP | Swap qubits | Qubit1, Qubit2 | `SWAP 1 2` |

### 4. **Run Simulation**
- Click "Run Simulation" button
- View results in the Bloch sphere visualizations below

## 🔬 Example Circuits

### **Bell State (2 qubits):**
```
H 0
CNOT 0 1
```

### **GHZ State (3 qubits):**
```
H 0
CNOT 0 1
CNOT 1 2
```

### **3-Qubit Product State:**
```
RX 0.8 0
RY 1.1 1
RZ 1.6 2
```

### **4-Qubit Entangled Chain:**
```
H 0
CNOT 0 1
CNOT 1 2
CNOT 2 3
```

## 📊 Understanding Results

### **Bloch Vector Components:**
- **X-component (rx)**: Real part of off-diagonal density matrix elements
- **Y-component (ry)**: Imaginary part of off-diagonal density matrix elements  
- **Z-component (rz)**: Difference between diagonal density matrix elements

### **Physical Interpretation:**
- **|0⟩ state**: Bloch vector points to +Z direction (0, 0, 1)
- **|1⟩ state**: Bloch vector points to -Z direction (0, 0, -1)
- **|+⟩ state**: Bloch vector points to +X direction (1, 0, 0)
- **|+i⟩ state**: Bloch vector points to +Y direction (0, 1, 0)

### **Mixed States:**
- **Pure state**: Bloch vector magnitude = 1.0
- **Mixed state**: Bloch vector magnitude < 1.0
- **Maximally mixed**: Bloch vector magnitude ≈ 0.0

## 🛠️ Technical Details

### **Quantum Simulation:**
- Uses complex number arithmetic for accurate quantum calculations
- Implements Kronecker product for multi-qubit gate construction
- Performs partial trace to extract single-qubit reduced density matrices

### **Performance:**
- Optimized for circuits with 1-5 qubits
- Real-time simulation for most practical circuits
- Memory usage scales as 2^(2*numQubits)

### **Browser Compatibility:**
- Modern browsers with WebGL support
- React 18+ and Three.js 0.158+
- Responsive design for desktop and mobile

## 🔧 Troubleshooting

### **Common Issues:**
1. **"Qubit index out of bounds"**: Check that qubit indices are 0 to (numQubits-1)
2. **"Unknown gate"**: Verify gate names are spelled correctly (case-sensitive)
3. **Performance issues**: Reduce number of qubits or circuit depth
4. **Visualization not loading**: Ensure WebGL is enabled in your browser

### **Performance Tips:**
- Keep circuits under 20 operations for best performance
- Use 1-3 qubits for real-time simulation
- Avoid very deep circuits (>50 operations)

## 🎨 Customization

The visualizer can be extended with:
- Additional quantum gates
- Noise models and decoherence
- Circuit optimization algorithms
- Export functionality (PNG, CSV)
- Real-time animation of quantum evolution

## 📚 Further Reading

- [Quantum Computing Fundamentals](https://qiskit.org/learn/)
- [Bloch Sphere Visualization](https://en.wikipedia.org/wiki/Bloch_sphere)
- [Partial Trace in Quantum Mechanics](https://en.wikipedia.org/wiki/Partial_trace)
- [Three.js Documentation](https://threejs.org/docs/)

---

**Built with ❤️ using React, Three.js, and modern web technologies**
