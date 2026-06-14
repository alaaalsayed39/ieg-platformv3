export const SHIPMENT_STATUSES = [
  'pickup',
  'customs_cleared',
  'in_transit',
  'arrived',
  'delivered',
  'delayed',
]

export const SHIPMENT_STATUS_LABELS = {
  pickup: 'Pickup',
  customs_cleared: 'Customs Cleared',
  in_transit: 'In Transit',
  arrived: 'Arrived',
  delivered: 'Delivered',
  delayed: 'Delayed',
}

export const SHIPMENT_STATUS_COLORS = {
  pickup: '#F5A623',
  customs_cleared: '#3b82f6',
  in_transit: '#8b5cf6',
  arrived: '#10b981',
  delivered: '#22c55e',
  delayed: '#ef4444',
}

/** Primary pipeline (excludes delayed branch) for progress bars */
export const SHIPMENT_PIPELINE = [
  'pickup',
  'customs_cleared',
  'in_transit',
  'arrived',
  'delivered',
]
