import { useState, useRef } from 'react'
import { Camera, MapPin, Upload, ClipboardList } from 'lucide-react'
import type { Checkpoint } from '@/types'
import { anomalyReasonLabels } from '@/data/mock'
import { useStore } from '@/store/useStore'

interface ProcessingFormProps {
  waybillId: string
  onClose: () => void
}

export default function ProcessingForm({ waybillId, onClose }: ProcessingFormProps) {
  const [processingNote, setProcessingNote] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [anomalyRef, setAnomalyRef] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const addCheckpoint = useStore((s) => s.addCheckpoint)
  const checkpoints = useStore((s) => s.getCheckpointsForWaybill(waybillId))

  const anomalyCheckpoints = checkpoints.filter((cp) => cp.type === 'anomaly')

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
      const url = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=refrigerated%20truck%20cargo%20interior%20with%20temperature%20display%2C%20cold%20chain%20logistics%20processing&image_size=square'
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
    if (!processingNote.trim()) return

    addCheckpoint(waybillId, {
      type: 'processing',
      location: '当前位置 - GPS定位中',
      processingNote: processingNote.trim(),
      photo: photo || undefined,
      anomalyRef: anomalyRef || undefined,
    } as Omit<Checkpoint, 'id' | 'waybillId' | 'timestamp'>)
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 animate-fade-in z-40" onClick={onClose} />

      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl animate-slide-up z-50 safe-bottom">
        <div className="p-4 max-w-md mx-auto">
          <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />

          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-lg bg-cold-100 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-cold-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800">追加处理记录</h3>
              <p className="text-xs text-slate-500">补充异常处理的跟进说明</p>
            </div>
          </div>

          {anomalyCheckpoints.length > 0 && (
            <div className="mb-3">
              <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                关联异常（可选）
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setAnomalyRef('')}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-colors min-h-[36px] ${
                    anomalyRef === ''
                      ? 'border-cold-500 bg-cold-50 text-cold-600'
                      : 'border-slate-200 text-slate-500'
                  }`}
                >
                  通用说明
                </button>
                {anomalyCheckpoints.map((cp, idx) => (
                  <button
                    key={cp.id}
                    onClick={() => setAnomalyRef(cp.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-colors min-h-[36px] ${
                      anomalyRef === cp.id
                        ? 'border-warn-500 bg-warn-50 text-warn-600'
                        : 'border-slate-200 text-slate-500'
                    }`}
                  >
                    异常 #{idx + 1} - {cp.anomalyReason ? anomalyReasonLabels[cp.anomalyReason] : '未标注'}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mb-3">
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">
              处理说明 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={processingNote}
              onChange={(e) => setProcessingNote(e.target.value)}
              placeholder="请输入处理说明，例如：已重新调整制冷设备温度，确认运行正常..."
              className="w-full border border-slate-200 rounded-xl p-3 text-sm resize-none h-24 focus:outline-none focus:border-cold-400"
            />
          </div>

          <div className="mb-3">
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">
              现场照片（可选）
            </label>
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

          <div className="flex items-center gap-1 text-xs text-slate-400 mb-4">
            <MapPin size={12} />
            <span>当前位置：当前位置 - GPS定位中</span>
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
              disabled={!processingNote.trim()}
              className="flex-1 bg-cold-500 text-white rounded-xl min-h-[48px] text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            >
              提交记录
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
