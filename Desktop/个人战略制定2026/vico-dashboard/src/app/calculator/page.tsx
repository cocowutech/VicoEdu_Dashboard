'use client'

import React, { useState, useEffect, useCallback } from 'react'

// Types matching database schema
interface LiveClass {
  id: number
  name: string
  lessonPricePerStudent: number  // 每课收入/人
  studentCount: number           // 人数
  studentNames: string | null    // 学员姓名列表(JSON数组格式)
  lessonDuration: number         // 每课时长（小时）
  weeklyLessons: number          // 周课次
  teacherHourlyCost: number      // 教师每小时成本
  totalLessons: number           // 学期总课次
}

interface FixedCost {
  id: number
  name: string
  amount: number
  frequency: 'monthly' | 'yearly'
  notes: string | null
}

interface CommissionCalculation {
  id: number
  courseName: string
  studentCount: number
  hasLive: boolean
  retailPrice: number
  totalRevenue: number
  materialCost: number
  salesCommission: number
  platformCommission: number
  qianTeacherFee: number
  distributionPool: number
  cocoAmount: number
  zoeyAmount: number
  echoAmount: number
  cocoRate: number
  zoeyRate: number
  echoRate: number
}

export default function CalculatorPage() {
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([])
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([])
  const [commissionCalculations, setCommissionCalculations] = useState<CommissionCalculation[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedClasses, setExpandedClasses] = useState<Set<number>>(new Set())
  const [editingStudentNames, setEditingStudentNames] = useState<number | null>(null)
  const [tempStudentNames, setTempStudentNames] = useState<string>('')

  // 解析学员姓名JSON
  const parseStudentNames = (namesJson: string | null): string[] => {
    if (!namesJson) return []
    try {
      return JSON.parse(namesJson)
    } catch {
      return []
    }
  }

  // 切换展开/折叠
  const toggleExpand = (id: number) => {
    setExpandedClasses(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  // 开始编辑学员姓名
  const startEditingStudentNames = (c: LiveClass) => {
    const names = parseStudentNames(c.studentNames)
    setTempStudentNames(names.join('\n'))
    setEditingStudentNames(c.id)
  }

  // 保存学员姓名（同时自动更新人数）
  const saveStudentNames = async (id: number) => {
    const names = tempStudentNames.split('\n').map(n => n.trim()).filter(n => n)
    const namesJson = JSON.stringify(names)
    const studentCount = names.length

    setLiveClasses(prev => prev.map(c =>
      c.id === id ? { ...c, studentNames: namesJson, studentCount } : c
    ))

    await fetch('/api/live-classes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, studentNames: namesJson, studentCount }),
    })

    setEditingStudentNames(null)
    setTempStudentNames('')
  }

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [liveRes, fixedRes, commissionRes] = await Promise.all([
          fetch('/api/live-classes'),
          fetch('/api/fixed-costs'),
          fetch('/api/commission-calculations'),
        ])

        const liveData = await liveRes.json()
        const fixedData = await fixedRes.json()
        const commissionData = await commissionRes.json()

        setLiveClasses(Array.isArray(liveData) ? liveData : [])
        setFixedCosts(Array.isArray(fixedData) ? fixedData : [])
        setCommissionCalculations(Array.isArray(commissionData) ? commissionData : [])
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // ==================== Live Class Calculations ====================
  // 安全数字转换，避免 NaN
  const safeNum = (n: number | null | undefined) => (isNaN(n as number) || n === null || n === undefined) ? 0 : n

  // 每小时收费/人 = 每课收入/人 / 每课时长
  const calcHourlyRatePerStudent = (c: LiveClass) => {
    const duration = safeNum(c.lessonDuration)
    return duration > 0 ? safeNum(c.lessonPricePerStudent) / duration : 0
  }

  // 每小时总收入 = 每小时收费/人 * 人数
  const calcHourlyRevenue = (c: LiveClass) => calcHourlyRatePerStudent(c) * safeNum(c.studentCount)

  // 获取教师时薪
  const getTeacherHourlyRate = (c: LiveClass) => safeNum(c.teacherHourlyCost)

  // 每小时利润 = 每小时总收入 - 教师成本
  const calcHourlyProfit = (c: LiveClass) => calcHourlyRevenue(c) - getTeacherHourlyRate(c)

  // 月利润 = 每小时利润 * 每课时长 * 周课次 * 4
  const calcMonthlyProfit = (c: LiveClass) => calcHourlyProfit(c) * safeNum(c.lessonDuration) * safeNum(c.weeklyLessons) * 4

  // 课程总利润 = 每小时利润 * 每课时长 * 学期总课次
  const calcCourseProfit = (c: LiveClass) => calcHourlyProfit(c) * safeNum(c.lessonDuration) * safeNum(c.totalLessons)

  const totalLiveStudents = liveClasses.reduce((sum, c) => sum + safeNum(c.studentCount), 0)
  const totalLiveMonthlyProfit = liveClasses.reduce((sum, c) => sum + calcMonthlyProfit(c), 0)
  const totalLiveCourseProfit = liveClasses.reduce((sum, c) => sum + calcCourseProfit(c), 0)

  // Live Class Unit Economics
  const totalLiveWeeklyLessons = liveClasses.reduce((sum, c) => sum + safeNum(c.weeklyLessons), 0)
  const avgHourlyRevenue = totalLiveWeeklyLessons > 0
    ? liveClasses.reduce((sum, c) => sum + calcHourlyRevenue(c) * safeNum(c.weeklyLessons), 0) / totalLiveWeeklyLessons
    : 0
  const avgHourlyProfit = totalLiveWeeklyLessons > 0
    ? liveClasses.reduce((sum, c) => sum + calcHourlyProfit(c) * safeNum(c.weeklyLessons), 0) / totalLiveWeeklyLessons
    : 0
  const avgProfitMarginLive = avgHourlyRevenue > 0 ? (avgHourlyProfit / avgHourlyRevenue) * 100 : 0

  // ==================== Recorded Camp Calculations ====================
  const calcSalesCost = (c: CommissionCalculation) => c.salesCommission + c.qianTeacherFee
  const calcPlatformCost = (c: CommissionCalculation) => c.platformCommission || 0
  const calcOpsCost = (c: CommissionCalculation) => c.zoeyAmount + c.echoAmount
  const calcProfit = (c: CommissionCalculation) => c.cocoAmount

  const totalCampStudents = commissionCalculations.reduce((sum, c) => sum + c.studentCount, 0)
  const totalCampRevenue = commissionCalculations.reduce((sum, c) => sum + c.totalRevenue, 0)
  const totalCampMaterialCost = commissionCalculations.reduce((sum, c) => sum + c.materialCost, 0)
  const totalCampSalesCost = commissionCalculations.reduce((sum, c) => sum + calcSalesCost(c), 0)
  const totalCampPlatformCost = commissionCalculations.reduce((sum, c) => sum + calcPlatformCost(c), 0)
  const totalCampOpsCost = commissionCalculations.reduce((sum, c) => sum + calcOpsCost(c), 0)
  const totalCampProfit = commissionCalculations.reduce((sum, c) => sum + calcProfit(c), 0)

  const avgTicketPrice = totalCampStudents > 0 ? totalCampRevenue / totalCampStudents : 0
  const avgSalesCost = totalCampStudents > 0 ? totalCampSalesCost / totalCampStudents : 0
  const avgOpsCost = totalCampStudents > 0 ? totalCampOpsCost / totalCampStudents : 0
  const avgProfitPerStudent = totalCampStudents > 0 ? totalCampProfit / totalCampStudents : 0
  const avgProfitMarginCamp = totalCampRevenue > 0 ? (totalCampProfit / totalCampRevenue) * 100 : 0

  // ==================== Fixed Costs ====================
  const calcMonthlyAmount = (c: FixedCost) => c.frequency === 'yearly' ? c.amount / 12 : c.amount
  const totalFixedCosts = fixedCosts.reduce((sum, c) => sum + calcMonthlyAmount(c), 0)

  // ==================== Summary ====================
  const netMonthlyIncome = totalLiveMonthlyProfit + totalCampProfit - totalFixedCosts
  const netMonthlyIncomeUSD = Math.round(netMonthlyIncome / 7.2)

  // ==================== Export Function ====================
  const exportToCSV = () => {
    const now = new Date().toISOString().slice(0, 10)
    let csv = '\uFEFF'

    csv += '直播课班级\n'
    csv += '班级名称,每课收入/人,人数,每课时长,每小时收费/人,周课次,教师成本/时,学期总课次,每小时收入,每小时利润,月利润,课程总利润\n'
    liveClasses.forEach(c => {
      csv += `${c.name},${c.lessonPricePerStudent},${c.studentCount},${c.lessonDuration},${calcHourlyRatePerStudent(c).toFixed(0)},${c.weeklyLessons},${getTeacherHourlyRate(c)},${c.totalLessons},${calcHourlyRevenue(c).toFixed(0)},${calcHourlyProfit(c).toFixed(0)},${calcMonthlyProfit(c).toFixed(0)},${calcCourseProfit(c).toFixed(0)}\n`
    })
    csv += `合计,,${totalLiveStudents},,,,,,,,${totalLiveMonthlyProfit.toFixed(0)},${totalLiveCourseProfit.toFixed(0)}\n\n`

    csv += '录播陪跑营\n'
    csv += '课程名称,学员数,总营收,教材成本,销售占比,平台抽佣,运营成本,利润(Coco)\n'
    commissionCalculations.forEach(c => {
      csv += `${c.courseName},${c.studentCount},${c.totalRevenue},${c.materialCost.toFixed(0)},${calcSalesCost(c).toFixed(0)},${calcPlatformCost(c).toFixed(0)},${calcOpsCost(c).toFixed(0)},${calcProfit(c).toFixed(0)}\n`
    })
    csv += `合计,${totalCampStudents},${totalCampRevenue},${totalCampMaterialCost.toFixed(0)},${totalCampSalesCost.toFixed(0)},${totalCampPlatformCost.toFixed(0)},${totalCampOpsCost.toFixed(0)},${totalCampProfit.toFixed(0)}\n\n`

    csv += '固定成本\n'
    csv += '成本名称,金额,频率,月均成本,备注\n'
    fixedCosts.forEach(c => {
      csv += `${c.name},${c.amount},${c.frequency === 'monthly' ? '每月' : '每年'},${calcMonthlyAmount(c).toFixed(0)},${c.notes || ''}\n`
    })
    csv += `合计,,,${totalFixedCosts.toFixed(0)},\n\n`

    csv += '综合收入汇总\n'
    csv += `直播课月利润,${totalLiveMonthlyProfit.toFixed(0)}\n`
    csv += `录播营利润,${totalCampProfit.toFixed(0)}\n`
    csv += `固定成本,${totalFixedCosts.toFixed(0)}\n`
    csv += `净月收入,${netMonthlyIncome.toFixed(0)}\n`
    csv += `美元换算,$${netMonthlyIncomeUSD}\n`

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `财务计算器_${now}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ==================== CRUD Handlers ====================
  const addLiveClass = async () => {
    const res = await fetch('/api/live-classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const newClass = await res.json()
    setLiveClasses([...liveClasses, newClass])
  }

  const updateLiveClass = useCallback(async (id: number, field: string, value: string | number | null) => {
    if (field === 'name') {
      setLiveClasses(prev => prev.map(c =>
        c.id === id ? { ...c, [field]: value as string } : c
      ))
      await fetch('/api/live-classes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, [field]: value }),
      })
    } else {
      const numValue = Number(value)
      setLiveClasses(prev => prev.map(c =>
        c.id === id ? { ...c, [field]: numValue } : c
      ))
      await fetch('/api/live-classes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, [field]: numValue }),
      })
    }
  }, [])

  const deleteLiveClass = async (id: number) => {
    if (liveClasses.length <= 1) return
    await fetch(`/api/live-classes?id=${id}`, { method: 'DELETE' })
    setLiveClasses(liveClasses.filter(c => c.id !== id))
  }

  // Fixed Cost CRUD
  const addFixedCost = async () => {
    const res = await fetch('/api/fixed-costs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '新成本项', amount: 0, frequency: 'monthly' }),
    })
    const newCost = await res.json()
    setFixedCosts([...fixedCosts, newCost])
  }

  const updateFixedCost = useCallback(async (id: number, field: keyof FixedCost, value: string | number | null) => {
    setFixedCosts(prev => prev.map(c =>
      c.id === id ? { ...c, [field]: value } : c
    ))

    await fetch('/api/fixed-costs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, [field]: value }),
    })
  }, [])

  const deleteFixedCost = async (id: number) => {
    await fetch(`/api/fixed-costs?id=${id}`, { method: 'DELETE' })
    setFixedCosts(fixedCosts.filter(c => c.id !== id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-stone-800">💰 <span className="text-amber-600">财务计算器</span></h1>
        <button
          onClick={exportToCSV}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
        >
          导出 CSV
        </button>
      </div>

      {/* ==================== Live Classes Table ==================== */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-800 text-lg">直播课班级</h3>
          <button
            onClick={addLiveClass}
            className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition flex items-center gap-2"
          >
            <span>+</span> 添加班级
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-amber-50 text-gray-700">
                <th className="px-2 py-3 text-left font-medium">班级名称</th>
                <th className="px-2 py-3 text-center font-medium">每课收入/人</th>
                <th className="px-2 py-3 text-center font-medium">人数</th>
                <th className="px-2 py-3 text-center font-medium">每课时长</th>
                <th className="px-2 py-3 text-center font-medium bg-gray-100">每小时收费/人</th>
                <th className="px-2 py-3 text-center font-medium">周课次</th>
                <th className="px-2 py-3 text-center font-medium">教师成本/时</th>
                <th className="px-2 py-3 text-center font-medium">学期总课次</th>
                <th className="px-2 py-3 text-right font-medium bg-green-50 text-green-700">每小时收入</th>
                <th className="px-2 py-3 text-right font-medium bg-green-50 text-green-700">每小时利润</th>
                <th className="px-2 py-3 text-right font-medium bg-blue-50 text-blue-700">月利润</th>
                <th className="px-2 py-3 text-right font-medium bg-amber-50 text-amber-700">课程总利润</th>
                <th className="px-2 py-3 text-center font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {liveClasses.map((c, index) => (
              <React.Fragment key={c.id}>
                <tr className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={c.name}
                      onChange={(e) => updateLiveClass(c.id, 'name', e.target.value)}
                      className="w-28 px-2 py-1 border rounded text-gray-800 hover:bg-blue-50"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      value={c.lessonPricePerStudent}
                      onChange={(e) => updateLiveClass(c.id, 'lessonPricePerStudent', e.target.value)}
                      className="w-16 px-1 py-1 border rounded text-center text-gray-800 hover:bg-blue-50"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex flex-col items-center gap-1">
                      <input
                        type="number"
                        value={c.studentCount}
                        onChange={(e) => updateLiveClass(c.id, 'studentCount', e.target.value)}
                        className="w-14 px-1 py-1 border rounded text-center text-gray-800 hover:bg-blue-50"
                      />
                      <button
                        onClick={() => toggleExpand(c.id)}
                        className="text-xs text-amber-600 hover:text-amber-800 flex items-center gap-1"
                      >
                        {expandedClasses.has(c.id) ? '收起' : '学员'}
                        <span className="text-[10px]">{expandedClasses.has(c.id) ? '▲' : '▼'}</span>
                      </button>
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      step="0.5"
                      value={c.lessonDuration}
                      onChange={(e) => updateLiveClass(c.id, 'lessonDuration', e.target.value)}
                      className="w-14 px-1 py-1 border rounded text-center text-gray-800 hover:bg-blue-50"
                    />
                  </td>
                  <td className="px-2 py-2 text-center bg-gray-50 text-gray-600">
                    {calcHourlyRatePerStudent(c).toFixed(0)}
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      value={c.weeklyLessons}
                      onChange={(e) => updateLiveClass(c.id, 'weeklyLessons', e.target.value)}
                      className="w-14 px-1 py-1 border rounded text-center text-gray-800 hover:bg-blue-50"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      min="0"
                      value={c.teacherHourlyCost}
                      onChange={(e) => updateLiveClass(c.id, 'teacherHourlyCost', e.target.value)}
                      className="w-16 px-1 py-1 border rounded text-center text-gray-800 hover:bg-blue-50"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      value={c.totalLessons}
                      onChange={(e) => updateLiveClass(c.id, 'totalLessons', e.target.value)}
                      className="w-14 px-1 py-1 border rounded text-center text-gray-800 hover:bg-blue-50"
                    />
                  </td>
                  <td className="px-2 py-2 text-right bg-green-50 text-gray-700">{calcHourlyRevenue(c).toFixed(0)}</td>
                  <td className="px-2 py-2 text-right bg-green-50 text-green-700 font-medium">{calcHourlyProfit(c).toFixed(0)}</td>
                  <td className="px-2 py-2 text-right bg-blue-50 text-blue-700 font-medium">{calcMonthlyProfit(c).toFixed(0)}</td>
                  <td className="px-2 py-2 text-right bg-amber-50 text-amber-700 font-medium">{calcCourseProfit(c).toFixed(0)}</td>
                  <td className="px-2 py-2 text-center">
                    <button
                      onClick={() => deleteLiveClass(c.id)}
                      className="text-red-500 hover:text-red-700 disabled:opacity-30"
                      disabled={liveClasses.length <= 1}
                    >
                      删除
                    </button>
                  </td>
                </tr>
                {/* 展开的学员姓名行 */}
                {expandedClasses.has(c.id) && (
                  <tr className="bg-amber-50/50">
                    <td colSpan={13} className="px-4 py-3">
                      <div className="flex items-start gap-4">
                        <div className="text-sm font-medium text-gray-700 whitespace-nowrap pt-1">学员名单:</div>
                        {editingStudentNames === c.id ? (
                          <div className="flex-1">
                            <textarea
                              value={tempStudentNames}
                              onChange={(e) => setTempStudentNames(e.target.value)}
                              placeholder="每行一个学员姓名..."
                              className="w-full px-3 py-2 border rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                              rows={4}
                            />
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() => saveStudentNames(c.id)}
                                className="px-3 py-1 bg-amber-600 text-white text-sm rounded hover:bg-amber-700"
                              >
                                保存
                              </button>
                              <button
                                onClick={() => { setEditingStudentNames(null); setTempStudentNames(''); }}
                                className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1">
                            {parseStudentNames(c.studentNames).length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {parseStudentNames(c.studentNames).map((name, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-white border border-amber-200 rounded text-sm text-gray-700">
                                    {name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">暂无学员</span>
                            )}
                            <button
                              onClick={() => startEditingStudentNames(c)}
                              className="mt-2 text-sm text-amber-600 hover:text-amber-800 block"
                            >
                              {parseStudentNames(c.studentNames).length > 0 ? '编辑学员' : '添加学员'}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-amber-100 font-bold text-gray-800">
                <td className="px-2 py-3 text-right" colSpan={2}>合计</td>
                <td className="px-2 py-3 text-center">{totalLiveStudents}人</td>
                <td colSpan={7}></td>
                <td className="px-2 py-3 text-right text-blue-700">{totalLiveMonthlyProfit.toFixed(0)}</td>
                <td className="px-2 py-3 text-right text-amber-700">{totalLiveCourseProfit.toFixed(0)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Live Class Unit Economics */}
        <div className="mt-4 p-4 bg-amber-50 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-3">Unit Economics</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-700">平均每小时收入</div>
              <div className="text-lg font-bold text-gray-900">{avgHourlyRevenue.toFixed(0)}</div>
            </div>
            <div>
              <div className="text-gray-700">平均每小时利润</div>
              <div className="text-lg font-bold text-amber-700">{avgHourlyProfit.toFixed(0)}</div>
            </div>
            <div>
              <div className="text-gray-700">平均利润率</div>
              <div className="text-lg font-bold text-amber-700">{avgProfitMarginLive.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== Recorded Camps Table ==================== */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-800 text-lg">录播陪跑营</h3>
          <span className="text-sm text-gray-500">数据来源：运营分配计算器（自动同步）</span>
        </div>

        {commissionCalculations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>暂无数据</p>
            <p className="text-sm mt-2">请先在「运营分配计算器」中添加分佣计算</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-200 text-gray-900">
                    <th className="px-2 py-3 text-left font-semibold">课程名称</th>
                    <th className="px-2 py-3 text-center font-semibold">学员数</th>
                    <th className="px-2 py-3 text-right font-semibold">总营收</th>
                    <th className="px-2 py-3 text-right font-semibold">教材成本</th>
                    <th className="px-2 py-3 text-right font-semibold bg-yellow-100 text-yellow-800">销售占比</th>
                    <th className="px-2 py-3 text-right font-semibold bg-purple-100 text-purple-800">平台抽佣</th>
                    <th className="px-2 py-3 text-right font-semibold bg-orange-100 text-orange-800">运营成本</th>
                    <th className="px-2 py-3 text-right font-semibold bg-pink-200 text-pink-900">利润(Coco)</th>
                  </tr>
                </thead>
                <tbody>
                  {commissionCalculations.map((c, index) => (
                    <tr key={c.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-2 py-2 text-gray-900">
                        {c.courseName}
                        <span className={`ml-1 text-xs px-1 rounded font-medium ${c.hasLive ? 'bg-amber-200 text-amber-900' : 'bg-orange-200 text-orange-900'}`}>
                          {c.hasLive ? '直播' : '录播'}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-center text-gray-900">{c.studentCount}</td>
                      <td className="px-2 py-2 text-right text-gray-900">{c.totalRevenue.toLocaleString()}</td>
                      <td className="px-2 py-2 text-right text-red-700 font-medium">-{c.materialCost.toFixed(0)}</td>
                      <td className="px-2 py-2 text-right bg-yellow-50 text-yellow-800 font-medium">-{calcSalesCost(c).toFixed(0)}</td>
                      <td className="px-2 py-2 text-right bg-purple-50 text-purple-800 font-medium">{calcPlatformCost(c) > 0 ? `-${calcPlatformCost(c).toFixed(0)}` : '-'}</td>
                      <td className="px-2 py-2 text-right bg-orange-50 text-orange-800 font-medium">-{calcOpsCost(c).toFixed(0)}</td>
                      <td className="px-2 py-2 text-right bg-pink-100 text-pink-900 font-bold">{calcProfit(c).toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-300 font-bold text-gray-900">
                    <td className="px-2 py-3 text-right">合计</td>
                    <td className="px-2 py-3 text-center">{totalCampStudents}人</td>
                    <td className="px-2 py-3 text-right">{totalCampRevenue.toLocaleString()}</td>
                    <td className="px-2 py-3 text-right text-red-700">-{totalCampMaterialCost.toFixed(0)}</td>
                    <td className="px-2 py-3 text-right text-yellow-800">-{totalCampSalesCost.toFixed(0)}</td>
                    <td className="px-2 py-3 text-right text-purple-800">{totalCampPlatformCost > 0 ? `-${totalCampPlatformCost.toFixed(0)}` : '-'}</td>
                    <td className="px-2 py-3 text-right text-orange-800">-{totalCampOpsCost.toFixed(0)}</td>
                    <td className="px-2 py-3 text-right text-pink-900">{totalCampProfit.toFixed(0)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-4 p-4 bg-orange-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Unit Economics</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <div className="text-gray-700">平均客单价</div>
                  <div className="text-lg font-bold text-gray-900">{avgTicketPrice.toFixed(0)}</div>
                </div>
                <div>
                  <div className="text-gray-700">平均销售占比</div>
                  <div className="text-lg font-bold text-yellow-700">{avgSalesCost.toFixed(0)}</div>
                </div>
                <div>
                  <div className="text-gray-700">平均运营成本</div>
                  <div className="text-lg font-bold text-orange-700">{avgOpsCost.toFixed(0)}</div>
                </div>
                <div>
                  <div className="text-gray-700">平均人均利润</div>
                  <div className="text-lg font-bold text-pink-700">{avgProfitPerStudent.toFixed(0)}</div>
                </div>
                <div>
                  <div className="text-gray-700">平均利润率</div>
                  <div className="text-lg font-bold text-green-700">{avgProfitMarginCamp.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ==================== Fixed Costs ==================== */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-800 text-lg">固定成本</h3>
          <button
            onClick={addFixedCost}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-2"
          >
            <span>+</span> 添加成本项
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-red-50 text-gray-700">
                <th className="px-2 py-3 text-left font-medium">成本名称</th>
                <th className="px-2 py-3 text-center font-medium">金额</th>
                <th className="px-2 py-3 text-center font-medium">频率</th>
                <th className="px-2 py-3 text-right font-medium bg-gray-100">月均成本</th>
                <th className="px-2 py-3 text-left font-medium">备注</th>
                <th className="px-2 py-3 text-center font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {fixedCosts.map((c, index) => (
                <tr key={c.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={c.name}
                      onChange={(e) => updateFixedCost(c.id, 'name', e.target.value)}
                      className="w-32 px-2 py-1 border rounded text-gray-800 hover:bg-blue-50"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      value={c.amount}
                      onChange={(e) => updateFixedCost(c.id, 'amount', Number(e.target.value))}
                      className="w-24 px-2 py-1 border rounded text-right text-gray-800 hover:bg-blue-50"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <select
                      value={c.frequency}
                      onChange={(e) => updateFixedCost(c.id, 'frequency', e.target.value)}
                      className="w-20 px-1 py-1 border rounded text-gray-800 bg-white hover:bg-blue-50"
                    >
                      <option value="monthly">每月</option>
                      <option value="yearly">每年</option>
                    </select>
                  </td>
                  <td className="px-2 py-2 text-right bg-gray-50 text-red-600 font-medium">
                    {calcMonthlyAmount(c).toFixed(0)}
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={c.notes || ''}
                      onChange={(e) => updateFixedCost(c.id, 'notes', e.target.value || null)}
                      placeholder="添加备注..."
                      className="w-40 px-2 py-1 border rounded text-gray-600 hover:bg-blue-50 placeholder-gray-400"
                    />
                  </td>
                  <td className="px-2 py-2 text-center">
                    <button
                      onClick={() => deleteFixedCost(c.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-red-100 font-bold text-gray-800">
                <td className="px-2 py-3 text-right" colSpan={3}>月均成本合计</td>
                <td className="px-2 py-3 text-right text-red-600">{totalFixedCosts.toFixed(0)}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ==================== Summary ==================== */}
      <div className="bg-gradient-to-r from-amber-600 to-blue-600 rounded-xl p-6 text-white">
        <h3 className="font-bold text-xl mb-4">综合收入汇总</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          <div className="bg-white/20 rounded-lg p-4">
            <div className="text-sm opacity-80">直播课月利润</div>
            <div className="text-2xl font-bold">{totalLiveMonthlyProfit.toFixed(0)}</div>
          </div>
          <div className="bg-white/20 rounded-lg p-4">
            <div className="text-sm opacity-80">录播营利润</div>
            <div className="text-2xl font-bold">{totalCampProfit.toFixed(0)}</div>
          </div>
          <div className="bg-white/20 rounded-lg p-4">
            <div className="text-sm opacity-80">固定成本</div>
            <div className="text-2xl font-bold text-red-300">-{totalFixedCosts.toFixed(0)}</div>
          </div>
          <div className="bg-white/30 rounded-lg p-4">
            <div className="text-sm opacity-80">净月收入</div>
            <div className="text-3xl font-bold">{netMonthlyIncome.toFixed(0)}</div>
          </div>
          <div className="bg-white/30 rounded-lg p-4">
            <div className="text-sm opacity-80">美元换算</div>
            <div className="text-3xl font-bold">${netMonthlyIncomeUSD.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-700 text-center">
        提示：所有数据实时保存，刷新页面数据不会丢失
      </p>
    </div>
  )
}
