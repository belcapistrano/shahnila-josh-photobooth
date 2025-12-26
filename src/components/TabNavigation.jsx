function TabNavigation({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'camera', label: 'Camera', icon: '📷' },
    { id: 'gallery', label: 'Gallery', icon: '🖼️' },
    { id: 'challenges', label: 'Challenges', icon: '🎯' }
  ]

  return (
    <div className="tab-navigation">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </div>
  )
}

export default TabNavigation
