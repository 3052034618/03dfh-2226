import type { TemperatureRecord } from '@/types'

interface TemperatureChartProps {
  records: TemperatureRecord[]
  tempRange: { min: number; max: number }
  compact?: boolean
}

const PADDING = { top: 20, right: 16, bottom: 36, left: 40 }

export default function TemperatureChart({ records, tempRange, compact }: TemperatureChartProps) {
  const chartHeight = compact ? 160 : 220
  const viewWidth = 400
  const viewHeight = chartHeight
  const plotW = viewWidth - PADDING.left - PADDING.right
  const plotH = viewHeight - PADDING.top - PADDING.bottom

  if (records.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-slate-400 text-sm"
        style={{ height: chartHeight }}
      >
        暂无温度数据
      </div>
    )
  }

  const sorted = [...records].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  const tempMin = tempRange.min - 2
  const tempMax = tempRange.max + 2
  const tempSpan = tempMax - tempMin || 1

  const toX = (i: number) => PADDING.left + (i / (sorted.length - 1)) * plotW
  const toY = (temp: number) => PADDING.top + plotH - ((temp - tempMin) / tempSpan) * plotH

  const rangeY1 = toY(tempRange.min)
  const rangeY2 = toY(tempRange.max)

  const linePoints = sorted.map((r, i) => `${toX(i)},${toY(r.temperature)}`).join(' ')

  const anomalyPoints = sorted.filter((r) => !r.isNormal)
  const lastRecord = sorted[sorted.length - 1]

  const gridLineCount = 4
  const gridLines = Array.from({ length: gridLineCount + 1 }, (_, i) => {
    const y = PADDING.top + (plotH / gridLineCount) * i
    return y
  })

  const xLabelCount = Math.min(sorted.length, 5)
  const xLabelStep = Math.max(1, Math.floor((sorted.length - 1) / (xLabelCount - 1)))
  const xLabels = sorted.filter((_, i) => i % xLabelStep === 0 || i === sorted.length - 1)

  const formatTime = (ts: string) => {
    const d = new Date(ts)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  return (
    <svg
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      className="w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {gridLines.map((y) => (
        <line
          key={y}
          x1={PADDING.left}
          y1={y}
          x2={viewWidth - PADDING.right}
          y2={y}
          stroke="#e2e8f0"
          strokeWidth={0.5}
        />
      ))}

      <rect
        x={PADDING.left}
        y={rangeY2}
        width={plotW}
        height={rangeY1 - rangeY2}
        fill="#e0f2fe"
        opacity={0.6}
      />

      <line
        x1={PADDING.left}
        y1={rangeY1}
        x2={viewWidth - PADDING.right}
        y2={rangeY1}
        stroke="#bae6fd"
        strokeWidth={0.5}
        strokeDasharray="4 2"
      />
      <line
        x1={PADDING.left}
        y1={rangeY2}
        x2={viewWidth - PADDING.right}
        y2={rangeY2}
        stroke="#bae6fd"
        strokeWidth={0.5}
        strokeDasharray="4 2"
      />

      <polyline
        points={linePoints}
        fill="none"
        stroke="#0ea5e9"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {anomalyPoints.map((r) => {
        const idx = sorted.indexOf(r)
        return (
          <circle
            key={r.id}
            cx={toX(idx)}
            cy={toY(r.temperature)}
            r={4}
            fill="#ef4444"
          />
        )
      })}

      {lastRecord && (
        <g>
          <circle
            cx={toX(sorted.length - 1)}
            cy={toY(lastRecord.temperature)}
            r={6}
            fill="#0ea5e9"
            opacity={0.3}
            className="animate-pulse-dot"
          />
          <circle
            cx={toX(sorted.length - 1)}
            cy={toY(lastRecord.temperature)}
            r={3.5}
            fill="#0ea5e9"
          />
        </g>
      )}

      <text
        x={PADDING.left - 6}
        y={rangeY2 + 3}
        textAnchor="end"
        fontSize={10}
        fill="#94a3b8"
      >
        {tempRange.max}°
      </text>
      <text
        x={PADDING.left - 6}
        y={rangeY1 + 3}
        textAnchor="end"
        fontSize={10}
        fill="#94a3b8"
      >
        {tempRange.min}°
      </text>

      {xLabels.map((r) => {
        const idx = sorted.indexOf(r)
        return (
          <text
            key={r.id}
            x={toX(idx)}
            y={viewHeight - 4}
            textAnchor="end"
            fontSize={9}
            fill="#94a3b8"
            transform={`rotate(-30 ${toX(idx)} ${viewHeight - 4})`}
          >
            {formatTime(r.timestamp)}
          </text>
        )
      })}
    </svg>
  )
}
