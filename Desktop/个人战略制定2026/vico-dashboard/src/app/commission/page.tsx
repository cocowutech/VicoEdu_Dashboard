'use client'

import { useState, useEffect, useCallback } from 'react'

interface CommissionRule {
  id: number
  productType: 'with_live' | 'without_live'
  minStudents: number
  maxStudents: number | null
  cocoRate: number
  zoeyRate: number
  echoRate: number
}

interface CommissionFixedRate {
  id: number
  personName: string
  examType: string
  campType: string
  amountPerStudent: number
  allocationType: string
}

interface CourseMaterial {
  id: number
  courseName: string
  retailPrice: number
  materialCost: number
  hasLive: boolean
  qianTeacherFee: number
  salesCommissionRate: number
  defaultCampDuration: number
  examType: string
  sortOrder: number
}

interface CalculationResult {
  id?: number
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
  thirdPersonName: string
  thirdPersonMode: 'percentage' | 'fixed'
  startDate?: string | null
  campDuration: number
  holidayDays: number
  notes?: string | null
}

export default function CommissionPage() {
  const [courseMaterials, setCourseMaterials] = useState<CourseMaterial[]>([])
  const [commissionRules, setCommissionRules] = useState<CommissionRule[]>([])
  const [fixedRates, setFixedRates] = useState<CommissionFixedRate[]>([])
  const [loading, setLoading] = useState(true)

  // 输入状态
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)
  const [studentCount, setStudentCount] = useState<number>(1)
  const [selectedClassManager, setSelectedClassManager] = useState<'echo' | 'fixed'>('echo')
  const [result, setResult] = useState<CalculationResult | null>(null)

  // 批量计算
  const [batchResults, setBatchResults] = useState<CalculationResult[]>([])

  // 编辑状态
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingStudentCount, setEditingStudentCount] = useState<number>(0)
  const [previewResult, setPreviewResult] = useState<CalculationResult | null>(null)

  // 拖拽排序状态
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  // 新增课程ID追踪（新增的课程编辑时不联动更新计算列表）
  const [newCourseIds, setNewCourseIds] = useState<Set<number>>(new Set())

  // 备注编辑状态
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null)
  const [editingNoteText, setEditingNoteText] = useState<string>('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [materialsRes, rulesRes, calculationsRes, fixedRatesRes] = await Promise.all([
          fetch('/api/course-materials'),
          fetch('/api/commission-rules'),
          fetch('/api/commission-calculations'),
          fetch('/api/commission-fixed-rates'),
        ])
        const materialsData = await materialsRes.json()
        const rulesData = await rulesRes.json()
        const calculationsData = await calculationsRes.json()
        const fixedRatesData = await fixedRatesRes.json()
        const materials = Array.isArray(materialsData) ? materialsData : []
        const rules = Array.isArray(rulesData) ? rulesData : []
        const calculations = Array.isArray(calculationsData) ? calculationsData : []
        const rates = Array.isArray(fixedRatesData) ? fixedRatesData : []
        setCourseMaterials(materials)
        setCommissionRules(rules)
        setBatchResults(calculations)
        setFixedRates(rates)
        if (materials.length > 0) {
          setSelectedCourseId(materials[0].id)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // 获取适用的分佣规则
  const getApplicableRule = useCallback((hasLive: boolean, students: number): CommissionRule | null => {
    const productType = hasLive ? 'with_live' : 'without_live'
    const applicableRules = commissionRules.filter(r => r.productType === productType)

    for (const rule of applicableRules) {
      if (students >= rule.minStudents && (rule.maxStudents === null || students <= rule.maxStudents)) {
        return rule
      }
    }
    return null
  }, [commissionRules])

  // 从课程名称推断 examType 和 campType
  const inferCourseType = useCallback((courseName: string): { examType: string; campType: string } => {
    let examType = ''
    if (courseName.includes('KET')) examType = 'KET'
    else if (courseName.includes('PET')) examType = 'PET'
    else if (courseName.includes('FCE')) examType = 'FCE'

    let campType = ''
    if (courseName.includes('全程')) campType = 'full'
    else if (courseName.includes('考冲')) campType = 'sprint'

    return { examType, campType }
  }, [])

  // 查找定额分配规则（根据课程的examType + campType匹配）
  const getFixedRate = useCallback((examType: string, campType: string): CommissionFixedRate | null => {
    if (!examType) return null
    const match = fixedRates.find(r => r.examType === examType && r.campType === campType)
    return match || null
  }, [fixedRates])

  // 计算单个课程分配（平台抽佣初始为0，在计算列表中单独设置）
  // classManager: 'echo' = Echo比例模式, 'fixed' = 定额模式（Ari等）
  const calculateDistribution = useCallback((course: CourseMaterial, students: number, platformFeePerStudent: number = 0, classManager: 'echo' | 'fixed' = 'echo'): CalculationResult | null => {
    const rule = getApplicableRule(course.hasLive, students)
    if (!rule) return null

    const totalRevenue = course.retailPrice * students
    const totalMaterialCost = course.materialCost * students
    const totalPlatformCommission = platformFeePerStudent * students
    const revenueAfterPlatform = totalRevenue - totalPlatformCommission
    const totalSalesCommission = revenueAfterPlatform * (course.salesCommissionRate / 100)
    const totalQianFee = course.qianTeacherFee * students

    // 可分配池 = (总营收 - 平台抽佣) × (1 - 销售分佣率%) - 教材成本 - 钱老师费用
    const distributionPool = revenueAfterPlatform * (1 - course.salesCommissionRate / 100) - totalMaterialCost - totalQianFee

    // 定额模式: 查找匹配的定额分配规则
    if (classManager === 'fixed') {
      const { examType: inferredExamType, campType: inferredCampType } = inferCourseType(course.courseName)
      const fixedRate = getFixedRate(inferredExamType, inferredCampType)

      if (fixedRate) {
        const zoeyAmount = distributionPool * (rule.zoeyRate / 100)
        const echoAmount = fixedRate.amountPerStudent * students
        const cocoAmount = distributionPool - zoeyAmount - echoAmount

        return {
          courseName: course.courseName,
          studentCount: students,
          hasLive: course.hasLive,
          retailPrice: course.retailPrice,
          totalRevenue,
          materialCost: totalMaterialCost,
          salesCommission: totalSalesCommission,
          platformCommission: totalPlatformCommission,
          qianTeacherFee: totalQianFee,
          distributionPool,
          cocoAmount,
          zoeyAmount,
          echoAmount,
          cocoRate: rule.cocoRate,
          zoeyRate: rule.zoeyRate,
          echoRate: fixedRate.amountPerStudent,
          thirdPersonName: fixedRate.personName,
          thirdPersonMode: 'fixed',
          startDate: null,
          campDuration: course.defaultCampDuration || 0,
          holidayDays: 0,
          notes: null,
        }
      }
    }

    // 比例模式 (Echo模式): 三人按比例分配
    return {
      courseName: course.courseName,
      studentCount: students,
      hasLive: course.hasLive,
      retailPrice: course.retailPrice,
      totalRevenue,
      materialCost: totalMaterialCost,
      salesCommission: totalSalesCommission,
      platformCommission: totalPlatformCommission,
      qianTeacherFee: totalQianFee,
      distributionPool,
      cocoAmount: distributionPool * (rule.cocoRate / 100),
      zoeyAmount: distributionPool * (rule.zoeyRate / 100),
      echoAmount: distributionPool * (rule.echoRate / 100),
      cocoRate: rule.cocoRate,
      zoeyRate: rule.zoeyRate,
      echoRate: rule.echoRate,
      thirdPersonName: 'Echo',
      thirdPersonMode: 'percentage',
      startDate: null,
      campDuration: course.defaultCampDuration || 0,
      holidayDays: 0,
      notes: null,
    }
  }, [getApplicableRule, getFixedRate, inferCourseType])

  // 单个计算
  const handleCalculate = () => {
    if (!selectedCourseId) return
    const course = courseMaterials.find(c => c.id === selectedCourseId)
    if (!course) return
    const calcResult = calculateDistribution(course, studentCount, 0, selectedClassManager)
    setResult(calcResult)
  }

  // 添加到批量列表并保存到数据库
  const addToBatch = async () => {
    if (!result) return
    try {
      const res = await fetch('/api/commission-calculations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      })
      if (!res.ok) throw new Error('Failed to save')
      const saved = await res.json()
      setBatchResults(prev => [saved, ...prev])
      setResult(null)
    } catch (error) {
      console.error('Error saving calculation:', error)
      alert('保存失败，请重试')
    }
  }

  // 从批量列表删除并从数据库删除
  const removeFromBatch = async (id: number | undefined, index: number) => {
    if (!id) return
    try {
      const res = await fetch(`/api/commission-calculations?id=${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete')
      setBatchResults(prev => prev.filter((_, i) => i !== index))
    } catch (error) {
      console.error('Error deleting calculation:', error)
      alert('删除失败，请重试')
    }
  }

  // 清空批量并从数据库删除所有记录
  const clearBatch = async () => {
    if (!confirm('确定要清空所有记录吗？')) return
    try {
      const res = await fetch('/api/commission-calculations?id=all', {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to clear')
      setBatchResults([])
    } catch (error) {
      console.error('Error clearing calculations:', error)
      alert('清空失败，请重试')
    }
  }

  // 开始编辑学员数
  const startEditStudentCount = (r: CalculationResult) => {
    if (!r.id) return
    setEditingId(r.id)
    setEditingStudentCount(r.studentCount)
    setPreviewResult(null)
  }

  // 预览学员数变更
  const previewStudentCountChange = useCallback((newCount: number, currentResult: CalculationResult) => {
    if (newCount < 1) return
    setEditingStudentCount(newCount)

    const course = courseMaterials.find(c => c.courseName === currentResult.courseName)
    if (!course) return

    const newResult = calculateDistribution(course, newCount)
    setPreviewResult(newResult)
  }, [courseMaterials, calculateDistribution])

  // 确认修改学员数
  const confirmStudentCountChange = async () => {
    if (!editingId || !previewResult) return

    const originalResult = batchResults.find(r => r.id === editingId)
    if (!originalResult) return

    const thirdName = originalResult.thirdPersonName || 'Echo'
    const changes = [
      `学员数: ${originalResult.studentCount} → ${previewResult.studentCount}`,
      `总营收: ${originalResult.totalRevenue.toLocaleString()} → ${previewResult.totalRevenue.toLocaleString()}`,
      `可分配池: ${originalResult.distributionPool.toFixed(0)} → ${previewResult.distributionPool.toFixed(0)}`,
      `Coco: ${originalResult.cocoAmount.toFixed(0)} → ${previewResult.cocoAmount.toFixed(0)}`,
      `Zoey: ${originalResult.zoeyAmount.toFixed(0)} → ${previewResult.zoeyAmount.toFixed(0)}`,
      `${thirdName}: ${originalResult.echoAmount.toFixed(0)} → ${previewResult.echoAmount.toFixed(0)}`,
    ]

    const confirmMsg = `以下数据将发生变动:\n\n${changes.join('\n')}\n\n是否确认修改？`
    if (!confirm(confirmMsg)) return

    try {
      // 删除旧记录
      await fetch(`/api/commission-calculations?id=${editingId}`, { method: 'DELETE' })
      // 创建新记录，保留原有的日期、营期、假期和备注信息
      const newData = {
        ...previewResult,
        startDate: originalResult.startDate,
        campDuration: originalResult.campDuration,
        holidayDays: originalResult.holidayDays,
        notes: originalResult.notes,
      }
      const res = await fetch('/api/commission-calculations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData),
      })
      if (!res.ok) throw new Error('Failed to update')
      const saved = await res.json()

      setBatchResults(prev => prev.map(r => r.id === editingId ? saved : r))
      cancelEdit()
    } catch (error) {
      console.error('Error updating calculation:', error)
      alert('修改失败，请重试')
    }
  }

  // 取消编辑
  const cancelEdit = () => {
    setEditingId(null)
    setEditingStudentCount(0)
    setPreviewResult(null)
  }

  // 更新计算记录的日期相关字段
  const updateCalculationField = async (id: number, field: keyof CalculationResult, value: string | number | null) => {
    // 更新本地状态
    setBatchResults(prev => prev.map(r =>
      r.id === id ? { ...r, [field]: value } : r
    ))

    // 保存到数据库
    try {
      await fetch('/api/commission-calculations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, [field]: value }),
      })
    } catch (error) {
      console.error('Error updating calculation:', error)
    }
  }

  // 更新平台抽佣并重新计算分配（平台抽佣是每个营单独设置的）
  const updatePlatformCommission = useCallback(async (id: number, newPlatformCommission: number) => {
    const result = batchResults.find(r => r.id === id)
    if (!result) return

    const course = courseMaterials.find(c => c.courseName === result.courseName)
    if (!course) return

    const rule = getApplicableRule(result.hasLive, result.studentCount)
    if (!rule) return

    const totalRevenue = result.totalRevenue
    const totalMaterialCost = result.materialCost
    const revenueAfterPlatform = totalRevenue - newPlatformCommission
    const totalSalesCommission = revenueAfterPlatform * (course.salesCommissionRate / 100)
    const totalQianFee = result.qianTeacherFee
    const distributionPool = revenueAfterPlatform * (1 - course.salesCommissionRate / 100) - totalMaterialCost - totalQianFee

    let cocoAmount: number, zoeyAmount: number, echoAmount: number

    if (result.thirdPersonMode === 'fixed') {
      // 定额模式: echoRate 存的是人均定额
      zoeyAmount = distributionPool * (rule.zoeyRate / 100)
      echoAmount = result.echoRate * result.studentCount
      cocoAmount = distributionPool - zoeyAmount - echoAmount
    } else {
      // 比例模式
      cocoAmount = distributionPool * (rule.cocoRate / 100)
      zoeyAmount = distributionPool * (rule.zoeyRate / 100)
      echoAmount = distributionPool * (rule.echoRate / 100)
    }

    const updatedResult: CalculationResult = {
      ...result,
      platformCommission: newPlatformCommission,
      salesCommission: totalSalesCommission,
      distributionPool,
      cocoAmount,
      zoeyAmount,
      echoAmount,
    }

    setBatchResults(prev => prev.map(r => r.id === id ? updatedResult : r))

    try {
      await fetch('/api/commission-calculations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          platformCommission: newPlatformCommission,
          salesCommission: totalSalesCommission,
          distributionPool,
          cocoAmount,
          zoeyAmount,
          echoAmount,
        }),
      })
    } catch (error) {
      console.error('Error updating platform commission:', error)
    }
  }, [batchResults, courseMaterials, getApplicableRule])

  // 计算结营日期
  const calculateEndDate = (startDate: string | null | undefined, campDuration: number, holidayDays: number): string | null => {
    if (!startDate) return null
    const start = new Date(startDate)
    if (isNaN(start.getTime())) return null
    // 结营日期 = 开营日期 + 营期长度 + 假期天数 - 1 (因为开营日期就是第1天)
    const totalDays = campDuration + holidayDays - 1
    const end = new Date(start)
    end.setDate(end.getDate() + totalDays)
    return end.toISOString().split('T')[0]
  }

  // 格式化日期显示 (年/月/日格式)
  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '-'
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
  }

  // 开始编辑备注
  const startEditNote = (r: CalculationResult) => {
    if (!r.id) return
    setEditingNoteId(r.id)
    setEditingNoteText(r.notes || '')
  }

  // 保存备注
  const saveNote = async () => {
    if (!editingNoteId) return
    await updateCalculationField(editingNoteId, 'notes', editingNoteText || null)
    setEditingNoteId(null)
    setEditingNoteText('')
  }

  // 取消编辑备注
  const cancelEditNote = () => {
    setEditingNoteId(null)
    setEditingNoteText('')
  }

  // 计算批量汇总
  const batchTotals = {
    totalRevenue: batchResults.reduce((sum, r) => sum + r.totalRevenue, 0),
    totalMaterialCost: batchResults.reduce((sum, r) => sum + r.materialCost, 0),
    totalSalesCommission: batchResults.reduce((sum, r) => sum + r.salesCommission, 0),
    totalPlatformCommission: batchResults.reduce((sum, r) => sum + (r.platformCommission || 0), 0),
    totalQianFee: batchResults.reduce((sum, r) => sum + r.qianTeacherFee, 0),
    totalPool: batchResults.reduce((sum, r) => sum + r.distributionPool, 0),
    totalCoco: batchResults.reduce((sum, r) => sum + r.cocoAmount, 0),
    totalZoey: batchResults.reduce((sum, r) => sum + r.zoeyAmount, 0),
    totalEcho: batchResults.reduce((sum, r) => sum + r.echoAmount, 0),
    totalStudents: batchResults.reduce((sum, r) => sum + r.studentCount, 0),
  }

  // 导出 CSV
  const exportToCSV = () => {
    if (batchResults.length === 0) return

    const now = new Date().toISOString().slice(0, 10)
    let csv = '\uFEFF' // UTF-8 BOM

    csv += '运营分配计算结果\n'
    csv += '课程名称,学员数,零售价,总营收,教材成本,销售分佣,平台抽佣,钱老师费用,可分配池,Coco分配,Zoey分配,班主任,班主任分配,分配模式,Coco比例,Zoey比例\n'

    batchResults.forEach(r => {
      const thirdName = r.thirdPersonName || 'Echo'
      const modeLabel = r.thirdPersonMode === 'fixed' ? `定额¥${r.echoRate}/人` : `${r.echoRate}%`
      csv += `${r.courseName},${r.studentCount},${r.retailPrice},${r.totalRevenue},${r.materialCost.toFixed(0)},${r.salesCommission.toFixed(0)},${(r.platformCommission || 0).toFixed(0)},${r.qianTeacherFee.toFixed(0)},${r.distributionPool.toFixed(0)},${r.cocoAmount.toFixed(0)},${r.zoeyAmount.toFixed(0)},${thirdName},${r.echoAmount.toFixed(0)},${modeLabel},${r.cocoRate}%,${r.zoeyRate}%\n`
    })

    csv += `合计,${batchTotals.totalStudents},,${batchTotals.totalRevenue},${batchTotals.totalMaterialCost.toFixed(0)},${batchTotals.totalSalesCommission.toFixed(0)},${batchTotals.totalPlatformCommission.toFixed(0)},${batchTotals.totalQianFee.toFixed(0)},${batchTotals.totalPool.toFixed(0)},${batchTotals.totalCoco.toFixed(0)},${batchTotals.totalZoey.toFixed(0)},,${batchTotals.totalEcho.toFixed(0)},,,,\n`

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `运营分配计算_${now}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 更新分佣规则
  const updateRule = async (id: number, field: string, value: number) => {
    const rule = commissionRules.find(r => r.id === id)
    if (!rule) return

    setCommissionRules(prev => prev.map(r =>
      r.id === id ? { ...r, [field]: value } : r
    ))

    await fetch('/api/commission-rules', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, [field]: value }),
    })
  }

  // 批量更新受影响的计算记录
  const updateAffectedCalculations = useCallback(async (
    courseName: string,
    updatedCourse: CourseMaterial
  ) => {
    // 找到所有使用该课程的计算记录
    const affectedResults = batchResults.filter(r => r.courseName === courseName)
    if (affectedResults.length === 0) return

    // 为每个受影响的记录重新计算（保留原有的平台抽佣，因为平台抽佣是每个营单独设置的）
    const updatedResults: CalculationResult[] = []
    for (const result of affectedResults) {
      const rule = getApplicableRule(updatedCourse.hasLive, result.studentCount)
      if (!rule) continue

      const totalRevenue = updatedCourse.retailPrice * result.studentCount
      const totalMaterialCost = updatedCourse.materialCost * result.studentCount
      const totalPlatformCommission = result.platformCommission || 0
      const revenueAfterPlatform = totalRevenue - totalPlatformCommission
      const totalSalesCommission = revenueAfterPlatform * (updatedCourse.salesCommissionRate / 100)
      const totalQianFee = updatedCourse.qianTeacherFee * result.studentCount
      const distributionPool = revenueAfterPlatform * (1 - updatedCourse.salesCommissionRate / 100) - totalMaterialCost - totalQianFee

      let cocoAmount: number, zoeyAmount: number, echoAmount: number

      if (result.thirdPersonMode === 'fixed') {
        // 定额模式: echoRate 存的是人均定额
        zoeyAmount = distributionPool * (rule.zoeyRate / 100)
        echoAmount = result.echoRate * result.studentCount
        cocoAmount = distributionPool - zoeyAmount - echoAmount
      } else {
        cocoAmount = distributionPool * (rule.cocoRate / 100)
        zoeyAmount = distributionPool * (rule.zoeyRate / 100)
        echoAmount = distributionPool * (rule.echoRate / 100)
      }

      const newResult: CalculationResult = {
        ...result,
        courseName: updatedCourse.courseName,
        hasLive: updatedCourse.hasLive,
        retailPrice: updatedCourse.retailPrice,
        totalRevenue,
        materialCost: totalMaterialCost,
        salesCommission: totalSalesCommission,
        platformCommission: totalPlatformCommission,
        qianTeacherFee: totalQianFee,
        distributionPool,
        cocoAmount,
        zoeyAmount,
        echoAmount,
        cocoRate: rule.cocoRate,
        zoeyRate: rule.zoeyRate,
        echoRate: result.thirdPersonMode === 'fixed' ? result.echoRate : rule.echoRate,
      }
      updatedResults.push(newResult)
    }

    // 检查是否有数据变化
    const hasChanges = updatedResults.some((newResult, i) => {
      const oldResult = affectedResults[i]
      return (
        newResult.totalRevenue !== oldResult.totalRevenue ||
        newResult.materialCost !== oldResult.materialCost ||
        newResult.salesCommission !== oldResult.salesCommission ||
        newResult.platformCommission !== oldResult.platformCommission ||
        newResult.qianTeacherFee !== oldResult.qianTeacherFee ||
        newResult.distributionPool !== oldResult.distributionPool ||
        newResult.cocoAmount !== oldResult.cocoAmount ||
        newResult.zoeyAmount !== oldResult.zoeyAmount ||
        newResult.echoAmount !== oldResult.echoAmount
      )
    })

    if (!hasChanges) return

    // 构建变化说明
    const changeDetails: string[] = []
    changeDetails.push(`检测到 ${affectedResults.length} 条计算记录使用了 "${courseName}" 课程`)
    changeDetails.push('')
    changeDetails.push('数据将发生以下变化：')
    changeDetails.push('')

    for (let i = 0; i < affectedResults.length; i++) {
      const oldR = affectedResults[i]
      const newR = updatedResults[i]
      changeDetails.push(`【${oldR.courseName} - ${oldR.studentCount}人】`)
      if (oldR.totalRevenue !== newR.totalRevenue) {
        changeDetails.push(`  总营收: ${oldR.totalRevenue.toLocaleString()} → ${newR.totalRevenue.toLocaleString()}`)
      }
      if (oldR.materialCost !== newR.materialCost) {
        changeDetails.push(`  教材成本: ${oldR.materialCost.toFixed(0)} → ${newR.materialCost.toFixed(0)}`)
      }
      if (oldR.salesCommission !== newR.salesCommission) {
        changeDetails.push(`  销售分佣: ${oldR.salesCommission.toFixed(0)} → ${newR.salesCommission.toFixed(0)}`)
      }
      if (oldR.platformCommission !== newR.platformCommission) {
        changeDetails.push(`  平台抽佣: ${oldR.platformCommission.toFixed(0)} → ${newR.platformCommission.toFixed(0)}`)
      }
      if (oldR.qianTeacherFee !== newR.qianTeacherFee) {
        changeDetails.push(`  钱老师费用: ${oldR.qianTeacherFee.toFixed(0)} → ${newR.qianTeacherFee.toFixed(0)}`)
      }
      if (oldR.distributionPool !== newR.distributionPool) {
        changeDetails.push(`  可分配池: ${oldR.distributionPool.toFixed(0)} → ${newR.distributionPool.toFixed(0)}`)
      }
      if (oldR.cocoAmount !== newR.cocoAmount) {
        changeDetails.push(`  Coco: ${oldR.cocoAmount.toFixed(0)} → ${newR.cocoAmount.toFixed(0)}`)
      }
      if (oldR.zoeyAmount !== newR.zoeyAmount) {
        changeDetails.push(`  Zoey: ${oldR.zoeyAmount.toFixed(0)} → ${newR.zoeyAmount.toFixed(0)}`)
      }
      if (oldR.echoAmount !== newR.echoAmount) {
        changeDetails.push(`  Echo: ${oldR.echoAmount.toFixed(0)} → ${newR.echoAmount.toFixed(0)}`)
      }
      changeDetails.push('')
    }

    changeDetails.push('是否确认更新这些计算记录？')

    const confirmMsg = changeDetails.join('\n')
    if (!confirm(confirmMsg)) return

    // 用户确认后，批量更新数据库中的记录
    try {
      for (const newResult of updatedResults) {
        if (!newResult.id) continue
        await fetch('/api/commission-calculations', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: newResult.id,
            courseName: newResult.courseName,
            hasLive: newResult.hasLive,
            retailPrice: newResult.retailPrice,
            totalRevenue: newResult.totalRevenue,
            materialCost: newResult.materialCost,
            salesCommission: newResult.salesCommission,
            platformCommission: newResult.platformCommission,
            qianTeacherFee: newResult.qianTeacherFee,
            distributionPool: newResult.distributionPool,
            cocoAmount: newResult.cocoAmount,
            zoeyAmount: newResult.zoeyAmount,
            echoAmount: newResult.echoAmount,
            cocoRate: newResult.cocoRate,
            zoeyRate: newResult.zoeyRate,
            echoRate: newResult.echoRate,
          }),
        })
      }

      // 更新本地状态
      setBatchResults(prev => prev.map(r => {
        const updated = updatedResults.find(u => u.id === r.id)
        return updated || r
      }))

      alert('计算记录已更新！')
    } catch (error) {
      console.error('Error updating calculations:', error)
      alert('更新失败，请重试')
    }
  }, [batchResults, getApplicableRule])

  // 更新课程成本
  const updateCourseMaterial = useCallback(async (id: number, field: keyof CourseMaterial, value: string | number | boolean) => {
    const numValue = typeof value === 'string' && field !== 'courseName' ? Number(value) : value

    // 获取当前课程信息
    const currentCourse = courseMaterials.find(c => c.id === id)
    if (!currentCourse) return

    // 先更新本地状态
    const updatedCourse = { ...currentCourse, [field]: numValue }
    setCourseMaterials(prev => prev.map(c =>
      c.id === id ? updatedCourse : c
    ))

    // 保存到数据库
    await fetch('/api/course-materials', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, [field]: numValue }),
    })

    // 只对原有课程触发联动更新，新增的课程不影响已有计算记录
    if (!newCourseIds.has(id)) {
      const courseNameToCheck = field === 'courseName' ? currentCourse.courseName : updatedCourse.courseName
      await updateAffectedCalculations(courseNameToCheck, updatedCourse)
    }
  }, [courseMaterials, updateAffectedCalculations, newCourseIds])

  // 拖拽开始
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  // 拖拽结束
  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  // 拖拽经过
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    // 重新排序
    const newMaterials = [...courseMaterials]
    const [draggedItem] = newMaterials.splice(draggedIndex, 1)
    newMaterials.splice(index, 0, draggedItem)

    setCourseMaterials(newMaterials)
    setDraggedIndex(index)
  }

  // 拖拽放下后保存顺序
  const handleDrop = async () => {
    // 更新所有项的 sortOrder
    const updates = courseMaterials.map((c, i) => ({
      id: c.id,
      sortOrder: i,
    }))

    // 批量更新
    for (const update of updates) {
      await fetch('/api/course-materials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      })
    }
  }

  // 新增课程成本
  const addCourseMaterial = async () => {
    try {
      const maxSort = courseMaterials.length > 0
        ? Math.max(...courseMaterials.map(c => c.sortOrder)) + 1
        : 0
      const res = await fetch('/api/course-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseName: '新课程',
          retailPrice: 0,
          materialCost: 0,
          hasLive: false,
          qianTeacherFee: 0,
          salesCommissionRate: 0,
          defaultCampDuration: 0,
          examType: '',
          sortOrder: maxSort,
        }),
      })
      if (!res.ok) throw new Error('Failed to create')
      const newMaterial = await res.json()
      setCourseMaterials(prev => [...prev, newMaterial])
      setNewCourseIds(prev => new Set(prev).add(newMaterial.id))
    } catch (error) {
      console.error('Error creating course material:', error)
      alert('新增失败，请重试')
    }
  }

  // 删除课程成本
  const deleteCourseMaterial = async (id: number) => {
    if (courseMaterials.length <= 1) {
      alert('至少保留一个课程')
      return
    }
    if (!confirm('确定要删除这个课程吗？')) return

    try {
      await fetch(`/api/course-materials?id=${id}`, { method: 'DELETE' })
      setCourseMaterials(prev => prev.filter(c => c.id !== id))
    } catch (error) {
      console.error('Error deleting course material:', error)
      alert('删除失败，请重试')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-900">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-800">👥 <span className="text-amber-600">运营分配计算器</span></h1>

      {/* ==================== 分佣规则设置 ==================== */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 no-print">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900 text-lg">分佣比例设置</h3>
          <span className="text-sm text-green-600 font-medium">自动保存</span>
        </div>
        <p className="text-sm text-gray-700 mb-4">根据产品类型和学员人数，设置 Coco、Zoey、Echo 三人的分佣比例（旧方案仍适用于已有记录）</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 带直播产品规则 */}
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
            <h4 className="font-semibold text-amber-800 mb-3">带直播产品</h4>
            <div className="space-y-3">
              {commissionRules
                .filter(r => r.productType === 'with_live')
                .map(rule => {
                  const sum = rule.cocoRate + rule.zoeyRate + rule.echoRate
                  const isValid = sum === 100
                  return (
                    <div key={rule.id} className="flex items-center gap-2 text-sm flex-wrap">
                      <span className="w-20 text-gray-900 font-medium">
                        {rule.minStudents}-{rule.maxStudents ?? '∞'}人:
                      </span>
                      <span className="text-gray-700">Coco</span>
                      <input
                        type="number"
                        value={rule.cocoRate}
                        onChange={(e) => updateRule(rule.id, 'cocoRate', Number(e.target.value))}
                        className="w-14 px-1 py-1 border border-gray-400 rounded text-center text-gray-900 bg-white"
                      />
                      <span className="text-gray-700">Zoey</span>
                      <input
                        type="number"
                        value={rule.zoeyRate}
                        onChange={(e) => updateRule(rule.id, 'zoeyRate', Number(e.target.value))}
                        className="w-14 px-1 py-1 border border-gray-400 rounded text-center text-gray-900 bg-white"
                      />
                      <span className="text-gray-700">Echo</span>
                      <input
                        type="number"
                        value={rule.echoRate}
                        onChange={(e) => updateRule(rule.id, 'echoRate', Number(e.target.value))}
                        className="w-14 px-1 py-1 border border-gray-400 rounded text-center text-gray-900 bg-white"
                      />
                      <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${isValid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        ={sum}%
                      </span>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* 不带直播产品规则 */}
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
            <h4 className="font-semibold text-orange-800 mb-3">不带直播产品</h4>
            <div className="space-y-3">
              {commissionRules
                .filter(r => r.productType === 'without_live')
                .map(rule => {
                  const sum = rule.cocoRate + rule.zoeyRate + rule.echoRate
                  const isValid = sum === 100
                  return (
                    <div key={rule.id} className="flex items-center gap-2 text-sm flex-wrap">
                      <span className="w-20 text-gray-900 font-medium">
                        {rule.minStudents}-{rule.maxStudents ?? '∞'}人:
                      </span>
                      <span className="text-gray-700">Coco</span>
                      <input
                        type="number"
                        value={rule.cocoRate}
                        onChange={(e) => updateRule(rule.id, 'cocoRate', Number(e.target.value))}
                        className="w-14 px-1 py-1 border border-gray-400 rounded text-center text-gray-900 bg-white"
                      />
                      <span className="text-gray-700">Zoey</span>
                      <input
                        type="number"
                        value={rule.zoeyRate}
                        onChange={(e) => updateRule(rule.id, 'zoeyRate', Number(e.target.value))}
                        className="w-14 px-1 py-1 border border-gray-400 rounded text-center text-gray-900 bg-white"
                      />
                      <span className="text-gray-700">Echo</span>
                      <input
                        type="number"
                        value={rule.echoRate}
                        onChange={(e) => updateRule(rule.id, 'echoRate', Number(e.target.value))}
                        className="w-14 px-1 py-1 border border-gray-400 rounded text-center text-gray-900 bg-white"
                      />
                      <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${isValid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        ={sum}%
                      </span>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      </div>

      {/* ==================== 班主任定额分配方案 ==================== */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 no-print">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900 text-lg">班主任定额分配方案</h3>
          <button
            onClick={async () => {
              try {
                const res = await fetch('/api/commission-fixed-rates', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    personName: 'Ari老师',
                    examType: 'KET',
                    campType: 'full',
                    amountPerStudent: 0,
                    allocationType: 'fixed',
                  }),
                })
                if (!res.ok) throw new Error('Failed to create')
                const newRate = await res.json()
                setFixedRates(prev => [...prev, newRate])
              } catch (error) {
                console.error('Error creating fixed rate:', error)
                alert('新增失败，请重试')
              }
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium"
          >
            + 新增规则
          </button>
        </div>
        <p className="text-sm text-gray-700 mb-4">
          按营类型设置班主任人均定额。计算逻辑：Zoey = 可分配池 × Zoey比例，班主任 = 定额 × 学员数，Coco = 可分配池 - Zoey - 班主任
        </p>

        {fixedRates.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-200 text-gray-900">
                  <th className="px-3 py-2 text-left font-semibold">班主任姓名</th>
                  <th className="px-3 py-2 text-center font-semibold">考试类型</th>
                  <th className="px-3 py-2 text-center font-semibold">营类型</th>
                  <th className="px-3 py-2 text-center font-semibold">人均定额 (¥)</th>
                  <th className="px-3 py-2 text-center font-semibold">操作</th>
                </tr>
              </thead>
              <tbody>
                {fixedRates.map((rate, index) => (
                  <tr key={rate.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={rate.personName}
                        onChange={async (e) => {
                          const newName = e.target.value
                          setFixedRates(prev => prev.map(r => r.id === rate.id ? { ...r, personName: newName } : r))
                          await fetch('/api/commission-fixed-rates', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: rate.id, personName: newName }),
                          })
                        }}
                        className="w-32 px-2 py-1 border border-gray-400 rounded text-gray-900 bg-white"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <select
                        value={rate.examType}
                        onChange={async (e) => {
                          const newType = e.target.value
                          setFixedRates(prev => prev.map(r => r.id === rate.id ? { ...r, examType: newType } : r))
                          await fetch('/api/commission-fixed-rates', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: rate.id, examType: newType }),
                          })
                        }}
                        className="px-2 py-1 border border-gray-400 rounded text-gray-900 bg-white"
                      >
                        <option value="KET">KET</option>
                        <option value="PET">PET</option>
                        <option value="FCE">FCE</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <select
                        value={rate.campType}
                        onChange={async (e) => {
                          const newType = e.target.value
                          setFixedRates(prev => prev.map(r => r.id === rate.id ? { ...r, campType: newType } : r))
                          await fetch('/api/commission-fixed-rates', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: rate.id, campType: newType }),
                          })
                        }}
                        className="px-2 py-1 border border-gray-400 rounded text-gray-900 bg-white"
                      >
                        <option value="full">全程营</option>
                        <option value="sprint">考冲营</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        min={0}
                        value={rate.amountPerStudent}
                        onChange={async (e) => {
                          const newAmount = Number(e.target.value) || 0
                          setFixedRates(prev => prev.map(r => r.id === rate.id ? { ...r, amountPerStudent: newAmount } : r))
                          await fetch('/api/commission-fixed-rates', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: rate.id, amountPerStudent: newAmount }),
                          })
                        }}
                        className="w-24 px-2 py-1 border border-gray-400 rounded text-center text-gray-900 bg-white"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={async () => {
                          if (!confirm('确定删除此规则？')) return
                          try {
                            await fetch(`/api/commission-fixed-rates?id=${rate.id}`, { method: 'DELETE' })
                            setFixedRates(prev => prev.filter(r => r.id !== rate.id))
                          } catch (error) {
                            console.error('Error deleting fixed rate:', error)
                            alert('删除失败')
                          }
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            暂无定额分配规则，点击「+ 新增规则」添加班主任定额方案
          </div>
        )}
      </div>

      {/* ==================== 计算器 ==================== */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 no-print">
        <h3 className="font-bold text-gray-900 text-lg mb-4">分配计算</h3>

        <div className="flex flex-wrap gap-4 items-end mb-6">
          <div>
            <label className="block text-sm text-gray-900 font-medium mb-1">选择课程</label>
            <select
              value={selectedCourseId || ''}
              onChange={(e) => setSelectedCourseId(Number(e.target.value))}
              className="w-60 px-3 py-2 border border-gray-400 rounded-lg text-gray-900 bg-white"
            >
              {courseMaterials.map(c => (
                <option key={c.id} value={c.id}>
                  {c.courseName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-900 font-medium mb-1">学员人数</label>
            <input
              type="number"
              min={1}
              value={studentCount}
              onChange={(e) => setStudentCount(Math.max(1, Number(e.target.value)))}
              className="w-24 px-3 py-2 border border-gray-400 rounded-lg text-center text-gray-900 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-900 font-medium mb-1">班主任</label>
            <select
              value={selectedClassManager}
              onChange={(e) => setSelectedClassManager(e.target.value as 'echo' | 'fixed')}
              className="px-3 py-2 border border-gray-400 rounded-lg text-gray-900 bg-white"
            >
              <option value="echo">Echo (比例分配)</option>
              {fixedRates.length > 0 && (
                <option value="fixed">
                  {[...new Set(fixedRates.map(r => r.personName))].join('/')} (定额分配)
                </option>
              )}
            </select>
          </div>

          <button
            onClick={handleCalculate}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            计算
          </button>
        </div>

        {/* 计算结果 */}
        {result && (
          <div className="border-2 border-blue-400 rounded-lg p-4 bg-blue-50 mb-4">
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-semibold text-gray-900">
                {result.courseName} - {result.studentCount}人
                <span className={`ml-2 text-sm px-2 py-1 rounded font-medium ${result.hasLive ? 'bg-amber-200 text-amber-900' : 'bg-orange-200 text-orange-900'}`}>
                  {result.hasLive ? '带直播' : '不带直播'}
                </span>
              </h4>
              <button
                onClick={addToBatch}
                className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 text-sm font-medium"
              >
                添加到列表
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm mb-4">
              <div>
                <div className="text-gray-700">零售价</div>
                <div className="font-bold text-gray-900 text-lg">{result.retailPrice.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-700">总营收</div>
                <div className="font-bold text-gray-900 text-lg">{result.totalRevenue.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-700">教材成本</div>
                <div className="font-bold text-red-700 text-lg">-{result.materialCost.toFixed(0)}</div>
              </div>
              <div>
                <div className="text-gray-700">销售分佣</div>
                <div className="font-bold text-red-700 text-lg">-{result.salesCommission.toFixed(0)}</div>
              </div>
              <div>
                <div className="text-gray-700">平台抽佣</div>
                <div className="font-bold text-red-700 text-lg">-{result.platformCommission.toFixed(0)}</div>
              </div>
            </div>

            {result.qianTeacherFee > 0 && (
              <div className="mb-4">
                <div className="text-gray-700 text-sm">钱老师费用</div>
                <div className="font-bold text-red-700 text-lg">-{result.qianTeacherFee.toFixed(0)}</div>
              </div>
            )}

            <div className="border-t-2 border-blue-300 pt-4">
              <div className="text-gray-900 mb-2 font-medium">可分配池: <span className="font-bold text-blue-800 text-xl">{result.distributionPool.toFixed(0)}</span></div>

              <div className="grid grid-cols-3 gap-4 mt-3">
                <div className="bg-pink-200 rounded-lg p-3 text-center border border-pink-400">
                  <div className="text-pink-900 font-semibold">Coco {result.thirdPersonMode === 'fixed' ? '(余额)' : `(${result.cocoRate}%)`}</div>
                  <div className="text-2xl font-bold text-pink-900">{result.cocoAmount.toFixed(0)}</div>
                </div>
                <div className="bg-green-200 rounded-lg p-3 text-center border border-green-400">
                  <div className="text-green-900 font-semibold">Zoey ({result.zoeyRate}%)</div>
                  <div className="text-2xl font-bold text-green-900">{result.zoeyAmount.toFixed(0)}</div>
                </div>
                <div className="bg-yellow-200 rounded-lg p-3 text-center border border-yellow-500">
                  <div className="text-yellow-900 font-semibold">
                    {result.thirdPersonName} {result.thirdPersonMode === 'fixed' ? `(¥${result.echoRate}/人)` : `(${result.echoRate}%)`}
                  </div>
                  <div className="text-2xl font-bold text-yellow-900">{result.echoAmount.toFixed(0)}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================== 批量结果列表 ==================== */}
      {batchResults.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900 text-lg">计算列表</h3>
            <div className="flex gap-2">
              <button
                onClick={exportToCSV}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 text-sm font-medium"
              >
                导出 CSV
              </button>
              <button
                onClick={clearBatch}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-medium"
              >
                清空列表
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-200 text-gray-900">
                  <th className="px-2 py-3 text-left font-semibold">课程名称</th>
                  <th className="px-2 py-3 text-center font-semibold">学员数</th>
                  <th className="px-2 py-3 text-right font-semibold">总营收</th>
                  <th className="px-2 py-3 text-right font-semibold">教材成本</th>
                  <th className="px-2 py-3 text-right font-semibold">销售分佣</th>
                  <th className="px-2 py-3 text-right font-semibold">平台抽佣</th>
                  <th className="px-2 py-3 text-right font-semibold">钱老师</th>
                  <th className="px-2 py-3 text-right font-semibold bg-blue-100">可分配池</th>
                  <th className="px-2 py-3 text-right font-semibold bg-pink-200 text-pink-900">Coco</th>
                  <th className="px-2 py-3 text-right font-semibold bg-green-200 text-green-900">Zoey</th>
                  <th className="px-2 py-3 text-right font-semibold bg-yellow-200 text-yellow-900">班主任</th>
                  <th className="px-2 py-3 text-center font-semibold bg-indigo-100 text-indigo-900">开营时间</th>
                  <th className="px-2 py-3 text-center font-semibold bg-indigo-100 text-indigo-900">营期</th>
                  <th className="px-2 py-3 text-center font-semibold bg-indigo-100 text-indigo-900">假期</th>
                  <th className="px-2 py-3 text-center font-semibold bg-indigo-200 text-indigo-900">结营日期</th>
                  <th className="px-2 py-3 text-center font-semibold">备注</th>
                  <th className="px-2 py-3 text-center font-semibold no-print">操作</th>
                </tr>
              </thead>
              <tbody>
                {batchResults.map((r, index) => {
                  const isEditing = editingId === r.id
                  const displayData = isEditing && previewResult ? previewResult : r
                  const hasChange = isEditing && previewResult && previewResult.studentCount !== r.studentCount
                  return (
                    <tr key={index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-100'} ${isEditing ? 'ring-2 ring-blue-400' : ''}`}>
                      <td className="px-2 py-2 text-gray-900">
                        {r.courseName}
                        <span className={`ml-1 text-xs px-1 rounded font-medium ${r.hasLive ? 'bg-amber-200 text-amber-900' : 'bg-orange-200 text-orange-900'}`}>
                          {r.hasLive ? '直播' : '录播'}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            min={1}
                            value={editingStudentCount}
                            onChange={(e) => previewStudentCountChange(Math.max(1, Number(e.target.value)), r)}
                            className="w-16 px-1 py-1 border-2 border-blue-400 rounded text-center text-gray-900 bg-white print:hidden"
                            autoFocus
                          />
                        ) : (
                          <button
                            onClick={() => startEditStudentCount(r)}
                            className="text-gray-900 hover:bg-blue-100 px-2 py-1 rounded cursor-pointer print:hidden"
                            title="点击编辑学员数"
                          >
                            {r.studentCount}
                          </button>
                        )}
                        <span className="hidden print:inline">{r.studentCount}</span>
                      </td>
                      <td className={`px-2 py-2 text-right ${hasChange ? 'text-blue-600' : 'text-gray-900'}`}>
                        {displayData.totalRevenue.toLocaleString()}
                      </td>
                      <td className={`px-2 py-2 text-right font-medium ${hasChange ? 'text-blue-600' : 'text-red-700'}`}>
                        -{displayData.materialCost.toFixed(0)}
                      </td>
                      <td className={`px-2 py-2 text-right font-medium ${hasChange ? 'text-blue-600' : 'text-red-700'}`}>
                        -{displayData.salesCommission.toFixed(0)}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <input
                          type="number"
                          min={0}
                          value={r.platformCommission || 0}
                          onChange={(e) => r.id && updatePlatformCommission(r.id, Number(e.target.value) || 0)}
                          className="w-20 px-1 py-1 border border-gray-300 rounded text-center text-red-700 bg-white text-xs font-medium print:hidden"
                          title="输入平台抽佣总金额（将自动重新计算分配）"
                        />
                        <span className="hidden print:inline text-red-700 font-medium">-{(r.platformCommission || 0).toFixed(0)}</span>
                      </td>
                      <td className={`px-2 py-2 text-right font-medium ${hasChange ? 'text-blue-600' : 'text-red-700'}`}>
                        {displayData.qianTeacherFee > 0 ? `-${displayData.qianTeacherFee.toFixed(0)}` : '-'}
                      </td>
                      <td className={`px-2 py-2 text-right bg-blue-100 font-bold ${hasChange ? 'text-blue-600' : 'text-blue-900'}`}>
                        {displayData.distributionPool.toFixed(0)}
                      </td>
                      <td className={`px-2 py-2 text-right bg-pink-100 font-bold ${hasChange ? 'text-blue-600' : 'text-pink-900'}`}>
                        {displayData.cocoAmount.toFixed(0)}
                      </td>
                      <td className={`px-2 py-2 text-right bg-green-100 font-bold ${hasChange ? 'text-blue-600' : 'text-green-900'}`}>
                        {displayData.zoeyAmount.toFixed(0)}
                      </td>
                      <td className={`px-2 py-2 text-right bg-yellow-100 font-bold ${hasChange ? 'text-blue-600' : 'text-yellow-900'}`} title={`${displayData.thirdPersonName || 'Echo'} ${displayData.thirdPersonMode === 'fixed' ? `(¥${displayData.echoRate}/人)` : `(${displayData.echoRate}%)`}`}>
                        <div>{displayData.echoAmount.toFixed(0)}</div>
                        <div className="text-xs font-normal text-yellow-700">{displayData.thirdPersonName || 'Echo'}</div>
                      </td>
                      {/* 开营时间 */}
                      <td className="px-2 py-2 text-center bg-indigo-50">
                        <input
                          type="date"
                          value={r.startDate ? r.startDate.split('T')[0] : ''}
                          onChange={(e) => r.id && updateCalculationField(r.id, 'startDate', e.target.value || null)}
                          className="w-32 px-1 py-1 border border-gray-300 rounded text-center text-gray-900 bg-white text-xs print:hidden"
                        />
                        <span className="hidden print:inline">{formatDate(r.startDate)}</span>
                      </td>
                      {/* 营期 */}
                      <td className="px-2 py-2 text-center bg-indigo-50">
                        <input
                          type="number"
                          min={1}
                          value={r.campDuration || ''}
                          onChange={(e) => r.id && updateCalculationField(r.id, 'campDuration', Number(e.target.value) || 0)}
                          className="w-14 px-1 py-1 border border-gray-300 rounded text-center text-gray-900 bg-white text-xs print:hidden"
                        />
                        <span className="hidden print:inline">{r.campDuration || '-'}</span>
                      </td>
                      {/* 假期 */}
                      <td className="px-2 py-2 text-center bg-indigo-50">
                        <input
                          type="number"
                          min={0}
                          value={r.holidayDays || ''}
                          onChange={(e) => r.id && updateCalculationField(r.id, 'holidayDays', Number(e.target.value) || 0)}
                          className="w-14 px-1 py-1 border border-gray-300 rounded text-center text-gray-900 bg-white text-xs print:hidden"
                        />
                        <span className="hidden print:inline">{r.holidayDays || '-'}</span>
                      </td>
                      {/* 结营日期 */}
                      <td className="px-2 py-2 text-center bg-indigo-100 font-medium text-indigo-900">
                        {calculateEndDate(r.startDate, r.campDuration, r.holidayDays)
                          ? formatDate(calculateEndDate(r.startDate, r.campDuration, r.holidayDays))
                          : '-'}
                      </td>
                      {/* 备注 */}
                      <td className="px-2 py-2 text-center">
                        <button
                          onClick={() => startEditNote(r)}
                          className={`px-2 py-1 rounded text-xs print:hidden ${r.notes ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'}`}
                          title={r.notes || '点击添加备注'}
                        >
                          {r.notes ? '📝' : '➕'}
                        </button>
                        <span className="hidden print:inline text-xs">{r.notes || '-'}</span>
                      </td>
                      <td className="px-2 py-2 text-center no-print">
                        {isEditing ? (
                          <div className="flex gap-1 justify-center">
                            <button
                              onClick={confirmStudentCountChange}
                              disabled={!hasChange}
                              className="text-green-700 hover:text-green-900 font-medium disabled:opacity-30"
                            >
                              确认
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="text-gray-500 hover:text-gray-700 font-medium"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => removeFromBatch(r.id, index)}
                            className="text-red-700 hover:text-red-900 font-medium"
                          >
                            删除
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-300 font-bold text-gray-900">
                  <td className="px-2 py-3 text-right">合计</td>
                  <td className="px-2 py-3 text-center">{batchTotals.totalStudents}人</td>
                  <td className="px-2 py-3 text-right">{batchTotals.totalRevenue.toLocaleString()}</td>
                  <td className="px-2 py-3 text-right text-red-700">-{batchTotals.totalMaterialCost.toFixed(0)}</td>
                  <td className="px-2 py-3 text-right text-red-700">-{batchTotals.totalSalesCommission.toFixed(0)}</td>
                  <td className="px-2 py-3 text-right text-red-700">-{batchTotals.totalPlatformCommission.toFixed(0)}</td>
                  <td className="px-2 py-3 text-right text-red-700">-{batchTotals.totalQianFee.toFixed(0)}</td>
                  <td className="px-2 py-3 text-right bg-blue-200 text-blue-900">{batchTotals.totalPool.toFixed(0)}</td>
                  <td className="px-2 py-3 text-right bg-pink-200 text-pink-900">{batchTotals.totalCoco.toFixed(0)}</td>
                  <td className="px-2 py-3 text-right bg-green-200 text-green-900">{batchTotals.totalZoey.toFixed(0)}</td>
                  <td className="px-2 py-3 text-right bg-yellow-200 text-yellow-900">{batchTotals.totalEcho.toFixed(0)}</td>
                  <td className="px-2 py-3 bg-indigo-100"></td>
                  <td className="px-2 py-3 bg-indigo-100"></td>
                  <td className="px-2 py-3 bg-indigo-100"></td>
                  <td className="px-2 py-3 bg-indigo-200"></td>
                  <td></td>
                  <td className="no-print"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 备注编辑弹窗 */}
          {editingNoteId && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
                <h4 className="font-bold text-gray-900 mb-4">编辑备注</h4>
                <textarea
                  value={editingNoteText}
                  onChange={(e) => setEditingNoteText(e.target.value)}
                  placeholder="输入备注内容，如学员变动记录..."
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={cancelEditNote}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    取消
                  </button>
                  <button
                    onClick={saveNote}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    保存
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 分配汇总卡片 */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-pink-600 rounded-xl p-4 text-white">
              <div className="text-sm font-medium">Coco 总收入</div>
              <div className="text-3xl font-bold">{batchTotals.totalCoco.toFixed(0)}</div>
              <div className="text-sm mt-1">
                占比 {batchTotals.totalPool > 0 ? ((batchTotals.totalCoco / batchTotals.totalPool) * 100).toFixed(1) : 0}%
              </div>
            </div>
            <div className="bg-green-600 rounded-xl p-4 text-white">
              <div className="text-sm font-medium">Zoey 总收入</div>
              <div className="text-3xl font-bold">{batchTotals.totalZoey.toFixed(0)}</div>
              <div className="text-sm mt-1">
                占比 {batchTotals.totalPool > 0 ? ((batchTotals.totalZoey / batchTotals.totalPool) * 100).toFixed(1) : 0}%
              </div>
            </div>
            <div className="bg-yellow-600 rounded-xl p-4 text-white">
              <div className="text-sm font-medium">班主任 总支出</div>
              <div className="text-3xl font-bold">{batchTotals.totalEcho.toFixed(0)}</div>
              <div className="text-sm mt-1">
                占比 {batchTotals.totalPool > 0 ? ((batchTotals.totalEcho / batchTotals.totalPool) * 100).toFixed(1) : 0}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 课程成本参考表（可编辑） ==================== */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 no-print">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900 text-lg">课程成本参考表</h3>
          <button
            onClick={addCourseMaterial}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium"
          >
            + 新增课程
          </button>
        </div>
        <p className="text-sm text-gray-700 mb-4">所有字段均可编辑，修改后实时保存</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <thead>
              <tr className="bg-gray-200 text-gray-900">
                <th className="w-10 px-2 py-3 text-center font-semibold" title="拖拽排序">☰</th>
                <th className="w-44 px-3 py-3 text-left font-semibold">课程名称</th>
                <th className="w-24 px-3 py-3 text-center font-semibold">类型</th>
                <th className="w-20 px-3 py-3 text-center font-semibold">考试类型</th>
                <th className="w-24 px-3 py-3 text-center font-semibold">零售价</th>
                <th className="w-24 px-3 py-3 text-center font-semibold">教材成本</th>
                <th className="w-28 px-3 py-3 text-center font-semibold">钱老师费用</th>
                <th className="w-28 px-3 py-3 text-center font-semibold">销售分佣率%</th>
                <th className="w-28 px-3 py-3 text-center font-semibold bg-indigo-100 text-indigo-900">默认营期(天)</th>
                <th className="w-16 px-2 py-3 text-center font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              {courseMaterials.map((c, index) => (
                <tr
                  key={c.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={handleDrop}
                  className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-100'} ${draggedIndex === index ? 'opacity-50 bg-blue-100' : ''}`}
                >
                  <td className="px-2 py-2 text-center cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
                    ☰
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={c.courseName}
                      onChange={(e) => updateCourseMaterial(c.id, 'courseName', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-400 rounded text-gray-900 bg-white"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <select
                      value={c.hasLive ? 'true' : 'false'}
                      onChange={(e) => updateCourseMaterial(c.id, 'hasLive', e.target.value === 'true')}
                      className="w-full px-2 py-1 border border-gray-400 rounded text-gray-900 bg-white text-center"
                    >
                      <option value="true">带直播</option>
                      <option value="false">不带直播</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <select
                      value={c.examType || ''}
                      onChange={(e) => updateCourseMaterial(c.id, 'examType', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-400 rounded text-gray-900 bg-white text-center"
                    >
                      <option value="">-</option>
                      <option value="KET">KET</option>
                      <option value="PET">PET</option>
                      <option value="FCE">FCE</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="number"
                      value={c.retailPrice}
                      onChange={(e) => updateCourseMaterial(c.id, 'retailPrice', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-400 rounded text-center text-gray-900 bg-white"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="number"
                      value={c.materialCost}
                      onChange={(e) => updateCourseMaterial(c.id, 'materialCost', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-400 rounded text-center text-gray-900 bg-white"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="number"
                      value={c.qianTeacherFee}
                      onChange={(e) => updateCourseMaterial(c.id, 'qianTeacherFee', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-400 rounded text-center text-gray-900 bg-white"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="number"
                      value={c.salesCommissionRate}
                      onChange={(e) => updateCourseMaterial(c.id, 'salesCommissionRate', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-400 rounded text-center text-gray-900 bg-white"
                    />
                  </td>
                  <td className="px-3 py-2 text-center bg-indigo-50">
                    <input
                      type="number"
                      min={0}
                      value={c.defaultCampDuration}
                      onChange={(e) => updateCourseMaterial(c.id, 'defaultCampDuration', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-400 rounded text-center text-gray-900 bg-white"
                    />
                  </td>
                  <td className="px-2 py-2 text-center">
                    <button
                      onClick={() => deleteCourseMaterial(c.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                      title="删除"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-sm text-gray-700 text-center no-print">
        提示：所有数据实时保存，刷新页面数据不会丢失。
      </p>
    </div>
  )
}
