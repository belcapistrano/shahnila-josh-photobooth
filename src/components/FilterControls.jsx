const FILTERS = [
  { id: 'none', name: 'None', style: 'none' },
  { id: 'grayscale', name: 'Grayscale', style: 'grayscale(100%)' },
  { id: 'sepia', name: 'Sepia', style: 'sepia(100%)' },
  { id: 'vintage', name: 'Vintage', style: 'sepia(50%) contrast(120%) brightness(90%)' },
  { id: 'warm', name: 'Warm', style: 'sepia(30%) saturate(140%) brightness(105%)' },
  { id: 'cool', name: 'Cool', style: 'hue-rotate(180deg) saturate(120%)' },
  { id: 'high-contrast', name: 'Pop', style: 'contrast(140%) saturate(130%)' },
  { id: 'black-white', name: 'B&W', style: 'grayscale(100%) contrast(120%)' }
]

function FilterControls({ selectedFilter, onFilterChange }) {
  return (
    <div className="filter-controls">
      <label className="filter-label">Filter:</label>
      <div className="filter-buttons">
        {FILTERS.map(filter => (
          <button
            key={filter.id}
            className={`filter-btn ${selectedFilter === filter.id ? 'active' : ''}`}
            onClick={() => onFilterChange(filter.id)}
          >
            {filter.name}
          </button>
        ))}
      </div>
    </div>
  )
}

export { FILTERS }
export default FilterControls
