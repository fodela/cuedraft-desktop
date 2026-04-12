import type { Template } from '../../shared/types'
import { obfuscatePreview } from '../../shared/privacy'

interface TemplateChipProps {
  template: Template
  privacyMode: boolean
  isSelected: boolean
  onClick: () => void
}

export function TemplateChip({ template, privacyMode, isSelected, onClick }: TemplateChipProps) {
  const rawPreview = template.content.length > 60
    ? template.content.slice(0, 60) + '…'
    : template.content
  const preview = privacyMode ? obfuscatePreview(rawPreview) : rawPreview

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        isSelected
          ? 'border-accent bg-raised ring-1 ring-accent'
          : 'border-low bg-raised/50 hover:border-mid hover:bg-raised'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-t1 truncate">
          {template.title}
        </span>
        {template.category && (
          <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-raised border border-low text-t2">
            {template.category}
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-t3 line-clamp-2 whitespace-pre-wrap">
        {preview}
      </p>
    </button>
  )
}
