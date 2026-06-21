import { useState, useEffect } from 'react'
import { X, QrCode, Copy, Share2, Smartphone } from 'lucide-react'
import { useStore } from '@/store/useStore'

interface HandoverCodeModalProps {
  waybillId: string
  handoverCode?: string
  onClose: () => void
}

export default function HandoverCodeModal({ waybillId, handoverCode: propHandoverCode, onClose }: HandoverCodeModalProps) {
  const [handoverCode, setHandoverCode] = useState('')
  const generateOrGetHandoverCode = useStore((s) => s.generateOrGetHandoverCode)

  useEffect(() => {
    if (propHandoverCode) {
      setHandoverCode(propHandoverCode)
    } else {
      const code = generateOrGetHandoverCode(waybillId)
      setHandoverCode(code)
    }
  }, [waybillId, propHandoverCode, generateOrGetHandoverCode])

  const receiveLink = `/receive/${handoverCode}`

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 animate-fade-in z-40" onClick={onClose} />

      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-md animate-fade-in shadow-xl">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <QrCode size={20} className="text-cold-600" />
              <h3 className="text-lg font-semibold text-slate-800">交接码 - 请收货人扫码查看</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-cold-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone size={32} className="text-cold-600" />
              </div>
              <div className="font-mono text-4xl font-bold tracking-widest text-cold-600 mb-2">
                {handoverCode}
              </div>
              <div className="text-sm text-slate-500">6位交接码</div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <div className="text-sm text-slate-600 mb-2 flex items-center gap-1">
                <Share2 size={14} />
                扫码链接
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm text-slate-700 bg-white px-3 py-2 rounded-lg border border-slate-200 truncate">
                  {receiveLink}
                </code>
                <button
                  onClick={() => copyToClipboard(receiveLink)}
                  className="p-2 text-cold-600 hover:bg-cold-50 rounded-lg transition-colors"
                  title="复制链接"
                >
                  <Copy size={18} />
                </button>
              </div>
            </div>

            <div className="text-sm text-slate-500 mb-6 leading-relaxed">
              请让收货人扫描二维码或在浏览器打开链接，即可查看全程温度档案并签收。
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => copyToClipboard(receiveLink)}
                className="flex-1 bg-cold-50 text-cold-600 rounded-xl min-h-[44px] text-sm font-medium flex items-center justify-center gap-2"
              >
                <Copy size={18} />
                复制链接
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-cold-500 text-white rounded-xl min-h-[44px] text-sm font-medium"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
