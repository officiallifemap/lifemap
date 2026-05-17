import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const initialBudgetCategories = []

const initialRecurringBills = []

const initialAssets = []

const initialDebts = []

const initialTodos = []

const initialEvents = []

const initialGoals = []

const initialHabits = []

const initialPeople = []

const initialAppointments = []

const initialMedications = []

const initialNotes = []

const initialExpenses = []

// Milestone percentages to check on each contribution
const MILESTONE_PCTS = [25, 50, 75, 100]

function checkMilestones(prevSaved, newSaved, target, existingMilestones, dateStr) {
  const prevPct = target > 0 ? Math.round((prevSaved / target) * 100) : 0
  const newPct  = target > 0 ? Math.round((newSaved  / target) * 100) : 0
  const hit = MILESTONE_PCTS.filter((m) => newPct >= m && prevPct < m)
  if (hit.length === 0) return existingMilestones
  const newMilestones = hit.map((pct) => ({ pct, date: dateStr }))
  return [...existingMilestones, ...newMilestones]
}

/* ── Profile data fields (snapshotted per profile) ── */
const PROFILE_DATA_FIELDS = [
  'todos','events','goals','expenses','habits','people',
  'appointments','medications','notes','contributions',
  'incomeMode','fixedIncome','incomeEntries','totalBudget','budgetCategories',
  'recurringBills','assets','debts',
  'navOrder','dashboardLayout','dashboardHidden',
  'paydayAnchorDate','paydayFrequency',
  'dashboardStatOrder','dashboardPinnedTodos',
  'financesTab','firstStepsDismissed',
]

function extractProfileData(state) {
  const d = {}
  PROFILE_DATA_FIELDS.forEach((f) => { d[f] = state[f] })
  return d
}

function getInitialProfileData() {
  return {
    todos:           [],
    events:          [],
    goals:           [],
    expenses:        [],
    habits:          [],
    people:          [],
    appointments:    [],
    medications:     [],
    notes:           [],
    contributions:   [],
    incomeMode:      'fixed',
    fixedIncome:     0,
    incomeEntries:   [],
    totalBudget:     0,
    budgetCategories: [],
    recurringBills:  [],
    assets:          [],
    debts:           [],
    navOrder:        ['dashboard','finances','events','goals','calendar','todos','habits','people','wellness','notes'],
    dashboardLayout: [
      { id: 'calendar',  col: 'left'  },
      { id: 'quicknote', col: 'left'  },
      { id: 'briefing',  col: 'right' },
      { id: 'goals',     col: 'right' },
      { id: 'tasks',     col: 'right' },
    ],
    dashboardHidden:     [],
    dashboardStatOrder:  ['upcoming-events','active-goals','habits-today','budget-used'],
    dashboardPinnedTodos:[],
    paydayAnchorDate:    '',
    paydayFrequency:     'biweekly',
    financesTab:         'overview',
    firstStepsDismissed: false,
  }
}

const GOAL_COLORS = ['gc-gold', 'gc-sage', 'gc-sky', 'gc-coral']

