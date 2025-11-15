import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  AIResponsePayload,
  PopupVisibilityPayload,
  WakeWordPayload,
} from './types/ipc'
import './popup.css'

type Phase = 'idle' | 'listening' | 'processing' | 'responding' | 'error'

const IDLE_MESSAGE = 'Say "Hey Aurora" to manage your calendar.'
const PROCESSING_DELAY_MS = 1400

const PHASE_LABEL: Record<Phase, string> = {
  idle: 'Standby',
  listening: 'Listening',
  processing: 'Processing',
  responding: 'Responding',
  error: 'Needs attention',
}

const usePhaseHint = (phase: Phase) => {
  return useMemo(() => {
    switch (phase) {
      case 'idle':
        return { title: 'Ready', body: 'Say "Hey Aurora" to get started.' }
      case 'listening':
        return { title: 'Listening', body: 'Share your request naturally.' }
      case 'processing':
        return {
          title: 'Processing',
          body: 'Aurora is interpreting your calendar update.',
        }
      case 'responding':
        return { title: 'Response', body: 'Popup will close in a moment.' }
      case 'error':
        return { title: 'Try again', body: 'Please repeat the request.' }
      default:
        return { title: 'Aurora', body: '' }
    }
  }, [phase])
}

function App() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState(IDLE_MESSAGE)
  const [wakeKeyword, setWakeKeyword] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const processingTimerRef = useRef<number | null>(null)
  const phaseHint = usePhaseHint(phase)

  const clearProcessingTimer = useCallback(() => {
    if (processingTimerRef.current !== null && typeof window !== 'undefined') {
      window.clearTimeout(processingTimerRef.current)
      processingTimerRef.current = null
    }
  }, [])

  const scheduleProcessingState = useCallback(() => {
    if (typeof window === 'undefined') return
    clearProcessingTimer()
    processingTimerRef.current = window.setTimeout(() => {
      setPhase((current) => (current === 'listening' ? 'processing' : current))
      setMessage('Processing...')
    }, PROCESSING_DELAY_MS)
  }, [clearProcessingTimer])

  const handleWakeWord = useCallback(
    (payload: WakeWordPayload) => {
      setVisible(true)
      setPhase('listening')
      setMessage('Listening...')
      setWakeKeyword(payload.keyword)
      setLastUpdated(payload.detectedAt)
      scheduleProcessingState()
    },
    [scheduleProcessingState],
  )

  const handleAIResponse = useCallback(
    (payload: AIResponsePayload) => {
      clearProcessingTimer()
      setLastUpdated(Date.now())

      if (payload.error) {
        setPhase('error')
        setMessage(payload.error)
        return
      }

      const sanitized = (payload.message ?? '').trim()
      setPhase('responding')
      setMessage(sanitized.length > 0 ? sanitized : 'All set.')
    },
    [clearProcessingTimer],
  )

  const handleVisibility = useCallback(
    (payload: PopupVisibilityPayload) => {
      setVisible(payload.visible)
      if (!payload.visible) {
        clearProcessingTimer()
        setPhase('idle')
        setMessage(IDLE_MESSAGE)
        setWakeKeyword(null)
        setLastUpdated(null)
      }
    },
    [clearProcessingTimer],
  )

  useEffect(() => {
    return () => clearProcessingTimer()
  }, [clearProcessingTimer])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const api = window.electronAPI

    if (!api) {
      const demoTimers: number[] = []
      demoTimers.push(
        window.setTimeout(
          () =>
            handleVisibility({
              visible: true,
              reason: 'wakeword',
            }),
          300,
        ),
      )
      demoTimers.push(
        window.setTimeout(
          () =>
            handleWakeWord({
              keyword: 'Hey Aurora (demo)',
              detectedAt: Date.now(),
            }),
          600,
        ),
      )
      demoTimers.push(
        window.setTimeout(
          () =>
            handleAIResponse({
              message:
                "Here's a sample response so you can iterate on the UI layout.",
            }),
          2400,
        ),
      )
      demoTimers.push(
        window.setTimeout(
          () =>
            handleVisibility({
              visible: false,
              reason: 'timeout',
            }),
          6400,
        ),
      )

      return () => demoTimers.forEach((id) => window.clearTimeout(id))
    }

    const unsubscribeWake = api.onWakeWord(handleWakeWord)
    const unsubscribeResponse = api.onAIResponse(handleAIResponse)
    const unsubscribeVisibility = api.onPopupVisibility(handleVisibility)

    return () => {
      unsubscribeWake()
      unsubscribeResponse()
      unsubscribeVisibility()
    }
  }, [handleAIResponse, handleVisibility, handleWakeWord])

  const containerClass = `popup ${visible ? 'popup--visible' : ''} popup--${phase}`
  const panelClass = `popup__panel popup__panel--${phase}`
  const orbClass = `ai-orb ai-orb--${phase}`
  const pillClass = `status-pill status-pill--${phase}`

  const phaseLabel = useMemo(() => {
    if (phase === 'listening' && wakeKeyword) {
      return wakeKeyword
    }
    return PHASE_LABEL[phase]
  }, [phase, wakeKeyword])

  const updatedLabel = useMemo(() => {
    if (!lastUpdated || phase === 'idle') {
      return null
    }
    return new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(lastUpdated))
  }, [lastUpdated, phase])

  return (
    <div className={containerClass}>
      <div className={panelClass}>
        <div className={orbClass} aria-hidden="true" />

        <div className="status-bar">
          <div className={pillClass}>
            <span className="status-pill__dot" aria-hidden="true" />
            {phaseLabel}
          </div>
          {updatedLabel && (
            <span className="status-meta">Updated {updatedLabel}</span>
          )}
        </div>

        <div className="response-window" role="status" aria-live="polite">
          {message}
        </div>

        <p className="hint">
          <strong>{phaseHint.title}</strong> {phaseHint.body}
        </p>
      </div>
    </div>
  )
}

export default App
