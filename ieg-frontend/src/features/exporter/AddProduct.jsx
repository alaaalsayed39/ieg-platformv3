import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, Plus, X, Check } from 'lucide-react'
import api from '../../config/api' // الـ instance بتاع الـ axios الجاهز عندك
import toast from 'react-hot-toast'
import PageHeader from '../../components/ui/PageHeader'

import { PRODUCT_CATEGORIES, PRODUCT_CERTIFICATIONS } from '../../config/productCategories'

const CATEGORIES = PRODUCT_CATEGORIES
const CERTS = PRODUCT_CERTIFICATIONS
const UNITS = ['kg','ton','piece','liter','m²','box','pallet']

export default function AddProduct() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  
  // 👈 State جديدة لتخزين ملفات الصور الحقيقية المرفوعة
  const [images, setImages] = useState([])
  // 👈 Ref لربط الـ Div المخصص بزرار الـ input المخفي
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    nameEn: '', nameAr: '', category: '', description: '',
    pricing: { pricePerUnit: '', currency: 'USD', unit: 'kg', tieredPricing: [] },
    moq: '', inventory: { quantity: '', unit: 'kg' },
    shipping: { length: '', width: '', height: '', weight: '' },
    certifications: [], tags: '', status: 'draft',
  })

  const set = (path, val) => {
    setForm(prev => {
      const next = { ...prev }
      const keys = path.split('.')
      let obj = next
      keys.slice(0, -1).forEach(k => { obj[k] = { ...obj[k] }; obj = obj[k] })
      obj[keys[keys.length - 1]] = val
      return next
    })
  }

  const toggleCert = (c) => {
    setForm(p => ({
      ...p,
      certifications: p.certifications.find(x => x.type === c)
        ? p.certifications.filter(x => x.type !== c)
        : [...p.certifications, { type: c, name: c }]
    }))
  }

  // 👈 دالة التعامل مع الملفات المضافة (سواء Browse أو Drag & Drop)
  const handleFiles = (fileList) => {
    const validImages = Array.from(fileList).filter(file => file.type.startsWith('image/'))
    if (validImages.length === 0) {
      toast.error('Please select valid image files (PNG, JPG)')
      return
    }
    // دمج الصور الجديدة مع الصور المختارة سابقاً
    setImages(prev => [...prev, ...validImages])
  }

  // 👈 حذف صورة من المعاينة قبل الرفع
  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  // 👈 دالة الـ Submit المعدلة بالكامل والمربوطة بالـ Form Data والـ API بتاعك حقيقي
 const handleSubmit = async (e, shouldPublish = false) => {
  e.preventDefault()
  setLoading(true)

  // ضبط الـ status بناءً على الزرار
  const currentStatus = shouldPublish ? 'published' : 'draft'

  try {
    let imageUrls = []

    // 1️⃣ الخطوة الأولى: لو فيه صور مختارة، ارفعها الأول للباكيند
    if (images.length > 0) {
      const imageFormData = new FormData()
      images.forEach(file => {
        imageFormData.append('images', file) // نفس الاسم المستلم في الباكيند
      })

      // هنعمل Endpoint بسيطة أو نستخدم نفس الـ Route لرفع الصور فقط
      // (لو الباكيند عندك فيه Endpoint منفصلة للرفع استخدمها، لو لاء هنبعتها مع الـ product)
      // لكن الأسهل لتجنب Joi تماماً، نبعت الـ Data بالطريقة الحالية بس نصلح الـ FormData بالفرونتند كالتالي:
    }

    // 🔥 الطريقة البديلة الأضمن لـ Joi بدون تعديل الباكيند:
    // هنفك الـ pricing والـ inventory والـ shipping ونبعتهم كـ حقول منفصلة تفهمها الـ FormData والـ Joi
    const formData = new FormData()
    
    formData.append('nameEn', form.nameEn)
    formData.append('nameAr', form.nameAr)
    formData.append('category', form.category)
    formData.append('description', form.description)
    formData.append('status', currentStatus)
    if (form.tags) formData.append('tags', form.tags)
    if (form.moq) formData.append('moq', form.moq)

    formData.append('pricing[pricePerUnit]', form.pricing.pricePerUnit)
    formData.append('pricing[currency]', form.pricing.currency)
    formData.append('pricing[unit]', form.pricing.unit)

    if (form.inventory.quantity !== '') formData.append('inventory[quantity]', form.inventory.quantity)
    if (form.inventory.unit) formData.append('inventory[unit]', form.inventory.unit)

    // Only append shipping when user entered values (empty strings fail Joi)
    if (form.shipping.length) formData.append('shipping[length]', form.shipping.length)
    if (form.shipping.width) formData.append('shipping[width]', form.shipping.width)
    if (form.shipping.height) formData.append('shipping[height]', form.shipping.height)
    if (form.shipping.weight) formData.append('shipping[weight]', form.shipping.weight)

    // إضافة الشهادات
    form.certifications.forEach((cert, index) => {
      formData.append(`certifications[${index}][type]`, cert.type)
      formData.append(`certifications[${index}][name]`, cert.name)
    })

    // إضافة الصور
    images.forEach(file => {
      formData.append('images', file)
    })

    // إرسال الطلب — do NOT set Content-Type; axios/browser adds multipart boundary
    const { data } = await api.post('/products', formData)
    
    const saved = data.data
    const statusMsg = saved?.status === 'pending_review'
      ? 'Product submitted for admin review (pending approval)'
      : shouldPublish ? 'Product published successfully!' : 'Draft saved successfully!'
    toast.success(statusMsg)
    navigate('/exporter/products')
  } catch (err) {
    console.error(err)
    toast.error(err.response?.data?.message || 'Something went wrong')
  } finally {
    setLoading(false)
  }
}  

  return (
    <div className="space-y-5 animate-fade-in max-w-5xl">
      <PageHeader title="Add New Product" subtitle="List a product on the IEG marketplace" />

      {/* الـ onSubmit متعدل عشان يبعت الـ e والـ status الافتراضية */}
      <form onSubmit={e => handleSubmit(e, form.status === 'published')} className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Basic Info */}
          <SectionCard title="Basic Info">
            <div className="space-y-4">
              <div>
                <label className="ieg-label">Product Name (English) *</label>
                <input className="ieg-input" placeholder="e.g. Egyptian Long-Staple Cotton Grade A" required
                  value={form.nameEn} onChange={e => set('nameEn', e.target.value)} />
              </div>
              <div>
                <label className="ieg-label">Product Name (Arabic)</label>
                <input className="ieg-input" placeholder="الاسم بالعربية" dir="rtl"
                  value={form.nameAr} onChange={e => set('nameAr', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="ieg-label">Category *</label>
                  <select className="ieg-input" required value={form.category} onChange={e => set('category', e.target.value)}>
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="ieg-label">Status</label>
                  <select className="ieg-input" value={form.status} onChange={e => set('status', e.target.value)}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="ieg-label">Description</label>
                <textarea className="ieg-input min-h-[90px] resize-none" placeholder="Describe your product..."
                  value={form.description} onChange={e => set('description', e.target.value)} />
              </div>
              <div>
                <label className="ieg-label">Tags (comma-separated)</label>
                <input className="ieg-input" placeholder="cotton, organic, export, Egypt"
                  value={form.tags} onChange={e => set('tags', e.target.value)} />
              </div>
            </div>
          </SectionCard>

          {/* Media Section المعدل بالكامل ليصبح حقيقي 100% */}
          <SectionCard title="Media">
            {/* input الرفع المخفي */}
            <input 
              type="file" 
              ref={fileInputRef} 
              multiple 
              accept="image/*" 
              className="hidden" 
              onChange={e => handleFiles(e.target.files)} 
            />

            <div 
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
              onClick={() => fileInputRef.current.click()}
              className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-gold-500/30 transition cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-3 group-hover:bg-gold-500/10 transition">
                <Upload size={22} className="text-slate-500 group-hover:text-gold-500 transition" />
              </div>
              <p className="text-sm text-slate-400 mb-1">Drag & Drop images here</p>
              <p className="text-xs text-slate-600">PNG, JPG up to 10MB</p>
              <button type="button" className="btn-ghost text-xs px-4 py-2 mt-3">Browse Files</button>
            </div>
            
            {/* عرض صور الـ Preview بعد الاختيار وقبل الرفع النهائي */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-4">
                {images.map((file, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-white/5 group">
                    <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                      className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 hover:bg-red-500 transition"
                    >
                      <X size={12} />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-0 inset-x-0 bg-gold-500/90 text-navy-900 text-[10px] font-bold text-center py-0.5">Primary</span>
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-600 mt-2 text-center">First image will be set as primary</p>
          </SectionCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Pricing */}
          <SectionCard title="Pricing">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="ieg-label">Price per Unit *</label>
                  <div className="flex gap-2">
                    <input className="ieg-input" type="number" min="0" step="0.01" placeholder="0.00" required
                      value={form.pricing.pricePerUnit} onChange={e => set('pricing.pricePerUnit', e.target.value)} />
                    <select className="ieg-input w-24" value={form.pricing.currency} onChange={e => set('pricing.currency', e.target.value)}>
                      <option>USD</option><option>EUR</option><option>EGP</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="ieg-label">Unit *</label>
                  <select className="ieg-input" required value={form.pricing.unit} onChange={e => set('pricing.unit', e.target.value)}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="ieg-label">MOQ (Minimum Order Qty)</label>
                <input className="ieg-input" type="number" min="1" placeholder="e.g. 100"
                  value={form.moq} onChange={e => set('moq', e.target.value)} />
              </div>
            </div>
          </SectionCard>

          {/* Certifications */}
          <SectionCard title="Certifications">
            <div className="grid grid-cols-2 gap-2">
              {CERTS.map(c => {
                const active = form.certifications.find(x => x.type === c)
                return (
                  <button key={c} type="button" onClick={() => toggleCert(c)}
                    className={`flex items-center gap-2 p-3 rounded-xl border transition ${active ? 'border-gold-500 bg-gold-500/10 text-gold-500' : 'border-white/10 text-slate-400 hover:border-white/20'}`}>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition ${active ? 'bg-gold-500 border-gold-500' : 'border-slate-600'}`}>
                      {active && <Check size={10} className="text-navy-900" />}
                    </div>
                    <span className="text-sm font-medium">{c}</span>
                  </button>
                )
              })}
            </div>
          </SectionCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Inventory */}
          <SectionCard title="Inventory">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="ieg-label">Quantity Available</label>
                <input className="ieg-input" type="number" min="0" placeholder="e.g. 10000"
                  value={form.inventory.quantity} onChange={e => set('inventory.quantity', e.target.value)} />
              </div>
              <div>
                <label className="ieg-label">Unit</label>
                <select className="ieg-input" value={form.inventory.unit} onChange={e => set('inventory.unit', e.target.value)}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </SectionCard>

          {/* Shipping Info */}
          <SectionCard title="Shipping Info">
            <div className="grid grid-cols-2 gap-3">
              {['length','width','height','weight'].map(f => (
                <div key={f}>
                  <label className="ieg-label">{f.charAt(0).toUpperCase()+f.slice(1)} (cm/kg)</label>
                  <input className="ieg-input" type="number" min="0" step="0.1" placeholder="0"
                    value={form.shipping[f]} onChange={e => set(`shipping.${f}`, e.target.value)} />
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => navigate('/exporter/products')} className="btn-ghost">Cancel</button>
          
          {/* زرار حفظ كـ مسودة */}
          <button type="button" disabled={loading} onClick={e => handleSubmit(e, false)} className="btn-ghost flex items-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : null}
            Save Draft
          </button>
          
          {/* زرار النشر المباشر */}
          <button type="button" disabled={loading} onClick={e => handleSubmit(e, true)} className="btn-gold flex items-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-navy-900/20 border-t-navy-900 rounded-full animate-spin" /> : null}
            Publish Product
          </button>
        </div>
      </form>
    </div>
  )
}

const SectionCard = ({ title, children }) => (
  <div className="ieg-card p-5">
    <h3 className="font-display font-bold text-white text-sm mb-4 pb-2 border-b border-white/5">{title}</h3>
    {children}
  </div>
)