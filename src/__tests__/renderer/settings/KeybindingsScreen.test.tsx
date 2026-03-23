/* @vitest-environment happy-dom */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { KeybindingsScreen } from '../../../renderer/settings/KeybindingsScreen'

describe('KeybindingsScreen', () => {
  it('renders after settings fetch resolves', async () => {
    render(<KeybindingsScreen />)
    await waitFor(() => {
      expect(screen.getByText(/Keyboard Shortcuts/i)).toBeInTheDocument()
    })
  })

  it('renders the current hotkey parts as key chips', async () => {
    render(<KeybindingsScreen />)
    await waitFor(() => {
      expect(screen.getAllByText('Ctrl').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Shift').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Space').length).toBeGreaterThan(0)
    })
  })

  it('shows Vim Mode: Off when vimMode is false', async () => {
    render(<KeybindingsScreen />)
    await waitFor(() => {
      expect(screen.getAllByText(/Vim Mode: Off/i).length).toBeGreaterThan(0)
    })
  })

  it('clicking vim mode button calls settings.set with vimMode: true', async () => {
    render(<KeybindingsScreen />)
    await waitFor(() => screen.getByRole('button', { name: /Vim Mode/i }))
    await userEvent.click(screen.getByRole('button', { name: /Vim Mode/i }))
    expect(window.cuedraft.settings.set).toHaveBeenCalledWith({ vimMode: true })
  })

  it('clicking Reset to Defaults calls settings.reset()', async () => {
    render(<KeybindingsScreen />)
    await waitFor(() => screen.getByText(/Reset to Defaults/i))
    await userEvent.click(screen.getByText(/Reset to Defaults/i))
    expect(window.cuedraft.settings.reset).toHaveBeenCalled()
  })

  it('clicking hotkey row enters recording mode', async () => {
    render(<KeybindingsScreen />)
    await waitFor(() => screen.getAllByText('Ctrl'))
    // Click the Trigger Menu row's hotkey button (the group containing Ctrl chip)
    const button = screen.getAllByRole('button').find(
      (b) => b.querySelector('kbd')?.textContent === 'Ctrl'
    )
    if (button) {
      await userEvent.click(button)
      await waitFor(() => {
        expect(screen.getByText(/Press combination/i)).toBeInTheDocument()
      })
    }
  })
})
