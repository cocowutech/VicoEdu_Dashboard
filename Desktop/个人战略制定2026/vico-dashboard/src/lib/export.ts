import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// 周报数据类型
interface WeeklyData {
  weekStart: string
  weekEnd: string
  metrics: {
    label: string
    target: number
    actual: number
    rate: string
  }[]
  reflection: {
    wins: string
    challenges: string
    priorities: string
    mainline: string
  }
}

// 月报数据类型
interface MonthlyData {
  month: string
  weeks: WeeklyData[]
  goals: {
    name: string
    target: number
    current: number
    unit: string
    progress: string
  }[]
  summary: {
    biggestWin: string
    biggestLesson: string
    nextMonthFocus: string
  }
}

// 导出周报为 Excel
export function exportWeeklyToExcel(data: WeeklyData) {
  const wb = XLSX.utils.book_new()

  // 指标表
  const metricsData = [
    ['指标', '目标', '实际', '完成率'],
    ...data.metrics.map(m => [m.label, m.target, m.actual, m.rate])
  ]
  const metricsSheet = XLSX.utils.aoa_to_sheet(metricsData)
  XLSX.utils.book_append_sheet(wb, metricsSheet, '周指标')

  // 复盘表
  const reflectionData = [
    ['项目', '内容'],
    ['本周做对了什么', data.reflection.wins],
    ['遇到什么卡点', data.reflection.challenges],
    ['下周最重要的3件事', data.reflection.priorities],
    ['是否在主线上', data.reflection.mainline === 'yes' ? '是' : data.reflection.mainline === 'deviated' ? '有偏离' : '需调整'],
  ]
  const reflectionSheet = XLSX.utils.aoa_to_sheet(reflectionData)
  XLSX.utils.book_append_sheet(wb, reflectionSheet, '周复盘')

  // 设置列宽
  metricsSheet['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 10 }]
  reflectionSheet['!cols'] = [{ wch: 20 }, { wch: 60 }]

  const fileName = `周报_${data.weekStart}_${data.weekEnd}.xlsx`
  XLSX.writeFile(wb, fileName)
}

// 导出周报为 PDF
export function exportWeeklyToPDF(data: WeeklyData) {
  const doc = new jsPDF()

  // 标题
  doc.setFontSize(18)
  doc.text('Vico Education 周报', 14, 20)

  doc.setFontSize(12)
  doc.text(`周期: ${data.weekStart} - ${data.weekEnd}`, 14, 30)

  // 指标表格
  doc.setFontSize(14)
  doc.text('周指标完成情况', 14, 45)

  autoTable(doc, {
    startY: 50,
    head: [['指标', '目标', '实际', '完成率']],
    body: data.metrics.map(m => [m.label, m.target.toString(), m.actual.toString(), m.rate]),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [102, 126, 234] },
  })

  // 复盘内容
  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 100

  doc.setFontSize(14)
  doc.text('本周复盘', 14, finalY + 15)

  autoTable(doc, {
    startY: finalY + 20,
    head: [['项目', '内容']],
    body: [
      ['做对了什么', data.reflection.wins || '-'],
      ['遇到卡点', data.reflection.challenges || '-'],
      ['下周重点', data.reflection.priorities || '-'],
      ['主线状态', data.reflection.mainline === 'yes' ? '是，继续保持' : data.reflection.mainline === 'deviated' ? '有偏离，需纠正' : '需要调整主线'],
    ],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [102, 126, 234] },
    columnStyles: { 1: { cellWidth: 120 } },
  })

  const fileName = `周报_${data.weekStart}_${data.weekEnd}.pdf`
  doc.save(fileName)
}