const useStore = create(
  persist(
    (set, get) => ({
      /* ── Navigation ── */
      currentPage:  'dashboard',
      activeModal:  null,
      modalData:    {},
      focusItem:    null,
      financesTab:  'overview',
      navOrder:     ['dashboard','finances','events','goals','calendar','todos','habits','people','wellness','notes'],
      dashboardLayout: [
        { id: 'calendar',  col: 'left'  },
        { id: 'quicknote', col: 'left'  },
        { id: 'briefing',  col: 'right' },
        { id: 'goals',     col: 'right' },
        { id: 'tasks',     col: 'right' },
      ],
      dashboardHidden:      [],
      dashboardStatOrder:   ['upcoming-events','active-goals','habits-today','budget-used'],
      dashboardPinnedTodos: [],
      paydayAnchorDate:     '',
      paydayFrequency:      'biweekly',
      firstStepsDismissed:  false,

      /* ── Appearance & Profiles ── */
      darkMode:        true,
      profiles:        [{ id: 'default', name: 'My Profile', avatar: null, color: '#d4a84c' }],
      activeProfileId: 'default',
      profileSnapshots: {},

      /* ── Data ── */
      todos:         initialTodos,
      events:        initialEvents,
      goals:         initialGoals,
      expenses:      initialExpenses,
      contributions: [],
      habits:        initialHabits,
      people:        initialPeople,
      appointments:  initialAppointments,
      medications:   initialMedications,
      notes:         initialNotes,

      /* ── Finance settings ── */
      incomeMode:       'fixed',
      fixedIncome:      0,
      incomeEntries:    [],
      totalBudget:      0,
      budgetCategories: initialBudgetCategories,
      recurringBills:   initialRecurringBills,
      assets:           initialAssets,
      debts:            initialDebts,

      /* ── Auth ── */
      currentUser:     null,
      authScreenOpen:  false,
      setCurrentUser:  (user) => set({ currentUser: user }),
      openAuthScreen:  ()     => set({ authScreenOpen: true }),
      closeAuthScreen: ()     => set({ authScreenOpen: false }),

      /* ── Navigation actions ── */
      setPage:        (page)           => set({ currentPage: page }),
      setModal:       (modal, data={}) => set({ activeModal: modal, modalData: data }),
      closeModal:     ()               => set({ activeModal: null, modalData: {} }),
      setFocusItem:   (item)           => set({ focusItem: item }),
      clearFocusItem: ()               => set({ focusItem: null }),
      setFinancesTab: (tab)            => set({ financesTab: tab }),
      reorderNav:             (ids)    => set({ navOrder: ids }),
      setDashboardLayout:     (layout) => set({ dashboardLayout: layout }),
      setPaydayAnchorDate:    (date)   => set({ paydayAnchorDate: date }),
      setPaydayFrequency:     (freq)   => set({ paydayFrequency: freq }),

      dismissFirstSteps: () => set({ firstStepsDismissed: true }),

      setDashboardStatOrder:  (order) => set({ dashboardStatOrder: order }),
      setDashboardPinnedTodos:(ids)   => set({ dashboardPinnedTodos: ids }),
      toggleDashboardPinTodo: (id)    => set((s) => {
        const pinned = s.dashboardPinnedTodos || []
        return {
          dashboardPinnedTodos: pinned.includes(id)
            ? pinned.filter((x) => x !== id)
            : [...pinned, id],
        }
      }),

      /* ── Dark mode ── */
      setDarkMode: (val) => set({ darkMode: val }),

      /* ── Profiles ── */
      updateProfile: (id, updates) =>
        set((s) => ({
          profiles: s.profiles.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),

      createProfile: (meta) =>
        set((s) => {
          const newId       = `profile-${Date.now()}`
          const newProfile  = { id: newId, name: meta.name || 'New Profile', avatar: meta.avatar || null, color: meta.color || '#72b5a3' }
          const snapshot    = extractProfileData(s)
          return {
            ...getInitialProfileData(),
            profiles:         [...s.profiles, newProfile],
            activeProfileId:  newId,
            profileSnapshots: { ...s.profileSnapshots, [s.activeProfileId]: snapshot },
            darkMode:         s.darkMode,
          }
        }),

      switchProfile: (targetId) =>
        set((s) => {
          if (targetId === s.activeProfileId) return {}
          const snapshot   = extractProfileData(s)
          const targetData = s.profileSnapshots[targetId] ?? getInitialProfileData()
          return {
            ...targetData,
            profiles:         s.profiles,
            activeProfileId:  targetId,
            profileSnapshots: { ...s.profileSnapshots, [s.activeProfileId]: snapshot },
            darkMode:         s.darkMode,
            currentPage:      s.currentPage,
          }
        }),

      clearProfile: () =>
        set((s) => ({
          ...getInitialProfileData(),
          profiles:         s.profiles,
          activeProfileId:  s.activeProfileId,
          profileSnapshots: s.profileSnapshots,
          darkMode:         s.darkMode,
          currentPage:      'dashboard',
        })),

      deleteProfile: (id) =>
        set((s) => {
          if (id === 'default' || s.profiles.length <= 1) return {}
          const wasActive = s.activeProfileId === id
          const remaining = s.profiles.filter((p) => p.id !== id)
          const snapshots = { ...s.profileSnapshots }
          delete snapshots[id]
          if (!wasActive) return { profiles: remaining, profileSnapshots: snapshots }
          const fallbackId   = remaining[0].id
          const fallbackData = snapshots[fallbackId] ?? getInitialProfileData()
          return {
            ...fallbackData,
            profiles:         remaining,
            activeProfileId:  fallbackId,
            profileSnapshots: snapshots,
            darkMode:         s.darkMode,
          }
        }),

      toggleDashboardHidden:  (id) => set((s) => ({
        dashboardHidden: (s.dashboardHidden || []).includes(id)
          ? (s.dashboardHidden || []).filter((x) => x !== id)
          : [...(s.dashboardHidden || []), id],
      })),

      /* ── Todos ── */
      toggleTodo: (id) =>
        set((s) => ({
          todos: s.todos.map((t) =>
            t.id === id
              ? { ...t, done: !t.done, completedAt: !t.done ? new Date().toISOString() : null }
              : t
          ),
        })),

      addTodo: ({ text, due, priority, notes = '', linkedEventId = null }) =>
        set((s) => ({
          todos: [
            { id: Date.now(), text, due, priority, done: false, completedAt: null, notes, linkedEventId },
            ...s.todos,
          ],
        })),

      updateTodo: (id, updates) =>
        set((s) => ({ todos: s.todos.map((t) => (t.id === id ? { ...t, ...updates } : t)) })),

      deleteTodo: (id) =>
        set((s) => ({
          todos: s.todos.filter((t) => t.id !== id),
          dashboardPinnedTodos: (s.dashboardPinnedTodos || []).filter((x) => x !== id),
        })),

      linkTodoToEvent: (todoId, eventId) =>
        set((s) => ({
          todos: s.todos.map((t) => (t.id === todoId ? { ...t, linkedEventId: eventId } : t)),
        })),

      unlinkTodo: (todoId) =>
        set((s) => ({
          todos: s.todos.map((t) => (t.id === todoId ? { ...t, linkedEventId: null } : t)),
        })),

      reorderTodos: (ids) =>
        set((s) => ({ todos: ids.map((id) => s.todos.find((t) => t.id === id)).filter(Boolean) })),

      /* ── Events ── */
      addEvent: (event) =>
        set((s) => ({
          events: [
            ...s.events,
            {
              id: Date.now(), todos: [], notes: '',
              photos: [], collapsed: false, completed: false, completedAt: null, milestones: [],
              linkedGoalId: null,
              ...event,
            },
          ],
        })),

      /**
       * Atomically create an event + a linked savings goal.
       * Used when EventModal's "Track with savings goal" is checked.
       */
      addEventWithGoal: ({ event, goal }) =>
        set((s) => {
          const eventId = Date.now()
          const goalId  = eventId + 1
          const color   = GOAL_COLORS[s.goals.length % GOAL_COLORS.length]
          const newEvent = {
            id: eventId, todos: [], notes: '',
            photos: [], collapsed: false, completed: false, completedAt: null, milestones: [],
            linkedGoalId: goalId,
            ...event,
          }
          const newGoal = {
            id: goalId, saved: 0, pinned: false, collapsed: false, milestones: [],
            color,
            linkedEventId: eventId,
            ...goal,
            target: Number(goal.target),
            monthly: Number(goal.monthly || 0),
          }
          return {
            events: [...s.events, newEvent],
            goals:  [...s.goals,  newGoal],
          }
        }),

      updateEvent: (id, updates) =>
        set((s) => ({ events: s.events.map((e) => (e.id === id ? { ...e, ...updates } : e)) })),

      /**
       * deleteEvent(id, { deleteTodos, deleteGoal })
       * By default: unlinks but keeps associated todos and goal.
       * Pass deleteTodos:true to also remove linked todos.
       * Pass deleteGoal:true  to also remove the linked savings goal.
       */
      deleteEvent: (id, { deleteTodos = false, deleteGoal = false } = {}) =>
        set((s) => {
          const event = s.events.find((e) => e.id === id)

          // Handle linked goal
          let newGoals  = s.goals
          let newContribs = s.contributions.filter((c) => c.eventId !== id)
          if (event?.linkedGoalId) {
            if (deleteGoal) {
              newGoals   = newGoals.filter((g) => g.id !== event.linkedGoalId)
              newContribs = newContribs.filter((c) => c.goalId !== event.linkedGoalId)
            } else {
              newGoals = newGoals.map((g) =>
                g.id === event.linkedGoalId ? { ...g, linkedEventId: null } : g
              )
            }
          }

          // Handle linked todos
          let newTodos   = s.todos
          let newPinned  = s.dashboardPinnedTodos || []
          if (deleteTodos) {
            const linkedIds = new Set(s.todos.filter((t) => t.linkedEventId === id).map((t) => t.id))
            newTodos  = newTodos.filter((t) => !linkedIds.has(t.id))
            newPinned = newPinned.filter((pid) => !linkedIds.has(pid))
          }

          return {
            events:               s.events.filter((e) => e.id !== id),
            goals:                newGoals,
            todos:                newTodos,
            contributions:        newContribs,
            dashboardPinnedTodos: newPinned,
          }
        }),

      toggleEventCollapse: (id) =>
        set((s) => ({
          events: s.events.map((e) => (e.id === id ? { ...e, collapsed: !e.collapsed } : e)),
        })),

      completeEvent: (id) =>
        set((s) => ({
          events: s.events.map((e) =>
            e.id === id ? { ...e, completed: true, completedAt: new Date().toISOString() } : e
          ),
        })),

      uncompleteEvent: (id) =>
        set((s) => ({
          events: s.events.map((e) =>
            e.id === id ? { ...e, completed: false, completedAt: null } : e
          ),
        })),

      reorderEvents: (ids) =>
        set((s) => ({ events: ids.map((id) => s.events.find((e) => e.id === id)).filter(Boolean) })),

      addEventPhoto: (eventId, dataUrl) =>
        set((s) => ({
          events: s.events.map((e) =>
            e.id === eventId ? { ...e, photos: [...(e.photos || []), dataUrl] } : e
          ),
        })),

      removeEventPhoto: (eventId, idx) =>
        set((s) => ({
          events: s.events.map((e) =>
            e.id === eventId ? { ...e, photos: e.photos.filter((_, i) => i !== idx) } : e
          ),
        })),

      /* ── Goal ↔ Event linking ── */
      linkGoalToEvent: (goalId, eventId) =>
        set((s) => ({
          goals:  s.goals.map((g)  => g.id === goalId  ? { ...g, linkedEventId: eventId } : g),
          events: s.events.map((e) => e.id === eventId ? { ...e, linkedGoalId: goalId   } : e),
        })),

      unlinkGoalFromEvent: (goalId) =>
        set((s) => {
          const goal = s.goals.find((g) => g.id === goalId)
          return {
            goals:  s.goals.map((g)  => g.id === goalId          ? { ...g, linkedEventId: null } : g),
            events: s.events.map((e) => e.id === goal?.linkedEventId ? { ...e, linkedGoalId: null  } : e),
          }
        }),

      /* ── Goals ── */
      addGoal: ({ name, category, target, monthly, cadence, targetDate = '', savedAmount = 0, linkedEventId = null, color: forcedColor }) =>
        set((s) => {
          const color = forcedColor || GOAL_COLORS[s.goals.length % GOAL_COLORS.length]
          const goalId = Date.now()
          const newGoal = {
            id: goalId, name, category, target: Number(target), saved: Number(savedAmount),
            cadence, monthly: Number(monthly), color, pinned: false, collapsed: false,
            targetDate, milestones: [], linkedEventId,
          }
          // If linking to an event, update event.linkedGoalId too
          const newEvents = linkedEventId
            ? s.events.map((e) => e.id === linkedEventId ? { ...e, linkedGoalId: goalId } : e)
            : s.events
          return { goals: [...s.goals, newGoal], events: newEvents }
        }),

      updateGoal: (id, updates) =>
        set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)) })),

      deleteGoal: (id) =>
        set((s) => {
          const goal = s.goals.find((g) => g.id === id)
          // Unlink associated event (don't delete the event)
          const newEvents = goal?.linkedEventId
            ? s.events.map((e) => e.id === goal.linkedEventId ? { ...e, linkedGoalId: null } : e)
            : s.events
          return {
            goals:         s.goals.filter((g) => g.id !== id),
            events:        newEvents,
            contributions: s.contributions.filter((c) => c.goalId !== id),
          }
        }),

      toggleGoalPin: (id) =>
        set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, pinned: !g.pinned } : g)) })),

      toggleGoalCollapse: (id) =>
        set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, collapsed: !g.collapsed } : g)) })),

      reorderGoals: (ids) =>
        set((s) => ({ goals: ids.map((id) => s.goals.find((g) => g.id === id)).filter(Boolean) })),

      /* ── Contributions — always target a goal ── */
      addContribution: ({ goalId, amount, date, note }) =>
        set((s) => {
          if (!goalId) return {}
          const g = s.goals.find((g) => g.id === goalId)
          if (!g) return {}

          const amt       = Number(amount)
          const dateStr   = date || new Date().toISOString().split('T')[0]
          const prevSaved = g.saved
          const newSaved  = g.saved + amt
          const newMilestones = checkMilestones(prevSaved, newSaved, g.target, g.milestones || [], dateStr)

          const newGoals = s.goals.map((gl) =>
            gl.id === goalId ? { ...gl, saved: newSaved, milestones: newMilestones } : gl
          )

          const contribution = {
            id: Date.now(), goalId,
            amount: amt, date: dateStr, note: note || '',
            runningTotal: newSaved, targetName: g.name,
          }

          return { goals: newGoals, contributions: [contribution, ...s.contributions] }
        }),

      deleteContribution: (id) =>
        set((s) => ({ contributions: s.contributions.filter((c) => c.id !== id) })),

      /* ── Habits ── */
      addHabit: ({ name, frequency, color }) =>
        set((s) => ({
          habits: [...s.habits, { id: Date.now(), name, frequency, color: color || 'gc-sage', history: [], archived: false }],
        })),
      updateHabit: (id, updates) =>
        set((s) => ({ habits: s.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)) })),
      deleteHabit: (id) =>
        set((s) => ({ habits: s.habits.filter((h) => h.id !== id) })),
      checkInHabit: (id) =>
        set((s) => {
          const today = new Date().toISOString().split('T')[0]
          return {
            habits: s.habits.map((h) =>
              h.id === id
                ? { ...h, history: h.history.includes(today) ? h.history.filter((d) => d !== today) : [...h.history, today] }
                : h
            ),
          }
        }),
      logHabitDate: (id, dateStr) =>
        set((s) => ({
          habits: s.habits.map((h) =>
            h.id === id
              ? { ...h, history: h.history.includes(dateStr) ? h.history.filter((d) => d !== dateStr) : [...h.history, dateStr] }
              : h
          ),
        })),
      reorderHabits: (ids) =>
        set((s) => ({ habits: ids.map((id) => s.habits.find((h) => h.id === id)).filter(Boolean) })),

      /* ── People ── */
      addPerson: (person) =>
        set((s) => ({
          people: [...s.people, { id: Date.now(), phone: '', email: '', notes: '', anniversary: '', giftIdeas: [], ...person }],
        })),
      updatePerson: (id, updates) =>
        set((s) => ({ people: s.people.map((p) => (p.id === id ? { ...p, ...updates } : p)) })),
      deletePerson: (id) =>
        set((s) => ({ people: s.people.filter((p) => p.id !== id) })),
      addGiftIdea: (personId, text) =>
        set((s) => ({
          people: s.people.map((p) =>
            p.id === personId
              ? { ...p, giftIdeas: [...(p.giftIdeas || []), { id: Date.now(), text, done: false }] }
              : p
          ),
        })),
      toggleGiftIdea: (personId, giftId) =>
        set((s) => ({
          people: s.people.map((p) =>
            p.id === personId
              ? { ...p, giftIdeas: p.giftIdeas.map((g) => (g.id === giftId ? { ...g, done: !g.done } : g)) }
              : p
          ),
        })),
      deleteGiftIdea: (personId, giftId) =>
        set((s) => ({
          people: s.people.map((p) =>
            p.id === personId ? { ...p, giftIdeas: p.giftIdeas.filter((g) => g.id !== giftId) } : p
          ),
        })),
      reorderPeople: (ids) =>
        set((s) => ({ people: ids.map((id) => s.people.find((p) => p.id === id)).filter(Boolean) })),

      /* ── Appointments ── */
      addAppointment: (appt) =>
        set((s) => ({
          appointments: [...s.appointments, { id: Date.now(), time: '', provider: '', notes: '', completed: false, ...appt }],
        })),
      updateAppointment: (id, updates) =>
        set((s) => ({ appointments: s.appointments.map((a) => (a.id === id ? { ...a, ...updates } : a)) })),
      deleteAppointment: (id) =>
        set((s) => ({ appointments: s.appointments.filter((a) => a.id !== id) })),
      toggleAppointmentDone: (id) =>
        set((s) => ({
          appointments: s.appointments.map((a) => (a.id === id ? { ...a, completed: !a.completed } : a)),
        })),
      reorderAppointments: (ids) =>
        set((s) => ({ appointments: ids.map((id) => s.appointments.find((a) => a.id === id)).filter(Boolean) })),

      /* ── Medications ── */
      addMedication: (med) =>
        set((s) => ({
          medications: [...s.medications, { id: Date.now(), dose: '', frequency: 'daily', checkins: [], ...med }],
        })),
      updateMedication: (id, updates) =>
        set((s) => ({ medications: s.medications.map((m) => (m.id === id ? { ...m, ...updates } : m)) })),
      deleteMedication: (id) =>
        set((s) => ({ medications: s.medications.filter((m) => m.id !== id) })),
      checkInMedication: (id) =>
        set((s) => {
          const today = new Date().toISOString().split('T')[0]
          return {
            medications: s.medications.map((m) =>
              m.id === id
                ? { ...m, checkins: m.checkins.includes(today) ? m.checkins.filter((d) => d !== today) : [...m.checkins, today] }
                : m
            ),
          }
        }),
      logMedicationDate: (id, dateStr) =>
        set((s) => ({
          medications: s.medications.map((m) =>
            m.id === id
              ? { ...m, checkins: m.checkins.includes(dateStr) ? m.checkins.filter((d) => d !== dateStr) : [...m.checkins, dateStr] }
              : m
          ),
        })),
      reorderMedications: (ids) =>
        set((s) => ({ medications: ids.map((id) => s.medications.find((m) => m.id === id)).filter(Boolean) })),

      /* ── Notes ── */
      addNote: ({ title = '', body = '', tags = [] }) =>
        set((s) => ({
          notes: [{ id: Date.now(), title, body, tags, date: new Date().toISOString().split('T')[0] }, ...s.notes],
        })),
      updateNote: (id, updates) =>
        set((s) => ({ notes: s.notes.map((n) => (n.id === id ? { ...n, ...updates } : n)) })),
      deleteNote: (id) =>
        set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

      /* ── Expenses ── */
      addExpense: ({ amt, cat, note, date, recurring = false, recurringFreq = 'monthly', recurringAnchorDate = '' }) =>
        set((s) => ({
          expenses: [
            {
              id: Date.now(),
              date: date ?? new Date().toISOString().split('T')[0],
              cat, amt: Number(amt), note,
              recurring, recurringFreq,
              recurringAnchorDate: recurring ? (recurringAnchorDate || date || new Date().toISOString().split('T')[0]) : '',
            },
            ...s.expenses,
          ],
        })),

      updateExpense: (id, updates) =>
        set((s) => ({ expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...updates } : e)) })),

      deleteExpense: (id) =>
        set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),

      /* ── Income ── */
      setIncomeMode:     (mode)   => set({ incomeMode: mode }),
      setFixedIncome:    (amount) => set({ fixedIncome: Number(amount) }),
      addIncomeEntry:    ({ amount, date, label }) =>
        set((s) => ({
          incomeEntries: [...s.incomeEntries, { id: Date.now(), amount: Number(amount), date, label }],
        })),
      deleteIncomeEntry: (id) =>
        set((s) => ({ incomeEntries: s.incomeEntries.filter((e) => e.id !== id) })),

      /* ── Budget ── */
      setTotalBudget:      (amount) => set({ totalBudget: Number(amount) }),
      setBudgetCategories: (cats)   => set({ budgetCategories: cats }),

      /* ── Recurring Bills ── */
      addRecurringBill: (bill) =>
        set((s) => ({ recurringBills: [...(s.recurringBills || []), { id: `bill-${Date.now()}`, ...bill }] })),
      updateRecurringBill: (id, updates) =>
        set((s) => ({ recurringBills: (s.recurringBills || []).map((b) => b.id === id ? { ...b, ...updates } : b) })),
      deleteRecurringBill: (id) =>
        set((s) => ({ recurringBills: (s.recurringBills || []).filter((b) => b.id !== id) })),

      /* ── Assets & Debts ── */
      addAsset: (asset) =>
        set((s) => ({ assets: [...(s.assets || []), { id: `asset-${Date.now()}`, ...asset }] })),
      updateAsset: (id, updates) =>
        set((s) => ({ assets: (s.assets || []).map((a) => a.id === id ? { ...a, ...updates } : a) })),
      deleteAsset: (id) =>
        set((s) => ({ assets: (s.assets || []).filter((a) => a.id !== id) })),
      addDebt: (debt) =>
        set((s) => ({ debts: [...(s.debts || []), { id: `debt-${Date.now()}`, ...debt }] })),
      updateDebt: (id, updates) =>
        set((s) => ({ debts: (s.debts || []).map((d) => d.id === id ? { ...d, ...updates } : d) })),
      deleteDebt: (id) =>
        set((s) => ({ debts: (s.debts || []).filter((d) => d.id !== id) })),
    }),
    {
      name: 'lifemap-store',
      version: 15,
      partialize: (s) => {
        const { activeModal, modalData, focusItem, financesTab, currentUser, setCurrentUser, authScreenOpen, openAuthScreen, closeAuthScreen, ...rest } = s
        return rest
      },
      migrate: (state, version) => {
        let s = { ...state }
        if (version < 2) {
          s.todos  = (s.todos  || []).map((t) => ({ completedAt: null, notes: '', linkedEventId: null, ...t }))
          s.events = (s.events || []).map((e) => ({ photos: [], ...e }))
          s.goals  = s.goals  || []
          s.modalData = {}
        }
        if (version < 3) {
          s.goals  = (s.goals  || []).map((g) => ({ pinned: false, collapsed: false, ...g }))
          s.events = (s.events || []).map((e) => ({ collapsed: false, completed: false, completedAt: null, ...e }))
          s.incomeMode       = s.incomeMode       ?? 'fixed'
          s.fixedIncome      = s.fixedIncome      ?? 5200
          s.incomeEntries    = s.incomeEntries    ?? []
          s.totalBudget      = s.totalBudget      ?? 3000
          s.budgetCategories = s.budgetCategories ?? initialBudgetCategories
          s.financesTab      = s.financesTab      ?? 'overview'
        }
        if (version < 4) {
          s.goals = (s.goals || []).map((g) => ({ targetDate: '', ...g }))
        }
        if (version < 5) {
          s.goals         = (s.goals  || []).map((g) => ({ milestones: [], ...g }))
          s.events        = (s.events || []).map((e) => ({ milestones: [], ...e }))
          s.contributions = s.contributions ?? []
        }
        if (version < 6) {
          s.habits       = s.habits       ?? []
          s.people       = s.people       ?? []
          s.appointments = s.appointments ?? []
          s.medications  = s.medications  ?? []
          s.notes        = s.notes        ?? []
        }
        if (version < 7) {
          s.navOrder = s.navOrder ?? ['dashboard','finances','events','goals','calendar','todos','habits','people','wellness','notes']
        }
        if (version < 8) {
          s.dashboardHidden = s.dashboardHidden ?? []
        }
        if (version < 9) {
          const left  = s.dashboardLeftOrder  ?? ['calendar', 'quicknote']
          const right = s.dashboardRightOrder ?? ['briefing', 'goals', 'tasks']
          const seen  = new Set()
          const layout = []
          left.forEach((id)  => { if (!seen.has(id))  { seen.add(id);  layout.push({ id, col: 'left'  }) } })
          right.forEach((id) => { if (!seen.has(id))  { seen.add(id);  layout.push({ id, col: 'right' }) } })
          ;['calendar','quicknote','briefing','goals','tasks'].forEach((id, i) => {
            if (!seen.has(id)) layout.push({ id, col: i < 2 ? 'left' : 'right' })
          })
          s.dashboardLayout = layout
          delete s.dashboardLeftOrder
          delete s.dashboardRightOrder
        }
        if (version < 10) {
          s.paydayAnchorDate = s.paydayAnchorDate ?? ''
          s.paydayFrequency  = s.paydayFrequency  ?? 'biweekly'
          s.expenses = (s.expenses || []).map((e) => ({
            recurring: false, recurringFreq: 'monthly', recurringAnchorDate: '',
            ...e,
          }))
        }
        if (version < 11) {
          s.darkMode         = s.darkMode         ?? true
          s.profiles         = s.profiles         ?? [{ id: 'default', name: 'My Profile', avatar: null, color: '#d4a84c' }]
          s.activeProfileId  = s.activeProfileId  ?? 'default'
          s.profileSnapshots = s.profileSnapshots ?? {}
        }
        if (version < 13) {
          s.recurringBills = s.recurringBills ?? initialRecurringBills
          s.assets         = s.assets         ?? initialAssets
          s.debts          = s.debts          ?? initialDebts
        }
        if (version < 14) {
          s.dashboardStatOrder   = s.dashboardStatOrder   ?? ['upcoming-events','active-goals','habits-today','budget-used']
          s.dashboardPinnedTodos = s.dashboardPinnedTodos ?? []
        }
        if (version < 15) {
          // Add linking fields to all goals and events
          s.goals  = (s.goals  || []).map((g) => ({ linkedEventId: null, ...g }))
          s.events = (s.events || []).map((e) => ({ linkedGoalId: null,  todos: e.todos || [], ...e }))

          // Try to link existing events to existing goals by name similarity or matching amounts
          const usedGoalIds = new Set()
          s.events = s.events.map((e) => {
            if (!e.cost || e.cost <= 0 || e.linkedGoalId) return e
            const eName = e.name.toLowerCase()
            const match = s.goals.find((g) =>
              !usedGoalIds.has(g.id) &&
              !g.linkedEventId &&
              (
                g.name.toLowerCase().includes(eName) ||
                eName.includes(g.name.toLowerCase()) ||
                (g.target === e.cost && g.saved === (e.saved || 0))
              )
            )
            if (match) {
              usedGoalIds.add(match.id)
              return { ...e, linkedGoalId: match.id }
            }
            return e
          })

          // Back-fill linkedEventId on goals that were just matched
          s.goals = s.goals.map((g) => {
            if (g.linkedEventId) return g
            const ev = s.events.find((e) => e.linkedGoalId === g.id)
            return ev ? { ...g, linkedEventId: ev.id } : g
          })

          // For events with cost > 0 still unlinked, create a new goal
          const newGoals = []
          let nextId = Date.now()
          s.events = s.events.map((e) => {
            if (!e.cost || e.cost <= 0 || e.linkedGoalId) return e
            const goalId = nextId++
            const color  = GOAL_COLORS[(s.goals.length + newGoals.length) % 4]
            newGoals.push({
              id: goalId, name: e.name, category: 'other',
              target: e.cost, saved: e.saved || 0,
              cadence: e.cadence || 'Monthly', monthly: 0, color,
              pinned: false, collapsed: false,
              targetDate: (e.date || '').slice(0, 10),
              milestones: e.milestones || [],
              linkedEventId: e.id,
            })
            return { ...e, linkedGoalId: goalId }
          })
          s.goals = [...s.goals, ...newGoals]
        }
        return s
      },
    }
  )
)

export default useStore
