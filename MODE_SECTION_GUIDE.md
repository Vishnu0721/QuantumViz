# Quantum Visualization Webapp - Mode Section Guide

## Overview
The Mode section in the quantum visualization webapp provides four different ways to interact with quantum data and analysis. Each mode offers unique capabilities for different use cases, from basic quantum circuit simulation to advanced research analysis.

## Available Modes

### 1. **Quantum Simulator (QASM)** - `sim`
**Purpose**: Interactive quantum circuit simulation and visualization

**How to Use**:
1. Select "Quantum Simulator (QASM)" from the Mode dropdown
2. Set the number of qubits (1-20)
3. Enter QASM circuit code in the text area
4. Click "🚀 Simulate & Visualize" to run the simulation

**What You'll Get**:
- **3D Bloch Sphere Visualization**: Individual qubit states displayed as 3D spheres
- **Real-time Quantum State Calculation**: Instant simulation of quantum circuits
- **Error Analysis Panel**: Shows fidelity, error rates, and noise parameters
- **Individual Qubit Metrics**: Purity, coherence, fidelity for each qubit
- **Export Capabilities**: CSV, PNG, SVG export of results

**Example QASM Input**:
```
h q[0];
cx q[0],q[1];
z q[0];
```

**Use Cases**:
- Learning quantum computing concepts
- Testing quantum algorithms
- Visualizing quantum state evolution
- Educational demonstrations

---

### 2. **Live Data Stream** - `live-url`
**Purpose**: Real-time visualization of quantum data from external sources

**How to Use**:
1. Select "Live Data Stream" from the Mode dropdown
2. Enter the JSON endpoint URL (default: `http://127.0.0.1:8000/api/frame`)
3. Set polling interval in milliseconds (default: 1000ms)
4. Click "Connect" to start live data streaming
5. Click "Disconnect" to stop streaming

**Expected JSON Format**:
```json
{
  "num_qubits": 2,
  "frames": [
    {
      "bloch": [[0, 0, 1], [0, 0, 1]]
    }
  ]
}
```

**Alternative Formats Supported**:
- **Statevector Format**: `{ "statevector": { "re": [...], "im": [...] } }`
- **Direct Bloch Format**: `{ "bloch": [[x,y,z], ...] }`

**What You'll Get**:
- **Real-time Visualization**: Live updates of quantum states
- **Connection Status**: Shows connection status and last update time
- **Error Handling**: Graceful handling of connection issues
- **Multiple Data Formats**: Supports various quantum data formats

**Use Cases**:
- Monitoring quantum hardware in real-time
- Visualizing quantum algorithm execution
- Live quantum experiment monitoring
- Integration with quantum computing backends

---

### 3. **Manual JSON Input** - `live-json`
**Purpose**: Static visualization of quantum data from JSON input

**How to Use**:
1. Select "Manual JSON Input" from the Mode dropdown
2. Enter JSON data in the text area (default example provided)
3. Click "Render JSON" to visualize the data
4. Optionally enable animation and set FPS for multi-frame data

**Default JSON Example**:
```json
{
  "num_qubits": 2,
  "frames": [
    {
      "bloch": [[0, 0, 1], [0, 0, 1]]
    }
  ]
}
```

**What You'll Get**:
- **Static Visualization**: Display quantum states from JSON data
- **Animation Support**: Animate through multiple frames
- **Custom Data Visualization**: Visualize any quantum data format
- **No Network Dependency**: Works offline with static data

**Use Cases**:
- Visualizing saved quantum experiment data
- Testing visualization with custom data
- Educational examples with predefined states
- Offline analysis of quantum results

---

### 4. **Advanced Analysis** - `analysis`
**Purpose**: Comprehensive quantum circuit analysis and research-grade metrics

**How to Use**:
1. Select "Advanced Analysis" from the Mode dropdown
2. Choose analysis type from the dropdown
3. Select research mode (Basic/Advanced/Research/Publication)
4. Enter QASM circuit code first
5. Click "Run Analysis" to perform analysis

**Analysis Types Available**:

#### **Entanglement Measures**
- **Concurrence**: Measures entanglement between qubits
- **Mutual Information**: Information shared between qubits
- **Von Neumann Entropy**: Quantum entropy of subsystems
- **Negativity**: Entanglement monotone

