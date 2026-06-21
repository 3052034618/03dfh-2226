import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Thermometer,
  Truck,
  FileCheck,
  Camera,
  QrCode,
  Home,
  Search,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { checkpointTypeLabels } from '@/data/mock'
import HandoverChart from '@/components/HandoverChart'
import SignOffPanel from '@/components/SignOffPanel'
import HandoverCodeModal from '@/components/HandoverCodeModal'
import AnomalyTrace from '@/components/AnomalyTrace'
import SignOffReceipt from '@/components/SignOffReceipt'

const checkpointIcons: Record<string, React.ReactNode> = {
  departure: <Truck className="w-4 h-4 text-cold-500" />,
  anomaly: <AlertTriangle className="w-4 h-4 text-warn-500" />,
  arrival: <CheckCircle2 className="w-4 h-4 text-safe-500" />,
  photo: <Camera className="w-4 h-4 text-sky-500" />,
}

export default function HandoverView() {
  const { handoverCode } = useParams<{ handoverCode: string }>()
  const navigate = useNavigate()
  const [showCodeModal, setShowCodeModal] = useState(false)

  const waybill = useStore((s) => s.getWaybillByHandoverCode(handoverCode || ''))
  const checkpoints = useStore((s) =>
    waybill ? s.getCheckpointsForWaybill(waybill.id) : []
  )
  const handoverRecord = useStore((s) =>
    waybill ? s.handoverRecords[waybill.id] : undefined
  )
  const generateOrGetHandoverCode = useStore((s) => s.generateOrGetHandoverCode)
  const getTemperatureRecords = useStore((s) => s.getTemperatureRecords)

  const records = waybill ? getTemperatureRecords(waybill.id) : []

  useEffect(() => {
    if (waybill) {
      getTemperatureRecords(waybill.id)
    }
  }, [waybill, getTemperatureRecords])

  if (!waybill) {
    return (
      <div className="max-w-md mx-auto min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6">
        <div className="w-20 h-20 bg-warn-100 rounded-full flex items-center justify-center mb-5">
          <AlertTriangle className="w-10 h-10 text-warn-500" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">未找到对应运单</h2>
        <p className="text-sm text-slate-500 text-center mb-3">
          交接码无效或已过期
        </p>
        <div className="bg-slate-100 rounded-xl px-4 py-2 mb-8">
          <span className="font-mono text-lg font-bold tracking-widest text-slate-600">
            {handoverCode?.toUpperCase() || '------'}
          </span>
        </div>
        <div className="space-y-3 w-full">
          <button
            onClick={() => navigate('/verify')}
            className="w-full bg-cold-500 active:bg-cold-600 text-white font-medium rounded-xl min-h-[48px] flex items-center justify-center gap-2 transition-colors"
          >
            <Search className="w-4 h-4" />
            重新输入交接码
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-slate-100 active:bg-slate-200 text-slate-700 font-medium rounded-xl min-h-[48px] flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="w-4 h-4" />
            返回首页
          </button>
        </div>
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
    ['departure', 'anomaly', 'arrival', 'photo'].includes(cp.type)
  )

  const currentHandoverCode = waybill.handoverCode || generateOrGetHandoverCode(waybill.id)

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
          <h1 className="text-lg font-semibold">温度档案查看</h1>
          {isReadOnly && <FileCheck className="w-5 h-5 ml-auto opacity-60" />}
          {!isReadOnly && (
            <button
              onClick={() => setShowCodeModal(true)}
              className="ml-auto w-9 h-9 rounded-full bg-white/10 active:bg-white/20 flex items-center justify-center"
            >
              <QrCode className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="mt-4">
          <span className="inline-flex items-center gap-1.5 bg-white/20 rounded-lg px-3 py-1.5 text-xs font-medium">
            <span className="font-mono tracking-wider">交接码: {currentHandoverCode}</span>
          </span>
        </div>
      </div>

      <div className={`px-4 -mt-4 space-y-4 ${isReadOnly ? 'pb-8' : 'pb-28'}`}>
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
                <div
                  key={cp.id}
                  className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2.5"
                >
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
                  {cp.type === 'photo' && cp.photo && (
                    <img
                      src={cp.photo}
                      alt="照片记录"
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                    />
                  )}
                  {cp.type === 'photo' && !cp.photo && (
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <Camera className="w-5 h-5 text-slate-300" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <AnomalyTrace
          waybillId={waybill.id}
          temperatureRecords={records}
          checkpoints={checkpoints}
          handoverRecord={handoverRecord}
        />

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
              <p
                className={`text-sm font-semibold ${overshootCount > 0 ? 'text-warn-500' : 'text-safe-500'}`}
              >
                {overshootCount} 次
              </p>
            </div>
          </div>
        </div>

        {!isReadOnly && (
          <div
            className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4"
            style={{ maxWidth: 448, margin: '0 auto' }}
          >
            <SignOffPanel waybillId={waybill.id} />
          </div>
        )}

        {isReadOnly && (
          <>
            <SignOffPanel waybillId={waybill.id} />
            <SignOffReceipt waybillId={waybill.id} />
          </>
        )}
      </div>

      {showCodeModal && (
        <HandoverCodeModal
          waybillId={waybill.id}
          handoverCode={currentHandoverCode}
          onClose={() => setShowCodeModal(false)}
        />
      )}
    </div>
  )
}
