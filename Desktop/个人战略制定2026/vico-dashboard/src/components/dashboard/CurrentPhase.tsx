export default function CurrentPhase() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-800 mb-4">📍 当前阶段</h2>
      <div className="flex flex-wrap gap-3">
        <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full font-medium">
          原事业上升期
        </span>
        <span className="px-1 py-2 text-gray-600">+</span>
        <span className="px-4 py-2 bg-orange-100 text-orange-700 rounded-full font-medium">
          整体事业转型期
        </span>
      </div>
      <p className="text-gray-800 mt-3">
        录播课找到节奏，有稳定销售伙伴；能力不止于考试培训，目标是做整体教育咨询
      </p>
    </div>
  )
}
