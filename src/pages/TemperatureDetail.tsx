import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Thermometer, Wifi, WifiOff, ClipboardCheck, QrCode } from 'lucide-react'
import { useStore } from '@/store/useStore'
import TemperatureChart from '@/components/TemperatureChart'
import CheckpointTimeline from '@/components/CheckpointTimeline'
import CheckpointForm from '@/components/CheckpointForm'
import HandoverCodeModal from '@/components/HandoverCodeModal'

export default function TemperatureDetail() {
  const { waybillId } = useParams<{ waybillId: string }>()
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [showCodeModal, setShowCodeModal] = useState(false)

  const waybill = useStore((s) => s.getWaybillById(waybillId || ''))
  const checkpoints = useStore((s) => s.getCheckpointsForWaybill(waybillId || ''))
  const startTransit = useStore((s) => s.startTransit)
  const generateOrGetHandoverCode = useStore((s) => s.generateOrGetHandoverCode)
  const getTemperatureRecords = useStore((s) => s.getTemperatureRecords)

  const tempRecords = waybillId ? getTemperatureRecords(waybillId) : []

  useEffect(() => {
    if (waybillId) {
      getTemperatureRecords(waybillId)
    }
  }, [waybillId, getTemperatureRecords])

  if (!waybill) {
    return (
      <div className="max-w-md mx-auto flex flex-col items-center justify-center h-full text-slate-400">
        <Thermometer size={48} className="mb-3" />
        <p className="text-sm">运单不存在或已删除</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-cold-500 text-sm min-h-[44px] px-4"
        >
          返回
        </button>
      </div>
    )
  }

  const lastTempNormal = tempRecords.length > 0
    ? tempRecords[tempRecords.length - 1].isNormal
    : waybill.currentTemp >= waybill.tempRange.min && waybill.currentTemp <= waybill.tempRange.max

  const getStatusBadge = () => {
    if (waybill.status === 'pending') {
      if (waybill.deviceBound) {
        return { text: '装车中', className: 'bg-cold-500/10 text-cold-600' }
      }
      return { text: '等待绑定', className: 'bg-slate-100 text-slate-500' }
    }
    if (lastTempNormal) {
      return { text: '正常', className: 'bg-safe-500/10 text-safe-600' }
    }
    return { text: '超温', className: 'bg-warn-500/10 text-warn-600' }
  }

  const statusBadge = getStatusBadge()

  const handleStartTransit = () => {
    startTransit(waybill.id)
    navigate(`/waybill/${waybill.id}`, { replace: true })
  }

  return (
    <div className="max-w-md mx-auto flex flex-col h-full bg-cold-50">
      <header className="bg-gradient-to-r from-cold-900 to-cold-800 text-white px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={() => navigate(-1)} className="min-h-[44px] flex items-center">
          <ArrowLeft size={20} />
        </button>
        <span className="text-sm font-medium flex-1">{waybill.waybillNo}</span>
        {waybill.status === 'in_transit' && (
          <>
            <button
              onClick={() => setShowCodeModal(true)}
              className="text-xs bg-white/20 rounded-lg px-2.5 py-1.5 min-h-[36px] flex items-center gap-1"
            >
              <QrCode size={14} />
              交接码
            </button>
            <button
              onClick={() => navigate(`/handover/${waybill.id}`)}
              className="text-xs bg-white/20 rounded-lg px-3 py-1.5 min-h-[36px] flex items-center gap-1"
            >
              <ClipboardCheck size={14} />
              交接签收
            </button>
          </>
        )}
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-hide pb-20">
        <section className="px-4 pt-4">
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-800">
                  {waybill.currentTemp}°C
                </span>
                <Thermometer size={18} className="text-cold-400" />
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge.className}`}
              >
                {statusBadge.text}
              </span>
            </div>

            <TemperatureChart
              records={tempRecords}
              tempRange={waybill.tempRange}
            />
          </div>
        </section>

        <section className="px-4 mt-3">
          <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              {waybill.probeOnline ? (
                <Wifi size={14} className="text-safe-500" />
              ) : (
                <WifiOff size={14} className="text-warn-500" />
              )}
              <span className={waybill.probeOnline ? 'text-safe-600' : 'text-warn-500'}>
                {waybill.probeOnline ? '在线' : '离线'}
              </span>
            </div>
            <div className="text-slate-500">
              设备：<span className="text-slate-700">{waybill.deviceId}</span>
            </div>
            <div className="text-slate-500">
              车牌：<span className="text-slate-700">{waybill.vehiclePlate}</span>
            </div>
          </div>
        </section>

        {checkpoints.length > 0 && (
          <section className="px-4 mt-4">
            <h3 className="text-sm font-medium text-slate-700 mb-3">运输记录</h3>
            <CheckpointTimeline checkpoints={checkpoints} />
          </section>
        )}
      </div>

      {waybill.status === 'in_transit' && (
        <button
          onClick={() => setShowForm(true)}
          className="fixed bottom-6 right-4 w-14 h-14 bg-cold-500 text-white rounded-full shadow-lg flex items-center justify-center z-30"
        >
          <Plus size={24} />
        </button>
      )}

      {waybill.status === 'pending' && waybill.deviceBound && (
        <div className="px-4 pb-4 pt-2 shrink-0 safe-bottom">
          <button
            onClick={handleStartTransit}
            className="w-full bg-cold-500 text-white rounded-xl min-h-[48px] text-sm font-medium"
          >
            出发
          </button>
        </div>
      )}

      {showForm && (
        <CheckpointForm
          waybillId={waybill.id}
          onClose={() => setShowForm(false)}
        />
      )}

      {showCodeModal && (
        <HandoverCodeModal
          waybillId={waybill.id}
          handoverCode={generateOrGetHandoverCode(waybill.id)}
          onClose={() => setShowCodeModal(false)}
        />
      )}
    </div>
  )
}
