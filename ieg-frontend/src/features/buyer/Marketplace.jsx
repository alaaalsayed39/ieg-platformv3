import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, SlidersHorizontal, Star, Shield, ChevronLeft, ChevronRight, Heart, X, ShoppingCart } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { formatCurrency } from '../../utils/format'
import api, { getAssetUrl } from '../../config/api'
import toast from 'react-hot-toast'
import Spinner from '../../components/ui/Spinner'

import { PRODUCT_CATEGORIES, PRODUCT_CERTIFICATIONS } from '../../config/productCategories'

const CATEGORIES = PRODUCT_CATEGORIES
const CERTS = PRODUCT_CERTIFICATIONS

export default function Marketplace() {
  const [products,   setProducts]   = useState([])
  const [total,      setTotal]      = useState(0)
  const [page,       setPage]       = useState(1)
  const [loading,    setLoading]    = useState(true)
  const [query,      setQuery]      = useState('')
  const [filters,    setFilters]    = useState({ category: '', cert: '', moq: '' })
  const [priceRange, setPriceRange] = useState(5000)
  const [saved,      setSaved]      = useState(new Set())
  const [quoteModal, setQuoteModal] = useState(null)
  const [quoteForm,  setQuoteForm]  = useState({ quantity: '', budgetMin: '', budgetMax: '', deliveryTimeline: '30 days', specialRequirements: '' })
  const [quoteLoading, setQuoteLoading] = useState(false)
  const navigate   = useNavigate()
  const location   = useLocation()
  const debounceRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 9 })
      if (query)            params.append('q', query)
      if (filters.category) params.append('category', filters.category)
      if (filters.cert)     params.append('cert', filters.cert)
      if (filters.moq)      params.append('moq', filters.moq)
      params.append('maxPrice', priceRange)
      const { data } = await api.get(`/products?${params}`)
      setProducts(data.data || [])
      setTotal(data.pagination?.total || 0)
    } catch { toast.error('Failed to load products') }
    finally { setLoading(false) }
  }, [page, query, filters, priceRange])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(load, 300)
  }, [load])

  useEffect(() => {
    const quoteProductId = location.state?.quoteProductId
    if (!quoteProductId || products.length === 0) return
    const product = products.find((p) => p._id === quoteProductId)
    if (product) {
      setQuoteModal(product)
      setQuoteForm({ quantity: product.moq || '', budgetMin: '', budgetMax: '', deliveryTimeline: '30 days', specialRequirements: '' })
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, products, navigate, location.pathname])

  const totalPages = Math.ceil(total / 9)

  const openQuote = (e, product) => {
    e.stopPropagation()
    setQuoteModal(product)
    setQuoteForm({ quantity: product.moq || '', budgetMin: '', budgetMax: '', deliveryTimeline: '30 days', specialRequirements: '' })
  }

  const submitQuote = async () => {
    if (!quoteForm.quantity) return toast.error('Quantity is required')
    setQuoteLoading(true)
    try {
      await api.post('/orders/quotes', {
        productId:            quoteModal._id,
        exporterId:           quoteModal.exporterId?._id || quoteModal.exporterId,
        productType:          quoteModal.nameEn,
        quantity:             Number(quoteForm.quantity),
        budgetMin:            Number(quoteForm.budgetMin) || undefined,
        budgetMax:            Number(quoteForm.budgetMax) || undefined,
        deliveryTimeline:     quoteForm.deliveryTimeline,
        specialRequirements:  quoteForm.specialRequirements,
      })
      toast.success('Purchase request submitted!')
      setQuoteModal(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send quote')
    } finally { setQuoteLoading(false) }
  }

  return (
    <div className="animate-fade-in">
      {/* Search bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="ieg-input pl-12 text-base h-12"
            placeholder="Search Egyptian products... (cotton, dates, olive oil)"
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1) }}
          />
        </div>
        <div className="h-12 px-4 flex items-center gap-2 bg-gold-500 text-navy-900 rounded-xl font-bold cursor-pointer hover:bg-gold-600 transition">
          <Search size={18} />
          <span className="hidden md:inline">Search</span>
        </div>
      </div>

      <div className="flex gap-5">
        {/* Sidebar */}
        <aside className="w-52 flex-shrink-0 space-y-5">
          <div className="ieg-card p-4">
            <h4 className="font-display font-bold text-white text-sm mb-3 flex items-center gap-2">
              <SlidersHorizontal size={14} /> Filters
            </h4>
            <div className="space-y-4">
              <div>
                <p className="ieg-label">Categories</p>
                <div className="space-y-1.5">
                  {CATEGORIES.map(c => (
                    <label key={c} className="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" name="cat" value={c} checked={filters.category === c}
                        onChange={() => { setFilters(f => ({ ...f, category: f.category === c ? '' : c })); setPage(1) }}
                        className="accent-gold-500" />
                      <span className={`text-xs transition ${filters.category === c ? 'text-gold-500 font-semibold' : 'text-slate-400 group-hover:text-white'}`}>{c}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="ieg-label">Certifications</p>
                <div className="space-y-1.5">
                  {CERTS.map(c => (
                    <label key={c} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={filters.cert === c}
                        onChange={() => setFilters(f => ({ ...f, cert: f.cert === c ? '' : c }))}
                        className="accent-gold-500" />
                      <span className="text-xs text-slate-400">{c}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="ieg-label">Max Price / Unit (USD)</p>
                <input type="range" min="0" max="5000" step="50" value={priceRange}
                  onChange={e => { setPriceRange(Number(e.target.value)); setPage(1) }}
                  className="w-full accent-gold-500" />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>$0</span>
                  <span className="text-gold-500 font-bold">${priceRange.toLocaleString()}</span>
                </div>
              </div>

              <button onClick={() => { setFilters({ category:'',cert:'',moq:'' }); setPriceRange(5000); setQuery(''); setPage(1) }}
                className="btn-gold w-full text-sm">Clear Filters</button>
            </div>
          </div>
        </aside>

        {/* Products grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="font-display font-bold text-gold-500 text-lg">{total.toLocaleString()}</span>
              <span className="text-slate-400 text-sm ml-2">products found</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>Page {page} / {totalPages || 1}</span>
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center disabled:opacity-30 hover:bg-white/10 transition">
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page >= totalPages}
                className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center disabled:opacity-30 hover:bg-white/10 transition">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-3 gap-4">
              {[...Array(9)].map((_,i) => <div key={i} className="ieg-card h-72 animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(p => (
                <div key={p._id} className="ieg-card overflow-hidden cursor-pointer group hover:border-gold-500/30 transition"
                  onClick={() => navigate(`/buyer/marketplace/${p._id}`)}>
                  {/* Image */}
                  <div className="relative h-44 overflow-hidden bg-navy-900">
                    {p.images?.[0]?.url ? (
                      <img src={getAssetUrl(p.images[0].url)} alt={p.nameEn} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                    )}
                    {p.isVerifiedExporter && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 bg-emerald-500/90 text-white text-[9px] font-bold px-2 py-1 rounded-full">
                        <Shield size={9} /> Verified
                      </div>
                    )}
                    <button onClick={e => { e.stopPropagation(); setSaved(s => { const n=new Set(s); n.has(p._id)?n.delete(p._id):n.add(p._id); return n }) }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 transition">
                      <Heart size={13} className={saved.has(p._id) ? 'text-red-400 fill-red-400' : 'text-white'} />
                    </button>
                    {p.moq && (
                      <div className="absolute bottom-2 left-2 bg-black/60 text-[9px] text-white px-2 py-0.5 rounded-full">
                        MOQ: {p.moq} {p.pricing?.unit}
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="p-3">
                    <p className="font-semibold text-white text-sm leading-tight truncate">{p.nameEn}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{p.category} · {p.exporterId?.companyName || p.exporterId?.fullName}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div>
                        <span className="text-gold-500 font-bold text-sm">{formatCurrency(p.pricing?.pricePerUnit)}</span>
                        <span className="text-slate-500 text-xs">/{p.pricing?.unit}</span>
                      </div>
                      {p.rating > 0 && (
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Star size={11} className="text-gold-500 fill-gold-500" /> {p.rating}
                        </div>
                      )}
                    </div>
                    <button onClick={e => openQuote(e, p)}
                      className="btn-gold w-full text-xs py-2 mt-3 flex items-center justify-center gap-1">
                      <ShoppingCart size={12} /> Request Quote
                    </button>
                  </div>
                </div>
              ))}
              {products.length === 0 && (
                <div className="col-span-3 text-center py-20">
                  <p className="text-slate-400 font-display font-bold text-lg">No products found</p>
                  <p className="text-slate-600 text-sm mt-1">Try adjusting your filters</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quote Request Modal */}
      {quoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-navy-800 border border-white/10 rounded-2xl shadow-2xl p-6 animate-slide-up mx-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-display font-bold text-white text-lg">Request Quote</h3>
                <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[280px]">{quoteModal.nameEn}</p>
              </div>
              <button onClick={() => setQuoteModal(null)} className="text-slate-500 hover:text-white transition">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="ieg-label">Quantity ({quoteModal.pricing?.unit})</label>
                <input className="ieg-input" type="number" min={quoteModal.moq || 1} placeholder={`Min ${quoteModal.moq || 1}`}
                  value={quoteForm.quantity} onChange={e => setQuoteForm(f => ({ ...f, quantity: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="ieg-label">Budget Min (USD)</label>
                  <input className="ieg-input" type="number" min="0" placeholder="e.g. 5000"
                    value={quoteForm.budgetMin} onChange={e => setQuoteForm(f => ({ ...f, budgetMin: e.target.value }))} />
                </div>
                <div>
                  <label className="ieg-label">Budget Max (USD)</label>
                  <input className="ieg-input" type="number" min="0" placeholder="e.g. 10000"
                    value={quoteForm.budgetMax} onChange={e => setQuoteForm(f => ({ ...f, budgetMax: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="ieg-label">Delivery Timeline</label>
                <select className="ieg-input" value={quoteForm.deliveryTimeline} onChange={e => setQuoteForm(f => ({ ...f, deliveryTimeline: e.target.value }))}>
                  {['7 days','14 days','21 days','30 days','45 days','60+ days'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="ieg-label">Special Requirements</label>
                <textarea className="ieg-input resize-none min-h-[70px] text-sm" placeholder="Certifications, packaging, labeling..."
                  value={quoteForm.specialRequirements} onChange={e => setQuoteForm(f => ({ ...f, specialRequirements: e.target.value }))} />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setQuoteModal(null)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={submitQuote} disabled={quoteLoading}
                className="btn-gold flex-1 flex items-center justify-center gap-2">
                {quoteLoading ? <div className="w-4 h-4 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin" /> : null}
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
