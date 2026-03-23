interface PlaceholderMatch {
  name: string
  start: number
  end: number
}

const PLACEHOLDER_RE = /__([A-Z][A-Z0-9_]*)__/g

export function findAllPlaceholders(content: string): PlaceholderMatch[] {
  const results: PlaceholderMatch[] = []
  const re = new RegExp(PLACEHOLDER_RE.source, 'g')
  let match: RegExpExecArray | null
  while ((match = re.exec(content)) !== null) {
    results.push({
      name: match[1]!,
      start: match.index,
      end: match.index + match[0].length,
    })
  }
  return results
}

/**
 * Find the next placeholder whose start index is > afterIndex.
 * Pass afterIndex = -1 to get the very first placeholder.
 * Pass afterIndex = textarea.selectionEnd - 1 to get the one after current selection.
 */
export function findNextPlaceholder(
  content: string,
  afterIndex: number
): { start: number; end: number } | null {
  const all = findAllPlaceholders(content)
  for (const m of all) {
    if (m.start > afterIndex) return { start: m.start, end: m.end }
  }
  return null
}

/**
 * Find the previous placeholder whose start index is < beforeIndex.
 * Returns the rightmost one before beforeIndex.
 */
export function findPrevPlaceholder(
  content: string,
  beforeIndex: number
): { start: number; end: number } | null {
  const all = findAllPlaceholders(content)
  let result: { start: number; end: number } | null = null
  for (const m of all) {
    if (m.start < beforeIndex) result = { start: m.start, end: m.end }
  }
  return result
}

export function hasPlaceholders(content: string): boolean {
  return /__[A-Z][A-Z0-9_]*__/.test(content)
}
