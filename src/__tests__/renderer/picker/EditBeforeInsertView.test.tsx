/* @vitest-environment happy-dom */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EditBeforeInsertView } from '../../../renderer/picker/EditBeforeInsertView'
import type { Template } from '../../../shared/types'

const templateWithPlaceholders: Template = {
  id: 1,
  title: 'Pain History',
  content: 'Site: __SITE__\nOnset: __ONSET__\nDuration: __DURATION__',
  category: 'Medical',
  use_count: 0,
  last_used: null,
}

const templateNoPlaceholders: Template = {
  id: 2,
  title: 'Simple Note',
  content: 'This is a plain note with no placeholders.',
  category: null,
  use_count: 0,
  last_used: null,
}

describe('EditBeforeInsertView', () => {
  it('renders the template title in the header', () => {
    render(<EditBeforeInsertView template={templateWithPlaceholders} onConfirm={vi.fn()} onBack={vi.fn()} />)
    expect(screen.getByText('Pain History')).toBeInTheDocument()
  })

  it('renders the textarea with template content', () => {
    render(<EditBeforeInsertView template={templateWithPlaceholders} onConfirm={vi.fn()} onBack={vi.fn()} />)
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(textarea.value).toContain('__SITE__')
  })

  it('calls onBack when Back button is clicked', async () => {
    const onBack = vi.fn()
    render(<EditBeforeInsertView template={templateWithPlaceholders} onConfirm={vi.fn()} onBack={onBack} />)
    await userEvent.click(screen.getByRole('button', { name: /back/i }))
    expect(onBack).toHaveBeenCalledOnce()
  })

  it('calls onConfirm with textarea content when Insert button is clicked', async () => {
    const onConfirm = vi.fn()
    render(<EditBeforeInsertView template={templateWithPlaceholders} onConfirm={onConfirm} onBack={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /^insert$/i }))
    expect(onConfirm).toHaveBeenCalledOnce()
    expect(onConfirm.mock.calls[0][0]).toContain('__SITE__')
  })

  it('calls onBack when Escape is pressed', async () => {
    const onBack = vi.fn()
    render(<EditBeforeInsertView template={templateWithPlaceholders} onConfirm={vi.fn()} onBack={onBack} />)
    const textarea = screen.getByRole('textbox')
    await userEvent.click(textarea)
    await userEvent.keyboard('{Escape}')
    expect(onBack).toHaveBeenCalledOnce()
  })

  it('calls onConfirm when Ctrl+Enter is pressed', async () => {
    const onConfirm = vi.fn()
    render(<EditBeforeInsertView template={templateWithPlaceholders} onConfirm={onConfirm} onBack={vi.fn()} />)
    const textarea = screen.getByRole('textbox')
    await userEvent.click(textarea)
    await userEvent.keyboard('{Control>}{Enter}{/Control}')
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('does not throw Tab on a template with no placeholders', async () => {
    render(<EditBeforeInsertView template={templateNoPlaceholders} onConfirm={vi.fn()} onBack={vi.fn()} />)
    const textarea = screen.getByRole('textbox')
    await userEvent.click(textarea)
    await expect(userEvent.keyboard('{Tab}')).resolves.not.toThrow()
  })
})
