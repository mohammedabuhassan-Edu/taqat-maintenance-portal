import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Link } from 'react-router'
import { Button } from './button'

describe('Button', () => {
  it('renders as a link when asChild is used', () => {
    render(
      <MemoryRouter>
        <Button asChild>
          <Link to="/somewhere">Go</Link>
        </Button>
      </MemoryRouter>,
    )
    const link = screen.getByRole('link', { name: 'Go' })
    expect(link).toHaveAttribute('href', '/somewhere')
    expect(link.className).toContain('inline-flex')
  })

  it('shows a spinner and disables while loading', () => {
    render(<Button loading>Save</Button>)
    const btn = screen.getByRole('button', { name: 'Save' })
    expect(btn).toBeDisabled()
    expect(btn.querySelector('svg')).not.toBeNull()
  })
})
