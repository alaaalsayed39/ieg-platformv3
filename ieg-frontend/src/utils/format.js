export const formatCurrency = (amount, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount ?? 0)

export const formatNumber = (n) =>
  new Intl.NumberFormat('en-US').format(n ?? 0)

export const formatDate = (date) => {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date))
}

export const formatDateShort = (date) => {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(new Date(date))
}

export const timeAgo = (date) => {
  if (!date) return ''
  const diff = Date.now() - new Date(date).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export const statusBadgeClass = (status) => {
  const map = {
    pending:    'badge-pending',
    pending_review: 'badge-pending',
    processing: 'badge-processing',
    shipped:    'badge-shipped',
    in_transit: 'badge-transit',
    delivered:  'badge-delivered',
    cancelled:  'badge-cancelled',
    approved:   'badge-approved',
    rejected:   'badge-rejected',
    expired:    'badge-expired',
    active:     'badge-approved',
    inactive:   'badge-expired',
    draft:      'badge-expired',
    published:  'badge-approved',
    new:        'badge-new',
    accepted:   'badge-approved',
    declined:   'badge-rejected',
    held:       'badge-processing',
    released:   'badge-approved',
    unpaid:     'badge-pending',
    paid:       'badge-approved',
    pickup:          'badge-pending',
    customs_cleared: 'badge-processing',
    in_transit:      'badge-transit',
    arrived:         'badge-shipped',
    delayed:         'badge-cancelled',
  }
  return `badge ${map[status] || 'badge-pending'}`
}

export const statusLabel = (status) =>
  (status || '').replace(/_/g, ' ').replace(/\w/g, c => c.toUpperCase())
