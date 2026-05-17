import { useState, useEffect, useRef } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPhoneNumber,
  RecaptchaVerifier,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider, yahooProvider } from '../../firebase'
import useStore from '../../store/useStore'

const SKIP_KEY = 'lifemap-skip-auth'

const SYNC_FIELDS = [
  'todos','events','goals','expenses','habits','people',
  'appointments','medications','notes','contributions',
  'incomeMode','fixedIncome','incomeEntries','totalBudget','budgetCategories',
  'recurringBills','assets','debts',
  'navOrder','dashboardLayout','dashboardHidden',
  'paydayAnchorDate','paydayFrequency',
  'dashboardStatOrder','dashboardPinnedTodos',
  'financesTab','firstStepsDismissed',
  'darkMode','profiles','activeProfileId',
]

function extractSyncData(state) {
  const data = {}
  SYNC_FIELDS.forEach((f) => { data[f] = state[f] })
  data.events   = (data.events   || []).map((e) => ({ ...e, photos: [] }))
  data.profiles = (data.profiles || []).map((p) => ({ ...p, avatar: null }))
  return data
}

function friendlyError(code) {
  switch (code) {
    case 'auth/email-already-in-use':      return 'An account with this email already exists. Try signing in.'
    case 'auth/wrong-password':
    case 'auth/invalid-credential':        return 'Incorrect email or password.'
    case 'auth/user-not-found':            return 'No account found with this email.'
    case 'auth/weak-password':             return 'Password must be at least 6 characters.'
    case 'auth/invalid-email':             return 'Please enter a valid email address.'
    case 'auth/too-many-requests':         return 'Too many attempts. Please wait a moment and try again.'
    case 'auth/invalid-verification-code': return 'Incorrect code. Please check and try again.'
    case 'auth/invalid-phone-number':      return 'Invalid phone number. Include your country code (e.g. +1 for US).'
    case 'auth/missing-phone-number':      return 'Please enter a phone number.'
    case 'auth/quota-exceeded':            return 'SMS quota exceeded. Try another sign-in method.'
    case 'auth/popup-closed-by-user':      return ''
    default:                               return 'Something went wrong. Please try again.'
  }
}

/* ── Sync helpers ── */
async function loadOrUpload(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  if (snap.exists()) {
    useStore.setState(snap.data().storeData)
  } else {
    await setDoc(doc(db, 'users', uid), {
      storeData: extractSyncData(useStore.getState()),
      updatedAt: serverTimestamp(),
    })
  }
}

/* ── AuthGate ── */
export default function AuthGate({ children }) {
  const [user,    setUser]    = useState(undefined)
  const [skipped, setSkipped] = useState(() => !!localStorage.getItem(SKIP_KEY))
  const unsubSyncRef = useRef(null)

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubSyncRef.current) { unsubSyncRef.current(); unsubSyncRef.current = null }

      if (firebaseUser) {
        try { await loadOrUpload(firebaseUser.uid) } catch (e) { console.error('Firestore:', e) }

        useStore.setState({
          currentUser: {
            uid:         firebaseUser.uid,
            email:       firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL:    firebaseUser.photoURL,
          },
        })

        let timer = null
        unsubSyncRef.current = useStore.subscribe((state) => {
          clearTimeout(timer)
          timer = setTimeout(async () => {
            try {
              await setDoc(doc(db, 'users', firebaseUser.uid), {
                storeData: extractSyncData(state),
                updatedAt: serverTimestamp(),
              })
            } catch (e) { console.error('Sync:', e) }
          }, 3000)
        })
      } else {
        useStore.setState({ currentUser: null })
      }

      setUser(firebaseUser)
    })

    return () => { unsubAuth(); if (unsubSyncRef.current) unsubSyncRef.current() }
  }, [])

  if (user === undefined) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--navy)' }}>
        <div style={{ fontSize: 13, color: 'var(--text3)' }}>Loading…</div>
      </div>
    )
  }

  if (!user && !skipped) {
    return <SignInScreen onSkip={() => { localStorage.setItem(SKIP_KEY, '1'); setSkipped(true) }} />
  }

  return children
}

