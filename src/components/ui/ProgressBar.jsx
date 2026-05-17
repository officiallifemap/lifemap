export default function ProgressBar({ pct, color = 'gold', style }) {
  return (
    <div className="progress-bar" style={style}>
      <div className={`progress-fill ${color}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  )
}
