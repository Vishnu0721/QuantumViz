import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Helper functions for Complex numbers and Matrices
class CustomComplex {
    constructor(re = 0, im = 0) {
        this.re = re;
        this.im = im;
    }

    add(other) {
        return new CustomComplex(this.re + other.re, this.im + other.im);
    }

    sub(other) {
        return new CustomComplex(this.re - other.re, this.im - other.im);
    }

    mul(other) {
        return new CustomComplex(
            this.re * other.re - this.im * other.im,
            this.re * other.im + this.im * other.re
        );
    }

    div(other) {
        const denom = other.re * other.re + other.im * other.im;
        return new CustomComplex(
            (this.re * other.re + this.im * other.im) / denom,
            (this.im * other.re - this.re * other.im) / denom
        );
    }

    conj() {
        return new CustomComplex(this.re, -this.im);
    }

    abs() {
        return Math.sqrt(this.re * this.re + this.im * this.im);
    }

    pow(n) {
        const r = this.abs();
        const theta = Math.atan2(this.im, this.re);
        return new CustomComplex(
            Math.pow(r, n) * Math.cos(n * theta),
            Math.pow(r, n) * Math.sin(n * theta)
        );
    }

    toString() {
        if (this.im === 0) return this.re.toFixed(4);
        if (this.re === 0) return `${this.im.toFixed(4)}i`;
        return `${this.re.toFixed(4)} ${this.im > 0 ? '+' : '-'} ${Math.abs(this.im).toFixed(4)}i`;
    }

    static from(value) {
        if (value instanceof CustomComplex) {
            return value;
        } else if (typeof value === 'number') {
            return new CustomComplex(value, 0);
        } else if (typeof value === 'object' && value !== null && 're' in value && 'im' in value) {
            return new CustomComplex(value.re, value.im);
        }
        return new CustomComplex(0, 0);
    }
}

// --- Matrix Operations ---
const identityMatrix = (size) => {
    const mat = Array(size).fill(0).map(() => Array(size).fill(0).map(() => new CustomComplex(0, 0)));
    for (let i = 0; i < size; i++) {
        mat[i][i] = new CustomComplex(1, 0);
    }
    return mat;
};

const kroneckerProduct = (matA, matB) => {
    const rowsA = matA.length;
    const colsA = matA[0].length;
    const rowsB = matB.length;
    const colsB = matB[0].length;

    const resultRows = rowsA * rowsB;
    const resultCols = colsA * colsB;
    const result = Array(resultRows).fill(0).map(() => Array(resultCols).fill(0).map(() => new CustomComplex(0, 0)));

    for (let i = 0; i < rowsA; i++) {
        for (let j = 0; j < colsA; j++) {
            for (let k = 0; k < rowsB; k++) {
                for (let l = 0; l < colsB; l++) {
                    result[i * rowsB + k][j * colsB + l] = matA[i][j].mul(matB[k][l]);
                }
            }
        }
    }
    return result;
};

const matrixVectorMultiply = (matrix, vector) => {
    const rows = matrix.length;
    const cols = matrix[0].length;
    if (cols !== vector.length) {
        throw new Error("Matrix columns must match vector rows for multiplication.");
    }

    const result = Array(rows).fill(0).map(() => new CustomComplex(0, 0));
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            result[i] = result[i].add(matrix[i][j].mul(vector[j]));
        }
    }
    return result;
};

const outerProduct = (vecA, vecB) => {
    const size = vecA.length;
    const result = Array(size).fill(0).map(() => Array(size).fill(0).map(() => new CustomComplex(0, 0)));
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            result[i][j] = vecA[i].mul(vecB[j].conj());
        }
    }
    return result;
};

// --- Quantum Gate Definitions ---
const H = [
    [new CustomComplex(1 / Math.sqrt(2), 0), new CustomComplex(1 / Math.sqrt(2), 0)],
    [new CustomComplex(1 / Math.sqrt(2), 0), new CustomComplex(-1 / Math.sqrt(2), 0)],
];