/* ══════════════════════════════════════════
   Sign-in screen — all providers
══════════════════════════════════════════ */
function SignInScreen({ onSkip }) {
  const [view,      setView]      = useState('choose')   // choose | email | phone | code | forgot
  const [emailMode, setEmailMode] = useState('signin')   // signin | signup
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [phone,     setPhone]     = useState('')
  const [code,      setCode]      = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [info,      setInfo]      = useState('')
  const [showPass,  setShowPass]  = useState(false)

  const recaptchaRef  = useRef(null)
  const confirmResult = useRef(null)

  const err = (e) => { setError(friendlyError(e.code)); setLoading(false) }
  const go  = (v) => { setError(''); setInfo(''); setView(v) }

  /* ── OAuth ── */
  const signInWith = async (provider) => {
    setLoading(true); setError('')
    try { await signInWithPopup(auth, provider) }
    catch (e) { err(e) }
  }

  /* ── Email ── */
  const handleEmail = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password) return
    if (emailMode === 'signup' && password !== confirm) { setError("Passwords don't match."); return }
    setLoading(true); setError('')
    try {
      if (emailMode === 'signup') await createUserWithEmailAndPassword(auth, email, password)
      else                        await signInWithEmailAndPassword(auth, email, password)
    } catch (e) { err(e) }
  }

  /* ── Forgot password ── */
  const handleForgot = async (e) => {
    e.preventDefault()
    if (!email.trim()) { setError('Enter your email above first.'); return }
    setLoading(true); setError('')
    try {
      await sendPasswordResetEmail(auth, email)
      setInfo('Reset link sent — check your inbox.')
      setLoading(false)
    } catch (e) { err(e) }
  }

  /* ── Phone ── */
  const initRecaptcha = () => {
    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' })
    }
  }

  const sendCode = async (e) => {
    e.preventDefault()
    if (!phone.trim()) return
    setLoading(true); setError('')
    initRecaptcha()
    try {
      confirmResult.current = await signInWithPhoneNumber(auth, phone, recaptchaRef.current)
      go('code')
    } catch (e) { err(e) }
    setLoading(false)
  }

  const verifyCode = async (e) => {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true); setError('')
    try { await confirmResult.current.confirm(code) }
    catch (e) { err(e) }
  }

  /* ── Layout helpers ── */
  const card = (content) => (
    <div style={{
      minHeight: '100vh', background: 'var(--navy)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '32px 20px',
    }}>
      <div style={{ marginBottom: 36, textAlign: 'center' }}>
        <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 42, color: 'var(--cream)', letterSpacing: -1, marginBottom: 4 }}>
          life<span style={{ color: 'var(--gold)' }}>map</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: 2.5, textTransform: 'uppercase' }}>
          Your life, organized
        </div>
      </div>

      <div style={{
        background: 'var(--navy3)', border: '1px solid var(--border2)',
        borderRadius: 20, padding: '28px 26px',
        width: '100%', maxWidth: 380,
        boxShadow: '0 24px 60px rgba(0,0,0,.45)',
      }}>
        {content}
      </div>

      <div id="recaptcha-container" />

      <button
        onClick={onSkip}
        style={{
          marginTop: 20, background: 'none', border: 'none',
          fontSize: 12, color: 'var(--text3)', cursor: 'pointer',
          fontFamily: 'DM Sans, sans-serif', transition: 'color .15s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text2)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text3)'}
      >
        Continue without an account →
      </button>

      <div style={{ marginTop: 16, fontSize: 11, color: 'var(--text3)', textAlign: 'center', maxWidth: 300, lineHeight: 1.7 }}>
        We never connect to your bank or third-party services.
      </div>
    </div>
  )

  /* ── Views ── */

  if (view === 'choose') return card(
    <>
      <div style={{ fontSize: 19, color: 'var(--cream)', fontWeight: 600, marginBottom: 6 }}>Welcome to Lifemap</div>
      <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.6, marginBottom: 24 }}>
        Sign in to sync your data across all your devices.
      </div>

      {/* Email CTA */}
      <button className="btn btn-primary" style={{ width: '100%', padding: '12px 0', fontSize: 14, marginBottom: 10 }} onClick={() => go('email')}>
        Continue with Email
      </button>

      <Divider />

      <OAuthBtn icon={<GoogleIcon />} label="Continue with Google" onClick={() => signInWith(googleProvider)} loading={loading} />
      <OAuthBtn icon={<YahooIcon  />} label="Continue with Yahoo"  onClick={() => signInWith(yahooProvider)}  loading={loading} style={{ marginTop: 8 }} />
      <OAuthBtn icon={<span style={{ fontSize: 16 }}>📱</span>} label="Continue with Phone" onClick={() => go('phone')} loading={false} style={{ marginTop: 8 }} />
    </>
  )

  if (view === 'email') return card(
    <>
      <BackBtn onClick={() => go('choose')} />
      <div style={{ fontSize: 18, color: 'var(--cream)', fontWeight: 600, marginBottom: 20 }}>
        {emailMode === 'signin' ? 'Sign in' : 'Create account'}
      </div>

      <form onSubmit={handleEmail} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input
          className="input" type="email" placeholder="Email address"
          value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus
        />
        <div style={{ position: 'relative' }}>
          <input
            className="input" type={showPass ? 'text' : 'password'} placeholder="Password"
            value={password} onChange={(e) => setPassword(e.target.value)} required
            style={{ paddingRight: 44 }}
          />
          <button type="button" onClick={() => setShowPass(v => !v)} style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 12,
          }}>{showPass ? 'Hide' : 'Show'}</button>
        </div>
        {emailMode === 'signup' && (
          <input
            className="input" type={showPass ? 'text' : 'password'} placeholder="Confirm password"
            value={confirm} onChange={(e) => setConfirm(e.target.value)} required
          />
        )}

        {error && <div style={{ fontSize: 12, color: 'var(--coral2)', marginTop: 2 }}>{error}</div>}

        <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '11px 0', fontSize: 14, marginTop: 4 }}>
          {loading ? '…' : emailMode === 'signin' ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
        <button
          onClick={() => { setEmailMode(m => m === 'signin' ? 'signup' : 'signin'); setError('') }}
          style={{ fontSize: 12, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          {emailMode === 'signin' ? 'New here? Create account' : 'Already have an account? Sign in'}
        </button>
        {emailMode === 'signin' && (
          <button onClick={() => go('forgot')} style={{ fontSize: 12, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            Forgot password?
          </button>
        )}
      </div>
    </>
  )

  if (view === 'forgot') return card(
    <>
      <BackBtn onClick={() => go('email')} />
      <div style={{ fontSize: 18, color: 'var(--cream)', fontWeight: 600, marginBottom: 8 }}>Reset password</div>
      <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20, lineHeight: 1.6 }}>
        Enter your email and we'll send a reset link.
      </div>
      <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input className="input" type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        {error && <div style={{ fontSize: 12, color: 'var(--coral2)' }}>{error}</div>}
        {info  && <div style={{ fontSize: 12, color: 'var(--sage2)' }}>{info}</div>}
        <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '11px 0', fontSize: 14 }}>
          {loading ? '…' : 'Send Reset Link'}
        </button>
      </form>
    </>
  )

  if (view === 'phone') return card(
    <>
      <BackBtn onClick={() => go('choose')} />
      <div style={{ fontSize: 18, color: 'var(--cream)', fontWeight: 600, marginBottom: 8 }}>Sign in with phone</div>
      <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20, lineHeight: 1.6 }}>
        We'll text you a verification code. Include your country code (e.g. +1 555 000 0000).
      </div>
      <form onSubmit={sendCode} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input className="input" type="tel" placeholder="+1 555 000 0000" value={phone} onChange={(e) => setPhone(e.target.value)} required autoFocus />
        {error && <div style={{ fontSize: 12, color: 'var(--coral2)' }}>{error}</div>}
        <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '11px 0', fontSize: 14 }}>
          {loading ? 'Sending…' : 'Send Code'}
        </button>
      </form>
    </>
  )

  if (view === 'code') return card(
    <>
      <BackBtn onClick={() => go('phone')} />
      <div style={{ fontSize: 18, color: 'var(--cream)', fontWeight: 600, marginBottom: 8 }}>Enter the code</div>
      <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20, lineHeight: 1.6 }}>
        We sent a 6-digit code to {phone}.
      </div>
      <form onSubmit={verifyCode} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input
          className="input" type="text" inputMode="numeric" placeholder="6-digit code"
          value={code} onChange={(e) => setCode(e.target.value)} required autoFocus
          style={{ letterSpacing: 4, fontSize: 20, textAlign: 'center' }}
        />
        {error && <div style={{ fontSize: 12, color: 'var(--coral2)' }}>{error}</div>}
        <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '11px 0', fontSize: 14 }}>
          {loading ? 'Verifying…' : 'Verify'}
        </button>
      </form>
      <button onClick={sendCode} style={{ marginTop: 12, fontSize: 12, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}>
        Resend code
      </button>
    </>
  )

  return null
}

