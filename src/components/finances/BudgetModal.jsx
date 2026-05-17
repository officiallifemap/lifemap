import { useState } from 'react'
import useStore from '../../store/useStore'

export default function BudgetModal() {
  const activeModal      = useStore((s) => s.activeModal)
  const closeModal       = useStore((s) => s.closeModal)
  const totalBudget      = useStore((s) => s.totalBudget)
  const budgetCategories = useStore((s) => s.budgetCategories)
  const setTotalBudget   = useStore((s) => s.setTotalBudget)
  const setBudgetCategories = useStore((s) => s.setBudgetCategories)

  const [total, setTotal] = useState(String(totalBudget))
  const [cats,  setCats]  = useState(budgetCategories.map((c) => ({ ...c })))
  const [newCatName, setNewCatName]   = useState('')
  const [newCatBudget, setNewCatBudget] = useState('')

  if (activeModal !== 'budget') return null

  const updateCat = (i, field, val) => {
    setCats((prev) => prev.map((c, idx) => idx === i ? { ...c, [field]: val } : c))
  }

  const removeCat = (i) => setCats((prev) => prev.filter((_, idx) => idx !== i))

  const addCat = () => {
    if (!newCatName.trim()) return
    setCats((prev) => [...prev, { name: newCatName.trim(), budget: Number(newCatBudget) || 0 }])
    setNewCatName(''); setNewCatBudget('')
  }

  const handleSave = () => {
    setTotalBudget(total)
    setBudgetCategories(cats.map((c) => ({ ...c, budget: Number(c.budget) || 0 })))
    closeModal()
  }

  const categorySum = cats.reduce((s, c) => s + (Number(c.budget) || 0), 0)
  const diff        = Number(total) - categorySum

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target.classList.contains('modal-overlay')) closeModal() }}
    >
      <div className="modal" style={{ maxWidth: 500 }}>
        <div className="modal-title">Edit Budget</div>

        {/* Total */}
        <div className="form-row">
          <label className="label">Total monthly budget</label>
          <input
            className="input"
            type="number"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            autoFocus
          />
        </div>

        {/* Summary */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, padding: '10px 14px', background: 'var(--navy3)', borderRadius: 8, fontSize: 12 }}>
          <span style={{ color: 'var(--text2)' }}>Categories total: <span className="mono" style={{ color: 'var(--cream)' }}>${categorySum.toLocaleString()}</span></span>
          <span style={{ color: diff >= 0 ? 'var(--sage2)' : 'var(--coral2)' }}>
            {diff >= 0 ? `$${diff.toLocaleString()} unallocated` : `$${Math.abs(diff).toLocaleString()} over budget`}
          </span>
        </div>

        {/* Category rows */}
        <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Categories</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
          {cats.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                className="input"
                style={{ flex: 2 }}
                value={c.name}
                onChange={(e) => updateCat(i, 'name', e.target.value)}
                placeholder="Category name"
              />
              <input
                className="input"
                style={{ flex: 1, maxWidth: 110 }}
                type="number"
                value={c.budget}
                onChange={(e) => updateCat(i, 'budget', e.target.value)}
                placeholder="$0"
              />
              <button className="action-btn danger" onClick={() => removeCat(i)}>✕</button>
            </div>
          ))}
        </div>

        {/* Add category */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
          <input className="input" style={{ flex: 2 }} placeholder="New category name"
            value={newCatName} onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCat()} />
          <input className="input" style={{ flex: 1, maxWidth: 110 }} type="number" placeholder="Budget"
            value={newCatBudget} onChange={(e) => setNewCatBudget(e.target.value)} />
          <button className="btn btn-sm" onClick={addCat}>+ Add</button>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={closeModal}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save Budget</button>
        </div>
      </div>
    </div>
  )
}