const X = [
    [new CustomComplex(0, 0), new CustomComplex(1, 0)],
    [new CustomComplex(1, 0), new CustomComplex(0, 0)],
];

const Y = [
    [new CustomComplex(0, 0), new CustomComplex(0, -1)],
    [new CustomComplex(0, 1), new CustomComplex(0, 0)],
];

const Z = [
    [new CustomComplex(1, 0), new CustomComplex(0, 0)],
    [new CustomComplex(0, 0), new CustomComplex(-1, 0)],
];

const T = [
    [new CustomComplex(1, 0), new CustomComplex(0, 0)],
    [new CustomComplex(0, 0), CustomComplex.from(1).pow(0.25).mul(new CustomComplex(Math.cos(Math.PI / 4), Math.sin(Math.PI / 4)))],
];

const S = [
    [new CustomComplex(1, 0), new CustomComplex(0, 0)],
    [new CustomComplex(0, 0), CustomComplex.from(1).pow(0.25).mul(new CustomComplex(Math.cos(Math.PI / 2), Math.sin(Math.PI / 2)))],
];

const P = (phi) => [
    [new CustomComplex(1, 0), new CustomComplex(0, 0)],
    [new CustomComplex(0, 0), new CustomComplex(Math.cos(phi), Math.sin(phi))],
];

const Rx = (theta) => [
    [new CustomComplex(Math.cos(theta / 2), 0), new CustomComplex(0, -Math.sin(theta / 2))],
    [new CustomComplex(0, -Math.sin(theta / 2)), new CustomComplex(Math.cos(theta / 2), 0)],
];

const Ry = (theta) => [
    [new CustomComplex(Math.cos(theta / 2), 0), new CustomComplex(-Math.sin(theta / 2), 0)],
    [new CustomComplex(Math.sin(theta / 2), 0), new CustomComplex(Math.cos(theta / 2), 0)],
];

const Rz = (theta) => [
    [new CustomComplex(Math.cos(theta / 2), -Math.sin(theta / 2)), new CustomComplex(0, 0)],
    [new CustomComplex(0, 0), new CustomComplex(Math.cos(theta / 2), Math.sin(theta / 2))],
];

// --- Quantum Circuit Simulation Logic ---
const getFullGateMatrix = (baseGate, numQubits, targetQubit, controlQubit = null) => {
    let fullGate = identityMatrix(1);
    
    for (let i = 0; i < numQubits; i++) {
        if (i === targetQubit) {
            fullGate = kroneckerProduct(fullGate, baseGate);
        } else if (controlQubit !== null && i === controlQubit) {
            fullGate = kroneckerProduct(fullGate, identityMatrix(2));
        } else {
            fullGate = kroneckerProduct(fullGate, identityMatrix(2));
        }
    }

    if (controlQubit !== null) {
        if (baseGate === X) {
            const size = 2 ** numQubits;
            const cnotMatrix = identityMatrix(size);
            for (let i = 0; i < size; i++) {
                if (((i >> (numQubits - 1 - controlQubit)) & 1) === 1) {
                    const targetBit = (i >> (numQubits - 1 - targetQubit)) & 1;
                    const flippedI = i ^ (1 << (numQubits - 1 - targetQubit));
                    cnotMatrix[i][i] = new CustomComplex(0, 0);
                    cnotMatrix[i][flippedI] = new CustomComplex(1, 0);
                }
            }
            return cnotMatrix;
        } else if (baseGate === 'SWAP') {
            const size = 2 ** numQubits;
            const swapMatrix = identityMatrix(size);
            const q1 = Math.min(targetQubit, controlQubit);
            const q2 = Math.max(targetQubit, controlQubit);

            for (let i = 0; i < size; i++) {
                const bit1 = (i >> (numQubits - 1 - q1)) & 1;
                const bit2 = (i >> (numQubits - 1 - q2)) & 1;

                if (bit1 !== bit2) {
                    const j = i ^ (1 << (numQubits - 1 - q1)) ^ (1 << (numQubits - 1 - q2));
                    swapMatrix[i][i] = new CustomComplex(0,0);
                    swapMatrix[i][j] = new CustomComplex(1,0);
                }
            }
            return swapMatrix;
        }
    }
    return fullGate;
};

