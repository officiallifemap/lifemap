import { useEffect, useState } from 'react'
import useStore from '../../store/useStore'

export default function FirstSteps() {
  const events              = useStore((s) => s.events)
  const goals               = useStore((s) => s.goals)
  const habits              = useStore((s) => s.habits)
  const people              = useStore((s) => s.people)
  const fixedIncome         = useStore((s) => s.fixedIncome)
  const incomeEntries       = useStore((s) => s.incomeEntries)
  const totalBudget         = useStore((s) => s.totalBudget)
  const paydayAnchorDate    = useStore((s) => s.paydayAnchorDate)
  const firstStepsDismissed = useStore((s) => s.firstStepsDismissed)
  const dismissFirstSteps   = useStore((s) => s.dismissFirstSteps)
  const setPage             = useStore((s) => s.setPage)
  const setFinancesTab      = useStore((s) => s.setFinancesTab)

  const [justCompleted, setJustCompleted] = useState(false)

  const steps = [
    {
      id:    'budget',
      label: 'Set your income & budget',
      sub:   'Unlocks budget tracking across the whole app',
      done:  (fixedIncome > 0 || incomeEntries.length > 0) && totalBudget > 0,
      go:    () => { setPage('finances'); setFinancesTab('overview') },
    },
    {
      id:    'event-or-goal',
      label: 'Add a life event or goal',
      sub:   'The heart of lifemap — something worth planning for',
      done:  events.length > 0 || goals.length > 0,
      go:    () => setPage('events'),
    },
    {
      id:    'habit',
      label: 'Add a habit',
      sub:   'Shows up in your daily briefing the moment you add one',
      done:  habits.filter((h) => !h.archived).length > 0,
      go:    () => setPage('habits'),
    },
    {
      id:    'payday',
      label: 'Set your payday',
      sub:   'Lights up your calendar with pay dates automatically',
      done:  !!paydayAnchorDate,
      go:    () => { setPage('finances'); setFinancesTab('overview') },
    },
    {
      id:    'people',
      label: 'Add someone',
      sub:   'Track birthdays, anniversaries, and gift ideas',
      done:  people.length > 0,
      go:    () => setPage('people'),
    },
  ]

  const doneCount = steps.filter((s) => s.done).length
  const allDone   = doneCount === steps.length
  const pct       = Math.round((doneCount / steps.length) * 100)

  /* Auto-dismiss after a short celebration when all steps complete */
  useEffect(() => {
    if (allDone && !firstStepsDismissed) {
      setJustCompleted(true)
      const t = setTimeout(() => dismissFirstSteps(), 2200)
      return () => clearTimeout(t)
    }
  }, [allDone, firstStepsDismissed])

  if (firstStepsDismissed) return null

  return (
    <div style={{
      background: 'var(--navy3)',
      border: '1px solid var(--border2)',
      borderRadius: 14,
      padding: '20px 24px',
      marginBottom: 20,
      position: 'relative',
    }}>
      {/* Dismiss button */}
      {!allDone && (
        <button
          onClick={dismissFirstSteps}
          title="Dismiss — I'll explore on my own"
          style={{
            position: 'absolute', top: 14, right: 14,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text3)', fontSize: 16, lineHeight: 1,
            padding: '2px 6px', borderRadius: 4,
            transition: 'color .15s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text1)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text3)'}
        >✕</button>
      )}

      {/* Header */}
      {justCompleted ? (
        <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
          <div style={{ fontSize: 16, color: 'var(--cream)', fontWeight: 600, marginBottom: 4 }}>
            You're all set up
          </div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>
            lifemap is ready. Everything's connected from here.
          </div>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 16, paddingRight: 24 }}>
            <div style={{ fontSize: 15, color: 'var(--cream)', fontWeight: 600, marginBottom: 3 }}>
              Getting started
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>
              Five things to make lifemap feel like yours.
            </div>
          </div>

          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 16 }}>
            {steps.map((step) => (
              <div
                key={step.id}
                onClick={step.done ? undefined : step.go}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '9px 12px', borderRadius: 9,
                  cursor: step.done ? 'default' : 'pointer',
                  transition: 'background .12s',
                  opacity: step.done ? 0.55 : 1,
                }}
                onMouseEnter={(e) => { if (!step.done) e.currentTarget.style.background = 'var(--card2)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                {/* Check circle */}
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: step.done ? 'var(--sage2)' : 'transparent',
                  border: step.done ? '2px solid var(--sage2)' : '2px solid var(--border2)',
                  transition: 'all .2s',
                  fontSize: 11, color: 'var(--navy)', fontWeight: 700,
                }}>
                  {step.done && '✓'}
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 500,
                    color: step.done ? 'var(--text3)' : 'var(--text1)',
                    textDecoration: step.done ? 'line-through' : 'none',
                  }}>
                    {step.label}
                  </div>
                  {!step.done && (
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{step.sub}</div>
                  )}
                </div>

                {/* Arrow */}
                {!step.done && (
                  <span style={{ fontSize: 12, color: 'var(--text3)', flexShrink: 0 }}>→</span>
                )}
              </div>
            ))}
          </div>

          {/* Progress bar + count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 4, background: 'var(--navy4)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 2,
                background: 'var(--sage2)',
                width: `${pct}%`,
                transition: 'width 0.4s ease',
              }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', flexShrink: 0, fontFamily: 'var(--font-mono)' }}>
              {doneCount}/{steps.length}
            </div>
          </div>

          {/* Dismiss link */}
          <button
            onClick={dismissFirstSteps}
            style={{
              marginTop: 14, background: 'none', border: 'none',
              fontSize: 11, color: 'var(--text3)', cursor: 'pointer',
              padding: 0, letterSpacing: 0.2,
              transition: 'color .15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text2)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text3)'}
          >
            Dismiss — I'll explore on my own
          </button>
        </>
      )}
    </div>
  )
}
