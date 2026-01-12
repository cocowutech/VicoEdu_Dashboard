'use client'

import { useState, useEffect, useCallback } from 'react'

interface ProductMatrixItem {
  id: number
  category: string
  itemType: string
  itemName: string
  itemValue: string | null
  itemValue2: string | null
  colorClass: string | null
  isOutsourced: boolean
  sortOrder: number
}

const colorOptions = [
  { value: 'green', label: '绿色' },
  { value: 'blue', label: '蓝色' },
  { value: 'amber', label: '琥珀色' },
  { value: 'orange', label: '橙色' },
  { value: 'gray', label: '灰色' },
]

const getColorClasses = (color: string | null, isOutsourced: boolean) => {
  if (isOutsourced) return { bg: 'bg-gray-100', text: 'text-gray-500' }
  const colors: Record<string, { bg: string; text: string }> = {
    green: { bg: 'bg-green-100', text: 'text-green-700' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-700' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-700' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-700' },
    gray: { bg: 'bg-gray-100', text: 'text-gray-500' },
  }
  return colors[color || 'gray'] || colors.gray
}

export default function ProductsPage() {
  const [items, setItems] = useState<ProductMatrixItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/product-matrix')
      if (res.ok) {
        const data = await res.json()
        setItems(data)
      }
    } catch (error) {
      console.error('Failed to fetch items:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const updateItem = (id: number, updates: Partial<ProductMatrixItem>) => {
    // Update local state immediately (optimistic update)
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item))
  }

  // Debounced save to API
  const saveItem = async (id: number, updates: Partial<ProductMatrixItem>) => {
    try {
      await fetch('/api/product-matrix', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      })
    } catch (error) {
      console.error('Failed to save item:', error)
    }
  }

  const addItem = async (category: string, itemType: string = 'custom') => {
    try {
      const res = await fetch('/api/product-matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, itemType, itemName: '新项目', colorClass: 'gray' }),
      })
      if (res.ok) {
        const newItem = await res.json()
        setItems(prev => [...prev, newItem])
        setEditingId(newItem.id)
      }
    } catch (error) {
      console.error('Failed to add item:', error)
    }
  }

  const deleteItem = async (id: number) => {
    if (!confirm('确定要删除这个项目吗？')) return
    try {
      await fetch(`/api/product-matrix?id=${id}`, { method: 'DELETE' })
      setItems(prev => prev.filter(item => item.id !== id))
    } catch (error) {
      console.error('Failed to delete item:', error)
    }
  }

  const examItems = items.filter(i => i.category === 'exam_hierarchy')
  const livePricingItems = items.filter(i => i.category === 'live_pricing')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-700">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-800">📦 <span className="text-amber-600">产品矩阵与定价</span></h1>

      {/* Product Hierarchy */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900">考试层级与能力范围</h3>
          <button
            onClick={() => addItem('exam_hierarchy', 'exam')}
            className="text-sm px-3 py-1 bg-amber-600 text-white rounded hover:bg-amber-700"
          >
            + 添加考试
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {examItems.map((item, index) => {
            const colors = getColorClasses(item.colorClass, item.isOutsourced)
            const isEditing = editingId === item.id
            return (
              <div key={item.id} className="flex items-center gap-2">
                {index > 0 && <span className="text-gray-500">→</span>}
                {isEditing ? (
                  <div className="flex items-center gap-1 p-2 bg-gray-100 rounded-lg">
                    <input
                      type="text"
                      value={item.itemName}
                      onChange={(e) => updateItem(item.id, { itemName: e.target.value })}
                      onBlur={(e) => saveItem(item.id, { itemName: e.target.value })}
                      className="w-20 px-2 py-1 border rounded text-sm text-gray-900"
                    />
                    <select
                      value={item.colorClass || 'gray'}
                      onChange={(e) => {
                        updateItem(item.id, { colorClass: e.target.value })
                        saveItem(item.id, { colorClass: e.target.value })
                      }}
                      className="px-1 py-1 border rounded text-xs text-gray-900"
                    >
                      {colorOptions.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    <label className="flex items-center gap-1 text-xs text-gray-700">
                      <input
                        type="checkbox"
                        checked={item.isOutsourced}
                        onChange={(e) => {
                          updateItem(item.id, { isOutsourced: e.target.checked })
                          saveItem(item.id, { isOutsourced: e.target.checked })
                        }}
                      />
                      外包
                    </label>
                    <button onClick={() => setEditingId(null)} className="text-green-600 text-sm">✓</button>
                    <button onClick={() => deleteItem(item.id)} className="text-red-600 text-sm">🗑️</button>
                  </div>
                ) : (
                  <span
                    className={`px-3 py-1 ${colors.bg} ${colors.text} rounded-full cursor-pointer hover:opacity-80`}
                    onClick={() => setEditingId(item.id)}
                  >
                    {item.itemName} {item.isOutsourced ? '(外包)' : '✓'}
                  </span>
                )}
              </div>
            )
          })}
        </div>
        <p className="text-xs text-gray-600 mt-2">✓ = 你亲自能做 | 外包 = 找其他老师做 | 点击可编辑</p>
      </div>

      {/* Live Course Pricing */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900">🎥 直播课定价（人民币/小时）</h3>
          <button
            onClick={() => addItem('live_pricing', 'tier')}
            className="text-sm px-3 py-1 bg-amber-600 text-white rounded hover:bg-amber-700"
          >
            + 添加档位
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-800">定价档位</th>
                <th className="px-4 py-3 text-left font-medium text-gray-800">包含考试</th>
                <th className="px-4 py-3 text-center font-medium text-gray-800">1对1</th>
                <th className="px-4 py-3 text-center font-medium text-gray-800">小班(3-6人)</th>
                <th className="px-4 py-3 text-center font-medium text-gray-800">操作</th>
              </tr>
            </thead>
            <tbody>
              {livePricingItems.map((item) => {
                const colors = getColorClasses(item.colorClass, false)
                const tierName = item.itemType === 'basic' ? '基础档' : item.itemType === 'intermediate' ? '进阶档' : item.itemType === 'advanced' ? '高级档' : '自定义'
                return (
                  <tr key={item.id} className="border-t">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 ${colors.bg} ${colors.text} rounded text-xs font-medium`}>
                        {tierName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={item.itemName}
                        onChange={(e) => updateItem(item.id, { itemName: e.target.value })}
                        onBlur={(e) => saveItem(item.id, { itemName: e.target.value })}
                        className="w-full px-2 py-1 border rounded text-gray-800"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="text"
                        value={item.itemValue || ''}
                        onChange={(e) => updateItem(item.id, { itemValue: e.target.value })}
                        onBlur={(e) => saveItem(item.id, { itemValue: e.target.value })}
                        className="w-28 px-2 py-1 border rounded text-center font-bold text-gray-800"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="text"
                        value={item.itemValue2 || ''}
                        onChange={(e) => updateItem(item.id, { itemValue2: e.target.value })}
                        onBlur={(e) => saveItem(item.id, { itemValue2: e.target.value })}
                        className="w-28 px-2 py-1 border rounded text-center font-bold text-gray-800"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recorded Course Pricing - Static for now, can be made dynamic later */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">📹 录播陪跑营定价（人民币/期）</h3>

        {/* With Live */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-amber-700 mb-2">带直播服务（全程6次直播，考冲4次）</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-amber-50">
                  <th className="px-4 py-2 text-left font-medium text-gray-800">考试</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-800">全程营</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-800">考冲营(减¥3000)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-4 py-2 text-gray-800">KET</td>
                  <td className="px-4 py-2 text-center font-bold text-gray-900">¥7,000-7,800</td>
                  <td className="px-4 py-2 text-center font-bold text-gray-900">¥4,000-4,800</td>
                </tr>
                <tr className="border-t bg-gray-50">
                  <td className="px-4 py-2 text-gray-800">PET</td>
                  <td className="px-4 py-2 text-center font-bold text-gray-900">¥8,800</td>
                  <td className="px-4 py-2 text-center font-bold text-gray-900">¥5,800</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 text-gray-800">FCE</td>
                  <td className="px-4 py-2 text-center font-bold text-gray-900">¥12,800</td>
                  <td className="px-4 py-2 text-center font-bold text-gray-900">¥9,800</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Without Live */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">不带直播服务</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left font-medium text-gray-800">考试</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-800">全程营</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-800">考冲营</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-800">教材部分</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-4 py-2 text-gray-800">KET</td>
                  <td className="px-4 py-2 text-center text-gray-900">¥5,800</td>
                  <td className="px-4 py-2 text-center text-gray-900">¥3,500</td>
                  <td className="px-4 py-2 text-center text-gray-600">-</td>
                </tr>
                <tr className="border-t bg-gray-50">
                  <td className="px-4 py-2 text-gray-800">PET</td>
                  <td className="px-4 py-2 text-center text-gray-900">¥6,000</td>
                  <td className="px-4 py-2 text-center text-gray-900">¥4,500</td>
                  <td className="px-4 py-2 text-center text-gray-600">-</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 text-gray-800">FCE</td>
                  <td className="px-4 py-2 text-center text-gray-900">¥7,800</td>
                  <td className="px-4 py-2 text-center text-gray-900">¥4,800</td>
                  <td className="px-4 py-2 text-center text-gray-900">¥3,000</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Cost Structure */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">💸 成本结构</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">直播课成本</h4>
            <ul className="text-sm text-gray-800 space-y-1">
              <li>• 老师交付成本（你抽30%，老师70%）</li>
              <li>• 直播平台成本</li>
              <li>• 小鹅通年费（课程存储）</li>
            </ul>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <h4 className="font-medium text-orange-800 mb-2">录播营成本</h4>
            <ul className="text-sm text-gray-800 space-y-1">
              <li>• 销售老师：不带直播25% / 带直播35-40%</li>
              <li>• 运营老师：65-70%</li>
              <li>• 教材成本（各营不同）</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