const simulateCircuit = (numQubits, operations) => {
    if (numQubits <= 0) return null;

    let stateVector = Array(2 ** numQubits).fill(0).map(() => new CustomComplex(0, 0));
    stateVector[0] = new CustomComplex(1, 0);

    const errors = [];

    for (const op of operations) {
        try {
            const parts = op.trim().split(/\s+/);
            const gateName = parts[0].toUpperCase();
            const qubits = parts.slice(1).map(Number);

            if (qubits.some(q => q < 0 || q >= numQubits)) {
                errors.push(`Error: Qubit index out of bounds for operation: ${op}`);
                continue;
            }

            let gateMatrix;
            if (gateName === 'H') {
                gateMatrix = getFullGateMatrix(H, numQubits, qubits[0]);
            } else if (gateName === 'X') {
                gateMatrix = getFullGateMatrix(X, numQubits, qubits[0]);
            } else if (gateName === 'Y') {
                gateMatrix = getFullGateMatrix(Y, numQubits, qubits[0]);
            } else if (gateName === 'Z') {
                gateMatrix = getFullGateMatrix(Z, numQubits, qubits[0]);
            } else if (gateName === 'T') {
                gateMatrix = getFullGateMatrix(T, numQubits, qubits[0]);
            } else if (gateName === 'S') {
                gateMatrix = getFullGateMatrix(S, numQubits, qubits[0]);
            } else if (gateName === 'P') {
                const angle = parseFloat(parts[1]);
                if (isNaN(angle)) throw new Error('Invalid angle for P gate.');
                gateMatrix = getFullGateMatrix(P(angle), numQubits, qubits[1]);
            } else if (gateName === 'RX') {
                const angle = parseFloat(parts[1]);
                if (isNaN(angle)) throw new Error('Invalid angle for Rx gate.');
                gateMatrix = getFullGateMatrix(Rx(angle), numQubits, qubits[1]);
            } else if (gateName === 'RY') {
                const angle = parseFloat(parts[1]);
                if (isNaN(angle)) throw new Error('Invalid angle for Ry gate.');
                gateMatrix = getFullGateMatrix(Ry(angle), numQubits, qubits[1]);
            } else if (gateName === 'RZ') {
                const angle = parseFloat(parts[1]);
                if (isNaN(angle)) throw new Error('Invalid angle for Rz gate.');
                gateMatrix = getFullGateMatrix(Rz(angle), numQubits, qubits[1]);
            } else if (gateName === 'CNOT') {
                if (qubits.length !== 2) throw new Error('CNOT requires 2 qubit indices (control, target).');
                gateMatrix = getFullGateMatrix(X, numQubits, qubits[1], qubits[0]);
            } else if (gateName === 'SWAP') {
                 if (qubits.length !== 2) throw new Error('SWAP requires 2 qubit indices (q1, q2).');
                gateMatrix = getFullGateMatrix('SWAP', numQubits, qubits[0], qubits[1]);
            } else {
                errors.push(`Error: Unknown gate "${gateName}" in operation: ${op}`);
                continue;
            }
            stateVector = matrixVectorMultiply(gateMatrix, stateVector);
        } catch (e) {
            errors.push(`Error processing operation "${op}": ${e.message}`);
        }
    }
    return { finalStateVector: stateVector, errors };
};

