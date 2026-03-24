/* @vitest-environment happy-dom */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppearanceScreen } from '../../../renderer/settings/AppearanceScreen'

// Spy on applyAllSettings so we can assert live-preview calls
vi.mock('../../../renderer/theme', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../renderer/theme')>()
  return {
    ...actual,
    applyAllSettings: vi.fn(),
  }
})

import { applyAllSettings } from '../../../renderer/theme'
const applyAllSettingsMock = applyAllSettings as ReturnType<typeof vi.fn>

describe('AppearanceScreen', () => {
  beforeEach(() => {
    applyAllSettingsMock.mockClear()
  })

  // ── Rendering ─────────────────────────────────────────────────────────────

  it('renders Visual Interface section', async () => {
    render(<AppearanceScreen />)
    await waitFor(() =>
      expect(screen.getByText(/Visual Interface/i)).toBeInTheDocument()
    )
  })

  it('renders all three theme cards (Light, Dark, Auto)', async () => {
    render(<AppearanceScreen />)
    await waitFor(() => {
      expect(screen.getByText('Light')).toBeInTheDocument()
      expect(screen.getByText('Dark')).toBeInTheDocument()
      expect(screen.getByText('Auto')).toBeInTheDocument()
    })
  })

  it('renders Typography Foundry section', async () => {
    render(<AppearanceScreen />)
    await waitFor(() =>
      expect(screen.getByText(/Typography Foundry/i)).toBeInTheDocument()
    )
  })

  it('renders Glass Transmission section with opacity slider', async () => {
    render(<AppearanceScreen />)
    await waitFor(() => {
      expect(screen.getByText(/Glass Transmission/i)).toBeInTheDocument()
      expect(screen.getByRole('slider')).toBeInTheDocument()
    })
  })

  it('renders Structural Geometry section with Sharp/Subtle/Round options', async () => {
    render(<AppearanceScreen />)
    await waitFor(() => {
      expect(screen.getByText(/Structural Geometry/i)).toBeInTheDocument()
      expect(screen.getByText('Sharp')).toBeInTheDocument()
      expect(screen.getByText('Subtle')).toBeInTheDocument()
      expect(screen.getByText('Round')).toBeInTheDocument()
    })
  })

  it('renders Accent Color section with all 10 colors', async () => {
    render(<AppearanceScreen />)
    await waitFor(() => {
      expect(screen.getByText(/Accent Color/i)).toBeInTheDocument()
      expect(screen.getByText('Teal')).toBeInTheDocument()
      expect(screen.getByText('Blue')).toBeInTheDocument()
      expect(screen.getByText('Purple')).toBeInTheDocument()
      expect(screen.getByText('Orange')).toBeInTheDocument()
      expect(screen.getByText('Mint')).toBeInTheDocument()
    })
  })

  // ── Live preview ───────────────────────────────────────────────────────────

  it('calls applyAllSettings immediately when settings load', async () => {
    render(<AppearanceScreen />)
    await waitFor(() => expect(applyAllSettingsMock).toHaveBeenCalled())
  })

  it('calls applyAllSettings when a different theme is selected', async () => {
    render(<AppearanceScreen />)
    await waitFor(() => screen.getByText('Light'))
    await act(async () => {
      await userEvent.click(screen.getByText('Light'))
    })
    expect(applyAllSettingsMock).toHaveBeenCalledWith(
      expect.objectContaining({ theme: 'light' })
    )
  })

  it('calls applyAllSettings when an accent color is selected', async () => {
    render(<AppearanceScreen />)
    await waitFor(() => screen.getByText('Indigo'))
    await act(async () => {
      await userEvent.click(screen.getByText('Indigo'))
    })
    expect(applyAllSettingsMock).toHaveBeenCalledWith(
      expect.objectContaining({ accentColor: 'indigo' })
    )
  })

  it('calls applyAllSettings when a border radius option is selected', async () => {
    render(<AppearanceScreen />)
    await waitFor(() => screen.getByText('Round'))
    await act(async () => {
      await userEvent.click(screen.getByText('Round'))
    })
    expect(applyAllSettingsMock).toHaveBeenCalledWith(
      expect.objectContaining({ borderRadius: 'round' })
    )
  })

  it('calls applyAllSettings when a font is selected', async () => {
    render(<AppearanceScreen />)
    await waitFor(() => screen.getByRole('combobox'))
    await act(async () => {
      await userEvent.selectOptions(screen.getByRole('combobox'), 'geist')
    })
    expect(applyAllSettingsMock).toHaveBeenCalledWith(
      expect.objectContaining({ font: 'geist' })
    )
  })

  // ── Save / Discard ─────────────────────────────────────────────────────────

  it('Save Changes button is disabled (dim) when no changes', async () => {
    render(<AppearanceScreen />)
    const btn = await waitFor(() => screen.getByRole('button', { name: /Save Changes/i }))
    // cursor-default class indicates disabled state
    expect(btn.className).toContain('cursor-default')
  })

  it('Save Changes button becomes active after a draft change', async () => {
    render(<AppearanceScreen />)
    await waitFor(() => screen.getByText('Light'))
    await act(async () => {
      await userEvent.click(screen.getByText('Light'))
    })
    const btn = screen.getByRole('button', { name: /Save Changes/i })
    expect(btn.className).toContain('cursor-pointer')
  })

  it('clicking Save Changes calls settings.set with the updated draft', async () => {
    render(<AppearanceScreen />)
    await waitFor(() => screen.getByText('Light'))
    await act(async () => {
      await userEvent.click(screen.getByText('Light'))
    })
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /Save Changes/i }))
    })
    expect(window.cuedraft.settings.set).toHaveBeenCalledWith(
      expect.objectContaining({ theme: 'light' })
    )
  })

  it('clicking Discard reverts draft and calls applyAllSettings with saved values', async () => {
    render(<AppearanceScreen />)
    await waitFor(() => screen.getByText('Light'))

    // Make a change
    await act(async () => {
      await userEvent.click(screen.getByText('Light'))
    })

    applyAllSettingsMock.mockClear()

    // Discard
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /Discard/i }))
    })

    // Should revert to saved (dark) settings
    expect(applyAllSettingsMock).toHaveBeenCalledWith(
      expect.objectContaining({ theme: 'dark' })
    )
  })

  it('shows "Unsaved changes" indicator when draft differs from saved', async () => {
    render(<AppearanceScreen />)
    await waitFor(() => screen.getByText('Light'))
    await act(async () => {
      await userEvent.click(screen.getByText('Light'))
    })
    expect(screen.getByText(/Unsaved changes/i)).toBeInTheDocument()
  })

  it('shows "Config Synchronized" when draft matches saved', async () => {
    render(<AppearanceScreen />)
    await waitFor(() =>
      expect(screen.getByText(/Config Synchronized/i)).toBeInTheDocument()
    )
  })
})
