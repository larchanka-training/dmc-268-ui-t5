import { AlertTriangle, CircleAlert, Info, type LucideIcon } from 'lucide-react'
import { Badge, type BadgeVariant } from '@/shared/ui/badge'
import type { Severity } from '../../model/types'

type SeverityConfig = {
  label: string
  variant: BadgeVariant
  icon: LucideIcon
}

const SEVERITY_CONFIG: Record<Severity, SeverityConfig> = {
  critical: { label: 'Критично', variant: 'destructive', icon: CircleAlert },
  warning: { label: 'Предупреждение', variant: 'warning', icon: AlertTriangle },
  info: { label: 'Инфо', variant: 'info', icon: Info },
}

export interface SeverityBadgeProps {
  severity: Severity
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const { label, variant, icon: Icon } = SEVERITY_CONFIG[severity]

  return (
    <Badge variant={variant} data-testid={`severity-badge-${severity}`}>
      <Icon aria-hidden="true" className="mr-1" size={12} />
      {label}
    </Badge>
  )
}

export default SeverityBadge
