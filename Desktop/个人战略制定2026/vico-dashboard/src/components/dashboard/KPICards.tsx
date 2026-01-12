export default function KPICards() {
  const kpis = [
    { label: '3月前招生目标', value: '80-100', unit: '学生', color: 'amber' },
    { label: '月被动收入目标', value: '$6,000', unit: '约4万人民币', color: 'green' },
    { label: '录播营目标', value: '50', unit: '学生', color: 'blue' },
    { label: '教师团队目标', value: '3', unit: '老师', color: 'orange' },
  ]

  const colorClasses: Record<string, string> = {
    amber: 'text-amber-600',
    green: 'text-green-600',
    blue: 'text-blue-600',
    orange: 'text-orange-600',
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => (
        <div key={index} className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-sm text-gray-700 mb-1">{kpi.label}</div>
          <div className={`text-3xl font-bold ${colorClasses[kpi.color]}`}>
            {kpi.value}
          </div>
          <div className="text-xs text-gray-600">{kpi.unit}</div>
        </div>
      ))}
    </div>
  )
}
