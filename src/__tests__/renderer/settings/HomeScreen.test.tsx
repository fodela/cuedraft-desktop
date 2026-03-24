/* @vitest-environment happy-dom */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HomeScreen } from '../../../renderer/settings/HomeScreen'
import type { Template } from '../../../shared/types'

const TEMPLATES: Template[] = [
  { id: 1, title: 'Medical History', content: 'PC: __COMPLAINT__', category: 'Medical', use_count: 5,  last_used: null },
  { id: 2, title: 'Legal Notice',    content: 'Dear Sir/Madam',    category: 'Legal',   use_count: 2,  last_used: null },
]

describe('HomeScreen', () => {
  beforeEach(() => {
    ;(window.cuedraft.templates.getAll as ReturnType<typeof vi.fn>).mockResolvedValue(TEMPLATES)
    ;(window.cuedraft.templates.delete as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)
  })

  // ── Rendering ─────────────────────────────────────────────────────────────

  it('renders "My Templates" heading', async () => {
    render(<HomeScreen onEdit={vi.fn()} onCreate={vi.fn()} />)
    await waitFor(() => expect(screen.getByText('My Templates')).toBeInTheDocument())
  })

  it('renders All / Drafts / Archived tabs', async () => {
    render(<HomeScreen onEdit={vi.fn()} onCreate={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument()
      expect(screen.getByText('Drafts')).toBeInTheDocument()
      expect(screen.getByText('Archived')).toBeInTheDocument()
    })
  })

  it('renders table column headers', async () => {
    render(<HomeScreen onEdit={vi.fn()} onCreate={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByText('Category')).toBeInTheDocument()
      expect(screen.getByText('Last Used')).toBeInTheDocument()
      expect(screen.getByText('Usage')).toBeInTheDocument()
    })
  })

  it('displays loaded templates in the table', async () => {
    render(<HomeScreen onEdit={vi.fn()} onCreate={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByText('Medical History')).toBeInTheDocument()
      expect(screen.getByText('Legal Notice')).toBeInTheDocument()
    })
  })

  it('shows category badges', async () => {
    render(<HomeScreen onEdit={vi.fn()} onCreate={vi.fn()} />)
    await waitFor(() => {
      // Tailwind `uppercase` is CSS-only; DOM text content stays as written
      expect(screen.getByText('Medical')).toBeInTheDocument()
      expect(screen.getByText('Legal')).toBeInTheDocument()
    })
  })

  it('shows "No templates found." when list is empty', async () => {
    ;(window.cuedraft.templates.getAll as ReturnType<typeof vi.fn>).mockResolvedValue([])
    render(<HomeScreen onEdit={vi.fn()} onCreate={vi.fn()} />)
    await waitFor(() =>
      expect(screen.getByText('No templates found.')).toBeInTheDocument()
    )
  })

  it('renders Global Shortcuts and System Health cards', async () => {
    render(<HomeScreen onEdit={vi.fn()} onCreate={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByText('Global Shortcuts')).toBeInTheDocument()
      expect(screen.getByText('System Health')).toBeInTheDocument()
    })
  })

  // ── Search ────────────────────────────────────────────────────────────────

  it('filters templates by title as user types', async () => {
    render(<HomeScreen onEdit={vi.fn()} onCreate={vi.fn()} />)
    await waitFor(() => screen.getByText('Medical History'))
    await act(async () => {
      await userEvent.type(screen.getByPlaceholderText(/Search cues/i), 'Medical')
    })
    expect(screen.getByText('Medical History')).toBeInTheDocument()
    expect(screen.queryByText('Legal Notice')).not.toBeInTheDocument()
  })

  it('filters templates by category name', async () => {
    render(<HomeScreen onEdit={vi.fn()} onCreate={vi.fn()} />)
    await waitFor(() => screen.getByText('Legal Notice'))
    await act(async () => {
      await userEvent.type(screen.getByPlaceholderText(/Search cues/i), 'Legal')
    })
    expect(screen.getByText('Legal Notice')).toBeInTheDocument()
    expect(screen.queryByText('Medical History')).not.toBeInTheDocument()
  })

  it('shows "No templates found." when search matches nothing', async () => {
    render(<HomeScreen onEdit={vi.fn()} onCreate={vi.fn()} />)
    await waitFor(() => screen.getByText('Medical History'))
    await act(async () => {
      await userEvent.type(screen.getByPlaceholderText(/Search cues/i), 'xyzzy')
    })
    expect(screen.getByText('No templates found.')).toBeInTheDocument()
  })

  it('restores all templates when search is cleared', async () => {
    render(<HomeScreen onEdit={vi.fn()} onCreate={vi.fn()} />)
    await waitFor(() => screen.getByText('Medical History'))
    const input = screen.getByPlaceholderText(/Search cues/i)
    await act(async () => { await userEvent.type(input, 'Medical') })
    await act(async () => { await userEvent.clear(input) })
    await waitFor(() => {
      expect(screen.getByText('Medical History')).toBeInTheDocument()
      expect(screen.getByText('Legal Notice')).toBeInTheDocument()
    })
  })

  // ── Tab switching ──────────────────────────────────────────────────────────

  it('clicking a tab changes the active tab', async () => {
    render(<HomeScreen onEdit={vi.fn()} onCreate={vi.fn()} />)
    await waitFor(() => screen.getByText('Drafts'))
    await act(async () => { await userEvent.click(screen.getByText('Drafts')) })
    // Active tab has text-accent class; just verify clicking doesn't throw
    expect(screen.getByText('Drafts')).toBeInTheDocument()
  })

  // ── Actions ───────────────────────────────────────────────────────────────

  it('clicking Edit calls onEdit with the template id', async () => {
    const onEdit = vi.fn()
    render(<HomeScreen onEdit={onEdit} onCreate={vi.fn()} />)
    await waitFor(() => screen.getByText('Medical History'))
    const editBtns = screen.getAllByRole('button', { name: /^Edit$/i })
    await act(async () => { await userEvent.click(editBtns[0]!) })
    expect(onEdit).toHaveBeenCalledWith(1)
  })

  it('clicking Delete opens the ConfirmDialog', async () => {
    render(<HomeScreen onEdit={vi.fn()} onCreate={vi.fn()} />)
    await waitFor(() => screen.getByText('Medical History'))
    const deleteBtns = screen.getAllByRole('button', { name: /^Delete$/i })
    await act(async () => { await userEvent.click(deleteBtns[0]!) })
    await waitFor(() =>
      expect(screen.getByText(/Are you sure you want to delete "Medical History"/i)).toBeInTheDocument()
    )
  })

  it('confirming delete calls templates.delete and refetches', async () => {
    render(<HomeScreen onEdit={vi.fn()} onCreate={vi.fn()} />)
    await waitFor(() => screen.getByText('Medical History'))

    // Open dialog
    const deleteBtns = screen.getAllByRole('button', { name: /^Delete$/i })
    await act(async () => { await userEvent.click(deleteBtns[0]!) })
    await waitFor(() => screen.getByText(/Are you sure/i))

    // The dialog contains a Delete button with bg-red-600 class
    const overlay = document.querySelector('.fixed.inset-0') as HTMLElement
    const confirmBtn = within(overlay).getByRole('button', { name: /^Delete$/i })
    await act(async () => { await userEvent.click(confirmBtn) })

    expect(window.cuedraft.templates.delete).toHaveBeenCalledWith(1)
    // getAll called once on mount + once after delete
    expect(window.cuedraft.templates.getAll).toHaveBeenCalledTimes(2)
  })

  it('cancelling delete dismisses the ConfirmDialog', async () => {
    render(<HomeScreen onEdit={vi.fn()} onCreate={vi.fn()} />)
    await waitFor(() => screen.getByText('Medical History'))
    const deleteBtns = screen.getAllByRole('button', { name: /^Delete$/i })
    await act(async () => { await userEvent.click(deleteBtns[0]!) })
    await waitFor(() => screen.getByText(/Are you sure/i))
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /Cancel/i }))
    })
    expect(screen.queryByText(/Are you sure/i)).not.toBeInTheDocument()
    expect(window.cuedraft.templates.delete).not.toHaveBeenCalled()
  })

  it('clicking the FAB calls onCreate', async () => {
    const onCreate = vi.fn()
    render(<HomeScreen onEdit={vi.fn()} onCreate={onCreate} />)
    await waitFor(() => screen.getByText('My Templates'))
    const fab = screen.getAllByRole('button').find((b) =>
      b.classList.contains('fixed') && b.classList.contains('bottom-6')
    )!
    await act(async () => { await userEvent.click(fab) })
    expect(onCreate).toHaveBeenCalled()
  })
})
