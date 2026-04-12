/* @vitest-environment happy-dom */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HomeScreen } from '../../../renderer/settings/HomeScreen'
import type { Template } from '../../../shared/types'

const TEMPLATES: Template[] = [
  { id: 1, title: 'Medical History', content: 'PC: __COMPLAINT__', category: 'Medical', use_count: 5, last_used: null },
  { id: 2, title: 'Legal Notice', content: 'Dear Sir/Madam', category: 'Legal', use_count: 2, last_used: null },
]

function filterTemplates(search = '') {
  const normalized = search.toLowerCase()
  return TEMPLATES.filter((template) =>
    normalized.length === 0
      ? true
      : template.title.toLowerCase().includes(normalized) ||
        (template.category ?? '').toLowerCase().includes(normalized)
  )
}

describe('HomeScreen', () => {
  beforeEach(() => {
    ;(window.cuedraft.templates.list as ReturnType<typeof vi.fn>).mockImplementation(
      async (query?: { search?: string }) => {
        const items = filterTemplates(query?.search ?? '')
        return { items, total: items.length }
      }
    )
    ;(window.cuedraft.templates.delete as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)
  })

  it('renders "My Templates" heading', async () => {
    render(<HomeScreen onEdit={vi.fn()} onCreate={vi.fn()} />)
    await waitFor(() => expect(screen.getByText('My Templates')).toBeInTheDocument())
  })

  it('renders the search and action controls in the header', async () => {
    render(<HomeScreen onEdit={vi.fn()} onCreate={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search cues/i)).toBeInTheDocument()
      expect(screen.getByText('My Templates')).toBeInTheDocument()
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
      expect(screen.getByText('Medical')).toBeInTheDocument()
      expect(screen.getByText('Legal')).toBeInTheDocument()
    })
  })

  it('shows "No templates found." when list is empty', async () => {
    ;(window.cuedraft.templates.list as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [],
      total: 0,
    })
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

  it('filters templates by title as user types', async () => {
    render(<HomeScreen onEdit={vi.fn()} onCreate={vi.fn()} />)
    await waitFor(() => screen.getByText('Medical History'))
    await act(async () => {
      await userEvent.type(screen.getByPlaceholderText(/Search cues/i), 'Medical')
    })
    await waitFor(() => {
      expect(screen.getByText('Medical History')).toBeInTheDocument()
      expect(screen.queryByText('Legal Notice')).not.toBeInTheDocument()
    })
  })

  it('filters templates by category name', async () => {
    render(<HomeScreen onEdit={vi.fn()} onCreate={vi.fn()} />)
    await waitFor(() => screen.getByText('Legal Notice'))
    await act(async () => {
      await userEvent.type(screen.getByPlaceholderText(/Search cues/i), 'Legal')
    })
    await waitFor(() => {
      expect(screen.getByText('Legal Notice')).toBeInTheDocument()
      expect(screen.queryByText('Medical History')).not.toBeInTheDocument()
    })
  })

  it('shows "No templates found." when search matches nothing', async () => {
    render(<HomeScreen onEdit={vi.fn()} onCreate={vi.fn()} />)
    await waitFor(() => screen.getByText('Medical History'))
    await act(async () => {
      await userEvent.type(screen.getByPlaceholderText(/Search cues/i), 'xyzzy')
    })
    await waitFor(() =>
      expect(screen.getByText('No templates found.')).toBeInTheDocument()
    )
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

  it('renders the header actions and the FAB', async () => {
    render(<HomeScreen onEdit={vi.fn()} onCreate={vi.fn()} />)
    await waitFor(() => screen.getByText('My Templates'))
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(3)
  })

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

    const deleteBtns = screen.getAllByRole('button', { name: /^Delete$/i })
    await act(async () => { await userEvent.click(deleteBtns[0]!) })
    await waitFor(() => screen.getByText(/Are you sure/i))

    const overlay = document.querySelector('.fixed.inset-0') as HTMLElement
    const confirmBtn = within(overlay).getByRole('button', { name: /^Delete$/i })
    await act(async () => { await userEvent.click(confirmBtn) })

    expect(window.cuedraft.templates.delete).toHaveBeenCalledWith(1)
    expect(window.cuedraft.templates.list).toHaveBeenCalledTimes(2)
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
    const fab = screen.getAllByRole('button').find((button) =>
      button.classList.contains('fixed') && button.classList.contains('bottom-6')
    )!
    await act(async () => { await userEvent.click(fab) })
    expect(onCreate).toHaveBeenCalled()
  })
})
