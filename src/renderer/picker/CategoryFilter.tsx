interface CategoryFilterProps {
  categories: string[]
  activeCategory: string | null
  onSelect: (category: string | null) => void
}

export function CategoryFilter({ categories, activeCategory, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto py-1 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
          activeCategory === null
            ? 'bg-accent text-white'
            : 'bg-raised text-t2 hover:text-t1'
        }`}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            activeCategory === cat
              ? 'bg-accent text-white'
              : 'bg-raised text-t2 hover:text-t1'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}
