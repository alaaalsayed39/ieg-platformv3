import { statusBadgeClass, statusLabel } from '../../utils/format'

export default function StatusBadge({ status }) {
  if (!status) return null
  return <span className={statusBadgeClass(status)}>{statusLabel(status)}</span>
}
