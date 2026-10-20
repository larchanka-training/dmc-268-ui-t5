import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { SeverityBadge } from './SeverityBadge'

describe('SeverityBadge', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders the critical severity with a Russian label', () => {
    render(<SeverityBadge severity="critical" />)

    expect(screen.getByTestId('severity-badge-critical')).toHaveTextContent(
      'Критично',
    )
  })

  it('renders the warning severity with a Russian label', () => {
    render(<SeverityBadge severity="warning" />)

    expect(screen.getByTestId('severity-badge-warning')).toHaveTextContent(
      'Предупреждение',
    )
  })

  it('renders the info severity with a Russian label', () => {
    render(<SeverityBadge severity="info" />)

    expect(screen.getByTestId('severity-badge-info')).toHaveTextContent('Инфо')
  })
})
