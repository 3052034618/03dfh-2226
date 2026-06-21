import { useState, useRef } from 'react'
import { Camera, FileText, AlertTriangle, MapPin, Upload } from 'lucide-react'
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
  const [photo, setPhoto] = useState<string | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const addCheckpoint = useStore((s) => s.addCheckpoint)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setPhoto(result)
        setPhotoPreview(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSimulatePhoto = async () => {
    try {
      const url = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=refrigerated%20truck%20on%20highway%2C%20temperature%20display%20inside%20cargo%20area%2C%20cold%20chain%20logistics&image_size=square'
      const response = await fetch(url)
      const blob = await response.blob()
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setPhoto(result)
        setPhotoPreview(result)
      }
      reader.readAsDataURL(blob)
    } catch (error) {
      console.error('Failed to generate photo:', error)
    }
  }

  const handleSubmit = () => {
    if (!selectedType) return

    addCheckpoint(waybillId, {
      type: selectedType,
      location: '当前路段 - GPS定位中',
      note: note || undefined,
      anomalyReason: selectedType === 'anomaly' ? anomalyReason! : undefined,
      photo: selectedType === 'photo' ? photo || undefined : undefined,
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

          {selectedType === 'photo' && (
            <div className="mb-3">
              <div className="flex gap-2 mb-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 bg-slate-100 text-slate-600 rounded-xl min-h-[44px] text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Upload size={18} />
                  选择照片
                </button>
                <button
                  onClick={handleSimulatePhoto}
                  className="flex-1 bg-cold-50 text-cold-600 rounded-xl min-h-[44px] text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Camera size={18} />
                  模拟拍照
                </button>
              </div>
              {photoPreview && (
                <img
                  src={photoPreview}
                  alt="照片预览"
                  className="w-full max-h-40 object-cover rounded-xl"
                />
              )}
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
              disabled={
                !selectedType ||
                (selectedType === 'anomaly' && !anomalyReason) ||
                (selectedType === 'photo' && !photo)
              }
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
