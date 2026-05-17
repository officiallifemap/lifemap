import { useState } from 'react'

const CATEGORIES = [
  { value: 'feedback',   label: '💬 Feedback',           desc: 'General thoughts about the app' },
  { value: 'question',   label: '❓ Question',            desc: 'How do I…?' },
  { value: 'bug',        label: '🐛 Bug Report',          desc: 'Something isn\'t working right' },
  { value: 'suggestion', label: '💡 Suggestion',          desc: 'Feature ideas or improvements' },
  { value: 'support',    label: '🛟 Support',             desc: 'I need help with something' },
  { value: 'other',      label: '📩 Other',               desc: 'Anything else' },
]

const CONTACT_EMAIL = 'officiallifemap@gmail.com'

export default function FeedbackModal({ onClose }) {
  const [category, setCategory] = useState('feedback')
  const [message,  setMessage]  = useState('')
  const [email,    setEmail]    = useState('')
  const [sent,     setSent]     = useState(false)

  const handleSubmit = () => {
    if (!message.trim()) return
    const cat     = CATEGORIES.find((c) => c.value === category)?.label ?? category
    const subject = encodeURIComponent(`[lifemap] ${cat}`)
    const body    = encodeURIComponent(
      `Category: ${cat}\n\n${message.trim()}${email.trim() ? `\n\nReply to: ${email.trim()}` : ''}`
    )
    window.open(`mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`, '_blank')
    setSent(true)
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target.classList.contains('modal-overlay')) onClose() }}
    >
      <div className="modal" style={{ maxWidth: 460 }}>

        {sent ? (
          /* ── Sent state ── */
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 14 }}>📬</div>
            <div style={{ fontSize: 18, color: 'var(--cream)', fontWeight: 600, marginBottom: 8 }}>
              Thanks for reaching out!
            </div>
            <div style={{ fontSize: 14, color: 'var(--text3)', lineHeight: 1.6, marginBottom: 24 }}>
              Your email client should have opened with the message pre-filled.
              If it didn't, feel free to email <span style={{ color: 'var(--gold)' }}>{CONTACT_EMAIL}</span> directly.
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <div className="modal-title">Get in Touch</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: -6, marginBottom: 16, lineHeight: 1.5 }}>
              Questions, bugs, ideas, or anything else — I'd love to hear from you.
            </div>

            {/* Category picker */}
            <div className="form-row">
              <label className="label">What's this about?</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setCategory(c.value)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                      padding: '9px 12px', borderRadius: 10,
                      background: category === c.value ? 'color-mix(in srgb, var(--gold) 14%, transparent)' : 'var(--navy3)',
                      border: `1.5px solid ${category === c.value ? 'var(--gold)' : 'var(--border)'}`,
                      cursor: 'pointer', transition: 'all .12s', textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: 13, color: category === c.value ? 'var(--gold)' : 'var(--text1)', fontWeight: 500 }}>
                      {c.label}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{c.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="form-row">
              <label className="label">Message</label>
              <textarea
                className="input"
                style={{ minHeight: 110, resize: 'vertical', fontFamily: 'inherit', fontSize: 13, lineHeight: 1.6 }}
                placeholder={
                  category === 'bug'        ? 'Describe what happened, what you expected, and how to reproduce it…' :
                  category === 'suggestion' ? 'Describe your idea — what problem does it solve?' :
                  category === 'question'   ? 'What would you like to know?' :
                  'Write your message here…'
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                autoFocus
              />
            </div>

            {/* Optional email */}
            <div className="form-row">
              <label className="label">
                Your Email <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(optional — for replies)</span>
              </label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 14, lineHeight: 1.5 }}>
              Clicking Send will open your email client with this message pre-filled.
            </div>

            <div className="modal-footer">
              <button className="btn" onClick={onClose}>Cancel</button>
              <button
                className="btn btn-primary"
                disabled={!message.trim()}
                onClick={handleSubmit}
              >Send →</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