// --- Partial Trace ---
const partialTrace = (densityMatrix, numQubits, targetQubitIndex) => {
    if (targetQubitIndex < 0 || targetQubitIndex >= numQubits) {
        throw new Error("Target qubit index out of bounds for partial trace.");
    }

    const reducedDensityMatrix = Array(2).fill(0).map(() => Array(2).fill(0).map(() => new CustomComplex(0, 0)));
    const totalSize = 2 ** numQubits;

    for (let row_q = 0; row_q < 2; row_q++) {
        for (let col_q = 0; col_q < 2; col_q++) {
            let sumVal = new CustomComplex(0, 0);

            const otherQubitsCount = numQubits - 1;
            for (let other_q_state_int = 0; other_q_state_int < (2 ** otherQubitsCount); other_q_state_int++) {
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
};

// --- Bloch Sphere Visualization Component ---
const BlochSphere = ({ blochVector, qubitIndex }) => {
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const vectorRef = useRef(null);

    const animate = useCallback(() => {
        if (!rendererRef.current) return;
        requestAnimationFrame(animate);
        rendererRef.current.render(sceneRef.current, cameraRef.current);
    }, []);

    useEffect(() => {
        const currentMount = mountRef.current;
        if (!currentMount) return;

        // Scene
        const scene = new THREE.Scene();
        sceneRef.current = scene;
        scene.background = new THREE.Color(0x1a1a2e);

        // Camera
        const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
        camera.position.z = 2.5;
        cameraRef.current = camera;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        currentMount.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 1;
        controls.maxDistance = 5;

        // Sphere
        const geometry = new THREE.SphereGeometry(1, 32, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0x4a4a6e,
            transparent: true,
            opacity: 0.2,
            wireframe: true
        });
        const sphere = new THREE.Mesh(geometry, material);
        scene.add(sphere);

        // Axes
        const axisLength = 1.2;
        const arrowHelperX = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), axisLength, 0xff0000, 0.2, 0.1);
        const arrowHelperY = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), axisLength, 0x00ff00, 0.2, 0.1);
        const arrowHelperZ = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), axisLength, 0x0000ff, 0.2, 0.1);
        scene.add(arrowHelperX);
        scene.add(arrowHelperY);
        scene.add(arrowHelperZ);

        // Labels
        const createTextSprite = (message, x, y, z, color = '#ffffff') => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            context.font = 'Bold 48px Arial';
            context.fillStyle = color;
            context.fillText(message, 0, 48);

            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.position.set(x, y, z);
            sprite.scale.set(0.5, 0.25, 1);
            return sprite;
        };

        scene.add(createTextSprite('+X', 1.3, 0, 0));
        scene.add(createTextSprite('-X', -1.3, 0, 0));
        scene.add(createTextSprite('+Y', 0, 1.3, 0));
        scene.add(createTextSprite('-Y', 0, -1.3, 0));
        scene.add(createTextSprite('|0⟩ (+Z)', 0, 0, 1.3));
        scene.add(createTextSprite('|1⟩ (-Z)', 0, 0, -1.3));

        // Point for the bloch vector
        const pointGeometry = new THREE.SphereGeometry(0.05, 16, 16);
        const pointMaterial = new THREE.MeshPhongMaterial({ color: 0xffa500 });
        const blochPoint = new THREE.Mesh(pointGeometry, pointMaterial);
        scene.add(blochPoint);
        vectorRef.current = blochPoint;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(0, 0, 5);
        scene.add(directionalLight);

        const handleResize = () => {
            if (currentMount) {
                camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
            }
        };

        window.addEventListener('resize', handleResize);
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            if (currentMount && renderer.domElement) {
                currentMount.removeChild(renderer.domElement);
            }
            renderer.dispose();
            controls.dispose();
            geometry.dispose();
            material.dispose();
            pointGeometry.dispose();
            pointMaterial.dispose();
            scene.traverse(obj => {
                if (obj.material) obj.material.dispose();
                if (obj.geometry) obj.geometry.dispose();
            });
            scene.clear();
        };
    }, [animate]);

    useEffect(() => {
        if (vectorRef.current && blochVector) {
            const [rx, ry, rz] = blochVector;
            vectorRef.current.position.set(rx, ry, rz);
        }
    }, [blochVector]);

    return (
        <div className="flex flex-col items-center p-4 bg-gray-800 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold text-white mb-2">Qubit {qubitIndex}</h3>
            <div ref={mountRef} className="w-full h-64 md:h-80 lg:h-96 rounded-lg overflow-hidden" />
        </div>
    );
};

