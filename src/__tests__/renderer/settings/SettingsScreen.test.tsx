/* @vitest-environment happy-dom */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsScreen } from '../../../renderer/settings/SettingsScreen'

describe('SettingsScreen', () => {
  // ── Rendering ─────────────────────────────────────────────────────────────

  it('renders after settings load', async () => {
    render(<SettingsScreen />)
    await waitFor(() =>
      expect(screen.getByText(/Startup & System Behavior/i)).toBeInTheDocument()
    )
  })

  it('renders Launch at startup card', async () => {
    render(<SettingsScreen />)
    await waitFor(() =>
      expect(screen.getByText(/Launch at startup/i)).toBeInTheDocument()
    )
  })

  it('renders Show in system tray card', async () => {
    render(<SettingsScreen />)
    await waitFor(() =>
      expect(screen.getByText(/Show in system tray/i)).toBeInTheDocument()
    )
  })

  it('renders Workflow Engine section', async () => {
    render(<SettingsScreen />)
    await waitFor(() =>
      expect(screen.getByText(/Workflow Engine/i)).toBeInTheDocument()
    )
  })

  it('renders injection method Type and Clipboard buttons', async () => {
    render(<SettingsScreen />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Type$/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^Clipboard$/i })).toBeInTheDocument()
    })
  })

  it('renders Privacy Mode toggle', async () => {
    render(<SettingsScreen />)
    await waitFor(() =>
      expect(screen.getByText(/Privacy Mode/i)).toBeInTheDocument()
    )
  })

  it('renders stat cards', async () => {
    render(<SettingsScreen />)
    await waitFor(() => {
      expect(screen.getByText('Database Size')).toBeInTheDocument()
      expect(screen.getByText('Last Sync')).toBeInTheDocument()
      expect(screen.getByText('Memory Hook')).toBeInTheDocument()
    })
  })

  // ── Save / Discard state ──────────────────────────────────────────────────

  it('Save Config button is in disabled state when nothing changed', async () => {
    render(<SettingsScreen />)
    const btn = await waitFor(() => screen.getByRole('button', { name: /Save Config/i }))
    expect(btn.className).toContain('cursor-default')
  })

  it('Save Config becomes active after toggling a value', async () => {
    render(<SettingsScreen />)
    // The mock returns launchAtStartup: false — find the first toggle (launch at startup)
    await waitFor(() => screen.getByText(/Launch at startup/i))
    const toggles = screen.getAllByRole('button').filter((b) =>
      b.className.includes('rounded-full') && b.className.includes('w-11')
    )
    await act(async () => { await userEvent.click(toggles[0]!) })
    const btn = screen.getByRole('button', { name: /Save Config/i })
    expect(btn.className).toContain('cursor-pointer')
  })

  it('clicking Save Config calls settings.set with the draft', async () => {
    render(<SettingsScreen />)
    await waitFor(() => screen.getByText(/Launch at startup/i))
    // Toggle launch-at-startup to make draft dirty
    const toggles = screen.getAllByRole('button').filter((b) =>
      b.className.includes('rounded-full') && b.className.includes('w-11')
    )
    await act(async () => { await userEvent.click(toggles[0]!) })
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /Save Config/i }))
    })
    expect(window.cuedraft.settings.set).toHaveBeenCalledWith(
      expect.objectContaining({ launchAtStartup: true })
    )
  })

  it('clicking Restore Defaults calls settings.reset', async () => {
    render(<SettingsScreen />)
    await waitFor(() => screen.getByRole('button', { name: /Restore Defaults/i }))
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /Restore Defaults/i }))
    })
    expect(window.cuedraft.settings.reset).toHaveBeenCalled()
  })

  // ── Injection method ──────────────────────────────────────────────────────

  it('clicking Clipboard switches the injection method', async () => {
    render(<SettingsScreen />)
    await waitFor(() => screen.getByRole('button', { name: /Clipboard/i }))
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /Clipboard/i }))
    })
    // Draft is now dirty — Save Config should be active
    const saveBtn = screen.getByRole('button', { name: /Save Config/i })
    expect(saveBtn.className).toContain('cursor-pointer')
  })

  it('clicking Type after Clipboard reverts injection method in draft', async () => {
    render(<SettingsScreen />)
    await waitFor(() => screen.getByRole('button', { name: /Clipboard/i }))
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /Clipboard/i }))
    })
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /^Type$/i }))
    })
    // Back to original — Save Config should be disabled again
    const saveBtn = screen.getByRole('button', { name: /Save Config/i })
    expect(saveBtn.className).toContain('cursor-default')
  })

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────

  it('ESC key discards draft changes', async () => {
    render(<SettingsScreen />)
    await waitFor(() => screen.getByText(/Launch at startup/i))
    const toggles = screen.getAllByRole('button').filter((b) =>
      b.className.includes('rounded-full') && b.className.includes('w-11')
    )
    await act(async () => { await userEvent.click(toggles[0]!) })
    // Confirm dirty
    expect(screen.getByRole('button', { name: /Save Config/i }).className).toContain('cursor-pointer')
    // Press ESC
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Save Config/i }).className).toContain('cursor-default')
    )
  })

  it('F5 key saves the draft', async () => {
    render(<SettingsScreen />)
    await waitFor(() => screen.getByText(/Launch at startup/i))
    const toggles = screen.getAllByRole('button').filter((b) =>
      b.className.includes('rounded-full') && b.className.includes('w-11')
    )
    await act(async () => { await userEvent.click(toggles[0]!) })
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F5', bubbles: true }))
    })
    await waitFor(() => expect(window.cuedraft.settings.set).toHaveBeenCalled())
  })
})
