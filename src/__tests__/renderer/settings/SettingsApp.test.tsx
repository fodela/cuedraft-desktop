/* @vitest-environment happy-dom */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsApp } from '../../../renderer/settings/SettingsApp'

// Prevent applyAllSettings DOM side-effects in AppearanceScreen
vi.mock('../../../renderer/theme', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../renderer/theme')>()
  return { ...actual, applyAllSettings: vi.fn() }
})

// Mock the logo PNG so Vite asset transform doesn't break in Node/happy-dom
vi.mock('../../../../assets/logo.png', () => ({ default: 'logo.png' }))

describe('SettingsApp', () => {
  beforeEach(() => {
    ;(window.cuedraft.templates.getAll as ReturnType<typeof vi.fn>).mockResolvedValue([])
    ;(window.cuedraft.templates.getCategories as ReturnType<typeof vi.fn>).mockResolvedValue([])
  })

  // ── Sidebar ────────────────────────────────────────────────────────────────

  it('renders the CUEDRAFT brand name in the sidebar', async () => {
    render(<SettingsApp />)
    await waitFor(() => expect(screen.getByText('CUEDRAFT')).toBeInTheDocument())
  })

  it('renders the current navigation items', async () => {
    render(<SettingsApp />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Templates/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Notes/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Keybindings/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Appearance/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Settings/i })).toBeInTheDocument()
    })
  })

  it('renders the user info section', async () => {
    render(<SettingsApp />)
    await waitFor(() => expect(screen.getByText('admin_root')).toBeInTheDocument())
  })

  // ── Default screen (Templates / HomeScreen) ────────────────────────────────

  it('shows the Templates screen by default', async () => {
    render(<SettingsApp />)
    await waitFor(() => expect(screen.getByText('My Templates')).toBeInTheDocument())
  })

  it('breadcrumb shows "Templates" on the default screen', async () => {
    render(<SettingsApp />)
    await waitFor(() => {
      const crumbs = screen.getAllByText('Templates')
      // At least one breadcrumb element
      expect(crumbs.length).toBeGreaterThan(0)
    })
  })

  // ── Navigation ─────────────────────────────────────────────────────────────

  it('clicking Settings renders the SettingsScreen', async () => {
    render(<SettingsApp />)
    await waitFor(() => screen.getByRole('button', { name: /^Settings$/i }))
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /^Settings$/i }))
    })
    await waitFor(() =>
      expect(screen.getByText(/Startup & System Behavior/i)).toBeInTheDocument()
    )
  })

  it('breadcrumb updates to "Settings" when navigating there', async () => {
    render(<SettingsApp />)
    await waitFor(() => screen.getByRole('button', { name: /^Settings$/i }))
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /^Settings$/i }))
    })
    await waitFor(() => {
      expect(screen.getAllByText('Settings').length).toBeGreaterThan(0)
    })
  })

  it('clicking Keybindings renders the KeybindingsScreen', async () => {
    render(<SettingsApp />)
    await waitFor(() => screen.getByRole('button', { name: /Keybindings/i }))
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /Keybindings/i }))
    })
    await waitFor(() =>
      expect(screen.getByText(/Keyboard Shortcuts/i)).toBeInTheDocument()
    )
  })

  it('clicking Appearance renders the AppearanceScreen', async () => {
    render(<SettingsApp />)
    await waitFor(() => screen.getByRole('button', { name: /Appearance/i }))
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /Appearance/i }))
    })
    await waitFor(() =>
      expect(screen.getByText(/Visual Interface/i)).toBeInTheDocument()
    )
  })

  it('clicking Templates from another screen returns to HomeScreen', async () => {
    render(<SettingsApp />)
    // Navigate away first
    await waitFor(() => screen.getByRole('button', { name: /^Settings$/i }))
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /^Settings$/i }))
    })
    await waitFor(() => screen.getByText(/Startup & System Behavior/i))
    // Navigate back to Templates
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /Templates/i }))
    })
    await waitFor(() => expect(screen.getByText('My Templates')).toBeInTheDocument())
  })

  // ── Header ─────────────────────────────────────────────────────────────────

  it('header search bar is present', async () => {
    render(<SettingsApp />)
    await waitFor(() =>
      expect(screen.getByPlaceholderText(/Search settings/i)).toBeInTheDocument()
    )
  })

  it('Ctrl+K focuses the search input', async () => {
    render(<SettingsApp />)
    await waitFor(() => screen.getByPlaceholderText(/Search settings/i))
    const input = screen.getByPlaceholderText(/Search settings/i)
    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true })
      )
    })
    await waitFor(() => expect(document.activeElement).toBe(input))
  })
})
