import { useState, useEffect } from 'react'
import useStore from '../../store/useStore'

export default function TodoModal() {
  const activeModal = useStore((s) => s.activeModal)
  const modalData   = useStore((s) => s.modalData)
  const closeModal  = useStore((s) => s.closeModal)
  const addTodo     = useStore((s) => s.addTodo)
  const updateTodo  = useStore((s) => s.updateTodo)
  const events      = useStore((s) => s.events)

  const [text,          setText]          = useState('')
  const [due,           setDue]           = useState('')
  const [priority,      setPriority]      = useState('med')
  const [notes,         setNotes]         = useState('')
  const [linkedEventId, setLinkedEventId] = useState('')

  const isEdit = !!modalData?.editId

  useEffect(() => {
    if (activeModal === 'todo') {
      setText(modalData?.text  ?? '')
      setDue(modalData?.due    ?? '')
      setPriority(modalData?.priority ?? 'med')
      setNotes(modalData?.notes ?? '')
      setLinkedEventId(modalData?.linkedEventId ? String(modalData.linkedEventId) : '')
    }
  }, [activeModal, modalData])

  if (activeModal !== 'todo') return null

  const reset = () => { setText(''); setDue(''); setPriority('med'); setNotes(''); setLinkedEventId('') }
  const handleClose = () => { reset(); closeModal() }

  const handleSave = () => {
    if (!text.trim()) return
    const payload = {
      text:          text.trim(),
      due,
      priority,
      notes,
      linkedEventId: linkedEventId ? Number(linkedEventId) : null,
    }
    if (isEdit) {
      updateTodo(modalData.editId, payload)
    } else {
      addTodo(payload)
    }
    reset()
    closeModal()
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) handleClose() }}>
      <div className="modal">
        <div className="modal-title">{isEdit ? 'Edit To-Do' : 'New To-Do'}</div>

        <div className="form-row">
          <label className="label">Task</label>
          <input className="input" placeholder="What needs to get done?" value={text}
            onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSave()} autoFocus />
        </div>
        <div className="form-row">
          <label className="label">Due Date</label>
          <input className="input" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
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
            {events.map((ev) => (
              <option key={ev.id} value={String(ev.id)}>{ev.name}</option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label className="label">Notes (optional)</label>
          <textarea className="input" style={{ minHeight: 64, resize: 'vertical', fontFamily: 'inherit', fontSize: 13 }}
            placeholder="Any extra details…" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>{isEdit ? 'Save Changes' : 'Add To-Do'}</button>
        </div>
      </div>
    </div>
  )
}
