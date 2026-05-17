export function getMotivation(pct) {
  if (pct >= 100) return "You did it! 🎉"
  if (pct >= 76)  return "Almost there, finish strong!"
  if (pct >= 51)  return "More than halfway there!"
  if (pct >= 26)  return "Building momentum!"
  return "Great start, keep going!"
}
