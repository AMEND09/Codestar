import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'

// ─── Shared helpers ─────────────────────────────────────────────────────────

function clamp(val: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, val))
}

function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x))
}

function relu(x: number) {
  return Math.max(0, x)
}

function tanh(x: number) {
  return Math.tanh(x)
}

// ─── 1. LinearRegressionViz ──────────────────────────────────────────────────

type Point = { x: number; y: number }

function leastSquares(points: Point[]): { m: number; b: number; r2: number } {
  const n = points.length
  if (n < 2) return { m: 0, b: 0, r2: 0 }
  const sumX = points.reduce((s, p) => s + p.x, 0)
  const sumY = points.reduce((s, p) => s + p.y, 0)
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0)
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0)
  const denom = n * sumX2 - sumX * sumX
  if (denom === 0) return { m: 0, b: sumY / n, r2: 0 }
  const m = (n * sumXY - sumX * sumY) / denom
  const b = (sumY - m * sumX) / n
  const meanY = sumY / n
  const ssTot = points.reduce((s, p) => s + (p.y - meanY) ** 2, 0)
  const ssRes = points.reduce((s, p) => s + (p.y - (m * p.x + b)) ** 2, 0)
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot
  return { m, b, r2 }
}

const DEFAULT_POINTS: Point[] = [
  { x: 50, y: 220 },
  { x: 110, y: 190 },
  { x: 170, y: 160 },
  { x: 230, y: 130 },
  { x: 290, y: 115 },
  { x: 350, y: 90 },
]

export function LinearRegressionViz() {
  const W = 400
  const H = 280
  const [points, setPoints] = useState<Point[]>(DEFAULT_POINTS)
  const [dragging, setDragging] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const { m, b, r2 } = leastSquares(points)

  const lineY = (x: number) => m * x + b

  function svgCoords(e: React.MouseEvent | React.TouchEvent) {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0]!.clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0]!.clientY : e.clientY
    return {
      x: clamp(((clientX - rect.left) / rect.width) * W, 10, W - 10),
      y: clamp(((clientY - rect.top) / rect.height) * H, 10, H - 10),
    }
  }

  function onMouseDown(index: number) {
    return (e: React.MouseEvent) => {
      e.preventDefault()
      setDragging(index)
    }
  }

  function onMouseMove(e: React.MouseEvent) {
    if (dragging === null) return
    const { x, y } = svgCoords(e)
    setPoints((prev) => prev.map((p, i) => (i === dragging ? { x, y } : p)))
  }

  function onMouseUp() {
    setDragging(null)
  }

  function addPoint(e: React.MouseEvent) {
    if (dragging !== null) return
    const target = e.target as SVGElement
    if (target.tagName === 'circle') return
    const { x, y } = svgCoords(e)
    setPoints((prev) => [...prev, { x, y }])
  }

  function removePoint(index: number) {
    return (e: React.MouseEvent) => {
      e.stopPropagation()
      setPoints((prev) => prev.filter((_, i) => i !== index))
    }
  }

  function reset() {
    setPoints(DEFAULT_POINTS)
  }

  const x0 = 0
  const y0 = lineY(x0)
  const x1 = W
  const y1 = lineY(x1)

  return (
    <div className="viz-container">
      <div className="viz-instructions">
        🖱️ <strong>Click</strong> the canvas to add points · <strong>Drag</strong> points to move them · <strong>Right-click</strong> to remove
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="viz-svg"
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onClick={addPoint}
        style={{ cursor: dragging !== null ? 'grabbing' : 'crosshair' }}
      >
        {/* Grid lines */}
        {[1, 2, 3, 4].map((i) => (
          <line key={`hg${i}`} x1={0} y1={(H / 5) * i} x2={W} y2={(H / 5) * i} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
        ))}
        {[1, 2, 3, 4].map((i) => (
          <line key={`vg${i}`} x1={(W / 5) * i} y1={0} x2={(W / 5) * i} y2={H} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
        ))}

        {/* Regression line */}
        {points.length >= 2 && (
          <line
            x1={x0} y1={y0} x2={x1} y2={y1}
            stroke="#58cc02"
            strokeWidth={2.5}
            strokeDasharray="6 3"
          />
        )}

        {/* Residuals */}
        {points.length >= 2 &&
          points.map((p, i) => (
            <line
              key={`res${i}`}
              x1={p.x} y1={p.y}
              x2={p.x} y2={lineY(p.x)}
              stroke="rgba(88, 204, 2, 0.3)"
              strokeWidth={1}
            />
          ))}

        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={`pt${i}`}
            cx={p.x}
            cy={p.y}
            r={8}
            fill="#1cb0f6"
            stroke="white"
            strokeWidth={2}
            style={{ cursor: 'grab' }}
            onMouseDown={onMouseDown(i)}
            onContextMenu={removePoint(i)}
          />
        ))}
      </svg>

      <div className="viz-stats">
        <div className="viz-stat">
          <span className="viz-stat-label">Equation</span>
          <span className="viz-stat-value" style={{ fontFamily: 'monospace' }}>
            y = {m.toFixed(2)}x + {b.toFixed(1)}
          </span>
        </div>
        <div className="viz-stat">
          <span className="viz-stat-label">R² Score</span>
          <span className="viz-stat-value" style={{ color: r2 > 0.8 ? '#58cc02' : r2 > 0.5 ? '#ffd900' : '#ff4b4b' }}>
            {r2.toFixed(3)}
          </span>
        </div>
        <div className="viz-stat">
          <span className="viz-stat-label">Points</span>
          <span className="viz-stat-value">{points.length}</span>
        </div>
      </div>

      <button className="viz-reset-btn" onClick={reset} type="button">
        Reset Points
      </button>
    </div>
  )
}

// ─── 2. GradientDescentViz ───────────────────────────────────────────────────

