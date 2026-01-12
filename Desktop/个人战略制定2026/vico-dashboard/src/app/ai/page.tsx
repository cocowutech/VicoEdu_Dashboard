'use client'

import { useCallback, useState, useEffect } from 'react'
import { useAiTasks } from '@/hooks/useAiTasks'

interface AiProductIdea {
  id: number
  title: string
  icon: string
  colorTheme: string
  description: string
  testNote: string
  sortOrder: number
}

const colorOptions = [
  { value: 'amber', label: '琥珀色' },
  { value: 'blue', label: '蓝色' },
  { value: 'green', label: '绿色' },
  { value: 'orange', label: '橙色' },
]

const colorClasses: Record<string, { border: string; bg: string; title: string; testText: string }> = {
  amber: { border: 'border-amber-200', bg: 'bg-amber-50', title: 'text-amber-700', testText: 'text-amber-500' },
  blue: { border: 'border-blue-200', bg: 'bg-blue-50', title: 'text-blue-700', testText: 'text-blue-500' },
  green: { border: 'border-green-200', bg: 'bg-green-50', title: 'text-green-700', testText: 'text-green-500' },
  orange: { border: 'border-orange-200', bg: 'bg-orange-50', title: 'text-orange-700', testText: 'text-orange-500' },
}

export default function AiPage() {
  const { data: tasks, loading, updateTask, createTask, deleteTask } = useAiTasks()
  const [ideas, setIdeas] = useState<AiProductIdea[]>([])
  const [ideasLoading, setIdeasLoading] = useState(true)
  const [editingIdeaId, setEditingIdeaId] = useState<number | null>(null)

  // Fetch AI product ideas
  const fetchIdeas = useCallback(async () => {
    try {
      const res = await fetch('/api/ai-product-ideas')
      if (res.ok) {
        const data = await res.json()
        setIdeas(data)
      }
    } catch (error) {
      console.error('Failed to fetch ideas:', error)
    } finally {
      setIdeasLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchIdeas()
  }, [fetchIdeas])

  const updateIdea = async (id: number, updates: Partial<AiProductIdea>) => {
    try {
      const res = await fetch('/api/ai-product-ideas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      })
      if (res.ok) {
        setIdeas(prev => prev.map(idea => idea.id === id ? { ...idea, ...updates } : idea))
      }
    } catch (error) {
      console.error('Failed to update idea:', error)
    }
  }

  const addIdea = async () => {
    try {
      const res = await fetch('/api/ai-product-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (res.ok) {
        const newIdea = await res.json()
        setIdeas(prev => [...prev, newIdea])
        setEditingIdeaId(newIdea.id)
      }
    } catch (error) {
      console.error('Failed to add idea:', error)
    }
  }

  const deleteIdea = async (id: number) => {
    if (!confirm('确定要删除这个产品方向吗？')) return
    try {
      await fetch(`/api/ai-product-ideas?id=${id}`, { method: 'DELETE' })
      setIdeas(prev => prev.filter(idea => idea.id !== id))
    } catch (error) {
      console.error('Failed to delete idea:', error)
    }
  }

  const handleFieldUpdate = useCallback(async (id: number, field: string, value: string | number) => {
    try {
      await updateTask(id, { [field]: value })
    } catch {
      alert('更新失败，请重试')
    }
  }, [updateTask])

  const handleAddTask = async () => {
    try {
      await createTask()
    } catch {
      alert('添加失败，请重试')
    }
  }

  const handleDeleteTask = async (id: number) => {
    if (!confirm('确定要删除这个工作流吗？')) return
    try {
      await deleteTask(id)
    } catch {
      alert('删除失败，请重试')
    }
  }

  if (loading || ideasLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-700">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-800">🤖 <span className="text-amber-600">AI自动化规划</span></h1>

      {/* AI Priority Matrix */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900">优先级矩阵</h3>
          <button
            onClick={handleAddTask}
            className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition flex items-center gap-2"
          >
            <span>+</span> 添加工作流
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <thead>
              <tr className="bg-gray-100 text-gray-900">
                <th className="w-48 px-3 py-3 text-left font-semibold">工作流</th>
                <th className="w-56 px-3 py-3 text-left font-semibold">AI工具建议</th>
                <th className="w-28 px-3 py-3 text-center font-semibold">优先级</th>
                <th className="w-28 px-3 py-3 text-center font-semibold">状态</th>
                <th className="w-20 px-3 py-3 text-center font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, index) => (
                <tr key={task.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={task.taskName}
                      onChange={(e) => handleFieldUpdate(task.id, 'taskName', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-400 rounded text-gray-900 bg-white"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={task.toolSuggestion || ''}
                      onChange={(e) => handleFieldUpdate(task.id, 'toolSuggestion', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-400 rounded text-gray-900 bg-white"
                      placeholder="输入AI工具建议"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <select
                      value={task.priority || 3}
                      onChange={(e) => handleFieldUpdate(task.id, 'priority', Number(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-400 rounded text-center text-gray-900 bg-white"
                    >
                      <option value={1}>★☆☆☆☆</option>
                      <option value={2}>★★☆☆☆</option>
                      <option value={3}>★★★☆☆</option>
                      <option value={4}>★★★★☆</option>
                      <option value={5}>★★★★★</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <select
                      value={task.status || 'pending'}
                      onChange={(e) => handleFieldUpdate(task.id, 'status', e.target.value)}
                      className={`w-full px-2 py-1 border border-gray-400 rounded text-center ${
                        task.status === 'completed' ? 'bg-green-100 text-green-800' :
                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <option value="pending">待开始</option>
                      <option value="in_progress">进行中</option>
                      <option value="completed">已完成</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-600 mt-3">所有字段均可编辑，修改后实时保存到数据库</p>
      </div>

      {/* AI Product Ideas - Now Editable */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900">💡 AI产品升级方向（待测试）</h3>
          <button
            onClick={addIdea}
            className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition flex items-center gap-2"
          >
            <span>+</span> 添加产品方向
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ideas.map((idea) => {
            const colors = colorClasses[idea.colorTheme] || colorClasses.amber
            const isEditing = editingIdeaId === idea.id
            return (
              <div
                key={idea.id}
                className={`border-2 border-dashed ${colors.border} rounded-lg p-4 ${colors.bg} relative`}
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={idea.icon}
                        onChange={(e) => updateIdea(idea.id, { icon: e.target.value })}
                        className="w-12 px-2 py-1 border rounded text-center text-gray-900"
                        placeholder="图标"
                      />
                      <input
                        type="text"
                        value={idea.title}
                        onChange={(e) => updateIdea(idea.id, { title: e.target.value })}
                        className="flex-1 px-2 py-1 border rounded text-gray-900"
                        placeholder="标题"
                      />
                      <select
                        value={idea.colorTheme}
                        onChange={(e) => updateIdea(idea.id, { colorTheme: e.target.value })}
                        className="px-2 py-1 border rounded text-gray-900"
                      >
                        {colorOptions.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                    <textarea
                      value={idea.description}
                      onChange={(e) => updateIdea(idea.id, { description: e.target.value })}
                      className="w-full px-2 py-1 border rounded text-sm text-gray-900"
                      rows={2}
                      placeholder="产品描述"
                    />
                    <input
                      type="text"
                      value={idea.testNote}
                      onChange={(e) => updateIdea(idea.id, { testNote: e.target.value })}
                      className="w-full px-2 py-1 border rounded text-sm text-gray-900"
                      placeholder="测试备注"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => deleteIdea(idea.id)}
                        className="px-3 py-1 text-red-600 hover:text-red-800 text-sm"
                      >
                        删除
                      </button>
                      <button
                        onClick={() => setEditingIdeaId(null)}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        完成
                      </button>
                    </div>
                  </div>
                ) : (
                  <div onClick={() => setEditingIdeaId(idea.id)} className="cursor-pointer">
                    <div className={`font-medium ${colors.title} mb-2`}>
                      {idea.icon} {idea.title}
                    </div>
                    <div className="text-sm text-gray-800">{idea.description}</div>
                    <div className={`mt-2 text-xs ${colors.testText}`}>{idea.testNote}</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <p className="text-xs text-gray-600 mt-3">点击卡片可编辑，所有修改实时保存</p>
      </div>
    </div>
  )
}
