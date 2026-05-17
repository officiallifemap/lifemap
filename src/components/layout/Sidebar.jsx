import { useState, useEffect, useRef } from 'react'
import useStore from '../../store/useStore'
import CropModal from '../ui/CropModal'
import FeedbackModal from '../modals/FeedbackModal'

const KOFI_URL = 'https://ko-fi.com/lifemap'

const NAV_META = {
  dashboard: { icon: '⊞', label: 'Dashboard' },
  finances:  { icon: '◈', label: 'Finances'   },
  events:    { icon: '◇', label: 'Life Events' },
  goals:     { icon: '◎', label: 'Goals'       },
  calendar:  { icon: '▦', label: 'Calendar'    },
  todos:     { icon: '☑', label: 'To-Dos'      },
  habits:    { icon: '⟳', label: 'Habits'      },
  people:    { icon: '◯', label: 'People'      },
  wellness:  { icon: '♡', label: 'Wellness'    },
  notes:     { icon: '◻', label: 'Notes'       },
}

const DEFAULT_ORDER = Object.keys(NAV_META)

const PROFILE_COLORS = ['#d4a84c','#72b5a3','#70aeda','#eb8570','#a67fc7','#6ab87f','#e8885e','#5b9bd5']

function initials(name) {
  return (name || 'P').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

function ProfileAvatar({ profile, size = 34, fontSize = 13 }) {
  const style = {
    width: size, height: size, borderRadius: '50%',
    background: profile.color || '#d4a84c',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize, fontWeight: 700, color: '#fff', flexShrink: 0, overflow: 'hidden',
  }
  return (
    <div style={style}>
      {profile.avatar
        ? <img src={profile.avatar} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
        : initials(profile.name)
      }
    </div>
  )
}

/* ── Edit Profile Modal ── */
function EditProfileModal({ profile, onSave, onClose, canDelete, onDelete, onClear }) {
  const [name,          setName]          = useState(profile.name || '')
  const [color,         setColor]         = useState(profile.color || '#d4a84c')
  const [avatar,        setAvatar]        = useState(profile.avatar || null)
  const [cropSrc,       setCropSrc]       = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmClear,  setConfirmClear]  = useState(false)
  const fileRef = useRef(null)

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setCropSrc(ev.target.result)
    reader.readAsDataURL(file)
    e.target.value = ''  // reset so same file can be re-selected
  }

  if (cropSrc) {
    return (
      <CropModal
        src={cropSrc}
        shape="circle"
        onApply={(url) => { setAvatar(url); setCropSrc(null) }}
        onCancel={() => setCropSrc(null)}
      />
    )
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target.classList.contains('modal-overlay')) onClose() }}
    >
      <div className="modal" style={{ maxWidth: 400 }}>
        <div className="modal-title">Edit Profile</div>

        {/* Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div
            style={{ cursor: 'pointer', position: 'relative' }}
            onClick={() => fileRef.current?.click()}
            title="Click to upload photo"
          >
            <ProfileAvatar profile={{ name, color, avatar }} size={72} fontSize={24} />
            <div style={{
              position: 'absolute', bottom: 0, right: 0,
              background: 'var(--navy3)', border: '1px solid var(--border2)',
              borderRadius: '50%', width: 22, height: 22,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, color: 'var(--text2)',
            }}>📷</div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
          {avatar && (
            <button
              style={{ fontSize: 11, color: 'var(--coral2)', background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => setAvatar(null)}
            >Remove photo</button>
          )}
        </div>

        <div className="form-row">
          <label className="label">Name</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Profile name"
            autoFocus
          />
        </div>

        <div className="form-row">
          <label className="label">Color</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {PROFILE_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: c, border: color === c ? '2.5px solid var(--cream)' : '2px solid transparent',
                  cursor: 'pointer', outline: color === c ? `2px solid ${c}` : 'none', outlineOffset: 2,
                }}
              />
            ))}
          </div>
        </div>

        {/* Danger zone — clear always available, delete only when canDelete */}
        <div style={{ marginTop: 12, padding: '12px 14px', background: 'var(--navy4)', borderRadius: 10, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Danger zone</div>

          {/* Clear Profile */}
          {!confirmClear
            ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: canDelete ? 10 : 0 }}>
                <span style={{ fontSize: 13, color: 'var(--text2)' }}>Clear all data</span>
                <button
                  style={{ fontSize: 12, color: 'var(--gold)', background: 'none', border: '1px solid var(--gold)', borderRadius: 7, padding: '4px 12px', cursor: 'pointer' }}
                  onClick={() => { setConfirmClear(true); setConfirmDelete(false) }}
                >Clear Data</button>
              </div>
            )
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: canDelete ? 10 : 0 }}>
                <div style={{ fontSize: 13, color: 'var(--text1)' }}>Wipe all todos, events, goals, finances, habits, wellness, notes, and people from this profile? This cannot be undone.</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    style={{ flex: 1, background: 'var(--gold)', color: '#1a1f2e', border: 'none', borderRadius: 8, padding: '6px 0', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
                    onClick={onClear}
                  >Yes, Clear</button>
                  <button className="btn" style={{ flex: 1 }} onClick={() => setConfirmClear(false)}>Cancel</button>
                </div>
              </div>
            )
          }

          {/* Delete Profile — only shown when allowed */}
          {canDelete && (
            !confirmDelete
              ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                  <span style={{ fontSize: 13, color: 'var(--text2)' }}>Delete profile</span>
                  <button
                    style={{ fontSize: 12, color: 'var(--coral2)', background: 'none', border: '1px solid var(--coral2)', borderRadius: 7, padding: '4px 12px', cursor: 'pointer' }}
                    onClick={() => { setConfirmDelete(true); setConfirmClear(false) }}
                  >Delete Profile</button>
                </div>
              )
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                  <div style={{ fontSize: 13, color: 'var(--text1)' }}>Delete "{profile.name}"? All data will be lost. This cannot be undone.</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      style={{ flex: 1, background: 'var(--coral2)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 0', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
                      onClick={onDelete}
                    >Yes, Delete</button>
                    <button className="btn" style={{ flex: 1 }} onClick={() => setConfirmDelete(false)}>Cancel</button>
                  </div>
                </div>
              )
          )}
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={!name.trim()}
            onClick={() => onSave({ name: name.trim(), color, avatar })}
          >Save</button>
        </div>
      </div>
    </div>
  )
}

