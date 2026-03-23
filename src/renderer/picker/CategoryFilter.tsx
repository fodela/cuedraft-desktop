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
            ? 'bg-blue-500 text-white'
            : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
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
              ? 'bg-blue-500 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}
