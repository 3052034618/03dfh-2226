import { useState } from 'react'
import { Camera, FileText, AlertTriangle, MapPin } from 'lucide-react'
import type { CheckpointType, AnomalyReason } from '@/types'
import { anomalyReasonLabels } from '@/data/mock'
import { useStore } from '@/store/useStore'

interface CheckpointFormProps {
  waybillId: string
  onClose: () => void
}

type QuickAction = { type: CheckpointType; label: string; icon: React.ReactNode }

const quickActions: QuickAction[] = [
  { type: 'photo', label: '拍照留痕', icon: <Camera size={20} /> },
  { type: 'note', label: '添加备注', icon: <FileText size={20} /> },
  { type: 'anomaly', label: '异常上报', icon: <AlertTriangle size={20} /> },
]

const anomalyReasons: AnomalyReason[] = ['door_open', 'device_shift', 'insufficient_precool']

export default function CheckpointForm({ waybillId, onClose }: CheckpointFormProps) {
  const [selectedType, setSelectedType] = useState<CheckpointType | null>(null)
  const [anomalyReason, setAnomalyReason] = useState<AnomalyReason | null>(null)
  const [note, setNote] = useState('')
  const addCheckpoint = useStore((s) => s.addCheckpoint)

  const handleSubmit = () => {
    if (!selectedType) return

    addCheckpoint(waybillId, {
      type: selectedType,
      location: '当前路段 - GPS定位中',
      note: note || undefined,
      anomalyReason: selectedType === 'anomaly' ? anomalyReason! : undefined,
    })
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 animate-fade-in z-40" onClick={onClose} />

      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl animate-slide-up z-50 safe-bottom">
        <div className="p-4 max-w-md mx-auto">
          <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />

          <div className="flex gap-3 mb-4">
            {quickActions.map((action) => (
              <button
                key={action.type}
                onClick={() => {
                  setSelectedType(action.type)
                  if (action.type !== 'anomaly') setAnomalyReason(null)
                }}
                className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-colors min-h-[44px] ${
                  selectedType === action.type
                    ? 'border-cold-500 bg-cold-50 text-cold-600'
                    : 'border-slate-200 text-slate-500'
                }`}
              >
                {action.icon}
                <span className="text-xs">{action.label}</span>
              </button>
            ))}
          </div>

          {selectedType === 'anomaly' && (
            <div className="flex gap-2 mb-4">
              {anomalyReasons.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setAnomalyReason(reason)}
                  className={`flex-1 py-2 px-2 rounded-lg text-xs border transition-colors min-h-[44px] ${
                    anomalyReason === reason
                      ? 'border-warn-500 bg-warn-50 text-warn-600'
                      : 'border-slate-200 text-slate-500'
                  }`}
                >
                  {anomalyReasonLabels[reason]}
                </button>
              ))}
            </div>
          )}

          {selectedType && selectedType !== 'photo' && (
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="请输入备注内容..."
              className="w-full border border-slate-200 rounded-xl p-3 text-sm resize-none h-20 focus:outline-none focus:border-cold-400 mb-3"
            />
          )}

          <div className="flex items-center gap-1 text-xs text-slate-400 mb-4">
            <MapPin size={12} />
            <span>当前位置：当前路段 - GPS定位中</span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="text-slate-400 text-sm min-h-[44px] px-4"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedType || (selectedType === 'anomaly' && !anomalyReason)}
              className="flex-1 bg-cold-500 text-white rounded-xl min-h-[48px] text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            >
              提交
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
