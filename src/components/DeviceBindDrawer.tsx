import { useState, useEffect } from 'react'
import { X, Wifi, WifiOff, Thermometer, ScanLine } from 'lucide-react'
import { useStore } from '@/store/useStore'

interface DeviceBindDrawerProps {
  waybillId: string | null
  onClose: () => void
}

export default function DeviceBindDrawer({ waybillId, onClose }: DeviceBindDrawerProps) {
  const getWaybillById = useStore((s) => s.getWaybillById)
  const bindDevice = useStore((s) => s.bindDevice)

  const waybill = waybillId ? getWaybillById(waybillId) : undefined

  const [plate, setPlate] = useState('')
  const [deviceId, setDeviceId] = useState('')

  useEffect(() => {
    if (waybill) {
      setPlate(waybill.vehiclePlate)
      setDeviceId(waybill.deviceId)
    }
  }, [waybill?.id])

  if (!waybillId || !waybill) return null

  const handleConfirm = () => {
    bindDevice(waybill.id, plate, deviceId)
    onClose()
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 animate-[fadeIn_200ms_ease-out]"
        onClick={onClose}
      />

      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto bg-white rounded-t-3xl animate-[slideUp_300ms_ease-out]">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="text-lg font-bold text-slate-900">绑定设备</h3>
          <button
            onClick={onClose}
            className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-slate-100 min-h-[44px] min-w-[44px]"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="px-5 pb-2">
          <p className="text-sm text-slate-500">
            运单号：{waybill.waybillNo}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {waybill.origin} → {waybill.destination}
          </p>
        </div>

        <div className="px-5 py-3 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">车牌号</label>
            <input
              type="text"
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-cold-500 focus:outline-none focus:ring-1 focus:ring-cold-500 min-h-[44px]"
              placeholder="请输入车牌号"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">温度记录仪编号</label>
            <div className="relative">
              <input
                type="text"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-10 text-sm text-slate-900 focus:border-cold-500 focus:outline-none focus:ring-1 focus:ring-cold-500 min-h-[44px]"
                placeholder="请输入或扫码"
              />
              <ScanLine className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              {waybill.probeOnline ? (
                <>
                  <Wifi className="h-4 w-4 text-safe-500" />
                  <span className="text-safe-500 font-medium">在线</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-red-500" />
                  <span className="text-red-500 font-medium">离线</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Thermometer className="h-4 w-4 text-slate-400" />
              <span className="text-lg font-bold text-slate-900">{waybill.currentTemp}</span>
              <span className="text-sm text-slate-400">°C</span>
            </div>
          </div>
        </div>

        <div className="px-5 pb-8 pt-3 space-y-3">
          <button
            onClick={handleConfirm}
            className="w-full rounded-xl bg-cold-500 py-3.5 text-base font-medium text-white min-h-[44px] active:bg-cold-600 transition-colors"
          >
            确认绑定
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 text-sm text-slate-500 min-h-[44px]"
          >
            取消
          </button>
        </div>
      </div>
    </>
  )
}
