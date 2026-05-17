import { useState, useEffect } from 'react'
import useStore from '../../store/useStore'

const DEFAULT_EXPENSE_CATS = ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Health', 'Personal']
const HABIT_COLORS = ['gc-sage', 'gc-gold', 'gc-sky', 'gc-coral']
const HABIT_COLOR_LABELS = { 'gc-sage': 'Sage', 'gc-gold': 'Gold', 'gc-sky': 'Sky', 'gc-coral': 'Coral' }

export default function QuickAddModal() {
  const activeModal      = useStore((s) => s.activeModal)
  const modalData        = useStore((s) => s.modalData)
  const closeModal       = useStore((s) => s.closeModal)
  const budgetCategories = useStore((s) => s.budgetCategories)
  const addExpense       = useStore((s) => s.addExpense)
  const addTodo          = useStore((s) => s.addTodo)
  const addEvent         = useStore((s) => s.addEvent)
  const addGoal          = useStore((s) => s.addGoal)
  const addHabit         = useStore((s) => s.addHabit)
  const addNote          = useStore((s) => s.addNote)
  const addPerson        = useStore((s) => s.addPerson)
  const addAppointment   = useStore((s) => s.addAppointment)
  const events           = useStore((s) => s.events)

  /* Unified expense category list: defaults + user budget categories */
  const expenseCats = [...new Set([
    ...DEFAULT_EXPENSE_CATS,
    ...(budgetCategories || []).map((c) => c.name),
  ])]

  const [type,                setType]                = useState('expense')
  // Expense
  const [amount,              setAmount]              = useState('')
  const [category,            setCategory]            = useState(expenseCats[0])
  const [customCat,           setCustomCat]           = useState('')
  const [note,                setNote]                = useState('')
  const [recurring,           setRecurring]           = useState(false)
  const [recurringFreq,       setRecurringFreq]       = useState('monthly')
  const [recurringAnchorDate, setRecurringAnchorDate] = useState('')
  // Todo
  const [task,          setTask]          = useState('')
  const [dueDate,       setDueDate]       = useState('')
  const [priority,      setPriority]      = useState('med')
  const [todoNotes,     setTodoNotes]     = useState('')
  const [linkedEventId, setLinkedEventId] = useState('')
  // Event
  const [eventName,  setEventName]  = useState('')
  const [eventDate,  setEventDate]  = useState('')
  const [eventCost,  setEventCost]  = useState('')
  // Goal
  const [goalName,     setGoalName]     = useState('')
  const [goalCategory, setGoalCategory] = useState('other')
  const [goalTarget,   setGoalTarget]   = useState('')
  const [goalMonthly,  setGoalMonthly]  = useState('')
  // Habit
  const [habitName,  setHabitName]  = useState('')
  const [habitFreq,  setHabitFreq]  = useState('daily')
  const [habitColor, setHabitColor] = useState('gc-sage')
  // Note
  const [noteTitle, setNoteTitle] = useState('')
  const [noteBody,  setNoteBody]  = useState('')
  // Person
  const [personName,     setPersonName]     = useState('')
  const [personBirthday, setPersonBirthday] = useState('')
  const [personPhone,    setPersonPhone]    = useState('')
  const [personEmail,    setPersonEmail]    = useState('')
  // Appointment
  const [apptTitle,    setApptTitle]    = useState('')
  const [apptDate,     setApptDate]     = useState('')
  const [apptTime,     setApptTime]     = useState('')
  const [apptProvider, setApptProvider] = useState('')

  /* Pre-fill from modalData when modal opens */
  useEffect(() => {
    if (activeModal === 'quick-add') {
      const t = modalData?.type ?? 'expense'
      setType(t)
      const date = modalData?.date ?? ''
      if (t === 'expense') {
        if (modalData?.recurring) {
          setRecurring(true)
          setRecurringAnchorDate(date || new Date().toISOString().split('T')[0])
        }
      }
      if (t === 'todo')        setDueDate(date)
      if (t === 'event')       setEventDate(date)
      if (t === 'appointment') setApptDate(date)
    }
  }, [activeModal, modalData])

  if (activeModal !== 'quick-add') return null

  const reset = () => {
    setAmount(''); setNote(''); setCustomCat(''); setTask(''); setDueDate(''); setTodoNotes(''); setLinkedEventId('')
    setEventName(''); setEventDate(''); setEventCost('')
    setGoalName(''); setGoalCategory('other'); setGoalTarget(''); setGoalMonthly('')
    setRecurring(false); setRecurringFreq('monthly'); setRecurringAnchorDate('')
    setHabitName(''); setHabitFreq('daily'); setHabitColor('gc-sage')
    setNoteTitle(''); setNoteBody('')
    setPersonName(''); setPersonBirthday(''); setPersonPhone(''); setPersonEmail('')
    setApptTitle(''); setApptDate(''); setApptTime(''); setApptProvider('')
  }

  const handleSave = () => {
    if (type === 'expense' && amount) {
      const date    = modalData?.date ?? new Date().toISOString().split('T')[0]
      const finalCat = category === '__custom__' ? (customCat.trim() || 'Other') : category
      addExpense({
        amt: parseFloat(amount), cat: finalCat, note, date,
        recurring,
        recurringFreq:       recurring ? recurringFreq : 'monthly',
        recurringAnchorDate: recurring ? (recurringAnchorDate || date) : '',
      })
    } else if (type === 'todo' && task.trim()) {
      addTodo({
        text: task.trim(), due: dueDate, priority, notes: todoNotes,
        linkedEventId: linkedEventId ? Number(linkedEventId) : null,
      })
    } else if (type === 'event' && eventName.trim() && eventDate) {
      addEvent({ name: eventName.trim(), type: 'other', date: eventDate, cost: parseFloat(eventCost) || 0, cadence: 'Monthly' })
    } else if (type === 'goal' && goalName.trim() && goalTarget && goalMonthly) {
      addGoal({ name: goalName.trim(), category: goalCategory, target: goalTarget, monthly: goalMonthly, cadence: 'Monthly' })
    } else if (type === 'habit' && habitName.trim()) {
      addHabit({ name: habitName.trim(), frequency: habitFreq, color: habitColor })
    } else if (type === 'note' && (noteTitle.trim() || noteBody.trim())) {
      addNote({ title: noteTitle.trim(), body: noteBody.trim() })
    } else if (type === 'person' && personName.trim()) {
      addPerson({ name: personName.trim(), birthday: personBirthday, phone: personPhone, email: personEmail })
    } else if (type === 'appointment' && apptTitle.trim() && apptDate) {
      addAppointment({ title: apptTitle.trim(), date: apptDate, time: apptTime, provider: apptProvider })
    } else {
      return
    }
    reset()
    closeModal()
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target.classList.contains('modal-overlay')) { reset(); closeModal() } }}
    >
      <div className="modal">
        <div className="modal-title">Quick Add</div>

        <div className="form-row">
          <label className="label">What are you adding?</label>
          <select className="select" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="expense">Expense</option>
            <option value="todo">To-Do</option>
            <option value="event">Event</option>
            <option value="goal">Savings Goal</option>
            <option value="habit">Habit</option>
            <option value="note">Note</option>
            <option value="person">Person</option>
            <option value="appointment">Appointment</option>
          </select>
        </div>

        {/* ── Expense ── */}
        {type === 'expense' && (
          <>
            <div className="form-row">
              <label className="label">Amount</label>
              <input className="input" placeholder="$0.00" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="form-row">
              <label className="label">Category</label>
              <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
                {expenseCats.map((c) => <option key={c} value={c}>{c}</option>)}
                <option value="__custom__">Custom…</option>
              </select>
            </div>
            {category === '__custom__' && (
              <div className="form-row">
                <label className="label">Custom Category Name</label>
                <input
                  className="input"
                  placeholder="e.g. Pet Care, Subscriptions…"
                  value={customCat}
                  onChange={(e) => setCustomCat(e.target.value)}
                />
              </div>
            )}
            <div className="form-row">
              <label className="label">Note (optional)</label>
              <input className="input" placeholder="What was it?" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="form-row" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <label className="label" style={{ marginBottom: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)}
                  style={{ accentColor: 'var(--gold)', width: 15, height: 15, cursor: 'pointer' }} />
                Recurring charge
              </label>
            </div>
            {recurring && (
              <div style={{ background: 'var(--navy3)', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div className="form-row" style={{ flex: 1, marginBottom: 0 }}>
                    <label className="label">Frequency</label>
                    <select className="select" value={recurringFreq} onChange={(e) => setRecurringFreq(e.target.value)}>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Every 2 weeks</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div className="form-row" style={{ flex: 1, marginBottom: 0 }}>
                    <label className="label">Most recent date</label>
                    <input className="input" type="date"
                      value={recurringAnchorDate || (modalData?.date ?? new Date().toISOString().split('T')[0])}
                      onChange={(e) => setRecurringAnchorDate(e.target.value)} />
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                  Future occurrences will appear on your calendar automatically.
                </div>
              </div>
            )}
          </>
        )}

        {/* ── To-Do ── */}
        {type === 'todo' && (
          <>
            <div className="form-row">
              <label className="label">Task</label>
              <input className="input" placeholder="What needs to get done?" value={task} onChange={(e) => setTask(e.target.value)} />
            </div>
            <div className="form-row">
              <label className="label">Due Date</label>
              <input className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="form-row">
              <label className="label">Priority</label>
              <select className="select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="high">High</option>
                <option value="med">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="form-row">
              <label className="label">Link to Event (optional)</label>
              <select className="select" value={linkedEventId} onChange={(e) => setLinkedEventId(e.target.value)}>
                <option value="">— None —</option>
                {events.map((ev) => <option key={ev.id} value={String(ev.id)}>{ev.name}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label className="label">Notes (optional)</label>
              <textarea className="input" style={{ minHeight: 56, resize: 'vertical', fontFamily: 'inherit', fontSize: 13 }}
                placeholder="Any extra details…" value={todoNotes} onChange={(e) => setTodoNotes(e.target.value)} />
            </div>
          </>
        )}

        {/* ── Event ── */}
        {type === 'event' && (
          <>
            <div className="form-row">
              <label className="label">Event Name</label>
              <input className="input" placeholder="e.g. Road trip..." value={eventName} onChange={(e) => setEventName(e.target.value)} />
            </div>
            <div className="form-row">
              <label className="label">Date</label>
              <input className="input" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            </div>
            <div className="form-row">
              <label className="label">Expected Cost</label>
              <input className="input" placeholder="$0" type="number" value={eventCost} onChange={(e) => setEventCost(e.target.value)} />
            </div>
          </>
        )}

        {/* ── Goal ── */}
        {type === 'goal' && (
          <>
            <div className="form-row">
              <label className="label">Goal Name</label>
              <input className="input" placeholder="e.g. Emergency Fund, New Car..." value={goalName} onChange={(e) => setGoalName(e.target.value)} />
            </div>
            <div className="form-row">
              <label className="label">Category</label>
              <select className="select" value={goalCategory} onChange={(e) => setGoalCategory(e.target.value)}>
                <option value="emergency">Emergency</option>
                <option value="wedding">Wedding</option>
                <option value="travel">Travel</option>
                <option value="retirement">Retirement</option>
                <option value="home">Home</option>
                <option value="education">Education</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-row">
              <label className="label">Target Amount</label>
              <input className="input" placeholder="$0" type="number" min="1" value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} />
            </div>
            <div className="form-row">
              <label className="label">Monthly Contribution</label>
              <input className="input" placeholder="$0 / month" type="number" min="1" value={goalMonthly} onChange={(e) => setGoalMonthly(e.target.value)} />
            </div>
          </>
        )}

        {/* ── Habit ── */}
        {type === 'habit' && (
          <>
            <div className="form-row">
              <label className="label">Habit Name</label>
              <input className="input" placeholder="e.g. Morning Run, Read 30 mins..." value={habitName} onChange={(e) => setHabitName(e.target.value)} />
            </div>
            <div className="form-row">
              <label className="label">Frequency</label>
              <select className="select" value={habitFreq} onChange={(e) => setHabitFreq(e.target.value)}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div className="form-row">
              <label className="label">Color</label>
              <select className="select" value={habitColor} onChange={(e) => setHabitColor(e.target.value)}>
                {HABIT_COLORS.map((c) => <option key={c} value={c}>{HABIT_COLOR_LABELS[c]}</option>)}
              </select>
            </div>
          </>
        )}

        {/* ── Note ── */}
        {type === 'note' && (
          <>
            <div className="form-row">
              <label className="label">Title (optional)</label>
              <input className="input" placeholder="Note title…" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} />
            </div>
            <div className="form-row">
              <label className="label">Content</label>
              <textarea className="input" style={{ minHeight: 80, resize: 'vertical', fontFamily: 'inherit', fontSize: 13 }}
                placeholder="Write your note…" value={noteBody} onChange={(e) => setNoteBody(e.target.value)} />
            </div>
          </>
        )}

        {/* ── Person ── */}
        {type === 'person' && (
          <>
            <div className="form-row">
              <label className="label">Name</label>
              <input className="input" placeholder="Full name" value={personName} onChange={(e) => setPersonName(e.target.value)} />
            </div>
            <div className="form-row">
              <label className="label">Birthday (optional)</label>
              <input className="input" type="date" value={personBirthday} onChange={(e) => setPersonBirthday(e.target.value)} />
            </div>
            <div className="form-row">
              <label className="label">Phone (optional)</label>
              <input className="input" placeholder="555-0100" value={personPhone} onChange={(e) => setPersonPhone(e.target.value)} />
            </div>
            <div className="form-row">
              <label className="label">Email (optional)</label>
              <input className="input" placeholder="email@example.com" type="email" value={personEmail} onChange={(e) => setPersonEmail(e.target.value)} />
            </div>
          </>
        )}

        {/* ── Appointment ── */}
        {type === 'appointment' && (
          <>
            <div className="form-row">
              <label className="label">Title</label>
              <input className="input" placeholder="e.g. Dentist, Annual Physical..." value={apptTitle} onChange={(e) => setApptTitle(e.target.value)} />
            </div>
            <div className="form-row">
              <label className="label">Date</label>
              <input className="input" type="date" value={apptDate} onChange={(e) => setApptDate(e.target.value)} />
            </div>
            <div className="form-row">
              <label className="label">Time (optional)</label>
              <input className="input" type="time" value={apptTime} onChange={(e) => setApptTime(e.target.value)} />
            </div>
            <div className="form-row">
              <label className="label">Provider (optional)</label>
              <input className="input" placeholder="e.g. Dr. Smith" value={apptProvider} onChange={(e) => setApptProvider(e.target.value)} />
            </div>
          </>
        )}

        <div className="modal-footer">
          <button className="btn" onClick={() => { reset(); closeModal() }}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
}
