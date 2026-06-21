import { useNavigate } from 'react-router-dom'
import { Snowflake, Thermometer, Search } from 'lucide-react'
import { useStore } from '@/store/useStore'
import StatusTabs from '@/components/StatusTabs'
import WaybillCard from '@/components/WaybillCard'
import DeviceBindDrawer from '@/components/DeviceBindDrawer'

export default function WaybillList() {
  const navigate = useNavigate()
  const waybills = useStore((s) => s.waybills)
  const activeStatusFilter = useStore((s) => s.activeStatusFilter)
  const bindingWaybillId = useStore((s) => s.bindingWaybillId)
  const setBindingWaybillId = useStore((s) => s.setBindingWaybillId)
  const startTransit = useStore((s) => s.startTransit)
  const getTemperatureHasOvershoot = useStore((s) => s.getTemperatureHasOvershoot)
  const getCheckpointsForWaybill = useStore((s) => s.getCheckpointsForWaybill)

  const filtered =
    activeStatusFilter === 'all'
      ? waybills
      : activeStatusFilter === 'anomaly'
      ? waybills.filter((w) => {
          if (w.status !== 'completed') return false
          const hasOvershoot = getTemperatureHasOvershoot(w.id)
          const checkpoints = getCheckpointsForWaybill(w.id)
          const hasAnomalyCheckpoint = checkpoints.some((cp) => cp.type === 'anomaly')
          return hasOvershoot || hasAnomalyCheckpoint
        })
      : waybills.filter((w) => w.status === activeStatusFilter)

  const today = new Date()
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日`

  const handleBindDevice = (id: string) => {
    setBindingWaybillId(id)
  }

  const handleStartTransit = (id: string) => {
    startTransit(id)
    navigate(`/waybill/${id}`)
  }

  return (
    <div className="min-h-screen bg-slate-50 max-w-md mx-auto">
      <header className="sticky top-0 z-30 bg-gradient-to-b from-cold-900 to-cold-800 px-5 pt-12 pb-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Snowflake className="h-6 w-6 text-cold-300" />
            <h1 className="text-xl font-bold">冷链通</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/verify')}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-full px-3 py-1.5 text-sm transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>收货查询</span>
            </button>
            <span className="text-sm text-cold-200">{dateStr}</span>
          </div>
        </div>
      </header>

      <StatusTabs />

      <div className="p-4 space-y-3 pb-24">
        {filtered.length > 0 ? (
          filtered.map((waybill) => (
            <WaybillCard
              key={waybill.id}
              waybill={waybill}
              onBindDevice={handleBindDevice}
              onStartTransit={handleStartTransit}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Thermometer className="h-12 w-12 mb-3" />
            <p className="text-sm">暂无运单</p>
          </div>
        )}
      </div>

      <DeviceBindDrawer
        waybillId={bindingWaybillId}
        onClose={() => setBindingWaybillId(null)}
      />
    </div>
  )
}
