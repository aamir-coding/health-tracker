export default function MetricCard({ label, value, unit, icon, sub }) {
  return (
    <div className="card p-4 lg:p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider leading-none">
          {label}
        </span>
        {icon}
      </div>
      <div className="flex items-baseline gap-1.5">
        {value != null ? (
          <>
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{value}</span>
            {unit && <span className="text-sm text-gray-400 dark:text-gray-500 font-medium">{unit}</span>}
          </>
        ) : (
          <span className="text-sm text-gray-400 dark:text-gray-500 italic">Not logged</span>
        )}
      </div>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 truncate">{sub}</p>}
    </div>
  )
}