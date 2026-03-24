/* @vitest-environment happy-dom */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PickerApp } from '../../../renderer/picker/PickerApp'
import type { Template } from '../../../shared/types'

const SAMPLE_TEMPLATES: Template[] = [
  { id: 1, title: 'Hello World',  content: 'Hello, {{name}}!', category: 'Greetings', use_count: 5,  last_used: null },
  { id: 2, title: 'Follow Up',    content: 'Just following up on {{topic}}.', category: 'Email', use_count: 3, last_used: null },
]

function setupTemplates(templates: Template[] = SAMPLE_TEMPLATES) {
  ;(window.cuedraft.templates.getAll as ReturnType<typeof vi.fn>).mockResolvedValue(templates)
}

// ── Rendering ──────────────────────────────────────────────────────────────

describe('PickerApp', () => {
  it('renders the search bar', async () => {
    setupTemplates()
    render(<PickerApp />)
    await waitFor(() =>
      expect(screen.getByPlaceholderText(/Search templates/i)).toBeInTheDocument()
    )
  })

  it('shows all templates after load', async () => {
    setupTemplates()
    render(<PickerApp />)
    await waitFor(() => {
      expect(screen.getByText('Hello World')).toBeInTheDocument()
      expect(screen.getByText('Follow Up')).toBeInTheDocument()
    })
  })

  it('shows "No templates found" when list is empty', async () => {
    setupTemplates([])
    render(<PickerApp />)
    await waitFor(() =>
      expect(screen.getByText(/No templates found/i)).toBeInTheDocument()
    )
  })

  it('renders keyboard hint bar', async () => {
    setupTemplates([])
    render(<PickerApp />)
    await waitFor(() => {
      expect(screen.getByText(/Open/i)).toBeInTheDocument()
      expect(screen.getByText(/Close/i)).toBeInTheDocument()
      expect(screen.getByText(/Navigate/i)).toBeInTheDocument()
    })
  })

  // ── Theme-aware CSS classes ─────────────────────────────────────────────

  it('root container uses bg-surface class', async () => {
    setupTemplates([])
    const { container } = render(<PickerApp />)
    await waitFor(() => screen.getByPlaceholderText(/Search templates/i))
    const root = container.firstElementChild as HTMLElement
    expect(root.classList.contains('bg-surface')).toBe(true)
  })

  it('hint bar uses border-low class', async () => {
    setupTemplates([])
    render(<PickerApp />)
    await waitFor(() => screen.getByText(/Navigate/i))
    // The hint bar has border-t border-low
    const hintBar = screen.getByText(/Navigate/i).closest('div')!
    expect(hintBar.className).toContain('border-low')
  })

  it('empty state message uses text-t3 class', async () => {
    setupTemplates([])
    render(<PickerApp />)
    const msg = await waitFor(() => screen.getByText(/No templates found/i))
    expect(msg.classList.contains('text-t3')).toBe(true)
  })

  // ── Interaction ────────────────────────────────────────────────────────

  it('clicking a template opens EditBeforeInsertView', async () => {
    setupTemplates()
    render(<PickerApp />)
    await waitFor(() => screen.getByText('Hello World'))
    await act(async () => {
      await userEvent.click(screen.getByText('Hello World'))
    })
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Insert/i })).toBeInTheDocument()
    )
  })

  it('clicking Back in EditBeforeInsertView returns to template list', async () => {
    setupTemplates()
    render(<PickerApp />)
    await waitFor(() => screen.getByText('Hello World'))
    await act(async () => {
      await userEvent.click(screen.getByText('Hello World'))
    })
    await waitFor(() => screen.getByRole('button', { name: /Back/i }))
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /Back/i }))
    })
    await waitFor(() =>
      expect(screen.getByText('Hello World')).toBeInTheDocument()
    )
  })

  it('category filter renders categories from templates', async () => {
    setupTemplates()
    render(<PickerApp />)
    await waitFor(() => {
      expect(screen.getByText('Greetings')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
    })
  })
})
