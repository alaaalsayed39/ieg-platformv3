import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Shield, Star, MessageSquare } from "lucide-react";
import api, { getAssetUrl } from "../../config/api";
import Spinner from "../../components/ui/Spinner";
import { formatCurrency } from "../../utils/format";
import { useChatStore } from "../../store/chatStore";
import toast from "react-hot-toast";

export default function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { initiateConversation } = useChatStore();
  const [product, setProduct] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);

  const handleContactExporter = async () => {
    const exporter = product?.exporterId;
    if (!exporter?._id) return;
    try {
      await initiateConversation(exporter._id);
      navigate("/buyer/messages");
    } catch (_) {
      // toast error handled in store
    }
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get(`/products/${id}`)
      .then((r) => {
        const p = r.data.data;
        setProduct(p);
        return api.get(`/products?category=${p.category}&limit=4`);
      })
      .then((r) => {
        const list = (r.data.data || []).filter((p) => p._id !== id).slice(0, 4);
        setSimilar(list);
      })
      .catch(() => toast.error("Product not found"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner size="lg" />;
  if (!product) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400">Product not found</p>
        <button onClick={() => navigate("/buyer/marketplace")} className="btn-gold mt-4">
          Back to Marketplace
        </button>
      </div>
    );
  }

  const images = product.images?.length
    ? product.images.map((i) => getAssetUrl(i.url))
    : ["https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=600"];

  const exporter = product.exporterId;

  return (
    <div className="space-y-6 animate-fade-in">
      <button
        onClick={() => navigate("/buyer/marketplace")}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
      >
        <ArrowLeft size={16} /> Back to Marketplace
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="ieg-card overflow-hidden mb-3">
            <img src={images[activeImg]} alt={product.nameEn} className="w-full h-80 object-cover" />
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`rounded-lg overflow-hidden border-2 ${activeImg === i ? "border-gold-500" : "border-transparent"}`}
                >
                  <img src={img} alt="" className="w-full h-16 object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs text-gold-500 font-semibold uppercase tracking-wider mb-1">
            {product.category}
          </p>
          <h1 className="font-display font-bold text-2xl text-white mb-2">{product.nameEn}</h1>
          {product.nameAr && <p className="text-slate-400 text-sm mb-4" dir="rtl">{product.nameAr}</p>}

          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl font-bold text-gold-500">
              {formatCurrency(product.pricing?.pricePerUnit)} / {product.pricing?.unit}
            </span>
            {product.rating > 0 && (
              <span className="flex items-center gap-1 text-sm text-slate-400">
                <Star size={14} className="text-gold-500 fill-gold-500" /> {product.rating}
              </span>
            )}
          </div>

          {exporter && (
            <div className="ieg-card p-4 mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center font-bold text-blue-400">
                  {(exporter.companyName || exporter.fullName || "?").charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">
                    {exporter.companyName || exporter.fullName}
                  </p>
                  <p className="text-xs text-slate-500">{exporter.country}</p>
                  {exporter.isVerified && (
                    <p className="text-xs text-emerald-400 flex items-center gap-1 mt-0.5">
                      <Shield size={10} /> Verified Exporter
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={handleContactExporter}
                className="btn-gold flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg hover:scale-105 active:scale-95 transition"
              >
                <MessageSquare size={13} /> Chat
              </button>
            </div>
          )}

          <p className="text-slate-400 text-sm leading-relaxed mb-4">
            {product.description || "No description provided."}
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
            <div className="ieg-card p-3">
              <p className="text-slate-500 text-xs">MOQ</p>
              <p className="text-white font-semibold">
                {product.moq} {product.pricing?.unit}
              </p>
            </div>
            <div className="ieg-card p-3">
              <p className="text-slate-500 text-xs">Available</p>
              <p className="text-white font-semibold">
                {product.inventory?.quantity ?? 0} {product.inventory?.unit || product.pricing?.unit}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate("/buyer/marketplace", { state: { quoteProductId: product._id } })}
            className="btn-gold w-full py-3"
          >
            Submit Purchase Request
          </button>
        </div>
      </div>

      {similar.length > 0 && (
        <div>
          <h3 className="font-display font-bold text-white mb-4">Similar Products</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {similar.map((p) => (
              <Link
                key={p._id}
                to={`/buyer/marketplace/${p._id}`}
                className="ieg-card p-0 overflow-hidden hover:border-gold-500/30 transition"
              >
                <img
                  src={getAssetUrl(p.images?.[0]?.url) || "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=300"}
                  alt={p.nameEn}
                  className="w-full h-28 object-cover"
                />
                <div className="p-3">
                  <p className="text-xs font-semibold text-white truncate">{p.nameEn}</p>
                  <p className="text-xs text-gold-500 mt-1">
                    {formatCurrency(p.pricing?.pricePerUnit)}/{p.pricing?.unit}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
