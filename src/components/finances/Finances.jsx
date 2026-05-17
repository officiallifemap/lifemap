import { useState } from 'react'
import ProgressBar from '../ui/ProgressBar'
import useStore from '../../store/useStore'
import { deriveSavingsItems } from '../../utils/savings'


function barColor(pct) {
  if (pct > 90) return 'coral'
  if (pct > 70) return 'gold'
  return 'green'
}

function fmtDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function ordinal(n) {
  const s = ['th','st','nd','rd']
  const v = n % 100
  return n + (s[(v-20)%10] || s[v] || s[0])
}

/* ── Overview ── */
function Overview({ onClickIncome, onClickBudget }) {
  const goals            = useStore((s) => s.goals)
  const events           = useStore((s) => s.events)
  const expenses         = useStore((s) => s.expenses)
  const contributions    = useStore((s) => s.contributions)
  const incomeMode       = useStore((s) => s.incomeMode)
  const fixedIncome      = useStore((s) => s.fixedIncome)
  const incomeEntries    = useStore((s) => s.incomeEntries)
  const totalBudget      = useStore((s) => s.totalBudget)
  const budgetCategories = useStore((s) => s.budgetCategories)
  const recurringBills   = useStore((s) => s.recurringBills) ?? []
  const setFinancesTab   = useStore((s) => s.setFinancesTab)

  const [catOpen,     setCatOpen]     = useState(true)
  const [savingsOpen, setSavingsOpen] = useState(true)

  const thisMonth = new Date().toISOString().slice(0, 7)
  const today     = new Date().getDate()

  const monthlyIncome = incomeMode === 'fixed'
    ? fixedIncome
    : incomeEntries.filter((e) => e.date?.startsWith(thisMonth)).reduce((s, e) => s + e.amount, 0)

  const monthExpenses = expenses.filter((e) => e.date?.startsWith(thisMonth))
  const totalSpent    = monthExpenses.reduce((s, e) => s + e.amt, 0)

  /* Contributions this month reduce remaining discretionary budget */
  const thisMonthContribs = contributions
    .filter((c) => c.date?.startsWith(thisMonth))
    .reduce((s, c) => s + c.amount, 0)

  const remaining      = totalBudget - totalSpent - thisMonthContribs
  const remainingRaw   = totalBudget - totalSpent  // for % display

  /* Upcoming recurring bills this month (due day >= today) */
  const upcomingRecurring = recurringBills.filter((r) => r.dueDay >= today).reduce((s, r) => s + r.amt, 0)
  const remainingAfter    = remaining - upcomingRecurring

  /* Category spent = recurring bills attributed to category + logged expenses */
  const expByCategory = monthExpenses.reduce((acc, e) => {
    acc[e.cat] = (acc[e.cat] || 0) + e.amt
    return acc
  }, {})
  const recurringByCategory = recurringBills.reduce((acc, r) => {
    if (r.cat) acc[r.cat] = (acc[r.cat] || 0) + r.amt
    return acc
  }, {})
  const catSpent = (name) => (expByCategory[name] || 0) + (recurringByCategory[name] || 0)

  const savingsItems = deriveSavingsItems(goals, events)

  return (
    <>
      <div className="grid-4">
        <div className="card-accent" onClick={onClickIncome} title="Edit income">
          <div className="stat-label">Monthly Income</div>
          <div className="stat-value">${monthlyIncome.toLocaleString()}</div>
          <div className="stat-sub">{incomeMode === 'fixed' ? 'Fixed salary · click to edit' : 'Variable · click to log'}</div>
        </div>
        <div className="card-accent" onClick={onClickBudget} title="Edit budget">
          <div className="stat-label">Total Budgeted</div>
          <div className="stat-value">${totalBudget.toLocaleString()}</div>
          <div className="stat-sub">${(monthlyIncome - totalBudget).toLocaleString()} to savings / invest</div>
        </div>
        <div className="card-accent" onClick={() => setFinancesTab('expenses')} title="View expenses" style={{ cursor: 'pointer' }}>
          <div className="stat-label">Spent This Month</div>
          <div className="stat-value">${totalSpent.toLocaleString()}</div>
          <div className="stat-sub stat-up">Click to view expenses</div>
        </div>
        <div className="card-accent" style={{ cursor: 'default' }}>
          <div className="stat-label">Remaining</div>
          <div className="stat-value" style={{ color: remaining >= 0 ? 'var(--sage2)' : 'var(--coral2)' }}>
            ${Math.abs(remaining).toLocaleString()}
          </div>
          <div className="stat-sub">{totalBudget > 0 ? Math.round((remainingRaw / totalBudget) * 100) : 0}% of budget left</div>
          {thisMonthContribs > 0 && (
            <div className="remaining-after">
              −${thisMonthContribs.toLocaleString()} in savings contributions
            </div>
          )}
          {upcomingRecurring > 0 && (
            <div className="remaining-after">
              ~${remainingAfter.toLocaleString()} after upcoming bills
            </div>
          )}
        </div>
      </div>

      <div className="card-lg">
        {/* ── Monthly Spending section ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: catOpen ? 8 : 0 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>Budget Categories</div>
          <button className="collapse-btn" onClick={() => setCatOpen((v) => !v)} title={catOpen ? 'Collapse' : 'Expand'}>
            {catOpen ? '▲' : '▼'}
          </button>
        </div>

        {catOpen && (
          <>
            <div className="budget-section-label">Monthly Spending</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px 20px' }}>
              {budgetCategories.map((c) => {
                const spent = catSpent(c.name)
                const pct   = c.budget > 0 ? Math.min(100, Math.round((spent / c.budget) * 100)) : 0
                return (
                  <div key={c.name} style={{ marginBottom: 8 }}>
                    <div className="flex-between" style={{ marginBottom: 2 }}>
                      <span style={{ fontSize: 12, color: 'var(--text1)' }}>{c.name}</span>
                      <span className="mono" style={{ fontSize: 11, color: 'var(--text3)' }}>${spent.toLocaleString()} / ${c.budget.toLocaleString()}</span>
                    </div>
                    <ProgressBar pct={pct} color={barColor(pct)} />
                  </div>
                )
              })}
            </div>
          </>
        )}

        {savingsItems.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: catOpen ? 8 : 12, marginBottom: savingsOpen ? 0 : 0 }}>
              <div className="budget-section-label" style={{ margin: 0 }}>Savings &amp; Contributions</div>
              <button className="collapse-btn" onClick={() => setSavingsOpen((v) => !v)} title={savingsOpen ? 'Collapse' : 'Expand'}>
                {savingsOpen ? '▲' : '▼'}
              </button>
            </div>
            {savingsOpen && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px 20px', marginTop: 8 }}>
                {savingsItems.map((s) => {
                  const pct      = s.monthly > 0 ? Math.min(100, Math.round((s.saved / s.monthly) * 100)) : 0
                  const savColor = pct >= 100 ? 'green' : pct >= 50 ? 'gold' : 'coral'
                  return (
                    <div key={s.key} style={{ marginBottom: 8 }}>
                      <div className="flex-between" style={{ marginBottom: 2 }}>
                        <span style={{ fontSize: 12, color: 'var(--text1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '55%' }}>{s.name}</span>
                        <span className="mono" style={{ fontSize: 11, color: 'var(--text3)' }}>
                          ${s.saved.toLocaleString()} saved · ${s.monthly.toLocaleString()}{s.isEvent ? '/period' : '/mo'}
                        </span>
                      </div>
                      <ProgressBar pct={pct} color={savColor} />
                      {s.isEvent && (
                        <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{s.sub}</div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

/* ── Expense Log ── */
function ExpenseLog() {
  const expenses         = useStore((s) => s.expenses)
  const budgetCategories = useStore((s) => s.budgetCategories)
  const setModal         = useStore((s) => s.setModal)
  const deleteExpense    = useStore((s) => s.deleteExpense)
  const updateExpense    = useStore((s) => s.updateExpense)

  const [sortField,  setSortField]  = useState('date')
  const [sortDir,    setSortDir]    = useState('desc')
  const [filterCat,  setFilterCat]  = useState('All')
  const [editingId,  setEditingId]  = useState(null)
  const [editAmt,    setEditAmt]    = useState('')
  const [editNote,   setEditNote]   = useState('')
  const [editCat,    setEditCat]    = useState('')
  const [confirmDel, setConfirmDel] = useState(null)

  const allCats = ['All', ...new Set([
    ...budgetCategories.map((c) => c.name),
    ...expenses.map((e) => e.cat),
  ])]

  const catBudget  = Object.fromEntries(budgetCategories.map((c) => [c.name, c.budget]))
  const catTotals  = expenses.reduce((acc, e) => { acc[e.cat] = (acc[e.cat] || 0) + e.amt; return acc }, {})

  const toggleSort = (field) => {
    if (sortField === field) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }
  const arrow = (f) => sortField === f ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''

  const filtered = expenses.filter((e) => filterCat === 'All' || e.cat === filterCat)
  const sorted   = [...filtered].sort((a, b) => {
    let cmp = 0
    if (sortField === 'date') cmp = a.date.localeCompare(b.date)
    if (sortField === 'cat')  cmp = a.cat.localeCompare(b.cat)
    if (sortField === 'amt')  cmp = a.amt - b.amt
    return sortDir === 'asc' ? cmp : -cmp
  })

  const startEdit = (e) => { setEditingId(e.id); setEditAmt(String(e.amt)); setEditNote(e.note || ''); setEditCat(e.cat) }
  const saveEdit  = (id) => {
    updateExpense(id, { amt: parseFloat(editAmt) || 0, note: editNote, cat: editCat })
    setEditingId(null)
  }

  return (
    <div className="card-lg">
      <div className="section-title-row">
        <div className="section-title">Expense Log</div>
        <button className="btn btn-primary btn-sm" onClick={() => setModal('quick-add', { type: 'expense' })}>+ Add Expense</button>
      </div>

      {/* Filter chips */}
      <div className="filter-chips">
        {allCats.map((c) => (
          <button key={c} className={`filter-chip${filterCat === c ? ' active' : ''}`} onClick={() => setFilterCat(filterCat === c ? 'All' : c)}>
            {c}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="sort-controls">
        <span className="sort-label">Sort:</span>
        {['date', 'cat', 'amt'].map((f) => (
          <button key={f} className={`sort-btn${sortField === f ? ' active' : ''}`} onClick={() => toggleSort(f)}>
            {f === 'date' ? 'Date' : f === 'cat' ? 'Category' : 'Amount'}{arrow(f)}
          </button>
        ))}
      </div>

      {sorted.map((e) => {
        const budget   = catBudget[e.cat]
        const catTotal = catTotals[e.cat] || 0
        const usagePct = budget ? Math.round((catTotal / budget) * 100) : null

        if (editingId === e.id) {
          return (
            <div key={e.id} className="expense-row-editing">
              <input className="expense-edit-input" style={{ width: 80 }} type="number" value={editAmt}
                onChange={(ev) => setEditAmt(ev.target.value)} placeholder="Amount" />
              <input className="expense-edit-input" style={{ flex: 1 }} value={editNote}
                onChange={(ev) => setEditNote(ev.target.value)} placeholder="Note" />
              <select className="select" style={{ fontSize: 12, padding: '4px 8px' }} value={editCat} onChange={(ev) => setEditCat(ev.target.value)}>
                {allCats.filter((c) => c !== 'All').map((c) => <option key={c}>{c}</option>)}
              </select>
              <button className="action-btn" onClick={() => saveEdit(e.id)}>Save</button>
              <button className="action-btn" onClick={() => setEditingId(null)}>Cancel</button>
            </div>
          )
        }

        return (
          <div key={e.id}>
            <div className="expense-row">
              <div>
                <div style={{ fontSize: 13, color: 'var(--text1)', fontWeight: 600 }}>{e.note || 'Expense'}</div>
                <div className="expense-cat">{e.cat} · {fmtDate(e.date)}</div>
                {usagePct !== null && (
                  <div className="expense-budget-line">
                    ${catTotal.toLocaleString()} of ${budget.toLocaleString()} budget used ({usagePct}%)
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="expense-amt mono">-${e.amt}</div>
                <div className="action-btns">
                  <button className="action-btn" onClick={() => startEdit(e)}>Edit</button>
                  <button className="action-btn danger" onClick={() => setConfirmDel(e.id)}>Delete</button>
                </div>
              </div>
            </div>
            {confirmDel === e.id && (
              <div className="delete-confirm">
                <span>Delete this expense?</span>
                <button className="btn-confirm" onClick={() => { deleteExpense(e.id); setConfirmDel(null) }}>Yes</button>
                <button className="btn-cancel"  onClick={() => setConfirmDel(null)}>Cancel</button>
              </div>
            )}
          </div>
        )
      })}

      {sorted.length === 0 && <div className="empty-state">No expenses{filterCat !== 'All' ? ` in ${filterCat}` : ''} yet.</div>}
    </div>
  )
}

const FREQ_LABEL = { weekly: 'Weekly', biweekly: 'Every 2 weeks', monthly: 'Monthly', yearly: 'Yearly' }

/* ── Recurring ── */
function Recurring() {
  const totalBudget         = useStore((s) => s.totalBudget)
  const incomeMode          = useStore((s) => s.incomeMode)
  const fixedIncome         = useStore((s) => s.fixedIncome)
  const incomeEntries       = useStore((s) => s.incomeEntries)
  const expenses            = useStore((s) => s.expenses)
  const budgetCategories    = useStore((s) => s.budgetCategories)
  const recurringBills      = useStore((s) => s.recurringBills) ?? []
  const deleteExpense       = useStore((s) => s.deleteExpense)
  const updateExpense       = useStore((s) => s.updateExpense)
  const addRecurringBill    = useStore((s) => s.addRecurringBill)
  const updateRecurringBill = useStore((s) => s.updateRecurringBill)
  const deleteRecurringBill = useStore((s) => s.deleteRecurringBill)
  const setModal            = useStore((s) => s.setModal)

  const [confirmDel,   setConfirmDel]   = useState(null)
  const [showAdd,      setShowAdd]      = useState(false)
  const [newName,      setNewName]      = useState('')
  const [newAmt,       setNewAmt]       = useState('')
  const [newDay,       setNewDay]       = useState('1')
  const [newCat,       setNewCat]       = useState('')
  // Edit bill
  const [editBillId,   setEditBillId]   = useState(null)
  const [editBillName, setEditBillName] = useState('')
  const [editBillAmt,  setEditBillAmt]  = useState('')
  const [editBillDay,  setEditBillDay]  = useState('')
  const [editBillCat,  setEditBillCat]  = useState('')
  // Edit user recurring expense
  const [editExpId,    setEditExpId]    = useState(null)
  const [editExpAmt,   setEditExpAmt]   = useState('')
  const [editExpNote,  setEditExpNote]  = useState('')

  const thisMonth     = new Date().toISOString().slice(0, 7)
  const monthlyIncome = incomeMode === 'fixed'
    ? fixedIncome
    : incomeEntries.filter((e) => e.date?.startsWith(thisMonth)).reduce((s, e) => s + e.amount, 0)

  const userRecurring = expenses.filter((e) => e.recurring)

  const staticTotal  = recurringBills.reduce((s, r) => s + r.amt, 0)
  const dynamicTotal = userRecurring.reduce((s, e) => s + e.amt, 0)
  const total        = staticTotal + dynamicTotal

  const allBudgetCats = budgetCategories.map((c) => c.name)
  const catOptions    = [...new Set(['Housing','Subscriptions','Health','Food & Dining','Transportation','Shopping','Entertainment', ...allBudgetCats])]

  const handleAddBill = () => {
    if (!newName.trim() || !newAmt) return
    addRecurringBill({ name: newName.trim(), amt: Number(newAmt), dueDay: Number(newDay), cat: newCat || '' })
    setNewName(''); setNewAmt(''); setNewDay('1'); setNewCat(''); setShowAdd(false)
  }

  const startEditBill = (r) => {
    setEditBillId(r.id); setEditBillName(r.name); setEditBillAmt(String(r.amt))
    setEditBillDay(String(r.dueDay)); setEditBillCat(r.cat || '')
  }
  const saveEditBill = () => {
    updateRecurringBill(editBillId, {
      name: editBillName.trim(), amt: Number(editBillAmt),
      dueDay: Number(editBillDay), cat: editBillCat,
    })
    setEditBillId(null)
  }

  const startEditExp = (e) => { setEditExpId(e.id); setEditExpAmt(String(e.amt)); setEditExpNote(e.note || '') }
  const saveEditExp  = () => {
    updateExpense(editExpId, { amt: Number(editExpAmt), note: editExpNote })
    setEditExpId(null)
  }

  const budgetPct = totalBudget > 0 ? Math.round((total / totalBudget) * 100) : 0
  const incomePct = monthlyIncome > 0 ? Math.round((total / monthlyIncome) * 100) : 0
  const isEmpty   = recurringBills.length === 0 && userRecurring.length === 0

  return (
    <div className="card-lg">
      <div className="section-title-row" style={{ marginBottom: 16 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>Recurring Expenses</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-sm" style={{ fontSize: 11 }} onClick={() => setShowAdd((v) => !v)}>
            {showAdd ? 'Cancel' : '+ Fixed Bill'}
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setModal('quick-add', { type: 'expense', recurring: true })}
          >+ Add Recurring</button>
        </div>
      </div>

      {isEmpty && !showAdd && (
        <div className="empty-state" style={{ marginBottom: 16, padding: '14px 0' }}>
          No recurring charges yet. Add fixed bills (rent, subscriptions) or click "+ Add Recurring" for variable repeating expenses.
        </div>
      )}

      {/* Fixed bills (recurringBills store) */}
      {recurringBills.length > 0 && (
        <>
          <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Fixed Bills</div>
          {recurringBills.map((r) => (
            <div key={r.id}>
              {editBillId === r.id ? (
                <div className="expense-row-editing" style={{ flexWrap: 'wrap', gap: 6 }}>
                  <input className="expense-edit-input" style={{ flex: 2, minWidth: 100 }} value={editBillName}
                    onChange={(e) => setEditBillName(e.target.value)} placeholder="Name" />
                  <input className="expense-edit-input" style={{ width: 80 }} type="number" value={editBillAmt}
                    onChange={(e) => setEditBillAmt(e.target.value)} placeholder="Amount" />
                  <input className="expense-edit-input" style={{ width: 56 }} type="number" min="1" max="31"
                    value={editBillDay} onChange={(e) => setEditBillDay(e.target.value)} placeholder="Day" title="Due day of month" />
                  <select className="select" style={{ fontSize: 12, padding: '4px 8px' }} value={editBillCat} onChange={(e) => setEditBillCat(e.target.value)}>
                    <option value="">No category</option>
                    {catOptions.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <button className="action-btn" onClick={saveEditBill}>Save</button>
                  <button className="action-btn" onClick={() => setEditBillId(null)}>Cancel</button>
                </div>
              ) : (
                <div className="expense-row">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: 'var(--text1)', fontWeight: 600 }}>{r.name}</div>
                    <div className="expense-cat">
                      Due {ordinal(r.dueDay)} · Monthly{r.cat ? ` · ${r.cat}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="expense-amt">${r.amt.toLocaleString()}</div>
                    <div className="action-btns">
                      <button className="action-btn" onClick={() => startEditBill(r)}>Edit</button>
                      <button className="action-btn danger" style={{ fontSize: 10 }} onClick={() => setConfirmDel(`bill-${r.id}`)}>✕</button>
                    </div>
                  </div>
                </div>
              )}
              {confirmDel === `bill-${r.id}` && (
                <div className="delete-confirm">
                  <span>Remove "{r.name}"?</span>
                  <button className="btn-confirm" onClick={() => { deleteRecurringBill(r.id); setConfirmDel(null) }}>Yes</button>
                  <button className="btn-cancel" onClick={() => setConfirmDel(null)}>Cancel</button>
                </div>
              )}
            </div>
          ))}
          {userRecurring.length > 0 && <div className="divider" />}
        </>
      )}

      {/* User-added recurring charges */}
      {userRecurring.length > 0 && (
        <>
          <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Recurring Charges</div>
          {userRecurring.map((e) => (
            <div key={e.id}>
              {editExpId === e.id ? (
                <div className="expense-row-editing">
                  <input className="expense-edit-input" style={{ flex: 1 }} value={editExpNote}
                    onChange={(ev) => setEditExpNote(ev.target.value)} placeholder="Note" />
                  <input className="expense-edit-input" style={{ width: 80 }} type="number" value={editExpAmt}
                    onChange={(ev) => setEditExpAmt(ev.target.value)} placeholder="Amount" />
                  <button className="action-btn" onClick={saveEditExp}>Save</button>
                  <button className="action-btn" onClick={() => setEditExpId(null)}>Cancel</button>
                </div>
              ) : (
                <div className="expense-row">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: 'var(--text1)', fontWeight: 600 }}>{e.note || e.cat}</div>
                    <div className="expense-cat">{e.cat} · {FREQ_LABEL[e.recurringFreq] || 'Monthly'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="expense-amt">${e.amt.toLocaleString()}</div>
                    <div className="action-btns">
                      <button className="action-btn" onClick={() => startEditExp(e)}>Edit</button>
                      <button className="action-btn danger" style={{ fontSize: 10 }} onClick={() => setConfirmDel(e.id)}>✕</button>
                    </div>
                  </div>
                </div>
              )}
              {confirmDel === e.id && (
                <div className="delete-confirm">
                  <span>Remove "{e.note || e.cat}"?</span>
                  <button className="btn-confirm" onClick={() => { deleteExpense(e.id); setConfirmDel(null) }}>Yes</button>
                  <button className="btn-cancel" onClick={() => setConfirmDel(null)}>Cancel</button>
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {/* Add fixed bill form */}
      {showAdd && (
        <div style={{ background: 'var(--navy3)', borderRadius: 10, padding: '12px 14px', marginTop: 10 }}>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10, fontWeight: 600 }}>New Fixed Bill</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <input className="input" style={{ flex: 2, minWidth: 100, fontSize: 12, padding: '6px 10px' }} placeholder="Name (e.g. Rent)" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <input className="input" style={{ flex: 1, minWidth: 80, fontSize: 12, padding: '6px 10px' }} type="number" placeholder="Amount" value={newAmt} onChange={(e) => setNewAmt(e.target.value)} />
            <input className="input" style={{ width: 56, fontSize: 12, padding: '6px 10px' }} type="number" min="1" max="31" placeholder="Day" title="Due day of month" value={newDay} onChange={(e) => setNewDay(e.target.value)} />
            <select className="select" style={{ fontSize: 12, padding: '6px 10px' }} value={newCat} onChange={(e) => setNewCat(e.target.value)}>
              <option value="">No category</option>
              {catOptions.map((c) => <option key={c}>{c}</option>)}
            </select>
            <button className="btn btn-primary btn-sm" onClick={handleAddBill}>Add</button>
          </div>
        </div>
      )}

      <div className="divider" />
      <div className="flex-between" style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: 'var(--text2)' }}>Total monthly recurring</span>
        <span className="mono" style={{ color: 'var(--cream)', fontSize: 16 }}>${total.toLocaleString()}</span>
      </div>
      {(totalBudget > 0 || monthlyIncome > 0) && (
        <div style={{ background: 'var(--navy3)', borderRadius: 10, padding: '12px 16px' }}>
          <div className="flex-between" style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>
              Recurring consumes <strong style={{ color: 'var(--coral2)' }}>{budgetPct}%</strong> of your ${totalBudget.toLocaleString()} budget
            </span>
            <span className="mono text-sm" style={{ color: 'var(--coral2)' }}>{budgetPct}%</span>
          </div>
          <div className="recurring-pct-bar">
            <div className="recurring-pct-fill" style={{ width: `${Math.min(100, budgetPct)}%` }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
            Also {incomePct}% of take-home income (${monthlyIncome.toLocaleString()}/mo)
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Net Worth ── */
function NetWorth() {
  const assets       = useStore((s) => s.assets) ?? []
  const debts        = useStore((s) => s.debts)  ?? []
  const addAsset     = useStore((s) => s.addAsset)
  const updateAsset  = useStore((s) => s.updateAsset)
  const deleteAsset  = useStore((s) => s.deleteAsset)
  const addDebt      = useStore((s) => s.addDebt)
  const updateDebt   = useStore((s) => s.updateDebt)
  const deleteDebt   = useStore((s) => s.deleteDebt)

  const [confirmDel,    setConfirmDel]    = useState(null)
  const [showAddAsset,  setShowAddAsset]  = useState(false)
  const [showAddDebt,   setShowAddDebt]   = useState(false)
  const [newAssetName,  setNewAssetName]  = useState('')
  const [newAssetAmt,   setNewAssetAmt]   = useState('')
  const [newDebtName,   setNewDebtName]   = useState('')
  const [newDebtAmt,    setNewDebtAmt]    = useState('')
  // Edit
  const [editAssetId,   setEditAssetId]   = useState(null)
  const [editAssetName, setEditAssetName] = useState('')
  const [editAssetAmt,  setEditAssetAmt]  = useState('')
  const [editDebtId,    setEditDebtId]    = useState(null)
  const [editDebtName,  setEditDebtName]  = useState('')
  const [editDebtAmt,   setEditDebtAmt]   = useState('')

  const totalAssets = assets.reduce((s, a) => s + a.amt, 0)
  const totalDebts  = debts.reduce((s, d) => s + d.amt, 0)
  const netWorth    = totalAssets - totalDebts
  const total       = totalAssets + totalDebts
  const assetPct    = total > 0 ? Math.round((totalAssets / total) * 100) : 50

  const handleAddAsset = () => {
    if (!newAssetName.trim() || !newAssetAmt) return
    addAsset({ name: newAssetName.trim(), amt: Number(newAssetAmt) })
    setNewAssetName(''); setNewAssetAmt(''); setShowAddAsset(false)
  }
  const handleAddDebt = () => {
    if (!newDebtName.trim() || !newDebtAmt) return
    addDebt({ name: newDebtName.trim(), amt: Number(newDebtAmt) })
    setNewDebtName(''); setNewDebtAmt(''); setShowAddDebt(false)
  }
  const startEditAsset = (a) => { setEditAssetId(a.id); setEditAssetName(a.name); setEditAssetAmt(String(a.amt)) }
  const saveEditAsset  = () => { updateAsset(editAssetId, { name: editAssetName.trim(), amt: Number(editAssetAmt) }); setEditAssetId(null) }
  const startEditDebt  = (d) => { setEditDebtId(d.id); setEditDebtName(d.name); setEditDebtAmt(String(d.amt)) }
  const saveEditDebt   = () => { updateDebt(editDebtId, { name: editDebtName.trim(), amt: Number(editDebtAmt) }); setEditDebtId(null) }

  return (
    <>
      <div className="grid-2">
        {/* Assets */}
        <div className="card-lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="section-title" style={{ color: 'var(--sage2)', marginBottom: 0 }}>Assets</div>
            <button className="btn btn-sm" style={{ fontSize: 11 }} onClick={() => setShowAddAsset((v) => !v)}>{showAddAsset ? 'Cancel' : '+ Add'}</button>
          </div>
          {assets.length === 0 && !showAddAsset && <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic', marginBottom: 8 }}>No assets yet.</div>}
          {assets.map((a) => (
            <div key={a.id}>
              {editAssetId === a.id ? (
                <div className="expense-row-editing">
                  <input className="expense-edit-input" style={{ flex: 2 }} value={editAssetName} onChange={(e) => setEditAssetName(e.target.value)} placeholder="Name" />
                  <input className="expense-edit-input" style={{ width: 100 }} type="number" value={editAssetAmt} onChange={(e) => setEditAssetAmt(e.target.value)} placeholder="Amount" />
                  <button className="action-btn" onClick={saveEditAsset}>Save</button>
                  <button className="action-btn" onClick={() => setEditAssetId(null)}>Cancel</button>
                </div>
              ) : (
                <div className="expense-row">
                  <span style={{ fontSize: 13, flex: 1 }}>{a.name}</span>
                  <span className="expense-amt mono">${a.amt.toLocaleString()}</span>
                  <div className="action-btns" style={{ marginLeft: 8 }}>
                    <button className="action-btn" onClick={() => startEditAsset(a)}>Edit</button>
                    <button className="action-btn danger" style={{ fontSize: 10 }} onClick={() => setConfirmDel(`asset-${a.id}`)}>✕</button>
                  </div>
                </div>
              )}
              {confirmDel === `asset-${a.id}` && (
                <div className="delete-confirm">
                  <span>Remove "{a.name}"?</span>
                  <button className="btn-confirm" onClick={() => { deleteAsset(a.id); setConfirmDel(null) }}>Yes</button>
                  <button className="btn-cancel" onClick={() => setConfirmDel(null)}>Cancel</button>
                </div>
              )}
            </div>
          ))}
          {showAddAsset && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <input className="input" style={{ flex: 2, fontSize: 12, padding: '6px 10px' }} placeholder="Account name" value={newAssetName} onChange={(e) => setNewAssetName(e.target.value)} />
              <input className="input" style={{ flex: 1, fontSize: 12, padding: '6px 10px' }} type="number" placeholder="Amount" value={newAssetAmt} onChange={(e) => setNewAssetAmt(e.target.value)} />
              <button className="btn btn-primary btn-sm" onClick={handleAddAsset}>Add</button>
            </div>
          )}
          {assets.length > 0 && <><div className="divider" /><div className="flex-between"><span style={{ color: 'var(--text2)', fontSize: 13 }}>Total Assets</span><span className="mono" style={{ color: 'var(--sage2)', fontSize: 16 }}>${totalAssets.toLocaleString()}</span></div></>}
        </div>

        {/* Liabilities */}
        <div className="card-lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="section-title" style={{ color: 'var(--coral2)', marginBottom: 0 }}>Liabilities</div>
            <button className="btn btn-sm" style={{ fontSize: 11 }} onClick={() => setShowAddDebt((v) => !v)}>{showAddDebt ? 'Cancel' : '+ Add'}</button>
          </div>
          {debts.length === 0 && !showAddDebt && <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic', marginBottom: 8 }}>No liabilities yet.</div>}
          {debts.map((d) => (
            <div key={d.id}>
              {editDebtId === d.id ? (
                <div className="expense-row-editing">
                  <input className="expense-edit-input" style={{ flex: 2 }} value={editDebtName} onChange={(e) => setEditDebtName(e.target.value)} placeholder="Name" />
                  <input className="expense-edit-input" style={{ width: 100 }} type="number" value={editDebtAmt} onChange={(e) => setEditDebtAmt(e.target.value)} placeholder="Amount" />
                  <button className="action-btn" onClick={saveEditDebt}>Save</button>
                  <button className="action-btn" onClick={() => setEditDebtId(null)}>Cancel</button>
                </div>
              ) : (
                <div className="expense-row">
                  <span style={{ fontSize: 13, flex: 1 }}>{d.name}</span>
                  <span className="expense-amt mono">${d.amt.toLocaleString()}</span>
                  <div className="action-btns" style={{ marginLeft: 8 }}>
                    <button className="action-btn" onClick={() => startEditDebt(d)}>Edit</button>
                    <button className="action-btn danger" style={{ fontSize: 10 }} onClick={() => setConfirmDel(`debt-${d.id}`)}>✕</button>
                  </div>
                </div>
              )}
              {confirmDel === `debt-${d.id}` && (
                <div className="delete-confirm">
                  <span>Remove "{d.name}"?</span>
                  <button className="btn-confirm" onClick={() => { deleteDebt(d.id); setConfirmDel(null) }}>Yes</button>
                  <button className="btn-cancel" onClick={() => setConfirmDel(null)}>Cancel</button>
                </div>
              )}
            </div>
          ))}
          {showAddDebt && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <input className="input" style={{ flex: 2, fontSize: 12, padding: '6px 10px' }} placeholder="Debt name" value={newDebtName} onChange={(e) => setNewDebtName(e.target.value)} />
              <input className="input" style={{ flex: 1, fontSize: 12, padding: '6px 10px' }} type="number" placeholder="Amount" value={newDebtAmt} onChange={(e) => setNewDebtAmt(e.target.value)} />
              <button className="btn btn-primary btn-sm" onClick={handleAddDebt}>Add</button>
            </div>
          )}
          {debts.length > 0 && <><div className="divider" /><div className="flex-between"><span style={{ color: 'var(--text2)', fontSize: 13 }}>Total Debts</span><span className="mono" style={{ color: 'var(--coral2)', fontSize: 16 }}>${totalDebts.toLocaleString()}</span></div></>}
        </div>
      </div>

      {(assets.length > 0 || debts.length > 0) && (
        <div className="card-lg">
          <div className="flex-between" style={{ marginBottom: 12 }}>
            <div className="section-title">Net Worth</div>
            <div className="mono" style={{ fontSize: 24, color: netWorth >= 0 ? 'var(--cream)' : 'var(--coral2)' }}>${netWorth.toLocaleString()}</div>
          </div>
          <div className="net-worth-bar">
            <div className="nw-assets" style={{ width: `${assetPct}%` }}>Assets {assetPct}%</div>
            <div className="nw-debts"  style={{ width: `${100 - assetPct}%` }}>Debts {100 - assetPct}%</div>
          </div>
          <div className="flex-between mt8">
            <span className="text-xs text-hint">Assets: ${totalAssets.toLocaleString()}</span>
            <span className="text-xs text-hint">Debts: ${totalDebts.toLocaleString()}</span>
          </div>
        </div>
      )}
    </>
  )
}

/* ── Savings Log ── */
function SavingsLog() {
  const contributions      = useStore((s) => s.contributions)
  const goals              = useStore((s) => s.goals)
  const events             = useStore((s) => s.events)
  const deleteContribution = useStore((s) => s.deleteContribution)
  const setModal           = useStore((s) => s.setModal)

  const [confirmDel,   setConfirmDel]   = useState(null)
  const [filterTarget, setFilterTarget] = useState('All')
  const [sortDir,      setSortDir]      = useState('desc')

  const allTargets = [
    'All',
    ...goals.map((g) => g.name),
    ...events.map((e) => e.name),
  ]

  const filtered = contributions.filter((c) =>
    filterTarget === 'All' || c.targetName === filterTarget
  )
  const sorted = [...filtered].sort((a, b) =>
    sortDir === 'desc'
      ? b.date.localeCompare(a.date) || b.id - a.id
      : a.date.localeCompare(b.date) || a.id - b.id
  )

  const fmtMo = (moStr) =>
    new Date(moStr + '-02').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const byMonth = sorted.reduce((acc, c) => {
    const mo = c.date.slice(0, 7)
    if (!acc[mo]) acc[mo] = []
    acc[mo].push(c)
    return acc
  }, {})
  const months = Object.keys(byMonth).sort((a, b) =>
    sortDir === 'desc' ? b.localeCompare(a) : a.localeCompare(b)
  )

  return (
    <div className="card-lg">
      <div className="section-title-row" style={{ marginBottom: 12 }}>
        <div className="section-title">Savings Log</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-sm" style={{ fontSize: 11 }} onClick={() => setSortDir((d) => d === 'desc' ? 'asc' : 'desc')}>
            {sortDir === 'desc' ? '↓ Newest' : '↑ Oldest'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setModal('contribution', {})}>
            + Add Contribution
          </button>
        </div>
      </div>

      {contributions.length > 0 && (
        <div className="filter-chips" style={{ marginBottom: 16 }}>
          {allTargets.map((t) => (
            <button key={t} className={`filter-chip${filterTarget === t ? ' active' : ''}`} onClick={() => setFilterTarget(t)}>{t}</button>
          ))}
        </div>
      )}

      {sorted.length === 0 && (
        <div className="empty-state" style={{ paddingTop: 24 }}>
          {contributions.length === 0
            ? 'No contributions yet. Log one above or from any goal / event card.'
            : `No contributions for "${filterTarget}".`
          }
        </div>
      )}

      {months.map((mo) => {
        const rows  = byMonth[mo]
        const total = rows.reduce((s, c) => s + c.amount, 0)
        return (
          <div key={mo} style={{ marginBottom: 24 }}>
            <div className="contrib-log-month-header">
              <span>{fmtMo(mo)}</span>
              <span className="mono" style={{ color: 'var(--sage2)' }}>+${total.toLocaleString()}</span>
            </div>
            {rows.map((c) => (
              <div key={c.id}>
                <div className="contrib-log-row">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--text1)', fontWeight: 600 }}>{c.targetName}</div>
                    {c.note && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2, fontStyle: 'italic' }}>{c.note}</div>}
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3, fontFamily: 'var(--font-mono)' }}>
                      {c.date}
                      {c.runningTotal != null && <span style={{ marginLeft: 8 }}>· running total ${c.runningTotal.toLocaleString()}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <span className="mono" style={{ color: 'var(--gold)', fontSize: 15 }}>+${c.amount.toLocaleString()}</span>
                    <button className="action-btn danger" style={{ fontSize: 10 }} onClick={() => setConfirmDel(c.id)}>Delete</button>
                  </div>
                </div>
                {confirmDel === c.id && (
                  <div className="delete-confirm">
                    <span>Remove this contribution?</span>
                    <button className="btn-confirm" onClick={() => { deleteContribution(c.id); setConfirmDel(null) }}>Yes</button>
                    <button className="btn-cancel" onClick={() => setConfirmDel(null)}>Cancel</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

/* ── Root Finances component ── */
const TABS = [
  { id: 'overview',  label: 'Overview'  },
  { id: 'expenses',  label: 'Expenses'  },
  { id: 'recurring', label: 'Recurring' },
  { id: 'networth',  label: 'Net Worth' },
  { id: 'savings',   label: 'Savings Log' },
]

export default function Finances() {
  const financesTab    = useStore((s) => s.financesTab)
  const setFinancesTab = useStore((s) => s.setFinancesTab)
  const setModal       = useStore((s) => s.setModal)

  return (
    <>
      <div className="tab-row">
        {TABS.map((t) => (
          <div key={t.id} className={`tab${financesTab === t.id ? ' active' : ''}`} onClick={() => setFinancesTab(t.id)}>
            {t.label}
          </div>
        ))}
      </div>

      {financesTab === 'overview'  && <Overview onClickIncome={() => setModal('income')} onClickBudget={() => setModal('budget')} />}
      {financesTab === 'expenses'  && <ExpenseLog />}
      {financesTab === 'recurring' && <Recurring />}
      {financesTab === 'networth'  && <NetWorth />}
      {financesTab === 'savings'   && <SavingsLog />}
    </>
  )
}
