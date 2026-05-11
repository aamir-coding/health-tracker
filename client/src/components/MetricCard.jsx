export default function MetricCard({ label, value, unit, icon, sub, onClick }) {
  return (
    <div
      className={`card p-4 lg:p-5 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow duration-150' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {label}
        </span>
        <span className="text-lg">{icon}</span>
      </div>

      <div className="flex items-baseline gap-1.5">
        {value != null ? (
          <>
            <span className="text-2xl font-bold text-gray-900 tabular-nums">
              {value}
            </span>
            {unit && (
              <span className="text-sm text-gray-400 font-medium">{unit}</span>
            )}
          </>
        ) : (
          <span className="text-sm text-gray-400 italic">Not logged</span>
        )}
      </div>

      {sub && (
        <p className="text-xs text-gray-400 mt-1.5 truncate">{sub}</p>
      )}
    </div>
  )
}