import type { TemperatureRecord, Checkpoint } from '@/types'
import { checkpointTypeLabels } from '@/data/mock'

interface HandoverChartProps {
  records: TemperatureRecord[]
  tempRange: { min: number; max: number }
  checkpoints: Checkpoint[]
}

const CHART_HEIGHT = 280
const PAD = { top: 24, right: 20, bottom: 34, left: 48 }

const CHECKPOINT_COLORS: Record<string, string> = {
  departure: '#0ea5e9',
  anomaly: '#f97316',
  arrival: '#22c55e',
}

export default function HandoverChart({ records, tempRange, checkpoints }: HandoverChartProps) {
  if (records.length === 0) return null

  const svgWidth = 640
  const plotW = svgWidth - PAD.left - PAD.right
  const plotH = CHART_HEIGHT - PAD.top - PAD.bottom

  const temps = records.map((r) => r.temperature)
  const dataMin = Math.min(...temps)
  const dataMax = Math.max(...temps)
  const pad = Math.max((dataMax - dataMin) * 0.18, 2)
  const yMin = Math.floor((dataMin - pad) * 2) / 2
  const yMax = Math.ceil((dataMax + pad) * 2) / 2
  const yRange = yMax - yMin || 1

  const mapX = (i: number) => PAD.left + (i / Math.max(records.length - 1, 1)) * plotW
  const mapY = (t: number) => PAD.top + plotH - ((t - yMin) / yRange) * plotH

  const normalTop = mapY(tempRange.max)
  const normalBot = mapY(tempRange.min)

  const linePoints = records.map((r, i) => `${mapX(i)},${mapY(r.temperature)}`).join(' ')

  const markerTypes = ['departure', 'anomaly', 'arrival']
  const markerCheckpoints = checkpoints
    .filter((cp) => markerTypes.includes(cp.type))
    .map((cp) => {
      const cpTime = new Date(cp.timestamp).getTime()
      let closestIdx = 0
      let closestDist = Infinity
      records.forEach((r, i) => {
        const d = Math.abs(new Date(r.timestamp).getTime() - cpTime)
        if (d < closestDist) {
          closestDist = d
          closestIdx = i
        }
      })
      return { ...cp, x: mapX(closestIdx), color: CHECKPOINT_COLORS[cp.type] }
    })

  const anomalySections: { start: number; end: number }[] = []
  let idx = 0
  while (idx < records.length) {
    if (!records[idx].isNormal) {
      const start = idx
      while (idx < records.length && !records[idx].isNormal) idx++
      anomalySections.push({ start, end: idx - 1 })
    } else {
      idx++
    }
  }

  const overshootRecords = records.filter((r) => !r.isNormal)
  const hasOvershoot = overshootRecords.length > 0
  let maxOvershoot = 0
  let overshootMin = 0
  if (hasOvershoot) {
    maxOvershoot = Math.max(
      ...overshootRecords.map((r) =>
        Math.max(r.temperature - tempRange.max, tempRange.min - r.temperature, 0)
      )
    )
    maxOvershoot = Math.round(maxOvershoot * 10) / 10
    if (overshootRecords.length >= 2) {
      const t0 = new Date(overshootRecords[0].timestamp).getTime()
      const t1 = new Date(overshootRecords[overshootRecords.length - 1].timestamp).getTime()
      overshootMin = Math.round((t1 - t0) / 60000)
    } else {
      overshootMin = 10
    }
  }

  const yTicks = Array.from({ length: 5 }, (_, i) => yMin + (yRange * i) / 4)

  return (
    <div>
      <svg viewBox={`0 0 ${svgWidth} ${CHART_HEIGHT}`} className="w-full" style={{ height: CHART_HEIGHT }}>
        <rect
          x={PAD.left}
          y={normalTop}
          width={plotW}
          height={normalBot - normalTop}
          fill="#0ea5e9"
          opacity={0.08}
        />
        <line x1={PAD.left} y1={normalTop} x2={PAD.left + plotW} y2={normalTop} stroke="#0ea5e9" strokeWidth={1} strokeDasharray="4 2" opacity={0.4} />
        <line x1={PAD.left} y1={normalBot} x2={PAD.left + plotW} y2={normalBot} stroke="#0ea5e9" strokeWidth={1} strokeDasharray="4 2" opacity={0.4} />
        <text x={PAD.left + plotW + 2} y={normalTop + 3} fontSize={9} fill="#0ea5e9" opacity={0.6}>{tempRange.max}°</text>
        <text x={PAD.left + plotW + 2} y={normalBot + 3} fontSize={9} fill="#0ea5e9" opacity={0.6}>{tempRange.min}°</text>

        {anomalySections.map((sec, si) => {
          const x1 = mapX(sec.start)
          const x2 = mapX(sec.end)
          return (
            <rect key={si} x={x1} y={PAD.top} width={Math.max(x2 - x1, 2)} height={plotH} fill="#ef4444" opacity={0.12} />
          )
        })}

        {yTicks.map((t, i) => {
          const y = mapY(t)
          return (
            <g key={i}>
              <line x1={PAD.left} y1={y} x2={PAD.left + plotW} y2={y} stroke="#e2e8f0" strokeWidth={0.5} />
              <text x={PAD.left - 6} y={y + 3} textAnchor="end" fontSize={10} fill="#94a3b8">{t.toFixed(1)}°</text>
            </g>
          )
        })}

        <polyline points={linePoints} fill="none" stroke="#0ea5e9" strokeWidth={2} strokeLinejoin="round" />

        {markerCheckpoints.map((cp, i) => (
          <g key={i}>
            <line x1={cp.x} y1={PAD.top} x2={cp.x} y2={PAD.top + plotH} stroke={cp.color} strokeWidth={1.5} strokeDasharray="4 3" />
            <circle cx={cp.x} cy={PAD.top - 6} r={3.5} fill={cp.color} />
            <text x={cp.x} y={PAD.top + plotH + 12} textAnchor="middle" fontSize={9} fill={cp.color} fontWeight={500}>
              {checkpointTypeLabels[cp.type]}
            </text>
          </g>
        ))}
      </svg>

      <div className="flex items-center justify-center gap-4 mt-3 text-xs text-slate-500">
        {markerTypes.map((type) => (
          <span key={type} className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 rounded" style={{ backgroundColor: CHECKPOINT_COLORS[type] }} />
            {checkpointTypeLabels[type]}
          </span>
        ))}
        {hasOvershoot && (
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-2 rounded-sm" style={{ backgroundColor: '#ef4444', opacity: 0.2 }} />
            超温区间
          </span>
        )}
      </div>

      {hasOvershoot && (
        <div className="mt-3 flex gap-3 text-xs">
          <div className="bg-red-50 text-red-600 rounded-lg px-3 py-1.5">
            最高超温 <span className="font-semibold">{maxOvershoot}°C</span>
          </div>
          <div className="bg-red-50 text-red-600 rounded-lg px-3 py-1.5">
            超温时长 <span className="font-semibold">{overshootMin}分钟</span>
          </div>
        </div>
      )}
    </div>
  )
}
