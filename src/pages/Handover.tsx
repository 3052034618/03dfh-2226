import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Thermometer,
  Truck,
  FileCheck,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { mockTemperatureRecords, checkpointTypeLabels } from '@/data/mock'
import HandoverChart from '@/components/HandoverChart'
import SignOffPanel from '@/components/SignOffPanel'

const checkpointIcons: Record<string, React.ReactNode> = {
  departure: <Truck className="w-4 h-4 text-cold-500" />,
  anomaly: <AlertTriangle className="w-4 h-4 text-warn-500" />,
  arrival: <CheckCircle2 className="w-4 h-4 text-safe-500" />,
}

export default function Handover() {
  const { waybillId } = useParams<{ waybillId: string }>()
  const navigate = useNavigate()

  const waybill = useStore((s) => s.getWaybillById(waybillId || ''))
  const checkpoints = useStore((s) => s.getCheckpointsForWaybill(waybillId || ''))
  const handoverRecord = useStore((s) => (waybillId ? s.handoverRecords[waybillId] : undefined))

  const records = waybillId ? mockTemperatureRecords[waybillId] || [] : []

  if (!waybill) {
    return (
      <div className="max-w-md mx-auto min-h-screen flex items-center justify-center text-slate-400">
        运单不存在
      </div>
    )
  }

  const isReadOnly = !!handoverRecord

  const temps = records.map((r) => r.temperature)
  const minTemp = temps.length > 0 ? Math.min(...temps) : 0
  const maxTemp = temps.length > 0 ? Math.max(...temps) : 0
  const avgTemp =
    temps.length > 0
      ? Math.round((temps.reduce((a, b) => a + b, 0) / temps.length) * 10) / 10
      : 0
  const overshootCount = records.filter((r) => !r.isNormal).length

  let durationMin = 0
  if (records.length >= 2) {
    const t0 = new Date(records[0].timestamp).getTime()
    const t1 = new Date(records[records.length - 1].timestamp).getTime()
    durationMin = Math.round((t1 - t0) / 60000)
  }

  const keyCheckpoints = checkpoints.filter((cp) =>
    ['departure', 'anomaly', 'arrival'].includes(cp.type)
  )

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50">
      <div className="bg-gradient-to-b from-cold-900 to-cold-800 text-white px-4 pt-12 pb-6">
        <div className="flex items-center gap-3">
          <button
            className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 active:bg-white/20"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">交接签收</h1>
          {isReadOnly && (
            <FileCheck className="w-5 h-5 ml-auto opacity-60" />
          )}
        </div>
      </div>

      <div className="px-4 -mt-4 pb-28 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-cold-600">{waybill.waybillNo}</span>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
              {waybill.goodsType}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-3 text-sm text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-cold-500 shrink-0" />
            <span className="truncate">{waybill.origin}</span>
            <span className="text-slate-300">→</span>
            <span className="truncate">{waybill.destination}</span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <Truck className="w-3.5 h-3.5" />
            <span>{waybill.vehiclePlate}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">全程温度回顾</h2>
          <HandoverChart
            records={records}
            tempRange={waybill.tempRange}
            checkpoints={keyCheckpoints}
          />
        </div>

        {keyCheckpoints.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">关键节点</h2>
            <div className="space-y-2">
              {keyCheckpoints.map((cp) => (
                <div key={cp.id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2.5">
                  <div className="shrink-0">{checkpointIcons[cp.type]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-700">
                        {checkpointTypeLabels[cp.type]}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(cp.timestamp).toLocaleTimeString('zh-CN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{cp.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
            <Thermometer className="w-4 h-4 text-cold-500" />
            温度统计
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-xs text-slate-400">最低</p>
              <p className="text-base font-semibold text-cold-600">{minTemp.toFixed(1)}°C</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400">最高</p>
              <p className="text-base font-semibold text-cold-600">{maxTemp.toFixed(1)}°C</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400">平均</p>
              <p className="text-base font-semibold text-cold-600">{avgTemp.toFixed(1)}°C</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100">
            <div className="text-center">
              <p className="text-xs text-slate-400">运输时长</p>
              <p className="text-sm font-semibold text-slate-700 flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {durationMin} 分钟
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400">超温次数</p>
              <p className={`text-sm font-semibold ${overshootCount > 0 ? 'text-warn-500' : 'text-safe-500'}`}>
                {overshootCount} 次
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4" style={{ maxWidth: 448, margin: '0 auto' }}>
        <SignOffPanel waybillId={waybill.id} />
      </div>
    </div>
  )
}
