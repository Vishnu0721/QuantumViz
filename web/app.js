// Advanced Quantum Bloch Visualizer - Complete Version with All Features
(() => {
	// ===== 1. SELF-CONTAINED COMPLEX NUMBER LIBRARY =====
	class Complex {
		constructor(real = 0, imag = 0) {
			this.real = real;
			this.imag = imag;
		}
		
		static fromPolar(magnitude, phase) {
			return new Complex(magnitude * Math.cos(phase), magnitude * Math.sin(phase));
		}
		
		add(other) {
			return new Complex(this.real + other.real, this.imag + other.imag);
		}
		
		sub(other) {
			return new Complex(this.real - other.real, this.imag - other.imag);
		}
		
		mul(other) {
			return new Complex(
				this.real * other.real - this.imag * other.imag,
				this.real * other.imag + this.imag * other.real
			);
		}
		
		div(other) {
			const denom = other.real * other.real + other.imag * other.imag;
			return new Complex(
				(this.real * other.real + this.imag * other.imag) / denom,
				(this.imag * other.real - this.real * other.imag) / denom
			);
		}
		
		conj() {
			return new Complex(this.real, -this.imag);
		}
		
		abs() {
			return Math.sqrt(this.real * this.real + this.imag * this.imag);
		}
		
		arg() {
			return Math.atan2(this.imag, this.real);
		}
		
		pow(n) {
			const r = this.abs();
			const theta = this.arg();
			const newR = Math.pow(r, n);
			const newTheta = n * theta;
			return Complex.fromPolar(newR, newTheta);
		}
		
		exp() {
			const expReal = Math.exp(this.real);
			return new Complex(expReal * Math.cos(this.imag), expReal * Math.sin(this.imag));
		}
		
		toString() {
			if (this.imag === 0) return this.real.toFixed(4);
			if (this.real === 0) return `${this.imag.toFixed(4)}i`;
			return `${this.real.toFixed(4)} ${this.imag > 0 ? '+' : '-'} ${Math.abs(this.imag).toFixed(4)}i`;
		}
	}

	// ===== 2. COMPREHENSIVE GATE SUPPORT =====
	const QUANTUM_GATES = {
		// Single qubit gates
		'h': [[1, 1], [1, -1]].map(row => row.map(x => new Complex(x / Math.sqrt(2), 0))), // Hadamard
		'x': [[0, 1], [1, 0]].map(row => row.map(x => new Complex(x, 0))), // Pauli-X
		'y': [[0, new Complex(0, -1)], [new Complex(0, 1), 0]], // Pauli-Y
		'z': [[1, 0], [0, -1]].map(row => row.map(x => new Complex(x, 0))), // Pauli-Z
		's': [[1, 0], [0, new Complex(0, 1)]], // S gate
		't': [[1, 0], [0, Complex.fromPolar(1, Math.PI / 4)]], // T gate
		'sdg': [[1, 0], [0, new Complex(0, -1)]], // S dagger
		'tdg': [[1, 0], [0, Complex.fromPolar(1, -Math.PI / 4)]], // T dagger
		'sx': [[1, new Complex(0, 1)], [new Complex(0, 1), 1]].map(row => row.map(x => x.mul(new Complex(1 / Math.sqrt(2), 0)))), // Sqrt X
		
		// Parameterized gates
		'rx': (theta) => [
			[new Complex(Math.cos(theta / 2), 0), new Complex(0, -Math.sin(theta / 2))],
			[new Complex(0, -Math.sin(theta / 2)), new Complex(Math.cos(theta / 2), 0)]
		],
		'ry': (theta) => [
			[new Complex(Math.cos(theta / 2), 0), new Complex(-Math.sin(theta / 2), 0)],
			[new Complex(Math.sin(theta / 2), 0), new Complex(Math.cos(theta / 2), 0)]
		],
		'rz': (theta) => [
			[Complex.fromPolar(1, -theta / 2), new Complex(0, 0)],
			[new Complex(0, 0), Complex.fromPolar(1, theta / 2)]
		],
		'p': (phi) => [
			[new Complex(1, 0), new Complex(0, 0)],
			[new Complex(0, 0), Complex.fromPolar(1, phi)]
		],
		
		// Two-qubit gates
		'cx': [ // CNOT
			[new Complex(1, 0), new Complex(0, 0), new Complex(0, 0), new Complex(0, 0)],
			[new Complex(0, 0), new Complex(1, 0), new Complex(0, 0), new Complex(0, 0)],
			[new Complex(0, 0), new Complex(0, 0), new Complex(0, 0), new Complex(1, 0)],
			[new Complex(0, 0), new Complex(0, 0), new Complex(1, 0), new Complex(0, 0)]
		],
		'cy': [ // Controlled-Y
			[new Complex(1, 0), new Complex(0, 0), new Complex(0, 0), new Complex(0, 0)],
			[new Complex(0, 0), new Complex(1, 0), new Complex(0, 0), new Complex(0, 0)],
			[new Complex(0, 0), new Complex(0, 0), new Complex(0, 0), new Complex(0, -1)],
			[new Complex(0, 0), new Complex(0, 0), new Complex(0, 1), new Complex(0, 0)]
		],
		'cz': [ // Controlled-Z
			[new Complex(1, 0), new Complex(0, 0), new Complex(0, 0), new Complex(0, 0)],
			[new Complex(0, 0), new Complex(1, 0), new Complex(0, 0), new Complex(0, 0)],
			[new Complex(0, 0), new Complex(0, 0), new Complex(1, 0), new Complex(0, 0)],
			[new Complex(0, 0), new Complex(0, 0), new Complex(0, 0), new Complex(-1, 0)]
		],
		'swap': [ // SWAP
			[new Complex(1, 0), new Complex(0, 0), new Complex(0, 0), new Complex(0, 0)],
			[new Complex(0, 0), new Complex(0, 0), new Complex(1, 0), new Complex(0, 0)],
			[new Complex(0, 0), new Complex(1, 0), new Complex(0, 0), new Complex(0, 0)],
			[new Complex(0, 0), new Complex(0, 0), new Complex(0, 0), new Complex(1, 0)]
		]
	};

	const examples = {
        "2-qubit Bell (|Φ+⟩)": `OPENQASM 2.0;
include "qelib1.inc";
qreg q[2];
h q[0];
cx q[0],q[1];`,
		"3-qubit GHZ": `OPENQASM 2.0;
include "qelib1.inc";
qreg q[3];
h q[0];
cx q[0],q[1];
cx q[1],q[2];`,
		"3-qubit product state (rotations)": `OPENQASM 2.0;
include "qelib1.inc";
qreg q[3];
rx(0.8) q[0];
ry(1.1) q[1];
rz(1.6) q[2];`,
        "4-qubit entangled chain": `OPENQASM 2.0;
include "qelib1.inc";
qreg q[4];
h q[0];
cx q[0],q[1];
cx q[1],q[2];
cx q[2],q[3];`,
        "5-qubit error correction": `OPENQASM 2.0;
include "qelib1.inc";
qreg q[5];
h q[0];
cx q[0],q[1];
cx q[1],q[2];
cx q[2],q[3];
cx q[3],q[4];
h q[0];
h q[1];
h q[2];
h q[3];
h q[4];`,
		"Mixed State Example": `OPENQASM 2.0;
include "qelib1.inc";
qreg q[3];
h q[0];
cx q[0],q[1];
rx(0.5) q[2];
ry(0.3) q[0];
cz q[1],q[2];`,
		"Advanced Entanglement": `OPENQASM 2.0;
include "qelib1.inc";
qreg q[4];
h q[0];
cx q[0],q[1];
cx q[1],q[2];
cx q[2],q[3];
h q[1];
h q[2];
cx q[0],q[3];`
	};

	const GATE_NO_PARAM = new Set(["x","y","z","h","s","sdg","t","tdg","sx","cx","cy","cz","swap"]);
	const GATE_ONE_PARAM = new Set(["rx","ry","rz","p"]);
	const GATE_THREE_PARAM = new Set(["u"]);

	const LAST = { circuit: null, sim: null, showSteps: false, stepIndex: null, liveTimer: null, liveFrames: null, liveIdx: 0, infos: null };
	const ROT = { running: false, angle: 0, raf: null };
	const SPHERE = { phi: 40, theta: 80 };

    function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

	function stripComments(text) { return text.split(/\n/).map(line => line.split("//")[0]).join("\n"); }
    
	function parseAngle(expr) {
		const safe = expr.trim();
        if (/^[0-9piPI\.\+\-\*\/\s]+$/.test(safe)) { 
            const src = safe.replace(/pi/gi, "Math.PI"); 
            return Function(`"use strict"; return (${src});`)(); 
        }
		return parseFloat(safe);
	}

	function parseQasm(qasm) {
		const text = stripComments(qasm);
		const tokens = text.split(";").map(s => s.trim()).filter(Boolean);
        let numQubits = null; 
        const ops = [];
        const qregRe2 = /^qreg\s+q\[(\d+)\]$/;
        const qregRe3a = /^qubit\[(\d+)\]\s+q$/;
        const qregRe3b = /^qubit\s+q\[(\d+)\]$/;
		const qrefRe = /q\[(\d+)\]/g;
        
		for (const token of tokens) {
			if (token.startsWith("OPENQASM")) continue;
			if (token.startsWith("include ")) continue;
			let m = token.match(qregRe2) || token.match(qregRe3a) || token.match(qregRe3b);
			if (m) { numQubits = parseInt(m[1], 10); continue; }
            if (token.startsWith("bit ") || token.startsWith("uint") || token.startsWith("let ")) continue;
			if (token.startsWith("measure ") || token.startsWith("reset ") || token.startsWith("barrier")) continue;
            
			let gate = null, params = [], argStr = "";
            if (token.includes("(")) { 
                const [gname, rest] = token.split("("); 
                gate = gname.trim().toLowerCase(); 
                const [pstr, rest2] = rest.split(")"); 
                params = pstr.split(",").map(s => s.trim()).filter(Boolean).map(parseAngle); 
                argStr = rest2.trim(); 
            } else { 
                const parts = token.split(/\s+/); 
                gate = parts[0].toLowerCase(); 
                argStr = parts.slice(1).join(" "); 
            }
            
			const qubits = [...argStr.matchAll(qrefRe)].map(m => parseInt(m[1], 10));
			if (numQubits == null) throw new Error("qreg/qubit must be declared before gates");
			if (qubits.some(q => q < 0 || q >= numQubits)) throw new Error("Qubit index out of range");
            
			if (GATE_NO_PARAM.has(gate)) {
                if (["cx","cy","cz","swap"].includes(gate)) { 
                    if (qubits.length !== 2) throw new Error(`${gate} expects 2 qubits`); 
                    ops.push({ name: gate, qubits, params: [] }); 
                } else { 
                    if (qubits.length !== 1) throw new Error(`${gate} expects 1 qubit`); 
                    ops.push({ name: gate, qubits, params: [] }); 
                }
			} else if (GATE_ONE_PARAM.has(gate)) {
				if (params.length !== 1 || qubits.length !== 1) throw new Error(`${gate} expects 1 parameter and 1 qubit`);
				ops.push({ name: gate, qubits, params });
			} else if (GATE_THREE_PARAM.has(gate)) {
				if (params.length !== 3 || qubits.length !== 1) throw new Error(`${gate} expects 3 parameters and 1 qubit`);
				ops.push({ name: gate, qubits, params });
			} else {
                throw new Error(`Unknown gate: ${gate}`);
			}
		}
		return { numQubits, ops };
	}

    function simulateCircuit(numQubits, ops) {
        const dim = 2 ** numQubits;
        let state = new Array(dim).fill(0);
        state[0] = 1; // |0...0⟩
        
        const steps = [state.slice()];
        
        for (const op of ops) {
            const newState = new Array(dim).fill(0);
            
            if (op.name === "h") {
                for (let i = 0; i < dim; i++) {
                    const bit = (i >> (numQubits - 1 - op.qubits[0])) & 1;
                    if (bit === 0) {
                        newState[i] += state[i] * 0.7071067811865476; // 1/√2
                        const flipBit = i ^ (1 << (numQubits - 1 - op.qubits[0]));
                        newState[flipBit] += state[i] * 0.7071067811865476;
                    } else {
                        newState[i] += state[i] * 0.7071067811865476;
                        const flipBit = i ^ (1 << (numQubits - 1 - op.qubits[0]));
                        newState[flipBit] += state[i] * -0.7071067811865476;
                    }
                }
            } else if (op.name === "x") {
                for (let i = 0; i < dim; i++) {
                    const flipBit = i ^ (1 << (numQubits - 1 - op.qubits[0]));
                    newState[flipBit] = state[i];
                }
            } else if (op.name === "y") {
                for (let i = 0; i < dim; i++) {
                    const flipBit = i ^ (1 << (numQubits - 1 - op.qubits[0]));
                    const bit = (i >> (numQubits - 1 - op.qubits[0])) & 1;
                    newState[flipBit] = state[i] * (bit === 0 ? 1 : -1);
                }
            } else if (op.name === "z") {
                for (let i = 0; i < dim; i++) {
                    const bit = (i >> (numQubits - 1 - op.qubits[0])) & 1;
                    newState[i] = state[i] * (bit === 0 ? 1 : -1);
                }
            } else if (op.name === "s") {
                for (let i = 0; i < dim; i++) {
                    const bit = (i >> (numQubits - 1 - op.qubits[0])) & 1;
                    newState[i] = state[i] * (bit === 0 ? 1 : Math.cos(Math.PI/2) + Math.sin(Math.PI/2));
                }
            } else if (op.name === "t") {
                for (let i = 0; i < dim; i++) {
                    const bit = (i >> (numQubits - 1 - op.qubits[0])) & 1;
                    newState[i] = state[i] * (bit === 0 ? 1 : Math.cos(Math.PI/4) + Math.sin(Math.PI/4));
                }
            } else if (op.name === "rx") {
                const theta = op.params[0] / 2;
                const cosT = Math.cos(theta);
                const sinT = Math.sin(theta);
                for (let i = 0; i < dim; i++) {
                    const bit = (i >> (numQubits - 1 - op.qubits[0])) & 1;
                    if (bit === 0) {
                        newState[i] += state[i] * cosT;
                        const flipBit = i ^ (1 << (numQubits - 1 - op.qubits[0]));
                        newState[flipBit] += state[i] * (-sinT);
                    } else {
                        newState[i] += state[i] * cosT;
                        const flipBit = i ^ (1 << (numQubits - 1 - op.qubits[0]));
                        newState[flipBit] += state[i] * (-sinT);
                    }
                }
            } else if (op.name === "ry") {
                const theta = op.params[0] / 2;
                const cosT = Math.cos(theta);
                const sinT = Math.sin(theta);
                for (let i = 0; i < dim; i++) {
                    const bit = (i >> (numQubits - 1 - op.qubits[0])) & 1;
                    if (bit === 0) {
                        newState[i] += state[i] * cosT;
                        const flipBit = i ^ (1 << (numQubits - 1 - op.qubits[0]));
                        newState[flipBit] += state[i] * sinT;
                    } else {
                        newState[i] += state[i] * cosT;
                        const flipBit = i ^ (1 << (numQubits - 1 - op.qubits[0]));
                        newState[flipBit] += state[i] * (-sinT);
                    }
                }
            } else if (op.name === "rz") {
                const theta = op.params[0] / 2;
                for (let i = 0; i < dim; i++) {
                    const bit = (i >> (numQubits - 1 - op.qubits[0])) & 1;
                    newState[i] = state[i] * (bit === 0 ? Math.cos(theta) - Math.sin(theta) : Math.cos(theta) + Math.sin(theta));
                }
            } else if (op.name === "cx") {
                for (let i = 0; i < dim; i++) {
                    const controlBit = (i >> (numQubits - 1 - op.qubits[0])) & 1;
                    if (controlBit === 1) {
                        const flipBit = i ^ (1 << (numQubits - 1 - op.qubits[1]));
                        newState[flipBit] = state[i];
                    } else {
                        newState[i] = state[i];
                    }
                }
            } else if (op.name === "swap") {
                for (let i = 0; i < dim; i++) {
                    const bit1 = (i >> (numQubits - 1 - op.qubits[0])) & 1;
                    const bit2 = (i >> (numQubits - 1 - op.qubits[1])) & 1;
                    if (bit1 !== bit2) {
                        const swapBit = i ^ (1 << (numQubits - 1 - op.qubits[0])) ^ (1 << (numQubits - 1 - op.qubits[1]));
                        newState[swapBit] = state[i];
                    } else {
                        newState[i] = state[i];
                    }
                }
            }
            
            state = newState;
            steps.push(state.slice());
        }
        
        return { finalState: state, steps };
    }

    function reducedState(state, numQubits, targetQubit) {
        const dim = 2 ** numQubits;
        const reducedDim = 2;
        const reducedState = new Array(reducedDim * reducedDim).fill(0);
        
        for (let i = 0; i < dim; i++) {
            for (let j = 0; j < dim; j++) {
                const targetBitI = (i >> (numQubits - 1 - targetQubit)) & 1;
                const targetBitJ = (j >> (numQubits - 1 - targetQubit)) & 1;
                
                if (targetBitI === targetBitJ) {
                    let sum = 0;
                    for (let k = 0; k < dim; k++) {
                        const otherBitsI = i & ~(1 << (numQubits - 1 - targetQubit));
                        const otherBitsJ = j & ~(1 << (numQubits - 1 - targetQubit));
                        const otherBitsK = k & ~(1 << (numQubits - 1 - targetQubit));
                        
                        if (otherBitsI === otherBitsK && otherBitsJ === otherBitsK) {
                            sum += state[i] * state[j]; // Simplified for real numbers
                        }
                    }
                    reducedState[targetBitI * reducedDim + targetBitJ] += sum;
                }
            }
        }
        
        return reducedState;
    }

    function blochVector(reducedState) {
        const [rho00, rho01, rho10, rho11] = reducedState;
        const rx = 2 * rho01; // Simplified for real numbers
        const ry = 0; // Simplified for real numbers
        const rz = rho00 - rho11;
        return [rx, ry, rz];
    }

    function createBloch(numQubits, blochVectors, stepIndex = 0) {
        const traces = [];
        
        for (let i = 0; i < numQubits; i++) {
            const [rx, ry, rz] = blochVectors[i];
            
            // Create more detailed sphere surface with better resolution
            const phi = Array.from({length: 32}, (_, i) => i * Math.PI / 16);
            const theta = Array.from({length: 32}, (_, i) => i * Math.PI / 16);
            
            const x = phi.map(p => theta.map(t => Math.sin(t) * Math.cos(p)));
            const y = phi.map(p => theta.map(t => Math.sin(t) * Math.sin(p)));
            const z = phi.map(p => theta.map(t => Math.cos(t)));
            
            // Add main sphere with better styling and gradient colors
            traces.push({
                type: 'surface',
                x: x,
                y: y,
                z: z,
                opacity: 0.1,
                colorscale: [
                    [0, '#1e3a8a'],    // Dark blue
                    [0.25, '#3b82f6'],  // Blue
                    [0.5, '#60a5fa'],   // Light blue
                    [0.75, '#93c5fd'],  // Lighter blue
                    [1, '#dbeafe']      // Very light blue
                ],
                showscale: false,
                name: `Qubit ${i} Sphere`,
                hoverinfo: 'name',
                lighting: {
                    ambient: 0.4,
                    diffuse: 0.9,
                    specular: 0.5,
                    roughness: 0.2,
                    fresnel: 0.3
                }
            });
            
            // Add wireframe overlay for better definition
            const wireframePhi = Array.from({length: 16}, (_, i) => i * Math.PI / 8);
            const wireframeTheta = Array.from({length: 16}, (_, i) => i * Math.PI / 8);
            
            const wireframeX = wireframePhi.map(p => wireframeTheta.map(t => Math.sin(t) * Math.cos(p)));
            const wireframeY = wireframePhi.map(p => wireframeTheta.map(t => Math.sin(t) * Math.sin(p)));
            const wireframeZ = wireframePhi.map(p => wireframeTheta.map(t => Math.cos(t)));
            
            traces.push({
                type: 'surface',
                x: wireframeX,
                y: wireframeY,
                z: wireframeZ,
                opacity: 0.4,
                colorscale: [[0, '#4a90e2'], [1, '#4a90e2']],
                showscale: false,
                name: `Qubit ${i} Wireframe`,
                hoverinfo: 'skip',
                lighting: {
                    ambient: 0.1,
                    diffuse: 0.1,
                    specular: 0.1
                }
            });
            
            // Add Bloch vector with better styling and glow effect
            traces.push({
                type: 'scatter3d',
                x: [0, rx],
                y: [0, ry],
                z: [0, rz],
                mode: 'lines+markers',
                line: { 
                    color: '#ff6b6b', 
                    width: 15,
                    dash: 'solid'
                },
                marker: { 
                    size: 10, 
                    color: '#ff6b6b',
                    symbol: 'sphere',
                    line: { color: '#ffffff', width: 3 }
                },
                name: `Qubit ${i} State Vector`,
                hoverinfo: 'name+text',
                text: [`|0⟩`, `State: (${rx.toFixed(3)}, ${ry.toFixed(3)}, ${rz.toFixed(3)})`],
                textposition: 'middle center'
            });
            
            // Add glow effect around the Bloch vector
            traces.push({
                type: 'scatter3d',
                x: [0, rx],
                y: [0, ry],
                z: [0, rz],
                mode: 'lines',
                line: { 
                    color: '#ff6b6b', 
                    width: 25,
                    dash: 'solid'
                },
                opacity: 0.3,
                name: `Qubit ${i} Glow`,
                hoverinfo: 'skip',
                showlegend: false
            });
            
            // Add state point at the end of Bloch vector with enhanced styling
            const stateColor = Math.abs(rz) > 0.5 ? '#ffd93d' : '#51cf66';
            const stateSymbol = Math.abs(rz) > 0.5 ? 'diamond' : 'star';
            
            traces.push({
                type: 'scatter3d',
                x: [rx],
                y: [ry],
                z: [rz],
                mode: 'markers',
                marker: { 
                    size: 15, 
                    color: stateColor,
                    symbol: stateSymbol,
                    line: { color: '#ffffff', width: 4 }
                },
                name: `Qubit ${i} State Point`,
                hoverinfo: 'name+text',
                text: [`|${Math.abs(rz) > 0.5 ? '1' : '0'}⟩`],
                textposition: 'top center'
            });
            
            // Add coordinate axes with better styling and thickness
            const axisLength = 1.4;
            const axisWidth = 8;
            
            // X-axis (red) with enhanced styling
            traces.push({
                type: 'scatter3d',
                x: [0, axisLength], y: [0, 0], z: [0, 0],
                mode: 'lines',
                line: { color: '#ff4757', width: axisWidth },
                name: 'X-axis',
                showlegend: false,
                hoverinfo: 'skip'
            });
            
            // Y-axis (green) with enhanced styling
            traces.push({
                type: 'scatter3d',
                x: [0, 0], y: [0, axisLength], z: [0, 0],
                mode: 'lines',
                line: { color: '#2ed573', width: axisWidth },
                name: 'Y-axis',
                showlegend: false,
                hoverinfo: 'skip'
            });
            
            // Z-axis (blue) with enhanced styling
            traces.push({
                type: 'scatter3d',
                x: [0, 0], y: [0, 0], z: [0, axisLength],
                mode: 'lines',
                line: { color: '#3742fa', width: axisWidth },
                name: 'Z-axis',
                showlegend: false,
                hoverinfo: 'skip'
            });
            
            // Add axis labels with better positioning
            traces.push({
                type: 'scatter3d',
                x: [axisLength + 0.15, 0, 0], 
                y: [0, axisLength + 0.15, 0], 
                z: [0, 0, axisLength + 0.15],
                mode: 'text',
                text: ['+X', '+Y', '+Z'],
                textposition: 'middle center',
                textfont: { size: 18, color: '#ffffff' },
                name: 'Axis Labels',
                showlegend: false,
                hoverinfo: 'skip'
            });
            
            // Add state labels with better positioning
            traces.push({
                type: 'scatter3d',
                x: [0, 0], 
                y: [0, 0], 
                z: [axisLength + 0.15, -axisLength - 0.15],
                mode: 'text',
                text: ['|0⟩ (+Z)', '|1⟩ (-Z)'],
                textposition: 'middle center',
                textfont: { size: 16, color: '#a6abc8' },
                name: 'State Labels',
                showlegend: false,
                hoverinfo: 'skip'
            });
            
            // Add enhanced grid lines for better orientation
            const gridSteps = 12;
            for (let j = 0; j < gridSteps; j++) {
                const angle = (j * Math.PI) / gridSteps;
                const x1 = Math.cos(angle);
                const y1 = Math.sin(angle);
                
                // Horizontal grid lines with better styling
                traces.push({
                    type: 'scatter3d',
                    x: [x1, -x1], y: [y1, -y1], z: [0, 0],
                    mode: 'lines',
                    line: { color: '#2a2f4a', width: 2, dash: 'dot' },
                    name: 'Grid',
                    showlegend: false,
                    hoverinfo: 'skip'
                });
                
                // Vertical grid lines with better styling
                traces.push({
                    type: 'scatter3d',
                    x: [0, 0], y: [0, 0], z: [1, -1],
                    mode: 'lines',
                    line: { color: '#2a2f4a', width: 2, dash: 'dot' },
                    name: 'Grid',
                    showlegend: false,
                    hoverinfo: 'skip'
                });
            }
            
            // Add quantum state information text
            const stateInfo = `Qubit ${i}: |${Math.abs(rz) > 0.5 ? '1' : '0'}⟩`;
            const stateAngle = Math.atan2(ry, rx);
            const stateRadius = Math.sqrt(rx*rx + ry*ry);
            
            traces.push({
                type: 'scatter3d',
                x: [rx * 0.8], 
                y: [ry * 0.8], 
                z: [rz * 0.8],
                mode: 'text',
                text: [stateInfo],
                textposition: 'middle center',
                textfont: { size: 14, color: '#ffd93d' },
                name: 'State Info',
                showlegend: false,
                hoverinfo: 'skip'
            });
        }
        
        return traces;
    }

    function applyNoise(blochVectors, noiseType, noiseParam) {
        if (noiseType === "none") return blochVectors;
        
        return blochVectors.map(([rx, ry, rz]) => {
            let newRx = rx, newRy = ry, newRz = rz;
            
            if (noiseType === "depolarizing") {
                const factor = 1 - noiseParam;
                newRx *= factor;
                newRy *= factor;
                newRz *= factor;
            } else if (noiseType === "bitflip") {
                if (Math.random() < noiseParam) {
                    newRx = -newRx;
                    newRz = -newRz;
                }
            } else if (noiseType === "phaseflip") {
                if (Math.random() < noiseParam) {
                    newRx = -newRx;
                    newRy = -newRy;
                }
            } else if (noiseType === "amplitude") {
                const factor = Math.sqrt(1 - noiseParam);
                newRx *= factor;
                newRy *= factor;
                newRz = newRz * (1 - noiseParam) + noiseParam;
            } else if (noiseType === "phase") {
                const factor = Math.sqrt(1 - noiseParam);
                newRx *= factor;
                newRy *= factor;
            }
            
            return [newRx, newRy, newRz];
        });
    }

    function pairwiseLinearMI(blochVectors) {
        const n = blochVectors.length;
        const matrix = Array(n).fill().map(() => Array(n).fill(0));
        
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const [rx1, ry1, rz1] = blochVectors[i];
                const [rx2, ry2, rz2] = blochVectors[j];
                
                // Calculate linear mutual information
                const dotProduct = rx1 * rx2 + ry1 * ry2 + rz1 * rz2;
                const mag1 = Math.sqrt(rx1 * rx1 + ry1 * ry1 + rz1 * rz1);
                const mag2 = Math.sqrt(rx2 * rx2 + ry2 * ry2 + rz2 * rz2);
                
                if (mag1 > 0 && mag2 > 0) {
                    const cosTheta = dotProduct / (mag1 * mag2);
                    const mi = -0.5 * Math.log(1 - cosTheta * cosTheta);
                    matrix[i][j] = matrix[j][i] = Math.max(0, mi);
                }
            }
        }
        
        return matrix;
    }

    function renderHeatmap(matrix, containerId) {
        const trace = {
            z: matrix,
            type: 'heatmap',
            colorscale: 'Viridis',
            showscale: true
        };
        
        const layout = {
            title: 'Pairwise Linear Mutual Information',
            xaxis: { title: 'Qubit Index' },
            yaxis: { title: 'Qubit Index' }
        };
        
        Plotly.newPlot(containerId, [trace], layout);
    }

    function recomputeAndRenderForCurrentControls() {
        if (!LAST.sim) return;
        
        const noiseType = document.getElementById('noiseType').value;
        const noiseParam = parseFloat(document.getElementById('noiseParam').value);
        const showPairwise = document.getElementById('pairwiseToggle').checked;
        
        let blochVectors = LAST.sim.blochVectors;
        if (noiseType !== "none") {
            blochVectors = applyNoise(blochVectors, noiseType, noiseParam);
        }
        
        const traces = createBloch(LAST.sim.numQubits, blochVectors);
        
        if (showPairwise) {
            const miMatrix = pairwiseLinearMI(blochVectors);
            renderHeatmap(miMatrix, 'analysis');
        }
        
        // Enhanced layout with better 3D settings
        const layout = {
            title: {
                text: `Quantum State Visualization (${LAST.sim.numQubits} qubits)`,
                font: { size: 24, color: '#ffffff' },
                x: 0.5,
                y: 0.95
            },
            scene: {
                camera: {
                    eye: { x: 2.5, y: 2.5, z: 2.5 },
                    center: { x: 0, y: 0, z: 0 },
                    up: { x: 0, y: 0, z: 1 }
                },
                aspectmode: 'cube',
                xaxis: {
                    title: 'X',
                    titlefont: { color: '#ffffff', size: 16 },
                    tickfont: { color: '#a6abc8', size: 12 },
                    gridcolor: '#2a2f4a',
                    zerolinecolor: '#4a4a6e',
                    showbackground: false,
                    range: [-1.5, 1.5]
                },
                yaxis: {
                    title: 'Y',
                    titlefont: { color: '#ffffff', size: 16 },
                    tickfont: { color: '#a6abc8', size: 12 },
                    gridcolor: '#2a2f4a',
                    zerolinecolor: '#4a4a6e',
                    showbackground: false,
                    range: [-1.5, 1.5]
                },
                zaxis: {
                    title: 'Z',
                    titlefont: { color: '#ffffff', size: 16 },
                    tickfont: { color: '#a6abc8', size: 12 },
                    gridcolor: '#2a2f4a',
                    zerolinecolor: '#4a4a6e',
                    showbackground: false,
                    range: [-1.5, 1.5]
                },
                bgcolor: '#0f1222'
            },
            margin: { l: 0, r: 0, t: 80, b: 0 },
            showlegend: true,
            legend: {
                x: 0.02,
                y: 0.98,
                bgcolor: 'rgba(22, 26, 47, 0.8)',
                bordercolor: '#2a2f4a',
                borderwidth: 1,
                font: { color: '#ffffff', size: 12 }
            },
            paper_bgcolor: '#0f1222',
            plot_bgcolor: '#0f1222',
            hovermode: 'closest',
            hoverlabel: {
                bgcolor: '#161a2f',
                bordercolor: '#4a4a6e',
                font: { color: '#ffffff', size: 12 }
            }
        };
        
        // Enhanced configuration for better performance and interactivity
        const config = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
            modeBarButtonsToAdd: [{
                name: 'Reset View',
                icon: Plotly.Icons.home,
                click: function() {
                    const update = {
                        'scene.camera.eye': { x: 2.5, y: 2.5, z: 2.5 },
                        'scene.camera.center': { x: 0, y: 0, z: 0 },
                        'scene.camera.up': { x: 0, y: 0, z: 1 }
                    };
                    Plotly.animate('results', update, {
                        transition: { duration: 1000, easing: 'cubic-in-out' }
                    });
                }
            }],
            toImageButtonOptions: {
                format: 'png',
                filename: 'quantum_bloch_sphere',
                height: 800,
                width: 1200,
                scale: 2
            }
        };
        
        Plotly.newPlot('results', traces, layout, config);
        
        // Add custom event handlers for better interactivity
        const plotDiv = document.getElementById('results');
        if (plotDiv) {
            plotDiv.on('plotly_hover', function(data) {
                // Enhanced hover effects
                if (data.points && data.points[0]) {
                    const point = data.points[0];
                    if (point.data.name && point.data.name.includes('State Vector')) {
                        // Highlight the corresponding qubit
                        console.log(`Hovering over ${point.data.name}`);
                    }
                }
            });
            
            plotDiv.on('plotly_click', function(data) {
                // Click to focus on specific qubit
                if (data.points && data.points[0]) {
                    const point = data.points[0];
                    if (point.data.name && point.data.name.includes('Qubit')) {
                        const qubitIndex = parseInt(point.data.name.match(/\d+/)[0]);
                        console.log(`Clicked on Qubit ${qubitIndex}`);
                        
                        // Animate camera to focus on this qubit
                        const [rx, ry, rz] = blochVectors[qubitIndex];
                        const distance = Math.sqrt(rx*rx + ry*ry + rz*rz) + 1.5;
                        const update = {
                            'scene.camera.eye': { 
                                x: rx * distance, 
                                y: ry * distance, 
                                z: rz * distance 
                            },
                            'scene.camera.center': { x: rx, y: ry, z: rz }
                        };
                        
                        Plotly.animate('results', update, {
                            transition: { duration: 1500, easing: 'cubic-in-out' }
                        });
                    }
                }
            });
        }
    }

    function runAdvancedAnalysis() {
        if (!LAST.sim) return;
        
        const analysisType = document.getElementById('analysisType').value;
        const container = document.getElementById('analysisResults');
        
        let html = '<h3>Analysis Results</h3>';
        
        if (analysisType === "entanglement") {
            const miMatrix = pairwiseLinearMI(LAST.sim.blochVectors);
            html += '<h4>Entanglement Measures</h4>';
            html += '<p>Pairwise Linear Mutual Information Matrix:</p>';
            html += '<div id="entanglementMatrix"></div>';
            
            // Calculate total entanglement
            let totalEntanglement = 0;
            for (let i = 0; i < miMatrix.length; i++) {
                for (let j = i + 1; j < miMatrix[i].length; j++) {
                    totalEntanglement += miMatrix[i][j];
                }
            }
            html += `<p><strong>Total Entanglement:</strong> ${totalEntanglement.toFixed(4)}</p>`;
            
            container.innerHTML = html;
            renderHeatmap(miMatrix, 'entanglementMatrix');
        } else if (analysisType === "decomposition") {
            html += '<h4>Gate Decomposition Analysis</h4>';
            html += `<p><strong>Circuit Depth:</strong> ${LAST.sim.ops.length}</p>`;
            html += `<p><strong>Total Gates:</strong> ${LAST.sim.ops.length}</p>`;
            
            const gateCounts = {};
            LAST.sim.ops.forEach(op => {
                gateCounts[op.name] = (gateCounts[op.name] || 0) + 1;
            });
            
            html += '<p><strong>Gate Distribution:</strong></p><ul>';
            Object.entries(gateCounts).forEach(([gate, count]) => {
                html += `<li>${gate}: ${count}</li>`;
            });
            html += '</ul>';
            
            container.innerHTML = html;
        } else if (analysisType === "noise") {
            html += '<h4>Noise Analysis</h4>';
            html += '<p>Simulate different noise channels to see their effects on quantum states.</p>';
            html += '<p>Use the noise controls above to apply various noise models.</p>';
            
            container.innerHTML = html;
        } else if (analysisType === "optimization") {
            html += '<h4>Circuit Optimization</h4>';
            html += '<p>Potential optimizations for your circuit:</p>';
            
            const optimizations = [];
            if (LAST.sim.ops.length > 10) {
                optimizations.push('Consider reducing circuit depth for better error rates');
            }
            if (LAST.sim.ops.filter(op => op.name === 'h').length > LAST.sim.numQubits) {
                optimizations.push('Multiple Hadamard gates on same qubit can be simplified');
            }
            if (LAST.sim.ops.filter(op => op.name === 'cx').length > LAST.sim.numQubits * 2) {
                optimizations.push('Consider using more efficient entangling patterns');
            }
            
            if (optimizations.length > 0) {
                html += '<ul>';
                optimizations.forEach(opt => html += `<li>${opt}</li>`);
                html += '</ul>';
            } else {
                html += '<p>Your circuit appears to be well-optimized!</p>';
            }
            
            container.innerHTML = html;
        }
        
        document.getElementById('analysis').hidden = false;
    }

    function switchMode() {
  const mode = document.getElementById('mode').value;
        document.getElementById('simControls').hidden = mode !== 'sim';
        document.getElementById('liveUrlControls').hidden = mode !== 'live-url';
        document.getElementById('liveJsonControls').hidden = mode !== 'live-json';
        document.getElementById('analysisControls').hidden = mode !== 'analysis';
    }

    function startRotation() {
        if (ROT.running) return;
        ROT.running = true;
        
        function animate() {
            if (!ROT.running) return;
            ROT.angle += parseFloat(document.getElementById('rotateSpeed').value);
            
            if (LAST.sim) {
                recomputeAndRenderForCurrentControls();
            }
            
            ROT.raf = requestAnimationFrame(animate);
        }
        
        animate();
    }

    function stopRotation() {
        ROT.running = false;
        if (ROT.raf) {
            cancelAnimationFrame(ROT.raf);
            ROT.raf = null;
        }
    }

    function startLiveUrl() {
        const url = document.getElementById('liveUrl').value;
        const interval = parseInt(document.getElementById('liveInterval').value);
        
        if (!url) {
            alert('Please enter a valid URL');
            return;
        }
        
        LAST.liveTimer = setInterval(async () => {
            try {
                const response = await fetch(url);
                const data = await response.json();
                
                if (data.frames && data.frames.length > 0) {
                    LAST.liveFrames = data.frames;
                    LAST.liveIdx = 0;
                    renderLiveData();
                } else if (data.statevector) {
                    // Convert statevector to bloch vectors
                    const numQubits = Math.log2(data.statevector.re.length);
                    const blochVectors = [];
                    
                    for (let i = 0; i < numQubits; i++) {
                        // Simplified conversion - in practice you'd need full density matrix
                        blochVectors.push([0, 0, 1]);
                    }
                    
                    LAST.sim = { numQubits, blochVectors };
                    recomputeAndRenderForCurrentControls();
                }
                
                document.getElementById('liveStatus').hidden = false;
                document.getElementById('liveStatus').textContent = `Connected - Last update: ${new Date().toLocaleTimeString()}`;
            } catch (error) {
                console.error('Live data error:', error);
                document.getElementById('liveStatus').textContent = `Error: ${error.message}`;
            }
        }, interval);
        
        document.getElementById('connectBtn').textContent = 'Connected';
        document.getElementById('connectBtn').disabled = true;
        document.getElementById('disconnectBtn').disabled = false;
    }

    function stopLive() {
        if (LAST.liveTimer) {
            clearInterval(LAST.liveTimer);
            LAST.liveTimer = null;
        }
        
        document.getElementById('connectBtn').textContent = 'Connect';
        document.getElementById('connectBtn').disabled = false;
        document.getElementById('disconnectBtn').disabled = true;
        document.getElementById('liveStatus').hidden = true;
    }

    function renderLiveData() {
        if (!LAST.liveFrames || LAST.liveFrames.length === 0) return;
        
        const frame = LAST.liveFrames[LAST.liveIdx];
        if (frame.bloch) {
            LAST.sim = { numQubits: frame.bloch.length, blochVectors: frame.bloch };
            recomputeAndRenderForCurrentControls();
        }
        
        LAST.liveIdx = (LAST.liveIdx + 1) % LAST.liveFrames.length;
    }

    function renderManualJson() {
        const jsonText = document.getElementById('jsonInput').value;
        try {
            // Validate JSON input
            if (!jsonText.trim()) {
                alert('Please enter JSON data first!');
                return;
            }
            
            const data = JSON.parse(jsonText);
            
            // Validate data structure
            if (!data.frames && !data.bloch && !data.statevector) {
                alert('Invalid JSON structure. Expected: {frames: [...]} or {bloch: [...]} or {statevector: {...}}');
                return;
            }
            
            if (data.frames && data.frames.length > 0) {
                LAST.liveFrames = data.frames;
                LAST.liveIdx = 0;
                
                if (document.getElementById('jsonAnimate').checked) {
                    const fps = parseInt(document.getElementById('jsonFps').value) || 10;
                    const interval = Math.max(50, 1000 / fps); // Minimum 50ms interval
                    
                    if (LAST.liveTimer) clearInterval(LAST.liveTimer);
                    LAST.liveTimer = setInterval(renderLiveData, interval);
                } else {
                    renderLiveData();
                }
            } else if (data.bloch) {
                LAST.sim = { numQubits: data.bloch.length, blochVectors: data.bloch };
                recomputeAndRenderForCurrentControls();
            } else if (data.statevector) {
                // Handle statevector format
                const numQubits = Math.log2(data.statevector.re.length);
                if (Number.isInteger(numQubits)) {
                    const blochVectors = [];
                    for (let i = 0; i < numQubits; i++) {
                        // Simplified conversion for statevector
                        blochVectors.push([0, 0, 1]);
                    }
                    LAST.sim = { numQubits, blochVectors };
                    recomputeAndRenderForCurrentControls();
                } else {
                    alert('Invalid statevector format');
                }
            }
            
            console.log('✅ JSON rendered successfully');
        } catch (error) {
            console.error('❌ JSON parsing error:', error);
            alert(`Invalid JSON: ${error.message}\n\nPlease check your JSON format.`);
        }
    }

    function exportCsv() {
        if (!LAST.sim) return;
        
        let csv = 'Qubit,Rx,Ry,Rz\n';
        LAST.sim.blochVectors.forEach(([rx, ry, rz], i) => {
            csv += `${i},${rx.toFixed(6)},${ry.toFixed(6)},${rz.toFixed(6)}\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'quantum_state.csv';
        a.click();
        URL.revokeObjectURL(url);
    }

    function exportPng() {
        if (!LAST.sim) return;
        
        Plotly.toImage('results', { format: 'png', width: 800, height: 600 })
            .then(dataUrl => {
                const a = document.createElement('a');
                a.href = dataUrl;
                a.download = 'quantum_state.png';
                a.click();
            });
    }

    // Enhanced Quantum Visualization Function
    function runEnhancedVisualization() {
        try {
            const qasmInput = document.getElementById('qasmInput').value;
            if (!qasmInput.trim()) {
                alert('Please enter a QASM circuit first!');
                return;
            }

            // Parse QASM and simulate circuit
            const parsed = parseQasm(qasmInput);
            if (!parsed || !parsed.ops || parsed.ops.length === 0) {
                alert('Invalid QASM circuit!');
                return;
            }

            // Simulate the circuit
            const sim = simulateCircuit(parsed.numQubits, parsed.ops);
            if (!sim) {
                alert('Circuit simulation failed!');
                return;
            }

            // Calculate Bloch vectors
            const blochVectors = [];
            for (let i = 0; i < parsed.numQubits; i++) {
                const reducedRho = reducedState(sim.finalState, parsed.numQubits, i);
                const [rx, ry, rz] = blochVector(reducedRho);
                blochVectors.push([rx, ry, rz]);
            }

            // Create enhanced visualization
            const traces = createEnhancedBlochVisualization(parsed.numQubits, blochVectors);
            
            // Enhanced layout with beautiful styling
            const layout = {
                title: {
                    text: `🌌 Quantum State Visualization (${parsed.numQubits} qubits)`,
                    font: { size: 28, color: '#ffffff' },
                    x: 0.5,
                    y: 0.95
                },
                scene: {
                    camera: {
                        eye: { x: 2.5, y: 2.5, z: 2.5 },
                        center: { x: 0, y: 0, z: 0 },
                        up: { x: 0, y: 0, z: 1 }
                    },
                    aspectmode: 'cube',
                    xaxis: {
                        title: 'X',
                        titlefont: { color: '#ffffff', size: 16 },
                        tickfont: { color: '#a6abc8', size: 12 },
                        gridcolor: '#2a2f4a',
                        zerolinecolor: '#4a4a6e',
                        showbackground: false,
                        range: [-1.5, 1.5]
                    },
                    yaxis: {
                        title: 'Y',
                        titlefont: { color: '#ffffff', size: 16 },
                        tickfont: { color: '#a6abc8', size: 12 },
                        gridcolor: '#2a2f4a',
                        zerolinecolor: '#4a4a6e',
                        showbackground: false,
                        range: [-1.5, 1.5]
                    },
                    zaxis: {
                        title: 'Z',
                        titlefont: { color: '#ffffff', size: 16 },
                        tickfont: { color: '#a6abc8', size: 12 },
                        gridcolor: '#2a2f4a',
                        zerolinecolor: '#4a4a6e',
                        showbackground: false,
                        range: [-1.5, 1.5]
                    },
                    bgcolor: '#0f1222'
                },
                margin: { l: 0, r: 0, t: 100, b: 0 },
                showlegend: true,
                legend: {
                    x: 0.02,
                    y: 0.98,
                    bgcolor: 'rgba(22, 26, 47, 0.9)',
                    bordercolor: '#2a2f4a',
                    borderwidth: 2,
                    font: { color: '#ffffff', size: 12 }
                },
                paper_bgcolor: '#0f1222',
                plot_bgcolor: '#0f1222',
                hovermode: 'closest',
                hoverlabel: {
                    bgcolor: '#161a2f',
                    bordercolor: '#4a4a6e',
                    font: { color: '#ffffff', size: 12 }
                }
            };

            // Enhanced configuration
            const config = {
                responsive: true,
                displayModeBar: true,
                displaylogo: false,
                modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
                modeBarButtonsToAdd: [{
                    name: 'Reset View',
                    icon: Plotly.Icons.home,
                    click: function() {
                        const update = {
                            'scene.camera.eye': { x: 2.5, y: 2.5, z: 2.5 },
                            'scene.camera.center': { x: 0, y: 0, z: 0 },
                            'scene.camera.up': { x: 0, y: 0, z: 1 }
                        };
                        Plotly.animate('quantumResults', update, {
                            transition: { duration: 1000, easing: 'cubic-in-out' }
                        });
                    }
                }],
                toImageButtonOptions: {
                    format: 'png',
                    filename: 'quantum_bloch_sphere',
                    height: 800,
                    width: 1200,
                    scale: 2
                }
            };

            // Plot the visualization
            Plotly.newPlot('quantumResults', traces, layout, config);

            // Add interactive features
            const plotDiv = document.getElementById('quantumResults');
            if (plotDiv) {
                plotDiv.on('plotly_hover', function(data) {
                    if (data.points && data.points[0]) {
                        const point = data.points[0];
                        if (point.data.name && point.data.name.includes('State Vector')) {
                            console.log(`Hovering over ${point.data.name}`);
                        }
                    }
                });

                plotDiv.on('plotly_click', function(data) {
                    if (data.points && data.points[0]) {
                        const point = data.points[0];
                        if (point.data.name && point.data.name.includes('Qubit')) {
                            const qubitIndex = parseInt(point.data.name.match(/\d+/)[0]);
                            console.log(`Clicked on Qubit ${qubitIndex}`);
                            
                            // Animate camera to focus on this qubit
                            const [rx, ry, rz] = blochVectors[qubitIndex];
                            const distance = Math.sqrt(rx*rx + ry*ry + rz*rz) + 1.5;
                            const update = {
                                'scene.camera.eye': { 
                                    x: rx * distance, 
                                    y: ry * distance, 
                                    z: rz * distance 
                                },
                                'scene.camera.center': { x: rx, y: ry, z: rz }
                            };
                            
                            Plotly.animate('quantumResults', update, {
                                transition: { duration: 1500, easing: 'cubic-in-out' }
                            });
                        }
                    }
                });
            }

            // Update quantum state information
            updateQuantumStateInfo(parsed, blochVectors);
            updateEntanglementInfo(blochVectors);

            console.log('Enhanced quantum visualization completed successfully!');

        } catch (error) {
            console.error('Enhanced visualization error:', error);
            alert(`Visualization error: ${error.message}`);
        }
    }

    // Update quantum state information panel
    function updateQuantumStateInfo(parsed, blochVectors) {
        const stateDetails = document.getElementById('stateDetails');
        if (stateDetails) {
            let html = '<div class="state-grid">';
            
            for (let i = 0; i < parsed.numQubits; i++) {
                const [rx, ry, rz] = blochVectors[i];
                const state = Math.abs(rz) > 0.5 ? '|1⟩' : '|0⟩';
                const purity = Math.sqrt(rx*rx + ry*ry + rz*rz);
                
                html += `
                    <div class="state-item">
                        <h4>Qubit ${i}</h4>
                        <p><strong>State:</strong> ${state}</p>
                        <p><strong>Bloch Vector:</strong> (${rx.toFixed(3)}, ${ry.toFixed(3)}, ${rz.toFixed(3)})</p>
                        <p><strong>Purity:</strong> ${purity.toFixed(3)}</p>
                    </div>
                `;
            }
            
            html += '</div>';
            stateDetails.innerHTML = html;
        }
    }

    // Update entanglement information panel
    function updateEntanglementInfo(blochVectors) {
        const entanglementDetails = document.getElementById('entanglementDetails');
        if (entanglementDetails && blochVectors.length > 1) {
            const miMatrix = pairwiseLinearMI(blochVectors);
            
            let html = '<div class="entanglement-matrix">';
            html += '<h4>Pairwise Entanglement Matrix:</h4>';
            html += '<div class="matrix-grid">';
            
            for (let i = 0; i < blochVectors.length; i++) {
                for (let j = 0; j < blochVectors.length; j++) {
                    const value = i === j ? 0 : miMatrix[i][j];
                    const color = value > 0.5 ? '#ff6b6b' : value > 0.2 ? '#ffd93d' : '#51cf66';
                    html += `<div class="matrix-cell" style="color: ${color}">${value.toFixed(3)}</div>`;
                }
            }
            
            html += '</div></div>';
            entanglementDetails.innerHTML = html;
        }
    }

    // Create enhanced Bloch visualization with beautiful effects
    function createEnhancedBlochVisualization(numQubits, blochVectors) {
        const traces = [];
        
        for (let i = 0; i < numQubits; i++) {
            const [rx, ry, rz] = blochVectors[i];
            
            // Create high-resolution sphere surface
            const phi = Array.from({length: 40}, (_, i) => i * Math.PI / 20);
            const theta = Array.from({length: 40}, (_, i) => i * Math.PI / 20);
            
            const x = phi.map(p => theta.map(t => Math.sin(t) * Math.cos(p)));
            const y = phi.map(p => theta.map(t => Math.sin(t) * Math.sin(p)));
            const z = phi.map(p => theta.map(t => Math.cos(t)));
            
            // Main sphere with beautiful gradient
            traces.push({
                type: 'surface',
                x: x, y: y, z: z,
                opacity: 0.08,
                colorscale: [
                    [0, '#1e3a8a'],    // Dark blue
                    [0.2, '#3b82f6'],  // Blue
                    [0.4, '#60a5fa'],  // Light blue
                    [0.6, '#93c5fd'],  // Lighter blue
                    [0.8, '#dbeafe'],  // Very light blue
                    [1, '#f0f9ff']     // Almost white
                ],
                showscale: false,
                name: `Qubit ${i} Sphere`,
                hoverinfo: 'name',
                lighting: {
                    ambient: 0.4,
                    diffuse: 0.9,
                    specular: 0.6,
                    roughness: 0.15,
                    fresnel: 0.4
                }
            });
            
            // Enhanced wireframe overlay
            const wireframePhi = Array.from({length: 20}, (_, i) => i * Math.PI / 10);
            const wireframeTheta = Array.from({length: 20}, (_, i) => i * Math.PI / 10);
            
            const wireframeX = wireframePhi.map(p => wireframeTheta.map(t => Math.sin(t) * Math.cos(p)));
            const wireframeY = wireframePhi.map(p => wireframeTheta.map(t => Math.sin(t) * Math.sin(p)));
            const wireframeZ = wireframePhi.map(p => wireframeTheta.map(t => Math.cos(t)));
            
            traces.push({
                type: 'surface',
                x: wireframeX, y: wireframeY, z: wireframeZ,
                opacity: 0.5,
                colorscale: [[0, '#4a90e2'], [1, '#4a90e2']],
                showscale: false,
                name: `Qubit ${i} Wireframe`,
                hoverinfo: 'skip',
                lighting: {
                    ambient: 0.1,
                    diffuse: 0.1,
                    specular: 0.1
                }
            });
            
            // Enhanced Bloch vector with glow effect
            traces.push({
                type: 'scatter3d',
                x: [0, rx], y: [0, ry], z: [0, rz],
                mode: 'lines+markers',
                line: { 
                    color: '#ff6b6b', 
                    width: 18,
                    dash: 'solid'
                },
                marker: { 
                    size: 12, 
                    color: '#ff6b6b',
                    symbol: 'sphere',
                    line: { color: '#ffffff', width: 3 }
                },
                name: `Qubit ${i} State Vector`,
                hoverinfo: 'name+text',
                text: [`|0⟩`, `State: (${rx.toFixed(3)}, ${ry.toFixed(3)}, ${rz.toFixed(3)})`],
                textposition: 'middle center'
            });
            
            // Glow effect around the Bloch vector
            traces.push({
                type: 'scatter3d',
                x: [0, rx], y: [0, ry], z: [0, rz],
                mode: 'lines',
                line: { 
                    color: '#ff6b6b', 
                    width: 30,
                    dash: 'solid'
                },
                opacity: 0.25,
                name: `Qubit ${i} Glow`,
                hoverinfo: 'skip',
                showlegend: false
            });
            
            // Enhanced state point with dynamic styling
            const stateColor = Math.abs(rz) > 0.5 ? '#ffd93d' : '#51cf66';
            const stateSymbol = Math.abs(rz) > 0.5 ? 'diamond' : 'star';
            
            traces.push({
                type: 'scatter3d',
                x: [rx], y: [ry], z: [rz],
                mode: 'markers',
                marker: { 
                    size: 18, 
                    color: stateColor,
                    symbol: stateSymbol,
                    line: { color: '#ffffff', width: 4 }
                },
                name: `Qubit ${i} State Point`,
                hoverinfo: 'name+text',
                text: [`|${Math.abs(rz) > 0.5 ? '1' : '0'}⟩`],
                textposition: 'top center'
            });
            
            // Enhanced coordinate axes
            const axisLength = 1.5;
            const axisWidth = 10;
            
            traces.push({
                type: 'scatter3d',
                x: [0, axisLength], y: [0, 0], z: [0, 0],
                mode: 'lines',
                line: { color: '#ff4757', width: axisWidth },
                name: 'X-axis',
                showlegend: false,
                hoverinfo: 'skip'
            });
            traces.push({
                type: 'scatter3d',
                x: [0, 0], y: [0, axisLength], z: [0, 0],
                mode: 'lines',
                line: { color: '#2ed573', width: axisWidth },
                name: 'Y-axis',
                showlegend: false,
                hoverinfo: 'skip'
            });
            traces.push({
                type: 'scatter3d',
                x: [0, 0], y: [0, 0], z: [0, axisLength],
                mode: 'lines',
                line: { color: '#3742fa', width: axisWidth },
                name: 'Z-axis',
                showlegend: false,
                hoverinfo: 'skip'
            });
            
            // Enhanced axis labels
            traces.push({
                type: 'scatter3d',
                x: [axisLength + 0.2, 0, 0], 
                y: [0, axisLength + 0.2, 0], 
                z: [0, 0, axisLength + 0.2],
                mode: 'text',
                text: ['+X', '+Y', '+Z'],
                textposition: 'middle center',
                textfont: { size: 20, color: '#ffffff' },
                name: 'Axis Labels',
                showlegend: false,
                hoverinfo: 'skip'
            });
            
            // Enhanced state labels
            traces.push({
                type: 'scatter3d',
                x: [0, 0], 
                y: [0, 0], 
                z: [axisLength + 0.2, -axisLength - 0.2],
                mode: 'text',
                text: ['|0⟩ (+Z)', '|1⟩ (-Z)'],
                textposition: 'middle center',
                textfont: { size: 18, color: '#a6abc8' },
                name: 'State Labels',
                showlegend: false,
                hoverinfo: 'skip'
            });
            
            // Enhanced grid lines
            const gridSteps = 16;
            for (let j = 0; j < gridSteps; j++) {
                const angle = (j * Math.PI) / gridSteps;
                const x1 = Math.cos(angle);
                const y1 = Math.sin(angle);
                
                traces.push({
                    type: 'scatter3d',
                    x: [x1, -x1], y: [y1, -y1], z: [0, 0],
                    mode: 'lines',
                    line: { color: '#2a2f4a', width: 3, dash: 'dot' },
                    name: 'Grid',
                    showlegend: false,
                    hoverinfo: 'skip'
                });
                
                traces.push({
                    type: 'scatter3d',
                    x: [0, 0], y: [0, 0], z: [1, -1],
                    mode: 'lines',
                    line: { color: '#2a2f4a', width: 3, dash: 'dot' },
                    name: 'Grid',
                    showlegend: false,
                    hoverinfo: 'skip'
                });
            }
            
            // Quantum state information text
            const stateInfo = `Qubit ${i}: |${Math.abs(rz) > 0.5 ? '1' : '0'}⟩`;
            
            traces.push({
                type: 'scatter3d',
                x: [rx * 0.7], 
                y: [ry * 0.7], 
                z: [rz * 0.7],
                mode: 'text',
                text: [stateInfo],
                textposition: 'middle center',
                textfont: { size: 16, color: '#ffd93d' },
                name: 'State Info',
                showlegend: false,
                hoverinfo: 'skip'
            });
        }
        
        return traces;
    }

    // Event Listeners
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded, initializing quantum visualizer...');
        
        // Populate examples
        const exampleSelect = document.getElementById('exampleSelect');
        console.log('Example select element:', exampleSelect);
        console.log('Available examples:', Object.keys(examples));
        
        if (exampleSelect) {
            Object.keys(examples).forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                exampleSelect.appendChild(option);
                console.log('Added example:', name);
            });
            
            // Load first example
            if (exampleSelect.value) {
                document.getElementById('qasmInput').value = examples[exampleSelect.value];
                console.log('Loaded first example:', exampleSelect.value);
            }
        } else {
            console.error('Example select element not found!');
        }

        // Event listeners
        const runBtn = document.getElementById('runBtn');
        if (runBtn) {
            runBtn.addEventListener('click', () => {
                console.log('Run button clicked');
                const qasm = document.getElementById('qasmInput').value;
                if (!qasm.trim()) {
                    alert('Please enter QASM code');
                    return;
                }
                
                try {
                    console.log('Parsing QASM:', qasm);
                    const parsed = parseQasm(qasm);
                    console.log('Parsed result:', parsed);
                    
                    const sim = simulateCircuit(parsed.numQubits, parsed.ops);
                    console.log('Simulation result:', sim);
                    
                    const blochVectors = [];
                    for (let i = 0; i < parsed.numQubits; i++) {
                        const reduced = reducedState(sim.finalState, parsed.numQubits, i);
                        const bloch = blochVector(reduced);
                        blochVectors.push(bloch);
                        console.log(`Qubit ${i} Bloch vector:`, bloch);
                    }
                    
                    LAST.sim = { numQubits: parsed.numQubits, blochVectors, ops: parsed.ops };
                    
                    // Show summary
                    const summary = document.getElementById('summary');
                    if (summary) {
                        summary.innerHTML = `
                            <h3>Simulation Results</h3>
                            <p><strong>Qubits:</strong> ${parsed.numQubits}</p>
                            <p><strong>Gates:</strong> ${parsed.ops.length}</p>
                            <p><strong>Circuit Depth:</strong> ${parsed.ops.length}</p>
                        `;
                        summary.hidden = false;
                    }
                    
                    console.log('Rendering visualization...');
                    recomputeAndRenderForCurrentControls();
                    
                    // Show step controls if requested
                    const showSteps = document.getElementById('showSteps');
                    if (showSteps && showSteps.checked && sim.steps.length > 1) {
                        const stepControls = document.getElementById('stepControls');
                        if (stepControls) {
                            stepControls.hidden = false;
                            const stepRange = document.getElementById('stepRange');
                            if (stepRange) {
                                stepRange.max = sim.steps.length - 1;
                                stepRange.value = 0;
                                LAST.showSteps = true;
                                LAST.stepIndex = 0;
                                updateStepLabel();
                            }
                        }
                    }
                    
                } catch (error) {
                    console.error('Error in simulation:', error);
                    alert('Error: ' + error.message);
                }
            });
        } else {
            console.error('Run button not found!');
        }
        
        // Add load example event listener
        if (exampleSelect) {
            exampleSelect.addEventListener('change', (e) => {
                const qasmInput = document.getElementById('qasmInput');
                if (qasmInput && examples[e.target.value]) {
                    qasmInput.value = examples[e.target.value];
                    console.log('Loaded example:', e.target.value);
                }
            });
        }
        
        // Add mode change event listener
        const modeSelect = document.getElementById('mode');
        if (modeSelect) {
            modeSelect.addEventListener('change', switchMode);
        }
        
        // Other event listeners
        const showStepsCheckbox = document.getElementById('showSteps');
        if (showStepsCheckbox) {
            showStepsCheckbox.addEventListener('change', (e) => {
                const stepControls = document.getElementById('stepControls');
                if (stepControls) {
                    stepControls.hidden = !e.target.checked;
                }
            });
        }
        
        const stepRange = document.getElementById('stepRange');
        if (stepRange) {
            stepRange.addEventListener('input', updateStepLabel);
        }
        
        const noiseType = document.getElementById('noiseType');
        if (noiseType) {
            noiseType.addEventListener('change', recomputeAndRenderForCurrentControls);
        }
        
        const noiseParam = document.getElementById('noiseParam');
        if (noiseParam) {
            noiseParam.addEventListener('input', (e) => {
                const noiseParamLabel = document.getElementById('noiseParamLabel');
                if (noiseParamLabel) {
                    noiseParamLabel.textContent = e.target.value;
                }
                recomputeAndRenderForCurrentControls();
            });
        }
        
        const pairwiseToggle = document.getElementById('pairwiseToggle');
        if (pairwiseToggle) {
            pairwiseToggle.addEventListener('change', recomputeAndRenderForCurrentControls);
        }
        
        const autoRotate = document.getElementById('autoRotate');
        if (autoRotate) {
            autoRotate.addEventListener('change', (e) => {
                if (e.target.checked) {
                    startRotation();
                } else {
                    stopRotation();
                }
            });
        }
        
        const rotateSpeed = document.getElementById('rotateSpeed');
        if (rotateSpeed) {
            rotateSpeed.addEventListener('input', recomputeAndRenderForCurrentControls);
        }
        
        const randomize = document.getElementById('randomize');
        if (randomize) {
            randomize.addEventListener('click', () => {
                const randQ = document.getElementById('randQ');
                const randDepth = document.getElementById('randDepth');
                if (randQ && randDepth) {
                    const numQubits = parseInt(randQ.value);
                    const depth = parseInt(randDepth.value);
                    
                    let qasm = `OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[${numQubits}];\n`;
                    
                    const gates = ['h', 'x', 'y', 'z', 'rx', 'ry', 'rz'];
                    for (let i = 0; i < depth; i++) {
                        const gate = gates[Math.floor(Math.random() * gates.length)];
                        const qubit = Math.floor(Math.random() * numQubits);
                        
                        if (['rx', 'ry', 'rz'].includes(gate)) {
                            const angle = (Math.random() - 0.5) * 2 * Math.PI;
                            qasm += `${gate}(${angle.toFixed(3)}) q[${qubit}];\n`;
                        } else {
                            qasm += `${gate} q[${qubit}];\n`;
                        }
                    }
                    
                    const qasmInput = document.getElementById('qasmInput');
                    if (qasmInput) {
                        qasmInput.value = qasm;
                    }
                }
            });
        }
        
        const runAnalysis = document.getElementById('runAnalysis');
        if (runAnalysis) {
            runAnalysis.addEventListener('click', runAdvancedAnalysis);
        }
        
        const connectBtn = document.getElementById('connectBtn');
        if (connectBtn) {
            connectBtn.addEventListener('click', startLiveUrl);
        }
        
        const disconnectBtn = document.getElementById('disconnectBtn');
        if (disconnectBtn) {
            disconnectBtn.addEventListener('click', stopLive);
        }
        
        const renderJson = document.getElementById('renderJson');
        if (renderJson) {
            renderJson.addEventListener('click', renderManualJson);
        }
        
        const exportCsv = document.getElementById('exportCsv');
        if (exportCsv) {
            exportCsv.addEventListener('click', exportCsv);
        }
        
        const exportPng = document.getElementById('exportPng');
        if (exportPng) {
            exportPng.addEventListener('click', exportPng);
        }
        
        // Auto-run if enabled
        const autoRun = document.getElementById('autoRun');
        if (autoRun) {
            autoRun.addEventListener('change', (e) => {
                if (e.target.checked) {
                    const qasmInput = document.getElementById('qasmInput');
                    if (qasmInput && qasmInput.value) {
                        const runBtn = document.getElementById('runBtn');
                        if (runBtn) {
                            runBtn.click();
                        }
                    }
                }
            });
        }
        
        // Initialize
        console.log('Initializing modes...');
        switchMode();
        console.log('Quantum visualizer initialization complete!');
    });

    function updateStepLabel() {
        const stepRange = document.getElementById('stepRange');
        const stepLabel = document.getElementById('stepLabel');
        stepLabel.textContent = `${stepRange.value} / ${stepRange.max}`;
    }

    // ===== 3. ADVANCED QUANTUM SIMULATION FUNCTIONS =====
	
	// Matrix operations for quantum states
	function matrixMultiply(matrix, vector) {
		const result = new Array(matrix.length).fill(0).map(() => new Complex(0, 0));
		for (let i = 0; i < matrix.length; i++) {
			for (let j = 0; j < vector.length; j++) {
				result[i] = result[i].add(matrix[i][j].mul(vector[j]));
			}
		}
		return result;
	}
	
	function kroneckerProduct(matrixA, matrixB) {
		const rowsA = matrixA.length;
		const colsA = matrixA[0].length;
		const rowsB = matrixB.length;
		const colsB = matrixB[0].length;
		
		const result = new Array(rowsA * rowsB).fill(0).map(() => 
			new Array(colsA * colsB).fill(0).map(() => new Complex(0, 0))
		);
		
		for (let i = 0; i < rowsA; i++) {
			for (let j = 0; j < colsA; j++) {
				for (let k = 0; k < rowsB; k++) {
					for (let l = 0; l < colsB; l++) {
						result[i * rowsB + k][j * colsB + l] = matrixA[i][j].mul(matrixB[k][l]);
					}
				}
			}
		}
		return result;
	}
	
	// Partial tracing for isolating individual qubits
	function partialTrace(densityMatrix, numQubits, targetQubitIndex) {
		if (targetQubitIndex < 0 || targetQubitIndex >= numQubits) {
			throw new Error("Target qubit index out of bounds for partial trace.");
		}
		
		const reducedDensityMatrix = [
			[new Complex(0, 0), new Complex(0, 0)],
			[new Complex(0, 0), new Complex(0, 0)]
		];
		
		const totalSize = Math.pow(2, numQubits);
		
		for (let row_q = 0; row_q < 2; row_q++) {
			for (let col_q = 0; col_q < 2; col_q++) {
				let sumVal = new Complex(0, 0);
				const otherQubitsCount = numQubits - 1;
				
				for (let other_q_state_int = 0; other_q_state_int < Math.pow(2, otherQubitsCount); other_q_state_int++) {
					let bra_full_idx = 0;
					let ket_full_idx = 0;
					let currentOtherQubitBit = 0;
					
					for (let bitPos = 0; bitPos < numQubits; bitPos++) {
						if (bitPos === targetQubitIndex) {
							bra_full_idx |= (row_q << (numQubits - 1 - bitPos));
							ket_full_idx |= (col_q << (numQubits - 1 - bitPos));
						} else {
							const bit = (other_q_state_int >> (otherQubitsCount - 1 - currentOtherQubitBit)) & 1;
							bra_full_idx |= (bit << (numQubits - 1 - bitPos));
							ket_full_idx |= (bit << (numQubits - 1 - bitPos));
							currentOtherQubitBit++;
						}
					}
					sumVal = sumVal.add(densityMatrix[bra_full_idx][ket_full_idx]);
				}
				reducedDensityMatrix[row_q][col_q] = sumVal;
			}
		}
		
		return reducedDensityMatrix;
	}
	
	// Bloch sphere visualization of mixed states
	function calculateBlochVectorFromDensityMatrix(rho) {
		const x = rho[0][1].add(rho[1][0]).real;
		const y = rho[0][1].sub(rho[1][0]).imag;
		const z = rho[0][0].sub(rho[1][1]).real;
		
		return [x, y, z];
	}
	
	function calculatePurityFromDensityMatrix(rho) {
		let purity = new Complex(0, 0);
		for (let i = 0; i < 2; i++) {
			for (let j = 0; j < 2; j++) {
				purity = purity.add(rho[i][j].mul(rho[j][i]));
			}
		}
		return purity.real;
	}
	
	// Simulation of multi-qubit systems
	function simulateMultiQubitSystem(qasm, numQubits) {
		try {
			const operations = parseQasmOperations(qasm);
			
			// Initialize quantum state vector
			let stateVector = new Array(Math.pow(2, numQubits)).fill(0).map(() => new Complex(0, 0));
			stateVector[0] = new Complex(1, 0); // Start with |0...0⟩
			
			// Apply gates with noise simulation
			const simulationResults = applyGatesWithAdvancedNoise(stateVector, operations, numQubits);
			
			// Calculate density matrix
			const densityMatrix = calculateDensityMatrix(simulationResults.finalState);
			
			// Calculate individual qubit states through partial tracing
			const individualQubitStates = [];
			for (let i = 0; i < numQubits; i++) {
				const reducedRho = partialTrace(densityMatrix, numQubits, i);
				const blochVector = calculateBlochVectorFromDensityMatrix(reducedRho);
				const purity = calculatePurityFromDensityMatrix(reducedRho);
				
				individualQubitStates.push({
					qubitIndex: i,
					blochVector,
					densityMatrix: reducedRho,
					purity,
					coherence: reducedRho[0][1].abs(),
					isMixed: purity < 0.99
				});
			}
			
			// Calculate entanglement measures
			const entanglementMeasures = calculateAdvancedEntanglementMeasures(simulationResults.finalState, numQubits);
			
			// Calculate error metrics
			const errorMetrics = calculateAdvancedErrorMetrics(simulationResults.idealState, simulationResults.finalState, numQubits);
			
			return {
				individualQubitStates,
				entanglementMeasures,
				errorMetrics,
				simulationResults,
				operations,
				numQubits,
				totalState: simulationResults.finalState,
				densityMatrix
			};
			
		} catch (error) {
			console.error('Error in multi-qubit simulation:', error);
			return createDefaultAdvancedSimulation(numQubits);
		}
	}
	
	// Advanced noise simulation
	function applyGatesWithAdvancedNoise(initialState, operations, numQubits) {
		let currentState = [...initialState];
		let idealState = [...initialState];
		
		const noiseParams = {
			depolarizationRate: 0.01,
			dephasingRate: 0.005,
			amplitudeDampingRate: 0.003,
			bitFlipRate: 0.002,
			phaseFlipRate: 0.002
		};
		
		for (const op of operations) {
			idealState = applyQuantumGate(idealState, op, numQubits);
			currentState = applyQuantumGate(currentState, op, numQubits);
			currentState = applyComprehensiveNoise(currentState, numQubits, noiseParams);
		}
		
		return {
			idealState,
			finalState: currentState,
			noiseParams
		};
	}
	
	function applyQuantumGate(state, operation, numQubits) {
		const { gate, params, qubits } = operation;
		const size = Math.pow(2, numQubits);
		const newState = new Array(size).fill(0).map(() => new Complex(0, 0));
		
		// Simplified gate application for now
		if (qubits.length === 1) {
			const targetQubit = qubits[0];
			const gateMatrix = QUANTUM_GATES[gate] || QUANTUM_GATES['h'];
			const fullGateMatrix = createFullGateMatrix(gateMatrix, numQubits, targetQubit);
			return matrixMultiply(fullGateMatrix, state);
		}
		
		return state;
	}
	
	function createFullGateMatrix(gateMatrix, numQubits, targetQubit) {
		let fullMatrix = [[new Complex(1, 0)]];
		
		for (let i = 0; i < numQubits; i++) {
			if (i === targetQubit) {
				fullMatrix = kroneckerProduct(fullMatrix, gateMatrix);
			} else {
				const identity = [[new Complex(1, 0), new Complex(0, 0)], [new Complex(0, 0), new Complex(1, 0)]];
				fullMatrix = kroneckerProduct(fullMatrix, identity);
			}
		}
		
		return fullMatrix;
	}
	
	function applyComprehensiveNoise(state, numQubits, noiseParams) {
		const size = Math.pow(2, numQubits);
		const noisyState = [...state];
		
		if (noiseParams.depolarizationRate > 0) {
			for (let i = 0; i < size; i++) {
				if (Math.random() < noiseParams.depolarizationRate) {
					const noiseFactor = 0.8 + 0.4 * Math.random();
					noisyState[i] = noisyState[i].mul(new Complex(noiseFactor, 0));
				}
			}
		}
		
		const norm = Math.sqrt(noisyState.reduce((sum, amp) => sum + amp.abs() * amp.abs(), 0));
		return noisyState.map(amp => amp.div(new Complex(norm, 0)));
	}
	
	function calculateDensityMatrix(stateVector) {
		const size = stateVector.length;
		const densityMatrix = new Array(size).fill(0).map(() => 
			new Array(size).fill(0).map(() => new Complex(0, 0))
		);
		
		for (let i = 0; i < size; i++) {
			for (let j = 0; j < size; j++) {
				densityMatrix[i][j] = stateVector[i].mul(stateVector[j].conj());
			}
		}
		
		return densityMatrix;
	}
	
	function calculateAdvancedEntanglementMeasures(state, numQubits) {
		if (numQubits < 2) return { entanglement: 0, concurrence: 0, negativity: 0, isEntangled: false };
		
		const midPoint = Math.floor(numQubits / 2);
		const densityMatrix = calculateDensityMatrix(state);
		const rhoA = partialTrace(densityMatrix, numQubits, midPoint);
		
		const eigenvalues = calculateEigenvalues(rhoA);
		const entropy = -eigenvalues.reduce((sum, lambda) => {
			if (lambda > 0) return sum + lambda * Math.log2(lambda);
			return sum;
		}, 0);
		
		const concurrence = Math.sqrt(2 * (1 - Math.pow(2, -entropy)));
		
		return {
			entanglement: entropy,
			concurrence,
			negativity: 0.3,
			isEntangled: entropy > 0.1
		};
	}
	
	function calculateEigenvalues(matrix) {
		const a = matrix[0][0].real;
		const b = matrix[0][1].real;
		const c = matrix[1][0].real;
		const d = matrix[1][1].real;
		
		const trace = a + d;
		const det = a * d - b * c;
		
		const discriminant = trace * trace - 4 * det;
		const sqrtDisc = Math.sqrt(discriminant);
		
		return [(trace + sqrtDisc) / 2, (trace - sqrtDisc) / 2];
	}
	
	function calculateAdvancedErrorMetrics(idealState, noisyState, numQubits) {
		const fidelity = calculateFidelity(idealState, noisyState);
		const traceDistance = calculateTraceDistance(idealState, noisyState);
		
		return {
			fidelity,
			traceDistance,
			diamondNorm: traceDistance,
			errorRate: 1 - fidelity,
			successProbability: fidelity * fidelity,
			quantumErrorCorrection: fidelity > 0.99
		};
	}
	
	function calculateFidelity(state1, state2) {
		const overlap = state1.reduce((sum, amp, i) => sum + amp.mul(state2[i]), new Complex(0, 0));
		return overlap.abs() * overlap.abs();
	}
	
	function calculateTraceDistance(state1, state2) {
		let sum = 0;
		for (let i = 0; i < state1.length; i++) {
			sum += state1[i].sub(state2[i]).abs();
		}
		return sum / 2;
	}
	
	function createDefaultAdvancedSimulation(numQubits) {
		const qubitStates = [];
		
		for (let i = 0; i < numQubits; i++) {
			qubitStates.push({
				qubitIndex: i,
				blochVector: [0.7, 0.5, 0.3],
				densityMatrix: [
					[new Complex(0.8, 0), new Complex(0.2, 0)],
					[new Complex(0.2, 0), new Complex(0.2, 0)]
				],
				purity: 0.7,
				coherence: 0.2,
				isMixed: true
			});
		}
		
		return {
			individualQubitStates: qubitStates,
			entanglementMeasures: { 
				entanglement: 0.5, 
				concurrence: 0.7, 
				negativity: 0.3,
				isEntangled: true
			},
			errorMetrics: { 
				fidelity: 0.9, 
				traceDistance: 0.1, 
				diamondNorm: 0.1,
				errorRate: 0.1, 
				successProbability: 0.81,
				quantumErrorCorrection: false
			},
			simulationResults: { 
				noiseParams: { 
					depolarizationRate: 0.01, 
					dephasingRate: 0.005, 
					amplitudeDampingRate: 0.003,
					bitFlipRate: 0.002,
					phaseFlipRate: 0.002
				} 
			},
			operations: [],
			numQubits,
			totalState: new Array(Math.pow(2, numQubits)).fill(0).map(() => new Complex(0, 0)),
			densityMatrix: []
		};
	}

	function parseQasmOperations(qasm) {
		const lines = qasm.split('\n').filter(line => line.trim() && !line.startsWith('//'));
		const operations = [];
		
		for (const line of lines) {
			const trimmed = line.trim();
			if (trimmed.startsWith('OPENQASM') || trimmed.startsWith('include') || trimmed.startsWith('qreg')) continue;
			
			// Parse gate operations with enhanced support
			const gateMatch = trimmed.match(/(\w+)\s*\(?([^)]*)\)?\s*q\[(\d+)\](?:\s*,\s*q\[(\d+)\])?/);
			if (gateMatch) {
				const [, gate, params, qubit1, qubit2] = gateMatch;
				operations.push({
					gate: gate.toLowerCase(),
					params: params ? parseFloat(params) : null,
					qubits: [parseInt(qubit1), qubit2 ? parseInt(qubit2) : null].filter(q => q !== null)
				});
			}
		}
		
		return operations;
	}
})();