export function GradientDescentViz() {
  const W = 400
  const H = 260
  const [x, setX] = useState(3.5)
  const [lr, setLr] = useState(0.3)
  const [history, setHistory] = useState<number[]>([3.5])
  const [converged, setConverged] = useState(false)

  const loss = (v: number) => v * v
  const grad = (v: number) => 2 * v

  const svgX = (v: number) => ((v + 5) / 10) * W
  const svgY = (v: number) => H - 10 - (v / 25) * (H - 30)

  function step() {
    if (converged) return
    setX((prev) => {
      const next = prev - lr * grad(prev)
      const clamped = clamp(next, -4.9, 4.9)
      setHistory((h) => [...h, clamped])
      if (Math.abs(clamped) < 0.01) setConverged(true)
      return clamped
    })
  }

  function reset() {
    setX(3.5)
    setHistory([3.5])
    setConverged(false)
  }

  const curvePoints = Array.from({ length: 100 }, (_, i) => {
    const v = -5 + (i / 99) * 10
    return `${svgX(v)},${svgY(loss(v))}`
  }).join(' ')

  return (
    <div className="viz-container">
      <div className="viz-instructions">
        Adjust the <strong>learning rate</strong>, then press <strong>Step</strong> to take one gradient descent step.
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="viz-svg">
        {/* Axes */}
        <line x1={W / 2} y1={0} x2={W / 2} y2={H} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
        <line x1={0} y1={H - 10} x2={W} y2={H - 10} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
        <text x={W - 6} y={H - 14} fontSize={10} fill="rgba(255,255,255,0.4)" textAnchor="end">x</text>
        <text x={W / 2 + 4} y={14} fontSize={10} fill="rgba(255,255,255,0.4)">L(x)</text>

        {/* Curve */}
        <polyline points={curvePoints} fill="none" stroke="#1cb0f6" strokeWidth={2.5} />

        {/* History path */}
        {history.length >= 2 && (
          <polyline
            points={history.map((v) => `${svgX(v)},${svgY(loss(v))}`).join(' ')}
            fill="none"
            stroke="rgba(255, 77, 77, 0.5)"
            strokeWidth={1.5}
            strokeDasharray="4 2"
          />
        )}

        {/* Ball */}
        <circle cx={svgX(x)} cy={svgY(loss(x))} r={8} fill="#ff4b4b" stroke="white" strokeWidth={2} />

        {/* Gradient arrow */}
        {!converged && (
          <line
            x1={svgX(x)}
            y1={svgY(loss(x))}
            x2={svgX(x) - lr * grad(x) * 20}
            y2={svgY(loss(x))}
            stroke="#ffd900"
            strokeWidth={2}
            markerEnd="url(#arrowhead)"
          />
        )}

        <defs>
          <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="3" refY="2" orient="auto">
            <polygon points="0 0, 6 2, 0 4" fill="#ffd900" />
          </marker>
        </defs>

        {converged && (
          <text x={svgX(x)} y={svgY(loss(x)) - 16} fontSize={12} fill="#58cc02" textAnchor="middle" fontWeight="bold">
            ✓ Converged!
          </text>
        )}
      </svg>

      <div className="viz-slider-row">
        <label className="viz-slider-label">
          Learning Rate: <strong>{lr.toFixed(2)}</strong>
        </label>
        <input
          type="range"
          min={0.01}
          max={0.99}
          step={0.01}
          value={lr}
          onChange={(e) => setLr(Number(e.target.value))}
          className="viz-slider"
        />
        <div className="viz-slider-hints">
          <span>Too slow</span>
          <span>Too fast</span>
        </div>
      </div>

      <div className="viz-stats">
        <div className="viz-stat">
          <span className="viz-stat-label">x</span>
          <span className="viz-stat-value">{x.toFixed(4)}</span>
        </div>
        <div className="viz-stat">
          <span className="viz-stat-label">Loss L(x)</span>
          <span className="viz-stat-value">{loss(x).toFixed(4)}</span>
        </div>
        <div className="viz-stat">
          <span className="viz-stat-label">Gradient</span>
          <span className="viz-stat-value">{grad(x).toFixed(4)}</span>
        </div>
        <div className="viz-stat">
          <span className="viz-stat-label">Steps</span>
          <span className="viz-stat-value">{history.length - 1}</span>
        </div>
      </div>

      <div className="viz-btn-row">
        <button className="viz-step-btn" onClick={step} disabled={converged} type="button">
          {converged ? '✓ Converged' : 'Step →'}
        </button>
        <button className="viz-reset-btn" onClick={reset} type="button">
          Reset
        </button>
      </div>
    </div>
  )
}

// ─── 3. ActivationFunctionViz ────────────────────────────────────────────────

type ActivationType = 'sigmoid' | 'relu' | 'tanh'

