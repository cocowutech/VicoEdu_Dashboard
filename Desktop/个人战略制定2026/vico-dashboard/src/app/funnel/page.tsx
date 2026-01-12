export default function FunnelPage() {
  const journeyStages = [
    {
      stage: 1,
      name: '认知',
      color: 'teal',
      touchpoint: '小红书、短视频',
      action: '发布教育干货',
      ai: 'AI：选题+初稿生成',
    },
    {
      stage: 2,
      name: '兴趣',
      color: 'blue',
      touchpoint: '私信、评论互动',
      action: '引导加微信',
      ai: 'AI：自动回复模板',
    },
    {
      stage: 3,
      name: '考虑',
      color: 'yellow',
      touchpoint: '测评、试听课',
      action: '销售跟进',
      ai: 'AI：生成测评报告',
    },
    {
      stage: 4,
      name: '购买',
      color: 'green',
      touchpoint: '选课、付款',
      action: '匹配班级老师',
      ai: 'AI：发送开课信息',
    },
    {
      stage: 5,
      name: '复购',
      color: 'amber',
      touchpoint: '考试通过',
      action: '推荐下阶段',
      ai: 'AI：追踪学习进度',
    },
  ]

  const hookProducts = [
    { icon: '📝', title: '免费水平测评', desc: 'AI自动化 → 生成报告 → 加微信' },
    { icon: '📅', title: '学习计划模板', desc: 'PDF下载 → 关注公众号' },
    { icon: '👥', title: '家长微信群', desc: '按考试分群 → 定期干货答疑' },
    { icon: '🎬', title: '录播试听课', desc: '免费体验 → 转化直播课' },
    { icon: '💡', title: '教育规划咨询', desc: '付费¥199 → 筛选高意向' },
    { icon: '🤖', title: '公众号AI助手', desc: '7×24答疑 → 留住每一个咨询' },
  ]

  const colorClasses: Record<string, { bg: string; border: string; title: string; aiBg: string; aiText: string }> = {
    teal: { bg: 'bg-teal-50', border: 'border-teal-500', title: 'text-teal-700', aiBg: 'bg-teal-100', aiText: 'text-teal-600' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-500', title: 'text-blue-700', aiBg: 'bg-blue-100', aiText: 'text-blue-600' },
    yellow: { bg: 'bg-yellow-50', border: 'border-yellow-500', title: 'text-yellow-700', aiBg: 'bg-yellow-100', aiText: 'text-yellow-600' },
    green: { bg: 'bg-green-50', border: 'border-green-500', title: 'text-green-700', aiBg: 'bg-green-100', aiText: 'text-green-600' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-500', title: 'text-amber-700', aiBg: 'bg-amber-100', aiText: 'text-amber-600' },
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-800">🎯 <span className="text-amber-600">用户旅程与转化漏斗</span></h1>

      {/* Funnel Visualization */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">学生升级路径</h3>
        <div className="flex flex-col items-center space-y-2">
          <div className="w-full max-w-2xl bg-gray-200 text-center py-4 rounded" style={{ clipPath: 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)' }}>
            <span className="font-medium text-gray-800">自媒体曝光 (小红书粉丝 1000+)</span>
          </div>
          <div className="text-2xl text-gray-500">↓</div>
          <div className="w-11/12 max-w-xl bg-blue-100 text-center py-4 rounded" style={{ clipPath: 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)' }}>
            <span className="font-medium text-blue-700">私信咨询 / 加微信</span>
          </div>
          <div className="text-2xl text-gray-500">↓</div>
          <div className="w-10/12 max-w-lg bg-green-100 text-center py-4 rounded" style={{ clipPath: 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)' }}>
            <span className="font-medium text-green-700">公立体系 → 录播陪跑营 (50人)</span>
          </div>
          <div className="text-2xl text-gray-500">↓</div>
          <div className="w-9/12 max-w-md bg-amber-100 text-center py-4 rounded" style={{ clipPath: 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)' }}>
            <span className="font-medium text-amber-700">国际路线 → 直播小班课 (80-100人)</span>
          </div>
          <div className="text-2xl text-gray-500">↓</div>
          <div className="w-8/12 max-w-sm bg-orange-100 text-center py-4 rounded" style={{ clipPath: 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)' }}>
            <span className="font-medium text-orange-700">升学咨询客户（毕业后）</span>
          </div>
        </div>
      </div>

      {/* Customer Journey Map */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">客户旅程地图</h3>
        <div className="overflow-x-auto">
          <div className="flex space-x-4 min-w-max pb-4">
            {journeyStages.map((stage) => {
              const colors = colorClasses[stage.color]
              return (
                <div
                  key={stage.stage}
                  className={`w-64 ${colors.bg} rounded-lg p-4 border-t-4 ${colors.border}`}
                >
                  <div className={`font-bold ${colors.title} mb-2`}>{stage.stage}. {stage.name}</div>
                  <div className="text-sm text-gray-800 mb-2">触点：{stage.touchpoint}</div>
                  <div className="text-sm text-gray-800 mb-2">你的动作：{stage.action}</div>
                  <div className={`text-xs ${colors.aiText} ${colors.aiBg} px-2 py-1 rounded`}>
                    {stage.ai}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Hook Products */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">🎣 留住客源的「钩子产品」</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hookProducts.map((product, index) => (
            <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="text-2xl mb-2">{product.icon}</div>
              <div className="font-medium text-gray-900">{product.title}</div>
              <div className="text-sm text-gray-700">{product.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
