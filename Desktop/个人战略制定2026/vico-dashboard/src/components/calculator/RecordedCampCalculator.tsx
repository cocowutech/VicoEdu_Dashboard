'use client'

import { useState, useEffect } from 'react'

interface Props {
  onProfitChange: (profit: number) => void
}

const campPrices: Record<string, number> = {
  'ket-full': 7800,
  'ket-sprint': 4800,
  'pet-full': 8800,
  'pet-sprint': 5800,
  'fce-full': 12800,
  'fce-sprint': 9800,
  'ket-full-no': 5800,
  'pet-full-no': 6000,
}

export default function RecordedCampCalculator({ onProfitChange }: Props) {
  const [campType, setCampType] = useState('ket-full')
  const [students, setStudents] = useState(30)
  const [salesRate, setSalesRate] = useState(35)
  const [opsRate, setOpsRate] = useState(65)
  const [materialCost, setMaterialCost] = useState(100)

  const price = campPrices[campType]
  const total = price * students
  const salesCost = total * (salesRate / 100)
  const afterSales = total - salesCost
  const opsCost = afterSales * (opsRate / 100)
  const totalMaterialCost = materialCost * students
  const profit = afterSales - opsCost - totalMaterialCost
  const margin = ((profit / total) * 100).toFixed(1)

  useEffect(() => {
    onProfitChange(Math.round(profit))
  }, [profit, onProfitChange])

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="font-bold text-orange-700 mb-4">📹 录播营收入计算</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">营类型</label>
          <select
            value={campType}
            onChange={(e) => setCampType(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="ket-full">KET 全程营（带直播）¥7,800</option>
            <option value="ket-sprint">KET 考冲营（带直播）¥4,800</option>
            <option value="pet-full">PET 全程营（带直播）¥8,800</option>
            <option value="pet-sprint">PET 考冲营（带直播）¥5,800</option>
            <option value="fce-full">FCE 全程营（带直播）¥12,800</option>
            <option value="fce-sprint">FCE 考冲营（带直播）¥9,800</option>
            <option value="ket-full-no">KET 全程营（不带直播）¥5,800</option>
            <option value="pet-full-no">PET 全程营（不带直播）¥6,000</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">学生人数</label>
          <input
            type="range"
            min="5"
            max="100"
            value={students}
            onChange={(e) => setStudents(parseInt(e.target.value))}
            className="w-full accent-orange-600"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>5</span>
            <span className="font-bold text-orange-600">{students}</span>
            <span>100</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">销售分成（%）</label>
          <input
            type="range"
            min="20"
            max="45"
            value={salesRate}
            onChange={(e) => setSalesRate(parseInt(e.target.value))}
            className="w-full accent-orange-600"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>20%</span>
            <span className="font-bold text-orange-600">{salesRate}%</span>
            <span>45%</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">运营分成（%）</label>
          <input
            type="range"
            min="50"
            max="75"
            value={opsRate}
            onChange={(e) => setOpsRate(parseInt(e.target.value))}
            className="w-full accent-orange-600"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>50%</span>
            <span className="font-bold text-orange-600">{opsRate}%</span>
            <span>75%</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">教材成本/人（元）</label>
          <input
            type="range"
            min="0"
            max="500"
            step="50"
            value={materialCost}
            onChange={(e) => setMaterialCost(parseInt(e.target.value))}
            className="w-full accent-orange-600"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>0</span>
            <span className="font-bold text-orange-600">{materialCost}</span>
            <span>500</span>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-orange-50 rounded-lg">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-sm text-gray-500">总流水</div>
            <div className="text-2xl font-bold text-orange-700">¥{total.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">销售成本</div>
            <div className="text-xl font-bold text-red-500">-¥{Math.round(salesCost).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">运营成本</div>
            <div className="text-xl font-bold text-red-500">-¥{Math.round(opsCost).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">教材成本</div>
            <div className="text-xl font-bold text-red-500">-¥{totalMaterialCost.toLocaleString()}</div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-orange-200 text-center">
          <div className="text-sm text-gray-500">你的净利润</div>
          <div className="text-3xl font-bold text-green-600">¥{Math.round(profit).toLocaleString()}</div>
          <div className="text-sm text-gray-400">利润率: {margin}%</div>
        </div>
      </div>
    </div>
  )
}
