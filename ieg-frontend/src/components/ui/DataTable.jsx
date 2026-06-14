import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function DataTable({ columns, data = [], loading, emptyMsg = 'No records found', page, totalPages, onPageChange }) {
  if (loading) return (
    <div className="ieg-card overflow-hidden">
      <div className="animate-pulse p-6 space-y-3">
        {[...Array(6)].map((_, i) => <div key={i} className="h-10 bg-white/5 rounded-lg" />)}
      </div>
    </div>
  )

  return (
    <div className="ieg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="ieg-table w-full border-collapse">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="text-left whitespace-nowrap" style={{ width: col.width }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={columns.length} className="text-center py-16 text-slate-500">{emptyMsg}</td></tr>
            ) : data.map((row, i) => (
              <tr key={row._id || i} className="transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="text-sm">
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
          <span className="text-xs text-slate-500 font-display">Page {page} of {totalPages}</span>
          <div className="flex gap-1">
            <button onClick={() => onPageChange(page - 1)} disabled={page === 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-white/10 disabled:opacity-30 transition">
              <ChevronLeft size={15} />
            </button>
            <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-white/10 disabled:opacity-30 transition">
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
