import { useState } from 'react'
import { CheckCircle2, AlertTriangle, User } from 'lucide-react'
import { useStore } from '@/store/useStore'

interface SignOffPanelProps {
  waybillId: string
}

export default function SignOffPanel({ waybillId }: SignOffPanelProps) {
  const handoverRecord = useStore((s) => s.handoverRecords[waybillId])
  const getTemperatureHasOvershoot = useStore((s) => s.getTemperatureHasOvershoot)
  const signHandover = useStore((s) => s.signHandover)

  const [isSigning, setIsSigning] = useState(false)
  const [isSigned, setIsSigned] = useState(false)
  const [overshootNote, setOvershootNote] = useState('')
  const [signerName, setSignerName] = useState('当前用户（收货）')

  const hasOvershoot = getTemperatureHasOvershoot(waybillId)

  const record = handoverRecord

  if (record || isSigned) {
    const signedAt = record?.signedAt ?? new Date().toISOString()
    const displaySignerName = record?.signerName ?? signerName
    return (
      <div className="text-center">
        <style>{`
          @keyframes signSuccess {
            0% { transform: scale(0.3); opacity: 0; }
            50% { transform: scale(1.15); }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>
        <div className="bg-safe-500/10 rounded-2xl p-5">
          <div className="flex items-center justify-center mb-2">
            <CheckCircle2
              className="w-10 h-10 text-safe-500"
              style={{ animation: 'signSuccess 0.5s ease-out' }}
            />
          </div>
          <p className="text-lg font-semibold text-safe-600">已签收</p>
          <p className="text-sm text-slate-500 mt-1">签收人：{displaySignerName}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {new Date(signedAt).toLocaleString('zh-CN')}
          </p>
        </div>
      </div>
    )
  }

  const handleSign = () => {
    setIsSigning(true)
    setTimeout(() => {
      signHandover(waybillId, signerName, hasOvershoot ? overshootNote : undefined)
      setIsSigning(false)
      setIsSigned(true)
    }, 800)
  }

  const signerInput = (
    <div className="mb-3">
      <label className="text-xs text-slate-500 mb-1.5 block">签收人姓名</label>
      <div className="relative">
        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-cold-400 focus:ring-1 focus:ring-cold-400"
          placeholder="请输入签收人姓名"
          value={signerName}
          onChange={(e) => setSignerName(e.target.value)}
        />
      </div>
    </div>
  )

  return (
    <div>
      <h3 className="text-base font-semibold text-slate-800 mb-3">收货人确认签收</h3>

      {hasOvershoot && (
        <>
          {signerInput}
          <div className="flex items-start gap-2 bg-warn-50 border border-warn-400/30 rounded-xl p-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-warn-500 shrink-0 mt-0.5" />
            <p className="text-sm text-warn-600">检测到超温记录，请补充说明</p>
          </div>
          <textarea
            className="w-full border border-slate-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-warn-400 focus:ring-1 focus:ring-warn-400 min-h-[80px]"
            placeholder="请描述超温原因及处理情况..."
            value={overshootNote}
            onChange={(e) => setOvershootNote(e.target.value)}
          />
          <button
            className="w-full mt-3 bg-warn-500 hover:bg-warn-600 text-white font-semibold rounded-xl min-h-[52px] disabled:opacity-50 transition-colors"
            disabled={isSigning || !overshootNote.trim() || !signerName.trim()}
            onClick={handleSign}
          >
            {isSigning ? '签收中...' : '补充说明并签收'}
          </button>
        </>
      )}

      {!hasOvershoot && (
        <>
          {signerInput}
          <button
            className="w-full bg-safe-500 hover:bg-safe-600 text-white font-semibold rounded-xl min-h-[52px] disabled:opacity-50 transition-colors"
            disabled={isSigning || !signerName.trim()}
            onClick={handleSign}
          >
            {isSigning ? '签收中...' : '确认签收'}
          </button>
        </>
      )}
    </div>
  )
}