#### **Fidelity Analysis**
- **Dynamic Fidelity**: Circuit-dependent fidelity calculation
- **Individual Qubit Fidelity**: Per-qubit fidelity metrics
- **Circuit Complexity Impact**: How complexity affects fidelity
- **Noise Analysis**: Impact of different noise types

#### **Coherence Analysis**
- **Quantum Coherence**: Superposition preservation
- **Decoherence Rates**: Coherence loss over time
- **Coherence Measures**: Multiple coherence metrics
- **Noise Impact on Coherence**: How noise affects coherence

#### **Quantum Volume**
- **Quantum Volume Calculation**: IBM's quantum volume metric
- **Scaling Analysis**: How volume scales with qubits
- **Benchmark Comparison**: Compare to known benchmarks
- **Effective Qubit Count**: Equivalent qubit capacity

#### **Error Correction**
- **Error Detection**: Identify correctable vs uncorrectable errors
- **Error Correction Requirements**: What correction is needed
- **Fault Tolerance Analysis**: Fault tolerance assessment
- **Error Budget Analysis**: Error budget breakdown

#### **Noise Analysis**
- **Depolarization**: Depolarizing noise effects
- **Dephasing**: Phase decoherence analysis
- **Amplitude Damping**: Energy loss analysis
- **Combined Noise Models**: Multiple noise types

#### **Circuit Optimization**
- **Gate Decomposition**: Break down complex gates
- **Circuit Depth Optimization**: Reduce circuit depth
- **Gate Count Optimization**: Minimize gate count
- **Efficiency Recommendations**: Optimization suggestions

**Research Modes**:

#### **Basic Analysis**
- Essential metrics only
- Simple visualizations
- Basic recommendations
- Quick results

#### **Advanced Metrics**
- Detailed calculations
- Advanced visualizations
- Comprehensive analysis
- Detailed recommendations

#### **Research Grade**
- Publication-quality metrics
- Statistical analysis
- Benchmark comparisons
- Research-grade visualizations

#### **Publication Ready**
- Journal-quality output
- Complete statistical analysis
- Professional formatting
- Export-ready results

**What You'll Get**:
- **Comprehensive Metrics**: Detailed quantum circuit analysis
- **Research-Grade Results**: Publication-quality analysis
- **Visual Analysis**: Advanced visualizations
- **Export Capabilities**: Export analysis results
- **Recommendations**: Optimization suggestions
- **Benchmark Comparisons**: Compare to known results

**Use Cases**:
- Quantum algorithm research
- Circuit optimization
- Error correction analysis
- Quantum hardware benchmarking
- Academic research
- Publication preparation

---

## Mode Selection Guide

### **Choose Quantum Simulator (QASM) when**:
- Learning quantum computing
- Testing quantum algorithms
- Interactive experimentation
- Educational purposes

### **Choose Live Data Stream when**:
- Monitoring quantum hardware
- Real-time experiment visualization
- Integration with quantum backends
- Live quantum system monitoring

### **Choose Manual JSON Input when**:
- Visualizing saved data
- Testing with custom data
- Offline analysis
- Educational examples

### **Choose Advanced Analysis when**:
- Research and development
- Circuit optimization
- Error analysis
- Publication preparation
- Professional quantum computing work

---

## Additional Features

### **Export Options**:
- **CSV Export**: Complete quantum analysis data
- **PNG Export**: High-quality visualization images
- **SVG Export**: Scalable vector graphics
- **Research Data Export**: JSON format for further analysis

### **Visualization Features**:
- **3D Bloch Spheres**: Interactive 3D quantum state visualization
- **Real-time Updates**: Live data streaming and updates
- **Animation Support**: Animate through quantum state evolution
- **Multiple Views**: Different visualization perspectives

### **Analysis Features**:
- **Dynamic Calculations**: Circuit-dependent metrics
- **Noise Modeling**: Realistic noise simulation
- **Error Analysis**: Comprehensive error metrics
- **Optimization Suggestions**: Circuit improvement recommendations

---

## Getting Started

1. **For Beginners**: Start with "Quantum Simulator (QASM)" mode
2. **For Real-time Data**: Use "Live Data Stream" mode
3. **For Static Data**: Use "Manual JSON Input" mode
4. **For Research**: Use "Advanced Analysis" mode

Each mode provides a different level of functionality and complexity, allowing users to choose the appropriate tool for their specific needs and expertise level.
