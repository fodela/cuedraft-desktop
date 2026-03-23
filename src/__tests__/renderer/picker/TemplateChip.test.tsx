/* @vitest-environment happy-dom */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TemplateChip } from '../../../renderer/picker/TemplateChip'
import type { Template } from '../../../shared/types'

const base: Template = {
  id: 1,
  title: 'My Template',
  content: 'Short content',
  category: 'Medical',
  use_count: 0,
  last_used: null,
}

describe('TemplateChip', () => {
  it('renders the template title', () => {
    render(<TemplateChip template={base} isSelected={false} onClick={vi.fn()} />)
    expect(screen.getByText('My Template')).toBeInTheDocument()
  })

  it('renders a short content preview as-is', () => {
    render(<TemplateChip template={base} isSelected={false} onClick={vi.fn()} />)
    expect(screen.getByText('Short content')).toBeInTheDocument()
  })

  it('truncates content longer than 60 chars and appends "…"', () => {
    const long = { ...base, content: 'a'.repeat(65) }
    render(<TemplateChip template={long} isSelected={false} onClick={vi.fn()} />)
    const preview = screen.getByText(/^a+…$/)
    expect(preview.textContent).toHaveLength(61) // 60 + ellipsis char
  })

  it('renders the category badge when category is non-null', () => {
    render(<TemplateChip template={base} isSelected={false} onClick={vi.fn()} />)
    expect(screen.getByText('Medical')).toBeInTheDocument()
  })

  it('does not render a category badge when category is null', () => {
    render(<TemplateChip template={{ ...base, category: null }} isSelected={false} onClick={vi.fn()} />)
    expect(screen.queryByText('Medical')).not.toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<TemplateChip template={base} isSelected={false} onClick={onClick} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