/* ── Shared sub-components ── */
function BackBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{
      background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer',
      fontSize: 12, padding: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4,
      fontFamily: 'DM Sans, sans-serif', transition: 'color .12s',
    }}
    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text2)'}
    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text3)'}
    >← Back</button>
  )
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 12px' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      <span style={{ fontSize: 11, color: 'var(--text3)' }}>or</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  )
}

function OAuthBtn({ icon, label, onClick, loading, style }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        width: '100%', padding: '11px 16px',
        background: 'var(--navy4)', border: '1px solid var(--border2)',
        color: 'var(--text1)', borderRadius: 10,
        fontSize: 14, fontWeight: 500,
        cursor: loading ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', gap: 10,
        fontFamily: 'DM Sans, sans-serif',
        transition: 'background .15s, border-color .15s',
        opacity: loading ? 0.6 : 1,
        ...style,
      }}
      onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = 'var(--navy3)'; e.currentTarget.style.borderColor = 'var(--border)' } }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--navy4)'; e.currentTarget.style.borderColor = 'var(--border2)' }}
    >
      {icon}
      {label}
    </button>
  )
}

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <g fill="none" fillRule="evenodd">
        <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
        <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
      </g>
    </svg>
  )
}

function YahooIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <circle cx="16" cy="16" r="16" fill="#6001D2"/>
      <path d="M6 8h5.5l4.5 7 4.5-7H26l-7 10.5V28h-6V18.5z" fill="#fff"/>
    </svg>
  )
}
