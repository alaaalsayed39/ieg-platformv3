import { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DataTable from "../../components/ui/DataTable";
import SearchBar from "../../components/ui/SearchBar";
import StatusBadge from "../../components/ui/StatusBadge";
import PageHeader from "../../components/ui/PageHeader";
import { formatCurrency } from "../../utils/format";
import api, { getAssetUrl } from "../../config/api";
import toast from "react-hot-toast";

const CATEGORIES = [
  "Agriculture",
  "Textiles",
  "Chemicals",
  "Marble",
  "Handicrafts",
  "Electronics",
  "Food & Beverage",
  "Machinery",
  "Furniture",
  "Other",
];

export default function ExporterProducts() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [statFilter, setStatFilter] = useState("");
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (catFilter) params.append("category", catFilter);
      if (statFilter) params.append("status", statFilter);
      const { data } = await api.get(`/products/my/products?${params}`);
      setProducts(data.data || []);
      setTotal(data.pagination?.total || 0);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [page, catFilter, statFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleStatus = async (id, current) => {
    const next = current === "published" ? "inactive" : "published";
    try {
      await api.patch(`/products/${id}/status`, { status: next });
      toast.success(`Product ${next}`);
      load();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success("Product deleted");
      load();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const columns = [
    {
      key: "nameEn",
      label: "Product",
      width: "260px",
      render: (v, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
            {row.images?.[0]?.url ? (
              <img
                src={getAssetUrl(row.images[0].url)}
                alt={v}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs font-bold">
                {v.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-white truncate max-w-[180px]">
              {v}
            </p>
            <p className="text-xs text-slate-500">{row.category}</p>
          </div>
        </div>
      ),
    },
    {
      key: "pricing",
      label: "Price / Unit",
      render: (v) => (
        <span className="font-bold text-gold-500">
          {formatCurrency(v?.pricePerUnit)}{" "}
          <span className="text-slate-500 font-normal text-xs">/{v?.unit}</span>
        </span>
      ),
    },
    {
      key: "inventory",
      label: "Stock",
      render: (v) => (
        <span className="text-sm">
          {v?.quantity?.toLocaleString()} {v?.unit}
        </span>
      ),
    },
    {
      key: "moq",
      label: "MOQ",
      render: (v) => <span className="text-sm text-slate-300">{v}</span>,
    },
    {
      key: "rating",
      label: "Rating",
      render: (v) => <span className="text-sm">{v > 0 ? `★ ${v}` : "—"}</span>,
    },
    {
      key: "views",
      label: "Views",
      render: (v) => (
        <span className="text-sm text-slate-400">
          {(v || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (v) => <StatusBadge status={v} />,
    },
    {
      key: "_id",
      label: "Actions",
      render: (id, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleStatus(id, row.status)}
            title="Toggle status"
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition text-xs font-bold ${row.status === "published" ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20" : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"}`}
          >
            {row.status === "published" ? "●" : "○"}
          </button>
          <button
            onClick={() => remove(id)}
            className="w-7 h-7 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="My Products"
        actions={
          <button
            onClick={() => navigate("/exporter/products/add")}
            className="btn-gold flex items-center gap-2"
          >
            <Plus size={15} /> Add New Product
          </button>
        }
      />
      <div className="flex gap-3 flex-wrap">
       
        <select
          className="ieg-input h-9 w-40 text-sm bg-[#0b132b] text-white"
          value={catFilter}
          onChange={(e) => {
            setCatFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="" className="bg-[#0b132b] text-white p-3">
            All Categories
          </option>
          {CATEGORIES.map((c) => (
            <option className="bg-[#0b132b] text-white" key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <div className="flex gap-1">
          {["", "published", "draft", "pending_review", "inactive"].map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatFilter(s);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${statFilter === s ? "bg-gold-500 text-navy-900" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}
            >
              {s || "All"}
            </button>
          ))}
        </div>
      </div>
      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        page={page}
        totalPages={Math.ceil(total / 10)}
        onPageChange={setPage}
        emptyMsg="No products yet. Add your first product!"
      />
    </div>
  );
}