/* ── New Profile Modal ── */
function NewProfileModal({ onSave, onClose }) {
  const [name,  setName]  = useState('')
  const [color, setColor] = useState('#72b5a3')

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target.classList.contains('modal-overlay')) onClose() }}
    >
      <div className="modal" style={{ maxWidth: 380 }}>
        <div className="modal-title">New Profile</div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <ProfileAvatar profile={{ name: name || '?', color }} size={60} fontSize={20} />
        </div>
        <div className="form-row">
          <label className="label">Profile name</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Work, Personal, Side Project…"
            autoFocus
          />
        </div>
        <div className="form-row">
          <label className="label">Color</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {PROFILE_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: c, border: color === c ? '2.5px solid var(--cream)' : '2px solid transparent',
                  cursor: 'pointer', outline: color === c ? `2px solid ${c}` : 'none', outlineOffset: 2,
                }}
              />
            ))}
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)', padding: '10px 0', lineHeight: 1.5 }}>
          This creates a fresh profile with a clean slate — separate goals, todos, habits and everything else.
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={!name.trim()}
            onClick={() => onSave({ name: name.trim(), color })}
          >Create Profile</button>
        </div>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const currentPage         = useStore((s) => s.currentPage)
  const setPage             = useStore((s) => s.setPage)
  const navOrder            = useStore((s) => s.navOrder) ?? DEFAULT_ORDER
  const reorderNav          = useStore((s) => s.reorderNav)
  const darkMode            = useStore((s) => s.darkMode)
  const setDarkMode         = useStore((s) => s.setDarkMode)
  const profiles            = useStore((s) => s.profiles)        ?? []
  const activeProfileId     = useStore((s) => s.activeProfileId) ?? 'default'
  const updateProfile       = useStore((s) => s.updateProfile)
  const createProfile       = useStore((s) => s.createProfile)
  const switchProfile       = useStore((s) => s.switchProfile)
  const deleteProfile       = useStore((s) => s.deleteProfile)
  const clearProfile        = useStore((s) => s.clearProfile)
  const firstStepsDismissed = useStore((s) => s.firstStepsDismissed)
  const [confirmDelProfile, setConfirmDelProfile] = useState(null)

  const activeProfile    = profiles.find((p) => p.id === activeProfileId) ?? profiles[0] ?? { id: 'default', name: 'My Profile', color: '#d4a84c' }

  const [dragId,        setDragId]        = useState(null)
  const [dragOverId,    setDragOverId]    = useState(null)
  const [showMenu,      setShowMenu]      = useState(false)
  const [showEdit,      setShowEdit]      = useState(false)
  const [showNewProf,   setShowNewProf]   = useState(false)
  const [showFeedback,  setShowFeedback]  = useState(false)
  const menuRef = useRef(null)

  /* Close menu on outside click */
  useEffect(() => {
    if (!showMenu) return
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMenu])

  const handleDrop = (targetId) => {
    if (!dragId || dragId === targetId) { setDragId(null); setDragOverId(null); return }
    const from = navOrder.indexOf(dragId)
    const to   = navOrder.indexOf(targetId)
    const next = [...navOrder]
    next.splice(from, 1)
    next.splice(to, 0, dragId)
    reorderNav(next)
    setDragId(null); setDragOverId(null)
  }

  const orderedItems = navOrder
    .map((id) => NAV_META[id] ? { id, ...NAV_META[id] } : null)
    .filter(Boolean)

  return (
    <>
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-mark">life<span>map</span></div>
          <div className="logo-sub">Your life, organized</div>
        </div>

        {/* Profile indicator pill (only when multiple profiles) — just below logo */}
        {profiles.length > 1 && (
          <div style={{
            margin: '10px 12px 2px',
            padding: '5px 10px',
            background: `color-mix(in srgb, ${activeProfile.color} 15%, transparent)`,
            border: `1px solid color-mix(in srgb, ${activeProfile.color} 35%, transparent)`,
            borderRadius: 20,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: activeProfile.color, flexShrink: 0, display: 'inline-block' }} />
            <span style={{ fontSize: 11, color: activeProfile.color, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeProfile.name}
            </span>
          </div>
        )}

        <nav className="nav">
          {orderedItems.map((item) => (
            <div
              key={item.id}
              className={[
                'nav-item',
                currentPage === item.id ? 'active'        : '',
                dragId      === item.id ? 'nav-dragging'  : '',
                dragOverId  === item.id ? 'nav-drag-over' : '',
              ].filter(Boolean).join(' ')}
              onDragOver={(e) => { e.preventDefault(); setDragOverId(item.id) }}
              onDragLeave={() => setDragOverId(null)}
              onDrop={() => handleDrop(item.id)}
              onClick={() => setPage(item.id)}
            >
              <span
                className="nav-drag-handle"
                draggable
                onDragStart={(e) => { e.stopPropagation(); setDragId(item.id) }}
                onDragEnd={() => { setDragId(null); setDragOverId(null) }}
                onClick={(e) => e.stopPropagation()}
              >⠿</span>
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </div>
          ))}
        </nav>

        {/* ── Sidebar footer: support links + profile ── */}
        <div className="sidebar-footer">
          {/* Getting started link — only while onboarding card is alive */}
          {!firstStepsDismissed && (
            <button
              onClick={() => setPage('dashboard')}
              style={{
                width: '100%', textAlign: 'left', background: 'none', border: 'none',
                cursor: 'pointer', padding: '5px 10px 8px',
                fontSize: 11, color: 'var(--gold)', letterSpacing: 0.3,
                display: 'flex', alignItems: 'center', gap: 5,
                transition: 'opacity .15s', opacity: 0.8,
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
              onMouseLeave={(e) => e.currentTarget.style.opacity = 0.8}
              title="Return to the getting started checklist"
            >
              ✦ Getting started guide
            </button>
          )}

          {/* Ko-fi + Feedback row */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <a
              href={KOFI_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                padding: '7px 10px', borderRadius: 10,
                background: 'rgba(255,94,94,.08)',
                border: '1px solid rgba(255,94,94,.2)',
                color: '#ff9d9d', fontSize: 12, fontWeight: 500,
                textDecoration: 'none', cursor: 'pointer', transition: 'all .15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,94,94,.16)'; e.currentTarget.style.borderColor = 'rgba(255,94,94,.4)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,94,94,.08)'; e.currentTarget.style.borderColor = 'rgba(255,94,94,.2)' }}
              title="Support lifemap on Ko-fi"
            >
              ☕ Ko-fi
            </a>
            <button
              onClick={() => setShowFeedback(true)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                padding: '7px 10px', borderRadius: 10,
                background: 'rgba(112,174,218,.08)',
                border: '1px solid rgba(112,174,218,.2)',
                color: 'var(--sky2)', fontSize: 12, fontWeight: 500,
                cursor: 'pointer', transition: 'all .15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(112,174,218,.16)'; e.currentTarget.style.borderColor = 'rgba(112,174,218,.4)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(112,174,218,.08)'; e.currentTarget.style.borderColor = 'rgba(112,174,218,.2)' }}
              title="Send feedback, questions, or report a bug"
            >
              📬 Contact
            </button>
          </div>

          <button className="profile-btn" onClick={() => setShowMenu((v) => !v)}>
            <ProfileAvatar profile={activeProfile} size={34} fontSize={13} />
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <div style={{ fontSize: 13, color: 'var(--text1)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeProfile.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                {profiles.length > 1 ? `${profiles.length} profiles` : 'Free plan'}
              </div>
            </div>
            <span style={{ fontSize: 14, color: 'var(--text3)', flexShrink: 0 }}>⋯</span>
          </button>
        </div>
      </aside>

      {/* ── Profile popup menu ── */}
      {showMenu && (
        <div className="profile-menu" ref={menuRef}>
          {/* Header */}
          <div className="profile-menu-header">
            <ProfileAvatar profile={activeProfile} size={44} fontSize={16} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, color: 'var(--text1)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeProfile.name}
              </div>
              <button
                style={{ fontSize: 11, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 2 }}
                onClick={() => { setShowEdit(true); setShowMenu(false) }}
              >Edit Profile</button>
            </div>
          </div>

          {/* My Profiles */}
          <div className="profile-menu-section">
            <div className="profile-menu-label">My Profiles</div>
            {profiles.map((p) => (
              <button
                key={p.id}
                className={`profile-menu-item${p.id === activeProfileId ? ' active-profile' : ''}`}
                onClick={() => { if (p.id !== activeProfileId) { switchProfile(p.id); setShowMenu(false) } }}
              >
                <ProfileAvatar profile={p} size={24} fontSize={10} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                {p.id === activeProfileId && <span style={{ fontSize: 11, color: 'var(--gold)' }}>✓</span>}
              </button>
            ))}
            <button
              className="profile-menu-item"
              style={{ color: 'var(--text3)' }}
              onClick={() => { setShowNewProf(true); setShowMenu(false) }}
            >
              <span style={{ width: 24, height: 24, borderRadius: '50%', border: '1.5px dashed var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'var(--text3)', flexShrink: 0 }}>+</span>
              New Profile
            </button>
          </div>

          {/* Appearance */}
          <div className="profile-menu-section">
            <div className="profile-menu-label">Appearance</div>
            <button className="dark-mode-toggle" onClick={() => setDarkMode(!darkMode)}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14 }}>{darkMode ? '🌙' : '☀️'}</span>
                <span>{darkMode ? 'Dark Mode' : 'Light Mode'}</span>
              </span>
              <div className={`toggle-pill ${darkMode ? 'on' : 'off'}`}>
                <div className="toggle-knob" />
              </div>
            </button>
          </div>

          {/* Account */}
          <div className="profile-menu-section" style={{ paddingBottom: 6 }}>
            <div className="profile-menu-label">Account</div>
            <button className="profile-menu-item" style={{ color: 'var(--text3)' }} onClick={() => {}}>
              <span style={{ fontSize: 14 }}>🔑</span>
              Sign In / Sign Up
              <span style={{ fontSize: 10, color: 'var(--text3)', marginLeft: 'auto' }}>soon</span>
            </button>
            <button className="profile-menu-item" onClick={() => { setShowFeedback(true); setShowMenu(false) }}>
              <span style={{ fontSize: 14 }}>📬</span>
              Contact / Feedback
            </button>
            <a
              href={KOFI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="profile-menu-item"
              style={{ textDecoration: 'none', color: 'var(--text2)' }}
            >
              <span style={{ fontSize: 14 }}>☕</span>
              Support on Ko-fi
            </a>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {showEdit && (
        <EditProfileModal
          profile={activeProfile}
          canDelete={activeProfile.id !== 'default' && profiles.length > 1}
          onSave={(updates) => { updateProfile(activeProfileId, updates); setShowEdit(false) }}
          onDelete={() => { deleteProfile(activeProfileId); setShowEdit(false) }}
          onClear={() => { clearProfile(); setShowEdit(false) }}
          onClose={() => setShowEdit(false)}
        />
      )}
      {showNewProf && (
        <NewProfileModal
          onSave={(meta) => { createProfile(meta); setShowNewProf(false) }}
          onClose={() => setShowNewProf(false)}
        />
      )}
      {showFeedback && (
        <FeedbackModal onClose={() => setShowFeedback(false)} />
      )}
    </>
  )
}
