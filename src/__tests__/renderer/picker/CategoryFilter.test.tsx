/* @vitest-environment happy-dom */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CategoryFilter } from '../../../renderer/picker/CategoryFilter'

describe('CategoryFilter', () => {
  const categories = ['Medical', 'Legal', 'Personal']

  it('renders an "All" button', () => {
    render(<CategoryFilter categories={categories} activeCategory={null} onSelect={vi.fn()} />)
    expect(screen.getByText('All')).toBeInTheDocument()
  })

  it('renders a button for each category', () => {
    render(<CategoryFilter categories={categories} activeCategory={null} onSelect={vi.fn()} />)
    expect(screen.getByText('Medical')).toBeInTheDocument()
    expect(screen.getByText('Legal')).toBeInTheDocument()
    expect(screen.getByText('Personal')).toBeInTheDocument()
  })

  it('clicking "All" calls onSelect(null)', async () => {
    const onSelect = vi.fn()
    render(<CategoryFilter categories={categories} activeCategory="Medical" onSelect={onSelect} />)
    await userEvent.click(screen.getByText('All'))
    expect(onSelect).toHaveBeenCalledWith(null)
  })

  it('clicking a category calls onSelect with that category', async () => {
    const onSelect = vi.fn()
    render(<CategoryFilter categories={categories} activeCategory={null} onSelect={onSelect} />)
    await userEvent.click(screen.getByText('Medical'))
    expect(onSelect).toHaveBeenCalledWith('Medical')
  })
})
