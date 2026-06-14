/** Platform-styled select — dark theme, white text */
export default function FormSelect({ label, value, onChange, options, required, placeholder = 'Select...', className = '', error }) {
  return (
    <div className={className}>
      {label && (
        <label className="ieg-label">
          {label}
          {required ? ' *' : ''}
        </label>
      )}
      <select
        className={`ieg-select ${error ? 'border-red-500/50' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => {
          const val = typeof opt === 'string' ? opt : opt.value
          const lab = typeof opt === 'string' ? opt : opt.label
          return (
            <option key={val} value={val}>
              {lab}
            </option>
          )
        })}
      </select>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}
