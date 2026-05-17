import { useState, useEffect, useRef } from 'react'
import { onAuthStateChanged, signInWithPopup } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider } from '../../firebase'
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
  // Strip large base64 blobs that would exceed Firestore's 1MB document limit
  data.events   = (data.events   || []).map((e) => ({ ...e, photos: [] }))
  data.profiles = (data.profiles || []).map((p) => ({ ...p, avatar: null }))
  return data
}

export default function AuthGate({ children }) {
  const [user,      setUser]      = useState(undefined) // undefined = still loading auth state
  const [skipped,   setSkipped]   = useState(() => !!localStorage.getItem(SKIP_KEY))
  const [signingIn, setSigningIn] = useState(false)
  const [error,     setError]     = useState('')
  const unsubSyncRef = useRef(null)

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      // Tear down previous sync subscription
      if (unsubSyncRef.current) { unsubSyncRef.current(); unsubSyncRef.current = null }

      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
          if (snap.exists()) {
            // Load cloud data — cloud is source of truth after first sign-in
            useStore.setState(snap.data().storeData)
          } else {
            // First sign-in: upload existing local data to the cloud
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              storeData:  extractSyncData(useStore.getState()),
              updatedAt:  serverTimestamp(),
            })
          }
        } catch (e) {
          console.error('Firestore load failed:', e)
        }

        // Expose Firebase user in store so Sidebar can read it
        useStore.setState({
          currentUser: {
            uid:         firebaseUser.uid,
            email:       firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL:    firebaseUser.photoURL,
          },
        })

        // Debounced write-back on every store change
        let timer = null
        unsubSyncRef.current = useStore.subscribe((state) => {
          clearTimeout(timer)
          timer = setTimeout(async () => {
            try {
              await setDoc(doc(db, 'users', firebaseUser.uid), {
                storeData: extractSyncData(state),
                updatedAt: serverTimestamp(),
              })
            } catch (e) {
              console.error('Sync write failed:', e)
            }
          }, 3000)
        })
      } else {
        useStore.setState({ currentUser: null })
      }

      setUser(firebaseUser)
      setSigningIn(false)
    })

    return () => {
      unsubAuth()
      if (unsubSyncRef.current) unsubSyncRef.current()
    }
  }, [])

  const handleSignIn = async () => {
    setSigningIn(true)
    setError('')
    try {
      await signInWithPopup(auth, googleProvider)
      // onAuthStateChanged fires next and handles data load
    } catch {
      setError('Sign-in failed. Please try again.')
      setSigningIn(false)
    }
  }

  const handleSkip = () => {
    localStorage.setItem(SKIP_KEY, '1')
    setSkipped(true)
  }

  if (user === undefined) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--navy)' }}>
        <div style={{ fontSize: 13, color: 'var(--text3)' }}>Loading…</div>
      </div>
    )
  }

  if (!user && !skipped) {
    return <SignInScreen onSignIn={handleSignIn} onSkip={handleSkip} signingIn={signingIn} error={error} />
  }

  return children
}

function SignInScreen({ onSignIn, onSkip, signingIn, error }) {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--navy)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '32px 20px',
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 44, textAlign: 'center' }}>
        <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 46, color: 'var(--cream)', letterSpacing: -1, marginBottom: 6 }}>
          life<span style={{ color: 'var(--gold)' }}>map</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)', letterSpacing: 2.5, textTransform: 'uppercase' }}>
          Your life, organized
        </div>
      </div>

      {/* Card */}
      <div style={{
        background: 'var(--navy3)', border: '1px solid var(--border2)',
        borderRadius: 20, padding: '32px 28px',
        width: '100%', maxWidth: 380, textAlign: 'center',
        boxShadow: '0 24px 60px rgba(0,0,0,.45)',
      }}>
        <div style={{ fontSize: 20, color: 'var(--cream)', fontWeight: 600, marginBottom: 8 }}>
          Sign in to sync your data
        </div>
        <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.65, marginBottom: 28 }}>
          Your goals, habits, finances, and everything else — available on every device, automatically.
        </div>

        <button
          onClick={onSignIn}
          disabled={signingIn}
          style={{
            width: '100%', padding: '13px 20px',
            background: '#fff', color: '#1f1f1f',
            border: 'none', borderRadius: 10,
            fontSize: 15, fontWeight: 600,
            cursor: signingIn ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            fontFamily: 'DM Sans, sans-serif',
            transition: 'opacity .15s, box-shadow .15s',
            opacity: signingIn ? 0.65 : 1,
            boxShadow: '0 2px 8px rgba(0,0,0,.18)',
          }}
          onMouseEnter={(e) => { if (!signingIn) e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.3)' }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.18)' }}
        >
          <GoogleIcon />
          {signingIn ? 'Signing in…' : 'Continue with Google'}
        </button>

        {error && (
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--coral2)' }}>{error}</div>
        )}

        <button
          onClick={onSkip}
          style={{
            marginTop: 18, background: 'none', border: 'none',
            fontSize: 12, color: 'var(--text3)', cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif', transition: 'color .15s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text2)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text3)'}
        >
          Continue without an account →
        </button>
      </div>

      <div style={{ marginTop: 28, fontSize: 11, color: 'var(--text3)', textAlign: 'center', maxWidth: 300, lineHeight: 1.7 }}>
        We never connect to your bank or third-party services.
        Only your Google account is used to save your data.
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" fillRule="evenodd">
        <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
        <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
      </g>
    </svg>
  )
}