export function ActivationFunctionViz() {
  const W = 400
  const H = 220
  const [inputVal, setInputVal] = useState(0)
  const [active, setActive] = useState<ActivationType>('sigmoid')

  const fns: Record<ActivationType, (x: number) => number> = { sigmoid, relu, tanh }
  const colors: Record<ActivationType, string> = {
    sigmoid: '#1cb0f6',
    relu: '#ff9600',
    tanh: '#cc33ff',
  }

  const svgX = (v: number) => ((v + 5) / 10) * W
  const svgY = (v: number, lo: number, hi: number) => H - ((v - lo) / (hi - lo)) * (H - 20) - 10

  const ranges: Record<ActivationType, [number, number]> = {
    sigmoid: [0, 1],
    relu: [-0.5, 5],
    tanh: [-1, 1],
  }

  const [lo, hi] = ranges[active]

  const curvePoints = Array.from({ length: 100 }, (_, i) => {
    const v = -5 + (i / 99) * 10
    return `${svgX(v)},${svgY(fns[active](v), lo, hi)}`
  }).join(' ')

  const outputVal = fns[active](inputVal)
  const dotX = svgX(inputVal)
  const dotY = svgY(outputVal, lo, hi)

  return (
    <div className="viz-container">
      <div className="viz-tab-row">
        {(['sigmoid', 'relu', 'tanh'] as ActivationType[]).map((fn) => (
          <button
            key={fn}
            type="button"
            className={`viz-tab ${active === fn ? 'active' : ''}`}
            style={active === fn ? { borderBottomColor: colors[fn], color: colors[fn] } : {}}
            onClick={() => setActive(fn)}
          >
            {fn}
          </button>
        ))}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="viz-svg">
        {/* Zero line */}
        <line x1={0} y1={svgY(0, lo, hi)} x2={W} y2={svgY(0, lo, hi)} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
        <line x1={svgX(0)} y1={0} x2={svgX(0)} y2={H} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />

        {/* Curve */}
        <polyline points={curvePoints} fill="none" stroke={colors[active]} strokeWidth={2.5} />

        {/* Input dot on x-axis */}
        <line x1={dotX} y1={svgY(0, lo, hi)} x2={dotX} y2={dotY} stroke="rgba(255,255,255,0.25)" strokeWidth={1} strokeDasharray="3 2" />
        <line x1={0} y1={dotY} x2={dotX} y2={dotY} stroke="rgba(255,255,255,0.25)" strokeWidth={1} strokeDasharray="3 2" />
        <circle cx={dotX} cy={dotY} r={7} fill={colors[active]} stroke="white" strokeWidth={2} />
      </svg>

      <div className="viz-slider-row">
        <label className="viz-slider-label">
          Input x: <strong>{inputVal.toFixed(2)}</strong>
        </label>
        <input
          type="range"
          min={-5}
          max={5}
          step={0.1}
          value={inputVal}
          onChange={(e) => setInputVal(Number(e.target.value))}
          className="viz-slider"
        />
      </div>

      <div className="viz-stats">
        <div className="viz-stat">
          <span className="viz-stat-label">Input x</span>
          <span className="viz-stat-value">{inputVal.toFixed(2)}</span>
        </div>
        <div className="viz-stat">
          <span className="viz-stat-label">{active}(x)</span>
          <span className="viz-stat-value" style={{ color: colors[active] }}>
            {outputVal.toFixed(4)}
          </span>
        </div>
        <div className="viz-stat">
          <span className="viz-stat-label">Range</span>
          <span className="viz-stat-value">[{lo}, {hi}]</span>
        </div>
      </div>
    </div>
  )
}

// ─── 4. NeuralNetworkViz ─────────────────────────────────────────────────────

