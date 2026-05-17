/**
 * How many periods (of the given cadence) remain until dateStr.
 * Returns at least 1 so we never divide by zero.
 */
function periodsUntil(dateStr, cadence) {
  const msUntil   = new Date(dateStr) - new Date()
  const daysUntil = Math.max(1, msUntil / (1000 * 60 * 60 * 24))

  if (cadence === 'Bi-weekly' || cadence === 'biweekly') {
    return Math.max(1, Math.ceil(daysUntil / 14))
  }
  if (cadence === 'Weekly' || cadence === 'weekly') {
    return Math.max(1, Math.ceil(daysUntil / 7))
  }
  return Math.max(1, Math.ceil(daysUntil / 30.4375))
}

/** Human-readable period label */
function cadenceLabel(cadence) {
  if (cadence === 'Bi-weekly' || cadence === 'biweekly') return 'every 2 wks'
  if (cadence === 'Weekly'    || cadence === 'weekly')    return 'weekly'
  return 'monthly'
}

/**
 * Derives savings line items for the budget display.
 * Goals are the single source of truth — events are referenced via linkedEventId.
 *
 * @param {Array} goals
 * @param {Array} events — used only for display names on linked goals
 */
export function deriveSavingsItems(goals, events = []) {
  const items = []

  for (const g of goals) {
    if (g.monthly <= 0 && !g.linkedEventId) continue

    // Find linked event for context label
    const linkedEvent = g.linkedEventId
      ? events.find((e) => e.id === g.linkedEventId)
      : null

    const sub = linkedEvent
      ? `Event · ${linkedEvent.name}`
      : `Goal · ${g.cadence || 'Monthly'}`

    if (g.monthly > 0) {
      items.push({
        key:     `goal-${g.id}`,
        name:    g.name,
        sub,
        monthly: g.monthly,
        saved:   g.saved ?? 0,
        isEvent: !!linkedEvent,
      })
    }
  }

  return items
}

/**
 * Calculate per-period savings needed to hit a goal's target by its target date.
 * Returns { amt, label, complete }.
 */
export function calcGoalPerPeriod(goal) {
  const remaining = Math.max(0, (goal.target || 0) - (goal.saved || 0))
  if (remaining <= 0) return { amt: 0, label: '/mo', complete: true }

  const cadence = goal.cadence || 'Monthly'

  if (!goal.targetDate) {
    // No target date — show monthly contribution if set
    const amt = goal.monthly > 0 ? goal.monthly : 0
    if (cadence === 'Bi-weekly' || cadence === 'biweekly') return { amt, label: '/2 wks' }
    if (cadence === 'Weekly'    || cadence === 'weekly')    return { amt, label: '/wk' }
    return { amt, label: '/mo' }
  }

  const periods = periodsUntil(goal.targetDate, cadence)
  const amt     = Math.ceil(remaining / periods)

  if (cadence === 'Bi-weekly' || cadence === 'biweekly') return { amt, label: '/2 wks' }
  if (cadence === 'Weekly'    || cadence === 'weekly')    return { amt, label: '/wk' }
  return { amt, label: '/mo' }
}

/**
 * @deprecated Use calcGoalPerPeriod instead.
 * Kept for backward compat — pass a goal object, not an event.
 */
export function calcEventPerPeriod(goal) {
  return calcGoalPerPeriod(goal)
}
