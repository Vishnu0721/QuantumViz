# Quantumviz — Qubit Bloch Visualizer

Load OpenQASM circuits, simulate the statevector, compute single-qubit reduced density matrices via partial trace, and plot each qubit on a Bloch sphere.

Useful for learning quantum computing, debugging circuits, and visualizing entanglement (mixed single-qubit states appear as shorter Bloch vectors).

---

## Features

- **Client-side QASM simulation** in the browser (no backend required for basic use)
- **3D Bloch sphere** visualization (Plotly / Three.js)
- **Partial trace** per qubit with purity, coherence, and related metrics
- **Live data stream** from a FastAPI + Qiskit backend (animated frames)
- **Manual JSON** input for static or animated Bloch / statevector data
- **Advanced analysis** UI (entanglement, noise, fidelity, coherence, and related views)
- **Export** CSV / image from the main web UI
- **Streamlit** Python app as an alternative UI
- **React + Three.js** demo page (`web/react-quantum.html`)

---

## Project structure

```
QUANTUMVIZ/
├── web/                    # Main browser UI (static HTML/JS)
│   ├── index.html          # Primary visualizer (modes, sim, analysis)
│   ├── app.js              # Client QASM parser + statevector simulator
│   ├── styles.css
│   ├── react-quantum.html  # Standalone React + Three.js demo
│   └── README.md           # Web UI usage notes & gate examples
├── server/
│   └── main.py             # FastAPI live Bloch frame API (Qiskit)
├── app/
│   ├── app.py              # Streamlit UI
│   ├── quantum.py          # Lightweight QASM parser + NumPy simulator
│   └── visuals.py          # Plotly Bloch figures
├── requirements.txt        # Python deps (API + Streamlit)
├── start_quantum_app.bat   # Open web/index.html in the browser
├── start_quantum_server.bat# HTTP server on port 5500 (project root)
└── start_server.bat        # HTTP server on port 5500 (from web/)
```

---

## Quick start (recommended)

Serve the static web UI (simulation runs in the browser):

**Windows (PowerShell / CMD)** — from this folder (`QUANTUMVIZ/`):

```bat
py -m http.server 5500
```

Or double-click `start_quantum_server.bat`.

Then open:

| App | URL |
|-----|-----|
| Main visualizer | http://127.0.0.1:5500/web/index.html |
| React demo | http://127.0.0.1:5500/web/react-quantum.html |

You can also open `web/index.html` directly in a modern browser (`start_quantum_app.bat`), though a local HTTP server is more reliable for some features.

---

## Web UI modes

In `web/index.html`, the **Mode** dropdown offers:

| Mode | Purpose |
|------|---------|
| **Quantum Simulator (QASM)** | Paste/upload OpenQASM, simulate & visualize Bloch spheres |
| **Live Data Stream** | Poll a JSON endpoint (default: FastAPI `/api/frame`) |
| **Manual JSON Input** | Paste Bloch / statevector JSON and render (optionally animate) |
| **Advanced Analysis** | Extra analysis views (entanglement, noise, fidelity, etc.) |

Example circuits (Bell, GHZ, product states) are available in the UI. Gate and input details: see [`web/README.md`](web/README.md).

---

## Python setup (API & Streamlit)

Required only for the live FastAPI backend or the Streamlit app.

```bat
cd QUANTUMVIZ
py -m venv .venv
.\.venv\Scripts\python -m pip install --upgrade pip
.\.venv\Scripts\pip install -r requirements.txt
```

**Dependencies** (`requirements.txt`): Streamlit, NumPy, Plotly, FastAPI, Uvicorn, Qiskit Terra.

### Linux / macOS

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

---

## Live FastAPI backend (optional)

Animates Bloch vectors after each gate (with interpolation between steps).

1. Start the API (from `QUANTUMVIZ/`):

```bat
.\.venv\Scripts\uvicorn server.main:app --reload --port 8000
```

2. Serve or open the web UI (see Quick start).

3. In the web app: Mode → **Live Data Stream** → URL `http://127.0.0.1:8000/api/frame` → **Connect**.

4. Prepare a custom circuit (optional):

```bat
curl -X POST http://127.0.0.1:8000/api/prepare -H "Content-Type: application/json" -d "{\"qasm\":\"OPENQASM 2.0;\\ninclude \\\"qelib1.inc\\\";\\nqreg q[2];\\nh q[0];\\ncx q[0],q[1];\\n\", \"frames_per_step\": 30}"
```

Keep connecting / polling; `GET /api/frame` cycles through prepared frames.

### API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Health / endpoint list |
| `GET` | `/api/frame` | Next (or indexed) Bloch frame: `{ i, n, bloch }` |
| `POST` | `/api/prepare` | Body: `{ "qasm": "...", "frames_per_step": 30 }` — builds frame sequence |

If no circuit is prepared, the API defaults to a 2-qubit Bell state.

---

## Streamlit app (optional)

```bat
.\.venv\Scripts\streamlit run app/app.py
```

Paste or upload OpenQASM 2.0, simulate with the built-in NumPy engine, and view Plotly Bloch spheres with purity and density matrices.

---

## Typical full setup (static UI + live API)

Use two terminals from `QUANTUMVIZ/`:

**Terminal 1 — static files**

```bat
py -m http.server 5500
```

**Terminal 2 — live API**

```bat
.\.venv\Scripts\uvicorn server.main:app --reload --port 8000
```

- UI: http://127.0.0.1:5500/web/index.html  
- API: http://127.0.0.1:8000/

---

## Supported circuits & conventions

- **OpenQASM 2.0** (and a subset of QASM 3 qubit declarations in the web parser)
- Common gates: `x`, `y`, `z`, `h`, `s`, `sdg`, `t`, `tdg`, `rx`, `ry`, `rz`, `cx`/`cnot`, `cz`, `swap`, and related variants depending on frontend
- **Unitary circuits only** for statevector simulation; `measure`, `barrier`, `reset`, etc. are ignored
- Bloch vector convention:  
  \(\mathbf{r} = (\mathrm{Tr}(\rho \sigma_x),\; \mathrm{Tr}(\rho \sigma_y),\; \mathrm{Tr}(\rho \sigma_z))\)
- Pure state: \(\|\mathbf{r}\| \approx 1\); mixed / entangled reductions: \(\|\mathbf{r}\| < 1\)

---

## Requirements

- **Web UI:** modern browser with WebGL (Chrome, Edge, Firefox, Safari)
- **Python path:** Python 3.10+ recommended; `py` launcher on Windows
- **Optional:** curl (or any HTTP client) to call `/api/prepare`

---

## Troubleshooting

| Issue | What to try |
|-------|-------------|
| Page blank / scripts fail when opened as `file://` | Use `py -m http.server 5500` and open via `http://127.0.0.1:5500/...` |
| Live mode won’t connect | Start uvicorn on port 8000; check CORS/browser console; confirm URL is `http://127.0.0.1:8000/api/frame` |
| Qiskit / install errors | Use a fresh `.venv` and `pip install -r requirements.txt` |
| Slow simulation | Reduce qubit count and circuit depth (browser sim grows as \(2^n\)) |
| Port 5500 in use | Pick another port, e.g. `py -m http.server 5501` |

---

## License / notes

Educational visualization project. Measurement and non-unitary ops are not simulated as hardware execution—focus is statevector → partial trace → Bloch display.