export function NeuralNetworkViz() {
  const W = 400
  const H = 260
  const [inputs, setInputs] = useState([0.8, 0.3])

  const layers = [2, 3, 1]
  const weights1 = useMemo(
    () => [
      [0.5, -0.2],
      [0.3, 0.8],
      [-0.4, 0.6],
    ],
    [],
  )
  const weights2 = useMemo(() => [[0.7, -0.3, 0.5]], [])

  const h1 = weights1.map((row) => sigmoid(row[0]! * inputs[0]! + row[1]! * inputs[1]!))
  const output = weights2.map((row) =>
    sigmoid(row.reduce((sum, w, i) => sum + w * (h1[i] ?? 0), 0)),
  )

  const layerX = [60, 200, 340]
  const nodePositions = layers.map((count, li) =>
    Array.from({ length: count }, (_, ni) => ({
      x: layerX[li]!,
      y: H / 2 + (ni - (count - 1) / 2) * 70,
    })),
  )

  const allActivations = [inputs, h1, output]

  function getColor(val: number) {
    const v = clamp(val, 0, 1)
    const r = Math.round(28 + (88 - 28) * v)
    const g = Math.round(176 + (204 - 176) * v)
    const b = Math.round(246 + (2 - 246) * v)
    return `rgb(${r},${g},${b})`
  }

  return (
    <div className="viz-container">
      <div className="viz-instructions">
        Adjust <strong>inputs</strong> to see activations propagate through the network.
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="viz-svg" style={{ overflow: 'visible' }}>
        {/* Layer labels */}
        {['Input', 'Hidden', 'Output'].map((label, li) => (
          <text key={label} x={layerX[li]} y={18} textAnchor="middle" fontSize={11} fill="rgba(255,255,255,0.5)">
            {label}
          </text>
        ))}

        {/* Connections layer 0→1 */}
        {nodePositions[0]!.map((src, si) =>
          nodePositions[1]!.map((dst, di) => (
            <line
              key={`c01-${si}-${di}`}
              x1={src.x + 14}
              y1={src.y}
              x2={dst.x - 14}
              y2={dst.y}
              stroke={weights1[di]![si]! > 0 ? 'rgba(88,204,2,0.3)' : 'rgba(255,75,75,0.3)'}
              strokeWidth={Math.abs(weights1[di]![si]!) * 2.5}
            />
          )),
        )}

        {/* Connections layer 1→2 */}
        {nodePositions[1]!.map((src, si) =>
          nodePositions[2]!.map((dst, di) => (
            <line
              key={`c12-${si}-${di}`}
              x1={src.x + 14}
              y1={src.y}
              x2={dst.x - 14}
              y2={dst.y}
              stroke={weights2[di]![si]! > 0 ? 'rgba(88,204,2,0.3)' : 'rgba(255,75,75,0.3)'}
              strokeWidth={Math.abs(weights2[di]![si]!) * 2.5}
            />
          )),
        )}

        {/* Nodes */}
        {nodePositions.map((layer, li) =>
          layer.map((node, ni) => {
            const val = allActivations[li]?.[ni] ?? 0
            return (
              <g key={`n-${li}-${ni}`}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={14}
                  fill={getColor(val)}
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth={1.5}
                />
                <text x={node.x} y={node.y + 4} textAnchor="middle" fontSize={9} fill="white" fontWeight="bold">
                  {val.toFixed(2)}
                </text>
              </g>
            )
          }),
        )}
      </svg>

      {inputs.map((val, i) => (
        <div key={i} className="viz-slider-row">
          <label className="viz-slider-label">
            Input {i + 1}: <strong>{val.toFixed(2)}</strong>
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={val}
            onChange={(e) => {
              const v = Number(e.target.value)
              setInputs((prev) => prev.map((p, idx) => (idx === i ? v : p)))
            }}
            className="viz-slider"
          />
        </div>
      ))}

      <div className="viz-stats">
        <div className="viz-stat">
          <span className="viz-stat-label">Output</span>
          <span className="viz-stat-value" style={{ color: '#58cc02' }}>
            {output[0]!.toFixed(4)}
          </span>
        </div>
        <div className="viz-stat">
          <span className="viz-stat-label">Prediction</span>
          <span className="viz-stat-value">
            {output[0]! > 0.5 ? 'Class 1' : 'Class 0'}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── 5. OverfittingViz ───────────────────────────────────────────────────────

function polynomialFit(xs: number[], ys: number[], degree: number): number[] {
  const n = xs.length
  const d = degree + 1
  const A: number[][] = Array.from({ length: d }, (_, i) =>
    Array.from({ length: d }, (_, j) => xs.reduce((s, x) => s + Math.pow(x, i + j), 0)),
  )
  const b = Array.from({ length: d }, (_, i) =>
    xs.reduce((s, x, k) => s + Math.pow(x, i) * ys[k]!, 0),
  )

  // Gaussian elimination
  const aug = A.map((row, i) => [...row, b[i]!])
  for (let col = 0; col < d; col++) {
    let pivot = col
    for (let row = col + 1; row < d; row++) {
      if (Math.abs(aug[row]![col]!) > Math.abs(aug[pivot]![col]!)) pivot = row
    }
    ;[aug[col], aug[pivot]] = [aug[pivot]!, aug[col]!]
    const pivotVal = aug[col]![col]!
    if (Math.abs(pivotVal) < 1e-12) continue
    for (let row = 0; row < d; row++) {
      if (row === col) continue
      const factor = aug[row]![col]! / pivotVal
      for (let k = col; k <= d; k++) {
        aug[row]![k]! -= factor * aug[col]![k]!
      }
    }
  }
  return aug.map((row) => row[d]! / row[aug.indexOf(row)]!)
}

function evalPoly(coeffs: number[], x: number) {
  return coeffs.reduce((sum, c, i) => sum + c * Math.pow(x, i), 0)
}

const TRAIN_DATA = [
  { x: 0.1, y: 0.3 + 0.15 },
  { x: 0.2, y: 0.5 - 0.1 },
  { x: 0.35, y: 0.55 + 0.12 },
  { x: 0.5, y: 0.6 - 0.08 },
  { x: 0.65, y: 0.58 + 0.1 },
  { x: 0.8, y: 0.5 - 0.09 },
  { x: 0.9, y: 0.35 + 0.07 },
]

const TEST_DATA = [
  { x: 0.15, y: 0.42 },
  { x: 0.4, y: 0.58 },
  { x: 0.55, y: 0.61 },
  { x: 0.75, y: 0.53 },
  { x: 0.85, y: 0.41 },
]

export function OverfittingViz() {
  const W = 400
  const H = 240
  const [degree, setDegree] = useState(1)

  const xs = TRAIN_DATA.map((p) => p.x)
  const ys = TRAIN_DATA.map((p) => p.y)

  const coeffs = useMemo(() => {
    try {
      return polynomialFit(xs, ys, degree)
    } catch {
      return [0]
    }
  }, [degree])

  const svgX = (v: number) => v * W
  const svgY = (v: number) => H - v * (H - 20) - 10

  const curvePoints = Array.from({ length: 200 }, (_, i) => {
    const x = i / 199
    const y = clamp(evalPoly(coeffs, x), -0.2, 1.4)
    return `${svgX(x)},${svgY(y)}`
  }).join(' ')

  const trainMSE = TRAIN_DATA.reduce((s, p) => s + (evalPoly(coeffs, p.x) - p.y) ** 2, 0) / TRAIN_DATA.length
  const testMSE = TEST_DATA.reduce((s, p) => s + (evalPoly(coeffs, p.x) - p.y) ** 2, 0) / TEST_DATA.length

  const degreeLabel =
    degree === 1 ? 'Linear (underfitting)' :
    degree <= 3 ? 'Good fit' :
    degree <= 6 ? 'Starting to overfit' :
    'Overfit!'

  const labelColor =
    degree === 1 ? '#1cb0f6' :
    degree <= 3 ? '#58cc02' :
    degree <= 6 ? '#ffd900' :
    '#ff4b4b'

  return (
    <div className="viz-container">
      <div className="viz-instructions">
        Adjust the polynomial <strong>degree</strong> to see underfitting vs overfitting. Blue = train points, orange = test points.
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="viz-svg">
        {/* True underlying curve (sinusoidal) */}
        <polyline
          points={Array.from({ length: 100 }, (_, i) => {
            const x = i / 99
            const y = 0.5 * Math.sin(Math.PI * x) + 0.3
            return `${svgX(x)},${svgY(y)}`
          }).join(' ')}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={1.5}
          strokeDasharray="6 4"
        />

        {/* Fitted curve */}
        <polyline points={curvePoints} fill="none" stroke={labelColor} strokeWidth={2.5} />

        {/* Train points */}
        {TRAIN_DATA.map((p, i) => (
          <circle key={`tr${i}`} cx={svgX(p.x)} cy={svgY(p.y)} r={6} fill="#1cb0f6" stroke="white" strokeWidth={1.5} />
        ))}

        {/* Test points */}
        {TEST_DATA.map((p, i) => (
          <circle key={`te${i}`} cx={svgX(p.x)} cy={svgY(p.y)} r={6} fill="#ff9600" stroke="white" strokeWidth={1.5} />
        ))}
      </svg>

      <div className="viz-slider-row">
        <label className="viz-slider-label">
          Degree: <strong>{degree}</strong>
          <span className="viz-degree-label" style={{ color: labelColor }}> — {degreeLabel}</span>
        </label>
        <input
          type="range"
          min={1}
          max={9}
          step={1}
          value={degree}
          onChange={(e) => setDegree(Number(e.target.value))}
          className="viz-slider"
        />
      </div>

      <div className="viz-stats">
        <div className="viz-stat">
          <span className="viz-stat-label">Train MSE</span>
          <span className="viz-stat-value" style={{ color: '#1cb0f6' }}>
            {trainMSE.toFixed(4)}
          </span>
        </div>
        <div className="viz-stat">
          <span className="viz-stat-label">Test MSE</span>
          <span className="viz-stat-value" style={{ color: testMSE > trainMSE * 2 ? '#ff4b4b' : '#ff9600' }}>
            {testMSE.toFixed(4)}
          </span>
        </div>
        <div className="viz-stat">
          <span className="viz-stat-label">Gap</span>
          <span className="viz-stat-value" style={{ color: testMSE - trainMSE > 0.05 ? '#ff4b4b' : '#58cc02' }}>
            {(testMSE - trainMSE).toFixed(4)}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── 6. DecisionBoundaryViz ───────────────────────────────────────────────────

const CLASS_DATA = [
  { x: 0.2, y: 0.7, label: 0 }, { x: 0.3, y: 0.8, label: 0 },
  { x: 0.25, y: 0.55, label: 0 }, { x: 0.15, y: 0.65, label: 0 },
  { x: 0.35, y: 0.75, label: 0 }, { x: 0.1, y: 0.9, label: 0 },
  { x: 0.7, y: 0.3, label: 1 }, { x: 0.8, y: 0.2, label: 1 },
  { x: 0.65, y: 0.4, label: 1 }, { x: 0.75, y: 0.15, label: 1 },
  { x: 0.85, y: 0.35, label: 1 }, { x: 0.9, y: 0.1, label: 1 },
]

export function DecisionBoundaryViz() {
  const W = 380
  const H = 260
  const [threshold, setThreshold] = useState(0.5)
  const [feature, setFeature] = useState<'x' | 'y'>('x')

  const svgX = (v: number) => v * W
  const svgY = (v: number) => H - v * H

  function predict(point: { x: number; y: number }) {
    const val = feature === 'x' ? point.x : 1 - point.y
    return val > threshold ? 1 : 0
  }

  const accuracy = CLASS_DATA.filter((p) => predict(p) === p.label).length / CLASS_DATA.length

  const boundaryX = feature === 'x' ? svgX(threshold) : undefined
  const boundaryY = feature === 'y' ? svgY(1 - threshold) : undefined

  return (
    <div className="viz-container">
      <div className="viz-instructions">
        Drag the <strong>threshold slider</strong> to move the decision boundary and see accuracy change.
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="viz-svg">
        {/* Background regions */}
        {feature === 'x' ? (
          <>
            <rect x={0} y={0} width={svgX(threshold)} height={H} fill="rgba(28,176,246,0.08)" />
            <rect x={svgX(threshold)} y={0} width={W - svgX(threshold)} height={H} fill="rgba(255,75,75,0.08)" />
          </>
        ) : (
          <>
            <rect x={0} y={0} width={W} height={svgY(1 - threshold)} fill="rgba(255,75,75,0.08)" />
            <rect x={0} y={svgY(1 - threshold)} width={W} height={H - svgY(1 - threshold)} fill="rgba(28,176,246,0.08)" />
          </>
        )}

        {/* Decision boundary */}
        {feature === 'x' ? (
          <line x1={boundaryX} y1={0} x2={boundaryX} y2={H} stroke="#ffd900" strokeWidth={2} strokeDasharray="6 3" />
        ) : (
          <line x1={0} y1={boundaryY} x2={W} y2={boundaryY} stroke="#ffd900" strokeWidth={2} strokeDasharray="6 3" />
        )}

        {/* Data points */}
        {CLASS_DATA.map((p, i) => {
          const correct = predict(p) === p.label
          return (
            <circle
              key={i}
              cx={svgX(p.x)}
              cy={svgY(p.y)}
              r={7}
              fill={p.label === 0 ? '#1cb0f6' : '#ff4b4b'}
              stroke={correct ? 'white' : '#ffd900'}
              strokeWidth={correct ? 1.5 : 2.5}
            />
          )
        })}
      </svg>

      <div className="viz-tab-row">
        <button type="button" className={`viz-tab ${feature === 'x' ? 'active' : ''}`} onClick={() => setFeature('x')}>
          Feature: x
        </button>
        <button type="button" className={`viz-tab ${feature === 'y' ? 'active' : ''}`} onClick={() => setFeature('y')}>
          Feature: y
        </button>
      </div>

      <div className="viz-slider-row">
        <label className="viz-slider-label">
          Threshold: <strong>{threshold.toFixed(2)}</strong>
        </label>
        <input
          type="range"
          min={0.05}
          max={0.95}
          step={0.01}
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="viz-slider"
        />
      </div>

      <div className="viz-stats">
        <div className="viz-stat">
          <span className="viz-stat-label">Accuracy</span>
          <span className="viz-stat-value" style={{ color: accuracy > 0.8 ? '#58cc02' : accuracy > 0.6 ? '#ffd900' : '#ff4b4b' }}>
            {(accuracy * 100).toFixed(0)}%
          </span>
        </div>
        <div className="viz-stat">
          <span className="viz-stat-label">Correct</span>
          <span className="viz-stat-value">{CLASS_DATA.filter((p) => predict(p) === p.label).length} / {CLASS_DATA.length}</span>
        </div>
      </div>
    </div>
  )
}

// ─── 7. KMeansViz ────────────────────────────────────────────────────────────

type KPoint = { x: number; y: number; cluster: number }
type Centroid = { x: number; y: number }

const INITIAL_KPOINTS: KPoint[] = [
  { x: 0.15, y: 0.75, cluster: -1 }, { x: 0.22, y: 0.82, cluster: -1 },
  { x: 0.18, y: 0.65, cluster: -1 }, { x: 0.28, y: 0.70, cluster: -1 },
  { x: 0.55, y: 0.55, cluster: -1 }, { x: 0.62, y: 0.60, cluster: -1 },
  { x: 0.50, y: 0.48, cluster: -1 }, { x: 0.68, y: 0.52, cluster: -1 },
  { x: 0.30, y: 0.20, cluster: -1 }, { x: 0.38, y: 0.15, cluster: -1 },
  { x: 0.25, y: 0.28, cluster: -1 }, { x: 0.42, y: 0.22, cluster: -1 },
]

const CLUSTER_COLORS = ['#1cb0f6', '#ff4b4b', '#58cc02', '#ff9600']

function assignClusters(points: KPoint[], centroids: Centroid[]): KPoint[] {
  return points.map((p) => {
    let minDist = Infinity
    let cluster = 0
    centroids.forEach((c, i) => {
      const d = (p.x - c.x) ** 2 + (p.y - c.y) ** 2
      if (d < minDist) { minDist = d; cluster = i }
    })
    return { ...p, cluster }
  })
}

function updateCentroids(points: KPoint[], k: number): Centroid[] {
  return Array.from({ length: k }, (_, i) => {
    const clusterPoints = points.filter((p) => p.cluster === i)
    if (clusterPoints.length === 0) return { x: Math.random(), y: Math.random() }
    return {
      x: clusterPoints.reduce((s, p) => s + p.x, 0) / clusterPoints.length,
      y: clusterPoints.reduce((s, p) => s + p.y, 0) / clusterPoints.length,
    }
  })
}

export function KMeansViz() {
  const W = 380
  const H = 260
  const K = 3
  const [points, setPoints] = useState<KPoint[]>(INITIAL_KPOINTS)
  const [centroids, setCentroids] = useState<Centroid[]>([
    { x: 0.2, y: 0.8 },
    { x: 0.6, y: 0.5 },
    { x: 0.35, y: 0.2 },
  ])
  const [iteration, setIteration] = useState(0)
  const [done, setDone] = useState(false)

  const svgX = (v: number) => v * W
  const svgY = (v: number) => H - v * H

  function kStep() {
    const assigned = assignClusters(points, centroids)
    const newCentroids = updateCentroids(assigned, K)

    const moved = newCentroids.some(
      (c, i) =>
        Math.abs(c.x - centroids[i]!.x) > 0.001 ||
        Math.abs(c.y - centroids[i]!.y) > 0.001,
    )

    setPoints(assigned)
    setCentroids(newCentroids)
    setIteration((n) => n + 1)
    if (!moved) setDone(true)
  }

  function resetKMeans() {
    setPoints(INITIAL_KPOINTS)
    setCentroids([
      { x: 0.2, y: 0.8 },
      { x: 0.6, y: 0.5 },
      { x: 0.35, y: 0.2 },
    ])
    setIteration(0)
    setDone(false)
  }

  return (
    <div className="viz-container">
      <div className="viz-instructions">
        Press <strong>Step</strong> to run one K-means iteration. Watch clusters form!
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="viz-svg">
        {/* Voronoi-ish regions (simplified: just show connections) */}
        {points.map((p, i) => {
          if (p.cluster < 0) return null
          const c = centroids[p.cluster]!
          return (
            <line
              key={`conn${i}`}
              x1={svgX(p.x)} y1={svgY(p.y)}
              x2={svgX(c.x)} y2={svgY(c.y)}
              stroke={CLUSTER_COLORS[p.cluster] ?? '#888'}
              strokeWidth={0.7}
              strokeOpacity={0.3}
            />
          )
        })}

        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={`kp${i}`}
            cx={svgX(p.x)}
            cy={svgY(p.y)}
            r={7}
            fill={p.cluster >= 0 ? (CLUSTER_COLORS[p.cluster] ?? '#888') : '#aaa'}
            stroke="white"
            strokeWidth={1.5}
            fillOpacity={0.85}
          />
        ))}

        {/* Centroids */}
        {centroids.map((c, i) => (
          <g key={`cent${i}`}>
            <circle cx={svgX(c.x)} cy={svgY(c.y)} r={12} fill={CLUSTER_COLORS[i] ?? '#888'} stroke="white" strokeWidth={2.5} />
            <text x={svgX(c.x)} y={svgY(c.y) + 4} textAnchor="middle" fontSize={11} fill="white" fontWeight="bold">
              C{i + 1}
            </text>
          </g>
        ))}
      </svg>

      <div className="viz-stats">
        <div className="viz-stat">
          <span className="viz-stat-label">Iteration</span>
          <span className="viz-stat-value">{iteration}</span>
        </div>
        <div className="viz-stat">
          <span className="viz-stat-label">K</span>
          <span className="viz-stat-value">{K}</span>
        </div>
        <div className="viz-stat">
          <span className="viz-stat-label">Status</span>
          <span className="viz-stat-value" style={{ color: done ? '#58cc02' : '#ffd900' }}>
            {done ? 'Converged!' : iteration === 0 ? 'Not started' : 'Running...'}
          </span>
        </div>
      </div>

      <div className="viz-btn-row">
        <button className="viz-step-btn" onClick={kStep} disabled={done} type="button">
          {done ? '✓ Converged' : 'Step →'}
        </button>
        <button className="viz-reset-btn" onClick={resetKMeans} type="button">
          Reset
        </button>
      </div>
    </div>
  )
}

// ─── 8. BiasVarianceViz ──────────────────────────────────────────────────────

export function BiasVarianceViz() {
  const W = 400
  const H = 220
  const [complexity, setComplexity] = useState(5)

  const xs = Array.from({ length: 20 }, (_, i) => (i + 1) / 20)

  const bias = xs.map((x) => 1 / (x * complexity + 0.5))
  const variance = xs.map((x) => Math.pow(x * complexity * 0.4, 1.5))
  const total = xs.map((_, i) => (bias[i]! + variance[i]!) * 0.6)

  const maxVal = Math.max(...total, ...bias, ...variance)
  const svgX = (i: number) => (i / 19) * (W - 40) + 20
  const svgY = (v: number) => H - 20 - (v / maxVal) * (H - 40)

  const biasPath = xs.map((_, i) => `${svgX(i)},${svgY(bias[i]!)}`).join(' ')
  const variancePath = xs.map((_, i) => `${svgX(i)},${svgY(variance[i]!)}`).join(' ')
  const totalPath = xs.map((_, i) => `${svgX(i)},${svgY(total[i]!)}`).join(' ')

  const optimalIdx = total.indexOf(Math.min(...total))
  const optimalComplexity = ((optimalIdx + 1) / 20 * 10).toFixed(1)

  const currentIdx = Math.floor((complexity / 10) * 19)
  const dotX = svgX(currentIdx)

  return (
    <div className="viz-container">
      <div className="viz-instructions">
        Explore the <strong>bias-variance tradeoff</strong>. The optimal model complexity minimises total error.
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="viz-svg">
        {/* Axes */}
        <line x1={20} y1={H - 20} x2={W - 10} y2={H - 20} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
        <text x={W - 10} y={H - 22} fontSize={9} fill="rgba(255,255,255,0.4)" textAnchor="end">complexity →</text>

        {/* Bias curve */}
        <polyline points={biasPath} fill="none" stroke="#1cb0f6" strokeWidth={2} />
        <text x={svgX(2)} y={svgY(bias[2]!) - 6} fontSize={10} fill="#1cb0f6">Bias²</text>

        {/* Variance curve */}
        <polyline points={variancePath} fill="none" stroke="#ff4b4b" strokeWidth={2} />
        <text x={svgX(14)} y={svgY(variance[14]!) - 6} fontSize={10} fill="#ff4b4b">Variance</text>

        {/* Total error curve */}
        <polyline points={totalPath} fill="none" stroke="#ffd900" strokeWidth={2.5} />
        <text x={svgX(10)} y={svgY(total[10]!) - 8} fontSize={10} fill="#ffd900">Total Error</text>

        {/* Minimum marker */}
        <line
          x1={svgX(optimalIdx)}
          y1={H - 20}
          x2={svgX(optimalIdx)}
          y2={svgY(total[optimalIdx]!)}
          stroke="rgba(88,204,2,0.5)"
          strokeWidth={1.5}
          strokeDasharray="4 2"
        />

        {/* Current complexity marker */}
        <line x1={dotX} y1={H - 20} x2={dotX} y2={20} stroke="rgba(255,255,255,0.25)" strokeWidth={1} strokeDasharray="3 2" />
        <circle cx={dotX} cy={svgY(total[currentIdx]!)} r={6} fill="#ffd900" stroke="white" strokeWidth={2} />
      </svg>

      <div className="viz-slider-row">
        <label className="viz-slider-label">
          Model Complexity: <strong>{complexity}</strong>
          <span style={{ color: complexity < 3 ? '#1cb0f6' : complexity > 7 ? '#ff4b4b' : '#58cc02', marginLeft: 8 }}>
            {complexity < 3 ? '← High Bias' : complexity > 7 ? 'High Variance →' : '✓ Sweet spot'}
          </span>
        </label>
        <input
          type="range"
          min={1}
          max={10}
          step={0.5}
          value={complexity}
          onChange={(e) => setComplexity(Number(e.target.value))}
          className="viz-slider"
        />
      </div>

      <div className="viz-stats">
        <div className="viz-stat">
          <span className="viz-stat-label">Bias²</span>
          <span className="viz-stat-value" style={{ color: '#1cb0f6' }}>{(bias[currentIdx]! ?? 0).toFixed(3)}</span>
        </div>
        <div className="viz-stat">
          <span className="viz-stat-label">Variance</span>
          <span className="viz-stat-value" style={{ color: '#ff4b4b' }}>{(variance[currentIdx]! ?? 0).toFixed(3)}</span>
        </div>
        <div className="viz-stat">
          <span className="viz-stat-label">Total</span>
          <span className="viz-stat-value" style={{ color: '#ffd900' }}>{(total[currentIdx]! ?? 0).toFixed(3)}</span>
        </div>
        <div className="viz-stat">
          <span className="viz-stat-label">Optimal ~</span>
          <span className="viz-stat-value" style={{ color: '#58cc02' }}>{optimalComplexity}</span>
        </div>
      </div>
    </div>
  )
}

// ─── 9. LearningRateViz ──────────────────────────────────────────────────────

export function LearningRateViz() {
  const W = 400
  const H = 240
  const steps = 20

  const lrConfigs = [
    { lr: 0.05, label: 'Too small (0.05)', color: '#1cb0f6' },
    { lr: 0.3, label: 'Just right (0.3)', color: '#58cc02' },
    { lr: 1.2, label: 'Too large (1.2)', color: '#ff4b4b' },
  ]

  const loss = (x: number) => x * x
  const grad = (x: number) => 2 * x

  function runGD(lr: number) {
    const pts: { step: number; x: number; loss: number }[] = []
    let x = 3.0
    for (let s = 0; s <= steps; s++) {
      pts.push({ step: s, x, loss: loss(x) })
      x = clamp(x - lr * grad(x), -10, 10)
    }
    return pts
  }

  const maxLoss = 9
  const svgX = (s: number) => (s / steps) * (W - 40) + 20
  const svgY = (l: number) => H - 20 - (clamp(l, 0, maxLoss) / maxLoss) * (H - 40)

  return (
    <div className="viz-container">
      <div className="viz-instructions">
        See how three different learning rates affect gradient descent convergence on a simple loss L(x) = x².
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="viz-svg">
        {/* Axes */}
        <line x1={20} y1={H - 20} x2={W - 10} y2={H - 20} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
        <line x1={20} y1={H - 20} x2={20} y2={10} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
        <text x={W - 10} y={H - 24} fontSize={9} fill="rgba(255,255,255,0.4)" textAnchor="end">steps →</text>
        <text x={22} y={14} fontSize={9} fill="rgba(255,255,255,0.4)">loss ↑</text>

        {/* Step grid */}
        {[5, 10, 15, 20].map((s) => (
          <text key={s} x={svgX(s)} y={H - 6} fontSize={9} fill="rgba(255,255,255,0.3)" textAnchor="middle">
            {s}
          </text>
        ))}

        {lrConfigs.map(({ lr, color }) => {
          const pts = runGD(lr)
          return (
            <polyline
              key={lr}
              points={pts.map((p) => `${svgX(p.step)},${svgY(p.loss)}`).join(' ')}
              fill="none"
              stroke={color}
              strokeWidth={2}
            />
          )
        })}
      </svg>

      <div className="viz-legend">
        {lrConfigs.map(({ label, color }) => (
          <div key={label} className="viz-legend-item">
            <span className="viz-legend-dot" style={{ background: color }} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── 10. ConfusionMatrixViz ──────────────────────────────────────────────────

export function ConfusionMatrixViz() {
  const [threshold, setThreshold] = useState(0.5)

  const predictions = [
    { prob: 0.9, actual: 1 }, { prob: 0.8, actual: 1 }, { prob: 0.7, actual: 1 },
    { prob: 0.6, actual: 1 }, { prob: 0.55, actual: 1 }, { prob: 0.45, actual: 0 },
    { prob: 0.35, actual: 0 }, { prob: 0.25, actual: 0 }, { prob: 0.15, actual: 0 },
    { prob: 0.05, actual: 0 }, { prob: 0.72, actual: 0 }, { prob: 0.42, actual: 1 },
  ]

  const tp = predictions.filter((p) => p.prob >= threshold && p.actual === 1).length
  const fp = predictions.filter((p) => p.prob >= threshold && p.actual === 0).length
  const tn = predictions.filter((p) => p.prob < threshold && p.actual === 0).length
  const fn = predictions.filter((p) => p.prob < threshold && p.actual === 1).length

  const precision = tp + fp > 0 ? tp / (tp + fp) : 0
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0
  const accuracy = (tp + tn) / predictions.length

  function cellColor(val: number, isGood: boolean) {
    const intensity = Math.min(val / 6, 1)
    if (isGood) return `rgba(88, 204, 2, ${0.15 + intensity * 0.5})`
    return `rgba(255, 75, 75, ${0.15 + intensity * 0.5})`
  }

  return (
    <div className="viz-container">
      <div className="viz-instructions">
        Adjust the classification <strong>threshold</strong> and watch precision, recall, and F1 change.
      </div>

      <div className="confusion-matrix-wrapper">
        <div className="cm-axis-label cm-axis-predicted">Predicted</div>
        <div className="cm-axis-label cm-axis-actual">Actual</div>
        <div className="confusion-matrix">
          <div className="cm-header cm-header-empty" />
          <div className="cm-header">Positive</div>
          <div className="cm-header">Negative</div>

          <div className="cm-row-label">Positive</div>
          <div className="cm-cell" style={{ background: cellColor(tp, true) }}>
            <div className="cm-cell-name">TP</div>
            <div className="cm-cell-value">{tp}</div>
          </div>
          <div className="cm-cell" style={{ background: cellColor(fn, false) }}>
            <div className="cm-cell-name">FN</div>
            <div className="cm-cell-value">{fn}</div>
          </div>

          <div className="cm-row-label">Negative</div>
          <div className="cm-cell" style={{ background: cellColor(fp, false) }}>
            <div className="cm-cell-name">FP</div>
            <div className="cm-cell-value">{fp}</div>
          </div>
          <div className="cm-cell" style={{ background: cellColor(tn, true) }}>
            <div className="cm-cell-name">TN</div>
            <div className="cm-cell-value">{tn}</div>
          </div>
        </div>
      </div>

      <div className="viz-slider-row">
        <label className="viz-slider-label">
          Threshold: <strong>{threshold.toFixed(2)}</strong>
        </label>
        <input
          type="range"
          min={0.05}
          max={0.95}
          step={0.05}
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="viz-slider"
        />
      </div>

      <div className="viz-stats">
        <div className="viz-stat">
          <span className="viz-stat-label">Accuracy</span>
          <span className="viz-stat-value">{(accuracy * 100).toFixed(0)}%</span>
        </div>
        <div className="viz-stat">
          <span className="viz-stat-label">Precision</span>
          <span className="viz-stat-value">{(precision * 100).toFixed(0)}%</span>
        </div>
        <div className="viz-stat">
          <span className="viz-stat-label">Recall</span>
          <span className="viz-stat-value">{(recall * 100).toFixed(0)}%</span>
        </div>
        <div className="viz-stat">
          <span className="viz-stat-label">F1</span>
          <span className="viz-stat-value" style={{ color: f1 > 0.7 ? '#58cc02' : '#ffd900' }}>
            {f1.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Registry ─────────────────────────────────────────────────────────────────

export const ML_VISUAL_REGISTRY: Record<string, React.FC> = {
  'linear-regression': LinearRegressionViz,
  'gradient-descent': GradientDescentViz,
  'activation-functions': ActivationFunctionViz,
  'neural-network': NeuralNetworkViz,
  'overfitting': OverfittingViz,
  'decision-boundary': DecisionBoundaryViz,
  'kmeans': KMeansViz,
  'bias-variance': BiasVarianceViz,
  'learning-rate': LearningRateViz,
  'confusion-matrix': ConfusionMatrixViz,
}