// 导出月报为 Excel
export function exportMonthlyToExcel(data: MonthlyData) {
  const wb = XLSX.utils.book_new()

  // 目标进度表
  const goalsData = [
    ['目标', '目标值', '当前值', '单位', '完成率'],
    ...data.goals.map(g => [g.name, g.target, g.current, g.unit, g.progress])
  ]
  const goalsSheet = XLSX.utils.aoa_to_sheet(goalsData)
  XLSX.utils.book_append_sheet(wb, goalsSheet, '月度目标')

  // 周汇总表
  if (data.weeks.length > 0) {
    const weeksSummary = [
      ['周次', '小红书发布', '新增粉丝', '私信咨询', '试听学生', '新入班', '收入'],
      ...data.weeks.map((w, i) => {
        const m = w.metrics
        return [
          `第${i + 1}周`,
          `${m[0]?.actual || 0}/${m[0]?.target || 0}`,
          `${m[1]?.actual || 0}/${m[1]?.target || 0}`,
          `${m[2]?.actual || 0}/${m[2]?.target || 0}`,
          `${m[3]?.actual || 0}/${m[3]?.target || 0}`,
          `${m[4]?.actual || 0}/${m[4]?.target || 0}`,
          `${m[5]?.actual || 0}/${m[5]?.target || 0}`,
        ]
      })
    ]
    const weeksSheet = XLSX.utils.aoa_to_sheet(weeksSummary)
    XLSX.utils.book_append_sheet(wb, weeksSheet, '周汇总')
  }

  // 月度复盘
  const summaryData = [
    ['项目', '内容'],
    ['最大收获', data.summary.biggestWin || '-'],
    ['最大教训', data.summary.biggestLesson || '-'],
    ['下月重点', data.summary.nextMonthFocus || '-'],
  ]
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(wb, summarySheet, '月度复盘')

  goalsSheet['!cols'] = [{ wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 10 }]

  const fileName = `月报_${data.month}.xlsx`
  XLSX.writeFile(wb, fileName)
}

// 导出月报为 PDF
export function exportMonthlyToPDF(data: MonthlyData) {
  const doc = new jsPDF()

  // 标题
  doc.setFontSize(18)
  doc.text('Vico Education 月报', 14, 20)

  doc.setFontSize(12)
  doc.text(`月份: ${data.month}`, 14, 30)

  // 目标进度
  doc.setFontSize(14)
  doc.text('月度目标完成情况', 14, 45)

  autoTable(doc, {
    startY: 50,
    head: [['目标', '目标值', '当前值', '单位', '完成率']],
    body: data.goals.map(g => [g.name, g.target.toString(), g.current.toString(), g.unit, g.progress]),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [102, 126, 234] },
  })

  let currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 100

  // 周汇总
  if (data.weeks.length > 0) {
    doc.setFontSize(14)
    doc.text('各周完成情况', 14, currentY + 15)

    autoTable(doc, {
      startY: currentY + 20,
      head: [['周次', '发布', '粉丝', '咨询', '试听', '入班', '收入']],
      body: data.weeks.map((w, i) => {
        const m = w.metrics
        return [
          `第${i + 1}周`,
          `${m[0]?.actual || 0}/${m[0]?.target || 0}`,
          `${m[1]?.actual || 0}/${m[1]?.target || 0}`,
          `${m[2]?.actual || 0}/${m[2]?.target || 0}`,
          `${m[3]?.actual || 0}/${m[3]?.target || 0}`,
          `${m[4]?.actual || 0}/${m[4]?.target || 0}`,
          `${m[5]?.actual || 0}/${m[5]?.target || 0}`,
        ]
      }),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [234, 126, 102] },
    })

    currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || currentY + 50
  }

  // 月度复盘
  doc.setFontSize(14)
  doc.text('月度复盘', 14, currentY + 15)

  autoTable(doc, {
    startY: currentY + 20,
    head: [['项目', '内容']],
    body: [
      ['最大收获', data.summary.biggestWin || '-'],
      ['最大教训', data.summary.biggestLesson || '-'],
      ['下月重点', data.summary.nextMonthFocus || '-'],
    ],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [102, 126, 234] },
    columnStyles: { 1: { cellWidth: 120 } },
  })

  const fileName = `月报_${data.month}.pdf`
  doc.save(fileName)
}
