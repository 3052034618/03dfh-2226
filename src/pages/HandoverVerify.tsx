import { useState, useRef, useEffect, ChangeEvent, KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { QrCode, Search, Home, AlertCircle } from 'lucide-react'
import { useStore } from '@/store/useStore'

export default function HandoverVerify() {
  const navigate = useNavigate()
  const getWaybillByHandoverCode = useStore((s) => s.getWaybillByHandoverCode)
  const [code, setCode] = useState<string[]>(['', '', '', '', '', ''])
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  const handleChange = (index: number, value: string) => {
    if (error) {
      setError(false)
    }

    const upperValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (upperValue.length > 1) {
      return
    }

    const newCode = [...code]
    newCode[index] = upperValue
    setCode(newCode)

    if (upperValue && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (pastedText.length === 0) return

    const newCode = [...code]
    for (let i = 0; i < 6 && i < pastedText.length; i++) {
      newCode[i] = pastedText[i]
    }
    setCode(newCode)

    const focusIndex = Math.min(pastedText.length, 5)
    inputRefs.current[focusIndex]?.focus()

    if (error) {
      setError(false)
    }
  }

  const handleSubmit = () => {
    const fullCode = code.join('')
    if (fullCode.length !== 6) {
      return
    }

    const waybill = getWaybillByHandoverCode(fullCode)
    if (waybill) {
      navigate(`/receive/${fullCode}`)
    } else {
      setError(true)
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
  }

  const isComplete = code.every((c) => c !== '')

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-gradient-to-b from-cold-900 to-cold-800 text-white px-6 pt-12 pb-8">
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
            <QrCode className="w-7 h-7 text-cold-200" />
          </div>
          <h1 className="text-xl font-bold">温度档案查询</h1>
          <p className="text-sm text-cold-200 mt-1">冷链运输全程温度追溯</p>
        </div>
      </div>

      <div className="flex-1 px-6 pt-8">
        <p className="text-sm text-slate-500 text-center mb-6">
          请输入司机出示的 6 位交接码，查询运单温度档案
        </p>

        <div className={`mb-6 ${shake ? 'animate-shake' : ''}`}>
          <div className="flex gap-2 justify-center" onPaste={handlePaste}>
            {code.map((char, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el }}
                type="text"
                inputMode="text"
                maxLength={1}
                value={char}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(index, e.target.value)}
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => handleKeyDown(index, e)}
                className={`w-11 h-14 text-center text-2xl font-bold font-mono rounded-xl border-2 transition-all duration-200 outline-none
                  ${error
                    ? 'border-red-400 bg-red-50 text-red-600'
                    : char
                      ? 'border-cold-500 bg-cold-50 text-cold-700'
                      : 'border-slate-200 bg-white text-slate-800 focus:border-cold-400 focus:ring-2 focus:ring-cold-100'
                  }`}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-center justify-center gap-2 text-red-500 text-sm mb-6">
            <AlertCircle className="w-4 h-4" />
            <span>交接码无效，请检查后重新输入</span>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!isComplete}
          className={`w-full rounded-xl min-h-[48px] text-base font-medium transition-all duration-200 flex items-center justify-center gap-2
            ${isComplete
              ? 'bg-cold-500 text-white active:bg-cold-600'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
        >
          <Search className="w-5 h-5" />
          查询
        </button>
      </div>

      <div className="pb-8 pt-4 text-center">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-cold-600 transition-colors"
        >
          <Home className="w-4 h-4" />
          返回首页
        </button>
      </div>
    </div>
  )
}
