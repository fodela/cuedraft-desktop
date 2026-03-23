import type { Template } from '../../shared/types'

interface TemplateChipProps {
  template: Template
  isSelected: boolean
  onClick: () => void
}

export function TemplateChip({ template, isSelected, onClick }: TemplateChipProps) {
  const preview = template.content.length > 60
    ? template.content.slice(0, 60) + '…'
    : template.content

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        isSelected
          ? 'border-blue-500 bg-zinc-800/80 ring-1 ring-blue-500/50'
          : 'border-zinc-700/50 bg-zinc-800/40 hover:border-zinc-600 hover:bg-zinc-800/60'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-zinc-100 truncate">
          {template.title}
        </span>
        {template.category && (
          <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-400">
            {template.category}
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-zinc-500 line-clamp-2 whitespace-pre-wrap">
        {preview}
      </p>
    </button>
  )
}
