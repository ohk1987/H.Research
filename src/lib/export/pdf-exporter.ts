import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { FitMeasures, PathResult } from '@/lib/interpretation/templates'

// PDF 문서 생성
// 참고: 한국어 폰트는 jsPDF 기본 폰트로는 지원 불가 → 추후 Noto Sans KR 임베드 예정
// 현재는 기본 영문+숫자 지원, 한국어는 Word 내보내기 권장
export function generatePDF(params: {
  projectName: string
  reliabilities: { variableName: string; alpha: number }[]
  fitMeasures: FitMeasures
  aveCrList: { variable: string; ave: number; cr: number }[]
  paths: PathResult[]
  interpretation: string
}): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  let yPos = 20

  // 제목
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(`${params.projectName} Analysis Report`, 105, yPos, { align: 'center' })
  yPos += 15

  // 1. 측정모형
  doc.setFontSize(13)
  doc.text('1. Measurement Model', 20, yPos)
  yPos += 8

  // 신뢰도 테이블
  if (params.reliabilities.length > 0) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'italic')
    doc.text('Table 1. Reliability Analysis', 20, yPos)
    yPos += 3

    autoTable(doc, {
      startY: yPos,
      head: [['Variable', "Cronbach's α", 'Grade']],
      body: params.reliabilities.map((r) => [
        r.variableName,
        r.alpha.toFixed(3),
        r.alpha >= 0.7 ? 'Acceptable' : 'Poor',
      ]),
      theme: 'plain',
      styles: { fontSize: 9, font: 'helvetica' },
      headStyles: { fontStyle: 'bold', lineWidth: { bottom: 0.5 } },
      margin: { left: 20, right: 20 },
    })

    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
  }

  // 적합도 테이블
  doc.setFontSize(10)
  doc.setFont('helvetica', 'italic')
  doc.text('Table 2. Model Fit Indices', 20, yPos)
  yPos += 3

  autoTable(doc, {
    startY: yPos,
    head: [['Index', 'Value', 'Criterion', 'Met']],
    body: [
      ['CFI', params.fitMeasures.cfi.toFixed(3), '>.95', params.fitMeasures.cfi >= 0.95 ? 'Yes' : 'No'],
      ['TLI', params.fitMeasures.tli.toFixed(3), '>.95', params.fitMeasures.tli >= 0.95 ? 'Yes' : 'No'],
      ['RMSEA', params.fitMeasures.rmsea.toFixed(3), '<.08', params.fitMeasures.rmsea <= 0.08 ? 'Yes' : 'No'],
      ['SRMR', params.fitMeasures.srmr.toFixed(3), '<.08', params.fitMeasures.srmr <= 0.08 ? 'Yes' : 'No'],
    ],
    theme: 'plain',
    styles: { fontSize: 9, font: 'helvetica' },
    headStyles: { fontStyle: 'bold', lineWidth: { bottom: 0.5 } },
    margin: { left: 20, right: 20 },
  })

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

  // AVE/CR 테이블
  if (params.aveCrList.length > 0) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'italic')
    doc.text('Table 3. Convergent Validity', 20, yPos)
    yPos += 3

    autoTable(doc, {
      startY: yPos,
      head: [['Variable', 'AVE', 'CR', 'Met']],
      body: params.aveCrList.map((item) => [
        item.variable,
        item.ave.toFixed(3),
        item.cr.toFixed(3),
        item.ave >= 0.5 && item.cr >= 0.7 ? 'Yes' : 'No',
      ]),
      theme: 'plain',
      styles: { fontSize: 9, font: 'helvetica' },
      headStyles: { fontStyle: 'bold', lineWidth: { bottom: 0.5 } },
      margin: { left: 20, right: 20 },
    })

    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
  }

  // 2. 구조모형
  if (params.paths.length > 0) {
    if (yPos > 230) {
      doc.addPage()
      yPos = 20
    }

    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('2. Structural Model', 20, yPos)
    yPos += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'italic')
    doc.text('Table 4. Path Coefficients', 20, yPos)
    yPos += 3

    autoTable(doc, {
      startY: yPos,
      head: [['Path', 'β', 'SE', 'p', '95% CI']],
      body: params.paths.map((p) => [
        `${p.from} -> ${p.to}`,
        p.beta.toFixed(3),
        p.se.toFixed(3),
        p.pValue < 0.001 ? '<.001' : p.pValue.toFixed(3),
        `[${p.ci[0].toFixed(3)}, ${p.ci[1].toFixed(3)}]`,
      ]),
      theme: 'plain',
      styles: { fontSize: 9, font: 'helvetica' },
      headStyles: { fontStyle: 'bold', lineWidth: { bottom: 0.5 } },
      margin: { left: 20, right: 20 },
    })
  }

  return doc
}
