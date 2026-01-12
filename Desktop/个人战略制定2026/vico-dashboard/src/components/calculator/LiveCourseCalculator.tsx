'use client'

import { useState, useEffect } from 'react'

interface Props {
  onIncomeChange: (income: number) => void
}

export default function LiveCourseCalculator({ onIncomeChange }: Props) {
  const [classes, setClasses] = useState(8)
  const [students, setStudents] = useState(5)
  const [price, setPrice] = useState(350)
  const [hours, setHours] = useState(8)
  const [commission, setCommission] = useState(30)

  const weeklyTotal = classes * students * price * hours
  const weeklyIncome = weeklyTotal * (commission / 100)
  const monthlyTotal = weeklyTotal * 4
  const monthlyIncome = weeklyIncome * 4

  useEffect(() => {
    onIncomeChange(monthlyIncome)
  }, [monthlyIncome, onIncomeChange])

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="font-bold text-amber-700 mb-4">🎥 直播课收入计算</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">班级数量</label>
          <input
            type="range"
            min="1"
            max="20"
            value={classes}
            onChange={(e) => setClasses(parseInt(e.target.value))}
            className="w-full accent-amber-600"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>1</span>
            <span className="font-bold text-amber-600">{classes}</span>
            <span>20</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">每班学生数</label>
          <input
            type="range"
            min="1"
            max="8"
            value={students}
            onChange={(e) => setStudents(parseInt(e.target.value))}
            className="w-full accent-amber-600"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>1</span>
            <span className="font-bold text-amber-600">{students}</span>
            <span>8</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">每人每小时价格（元）</label>
          <input
            type="range"
            min="200"
            max="600"
            step="50"
            value={price}
            onChange={(e) => setPrice(parseInt(e.target.value))}
            className="w-full accent-amber-600"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>200</span>
            <span className="font-bold text-amber-600">{price}</span>
            <span>600</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">每周课时数</label>
          <input
            type="range"
            min="1"
            max="20"
            value={hours}
            onChange={(e) => setHours(parseInt(e.target.value))}
            className="w-full accent-amber-600"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>1</span>
            <span className="font-bold text-amber-600">{hours}</span>
            <span>20</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">你的分成比例（%）</label>
          <input
            type="range"
            min="20"
            max="50"
            value={commission}
            onChange={(e) => setCommission(parseInt(e.target.value))}
            className="w-full accent-amber-600"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>20%</span>
            <span className="font-bold text-amber-600">{commission}%</span>
            <span>50%</span>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-amber-50 rounded-lg">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-sm text-gray-500">周流水</div>
            <div className="text-2xl font-bold text-amber-700">¥{weeklyTotal.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">你的周收入</div>
            <div className="text-2xl font-bold text-green-600">¥{weeklyIncome.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">月流水(4周)</div>
            <div className="text-xl font-bold text-amber-700">¥{monthlyTotal.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">你的月收入</div>
            <div className="text-xl font-bold text-green-600">¥{monthlyIncome.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
