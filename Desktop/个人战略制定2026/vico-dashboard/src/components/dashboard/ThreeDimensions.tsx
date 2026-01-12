export default function ThreeDimensions() {
  const dimensions = [
    {
      title: '维度一：事半功倍点',
      color: 'teal',
      items: [
        '考试研究→课纲→教学能力',
        '跨文化无障碍沟通',
        '哈佛资源、学术背书',
      ],
    },
    {
      title: '维度二：市场痛点',
      color: 'red',
      items: [
        '孩子「空心病」：无自驱力',
        '底层学习力激发需求',
        '需要全程陪伴的家庭',
      ],
    },
    {
      title: '维度三：靠近钱和资源',
      color: 'yellow',
      items: [
        '年收入百万/千万创业家庭',
        '有执行力的家庭（阿姨/家教）',
        '认识这些家长的圈子',
      ],
    },
  ]

  const colorClasses: Record<string, { border: string; title: string }> = {
    teal: { border: 'border-teal-500', title: 'text-teal-700' },
    red: { border: 'border-red-500', title: 'text-red-700' },
    yellow: { border: 'border-yellow-500', title: 'text-yellow-700' },
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {dimensions.map((dim, index) => (
        <div
          key={index}
          className={`bg-white rounded-xl p-5 shadow-sm border-t-4 ${colorClasses[dim.color].border}`}
        >
          <h3 className={`font-bold mb-3 ${colorClasses[dim.color].title}`}>
            {dim.title}
          </h3>
          <ul className="text-sm text-gray-800 space-y-2">
            {dim.items.map((item, i) => (
              <li key={i}>✓ {item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
