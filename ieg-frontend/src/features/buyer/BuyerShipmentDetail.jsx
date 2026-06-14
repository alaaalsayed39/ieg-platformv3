import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Truck } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import StatusBadge from '../../components/ui/StatusBadge'
import Spinner from '../../components/ui/Spinner'
import { ShipmentStagesList, ShipmentPipeline, ShipmentSummaryCard } from '../../components/shipments/ShipmentTimeline'
import { formatCurrency } from '../../utils/format'
import api from '../../config/api'
import toast from 'react-hot-toast'

export default function BuyerShipmentDetail() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [shipment, setShipment] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/shipments/by-order/${orderId}`)
      .then((r) => setShipment(r.data.data))
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Shipment not found')
        navigate('/buyer/orders')
      })
      .finally(() => setLoading(false))
  }, [orderId, navigate])

  if (loading) return <Spinner size="lg" />
  if (!shipment) return null

  const order = shipment.orderId

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Shipment Tracking"
        subtitle={order?.orderNumber ? `Order ${order.orderNumber}` : 'Live container tracking'}
        actions={
          <Link to="/buyer/orders" className="btn-ghost flex items-center gap-2 text-sm">
            <ArrowLeft size={14} /> Back to Orders
          </Link>
        }
      />

      <div className="ieg-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Truck size={20} className="text-purple-400" />
            </div>
            <div>
              <p className="font-mono font-bold text-gold-500">{shipment.containerNumber}</p>
              <p className="text-xs text-slate-500">{order?.productName}</p>
            </div>
          </div>
          <StatusBadge status={shipment.status} />
        </div>

        <ShipmentSummaryCard shipment={shipment} />

        {order && (
          <div className="pt-3 border-t border-white/5 text-sm flex flex-wrap gap-6">
            <div>
              <p className="text-[10px] text-slate-500 uppercase">Order Value</p>
              <p className="text-gold-500 font-bold">{formatCurrency(order.totalValueUsd)}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase">Shipper</p>
              <p className="text-slate-300">{shipment.shipperId?.companyName || shipment.shipperId?.fullName || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase">Exporter</p>
              <p className="text-slate-300">{shipment.exporterId?.companyName || shipment.exporterId?.fullName || '—'}</p>
            </div>
          </div>
        )}
      </div>

      <div className="ieg-card p-5">
        <h3 className="font-display font-bold text-white mb-4">Progress</h3>
        <ShipmentPipeline status={shipment.status} stages={shipment.stages} />
      </div>

      <div className="ieg-card p-5">
        <h3 className="font-display font-bold text-white mb-4">Tracking Timeline</h3>
        <ShipmentStagesList stages={shipment.stages} />
      </div>
    </div>
  )
}