const QuantumVisualizer = () => {
    const [numQubits, setNumQubits] = useState(1);
    const [circuitInput, setCircuitInput] = useState('H 0');
    const [blochVectors, setBlochVectors] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const runSimulation = () => {
        setLoading(true);
        setErrorMessage('');
        setBlochVectors([]);

        try {
            const operations = circuitInput.split('\n').filter(line => line.trim() !== '');
            const { finalStateVector, errors } = simulateCircuit(numQubits, operations);

            if (errors.length > 0) {
                setErrorMessage(errors.join('\n'));
                setLoading(false);
                return;
            }

            // Calculate overall density matrix
            const densityMatrix = outerProduct(finalStateVector, finalStateVector);

            const calculatedBlochVectors = [];
            for (let i = 0; i < numQubits; i++) {
                const reducedRho = partialTrace(densityMatrix, numQubits, i);

                const rho00 = reducedRho[0][0];
                const rho01 = reducedRho[0][1];
                const rho10 = reducedRho[1][0];
                const rho11 = reducedRho[1][1];

                const rx = rho01.add(rho10).re;
                const ry = rho01.sub(rho10).im;
                const rz = rho00.sub(rho11).re;

                calculatedBlochVectors.push([rx, ry, rz]);
            }
            setBlochVectors(calculatedBlochVectors);

        } catch (e) {
            setErrorMessage(`An unexpected error occurred: ${e.message}`);
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Initialize with a default simulation on mount
    useEffect(() => {
        runSimulation();
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 font-inter antialiased">
            <header className="text-center mb-8">
                <h1 className="text-4xl font-extrabold text-blue-400 mb-2">
                    Multi-Qubit Circuit Visualizer
                </h1>
                <p className="text-lg text-gray-300">
                    Simulate quantum circuits and visualize single-qubit mixed states on Bloch spheres.
                </p>
            </header>

            <div className="max-w-4xl mx-auto bg-gray-800 rounded-xl shadow-2xl p-6 mb-8 border border-blue-600">
                <div className="mb-6">
                    <label htmlFor="numQubits" className="block text-lg font-medium text-gray-200 mb-2">
                        Number of Qubits:
                    </label>
                    <input
                        type="number"
                        id="numQubits"
                        value={numQubits}
                        onChange={(e) => setNumQubits(Math.max(1, parseInt(e.target.value) || 1))}
                        min="1"
                        max="5"
                        className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:ring-blue-500 focus:border-blue-500 text-lg"
                    />
                    <p className="text-sm text-gray-400 mt-1">
                        (Recommended: 1 to 5 qubits for reasonable performance)
                    </p>
                </div>

                <div className="mb-6">
                    <label htmlFor="circuitInput" className="block text-lg font-medium text-gray-200 mb-2">
                        Circuit Operations:
                    </label>
                    <textarea
                        id="circuitInput"
                        value={circuitInput}
                        onChange={(e) => setCircuitInput(e.target.value)}
                        rows="8"
                        className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:ring-blue-500 focus:border-blue-500 text-lg font-mono resize-y"
                        placeholder="e.g.,
H 0
CNOT 0 1
X 2"
                    ></textarea>
                    <p className="text-sm text-gray-400 mt-1">
                        Each line: GATE_NAME qubit_index [control_qubit_index]
                    </p>
                </div>

                <button
                    onClick={runSimulation}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105
                                disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    disabled={loading}
                >
                    {loading ? (
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        'Run Simulation'
                    )}
                </button>

                {errorMessage && (
                    <div className="mt-6 p-4 bg-red-800 border border-red-600 rounded-lg text-red-200 text-sm font-mono whitespace-pre-wrap">
                        Error:
                        <br />
                        {errorMessage}
                    </div>
                )}
            </div>

            <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl font-bold text-center text-blue-300 mb-6">Bloch Sphere Visualizations</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {blochVectors.length > 0 ? (
                        blochVectors.map((vec, index) => (
                            <BlochSphere key={index} blochVector={vec} qubitIndex={index} />
                        ))
                    ) : (
                        <p className="col-span-full text-center text-gray-400 text-lg">
                            No simulation run or results to display.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuantumVisualizer;
