function CountdownTimer({ count, isActive }) {
  if (!isActive || count === 0) {
    return null
  }

  return (
    <div className="countdown-overlay">
      <div className="countdown-number">{count}</div>
    </div>
  )
}

export default CountdownTimer
