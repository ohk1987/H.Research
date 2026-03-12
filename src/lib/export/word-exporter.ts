import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  HeadingLevel,
  convertMillimetersToTwip,
} from 'docx'
import type { FitMeasures, PathResult } from '@/lib/interpretation/templates'

// APA 7판 기본 스타일
const FONT = 'Times New Roman'
const FONT_SIZE = 24 // half-points (12pt)
const MARGIN = convertMillimetersToTwip(25.4) // 1 inch = 25.4mm

// 헬퍼: 텍스트 런 생성
function text(content: string, options?: { bold?: boolean; italic?: boolean; size?: number }): TextRun {
  return new TextRun({
    text: content,
    font: FONT,
    size: options?.size ?? FONT_SIZE,
    bold: options?.bold,
    italics: options?.italic,
  })
}

// 헬퍼: APA 테이블 셀
function cell(content: string, options?: { bold?: boolean; width?: number }): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [text(content, { bold: options?.bold })],
        spacing: { after: 40 },
      }),
    ],
    width: options?.width ? { size: options.width, type: WidthType.PERCENTAGE } : undefined,
  })
}

// 적합도 테이블 생성
function createFitTable(fit: FitMeasures): Table {
  const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
  const topBottom = {
    top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
    left: noBorder,
    right: noBorder,
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          cell('적합도 지수', { bold: true }),
          cell('값', { bold: true }),
          cell('기준', { bold: true }),
          cell('평가', { bold: true }),
        ],
        tableHeader: true,
      }),
      ...([
        ['CFI', fit.cfi, '>.95', fit.cfi >= 0.95 ? '충족' : '미충족'],
        ['TLI', fit.tli, '>.95', fit.tli >= 0.95 ? '충족' : '미충족'],
        ['RMSEA', fit.rmsea, '<.08', fit.rmsea <= 0.08 ? '충족' : '미충족'],
        ['SRMR', fit.srmr, '<.08', fit.srmr <= 0.08 ? '충족' : '미충족'],
      ] as [string, number, string, string][]).map(
        ([name, value, criterion, evaluation]) =>
          new TableRow({
            children: [
              cell(name),
              cell(value.toFixed(3)),
              cell(criterion),
              cell(evaluation),
            ],
          })
      ),
    ],
    borders: {
      top: topBottom.top,
      bottom: topBottom.bottom,
      left: noBorder,
      right: noBorder,
      insideHorizontal: { style: BorderStyle.SINGLE, size: 0.5, color: 'CCCCCC' },
      insideVertical: noBorder,
    },
  })
}

// 경로계수 테이블 생성
function createPathTable(paths: PathResult[]): Table {
  const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          cell('경로', { bold: true }),
          cell('β', { bold: true }),
          cell('SE', { bold: true }),
          cell('p', { bold: true }),
          cell('95% CI', { bold: true }),
        ],
        tableHeader: true,
      }),
      ...paths.map(
        (path) =>
          new TableRow({
            children: [
              cell(`${path.from} → ${path.to}`),
              cell(path.beta.toFixed(3)),
              cell(path.se.toFixed(3)),
              cell(path.pValue < 0.001 ? '<.001' : path.pValue.toFixed(3)),
              cell(`[${path.ci[0].toFixed(3)}, ${path.ci[1].toFixed(3)}]`),
            ],
          })
      ),
    ],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      left: noBorder,
      right: noBorder,
      insideHorizontal: { style: BorderStyle.SINGLE, size: 0.5, color: 'CCCCCC' },
      insideVertical: noBorder,
    },
  })
}

// AVE/CR 테이블 생성
function createAveCrTable(items: { variable: string; ave: number; cr: number }[]): Table {
  const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          cell('변수', { bold: true }),
          cell('AVE', { bold: true }),
          cell('CR', { bold: true }),
          cell('판정', { bold: true }),
        ],
        tableHeader: true,
      }),
      ...items.map(
        (item) =>
          new TableRow({
            children: [
              cell(item.variable),
              cell(item.ave.toFixed(3)),
              cell(item.cr.toFixed(3)),
              cell(item.ave >= 0.5 && item.cr >= 0.7 ? '충족' : '미달'),
            ],
          })
      ),
    ],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      left: noBorder,
      right: noBorder,
      insideHorizontal: { style: BorderStyle.SINGLE, size: 0.5, color: 'CCCCCC' },
      insideVertical: noBorder,
    },
  })
}

// Word 문서 생성
export function generateWordDocument(params: {
  projectName: string
  reliabilities: { variableName: string; alpha: number }[]
  fitMeasures: FitMeasures
  aveCrList: { variable: string; ave: number; cr: number }[]
  paths: PathResult[]
  interpretation: string
}): Document {
  const sections: Paragraph[] = []

  // 제목
  sections.push(
    new Paragraph({
      children: [text(`${params.projectName} 분석 결과`, { bold: true, size: 32 })],
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  )

  // 1. 측정모형 분석
  sections.push(
    new Paragraph({
      children: [text('1. 측정모형 분석', { bold: true, size: 28 })],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 200 },
    })
  )

  // 신뢰도 테이블
  sections.push(
    new Paragraph({
      children: [text('Table 1. 신뢰도 분석 결과', { italic: true })],
      spacing: { before: 200, after: 100 },
    })
  )

  const children: (Paragraph | Table)[] = [...sections]

  // 신뢰도 테이블 추가
  if (params.reliabilities.length > 0) {
    const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [cell('변수', { bold: true }), cell("Cronbach's α", { bold: true }), cell('평가', { bold: true })],
            tableHeader: true,
          }),
          ...params.reliabilities.map(
            (r) =>
              new TableRow({
                children: [
                  cell(r.variableName),
                  cell(r.alpha.toFixed(3)),
                  cell(r.alpha >= 0.7 ? '양호' : '미흡'),
                ],
              })
          ),
        ],
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
          left: noBorder, right: noBorder,
          insideHorizontal: { style: BorderStyle.SINGLE, size: 0.5, color: 'CCCCCC' },
          insideVertical: noBorder,
        },
      })
    )
  }

  // 적합도 테이블
  children.push(
    new Paragraph({
      children: [text('Table 2. 모형적합도 지수', { italic: true })],
      spacing: { before: 300, after: 100 },
    })
  )
  children.push(createFitTable(params.fitMeasures))

  // AVE/CR 테이블
  if (params.aveCrList.length > 0) {
    children.push(
      new Paragraph({
        children: [text('Table 3. 수렴타당도 분석 결과', { italic: true })],
        spacing: { before: 300, after: 100 },
      })
    )
    children.push(createAveCrTable(params.aveCrList))
  }

  // 2. 구조모형 분석
  if (params.paths.length > 0) {
    children.push(
      new Paragraph({
        children: [text('2. 구조모형 분석', { bold: true, size: 28 })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
      })
    )
    children.push(
      new Paragraph({
        children: [text('Table 4. 경로계수 분석 결과', { italic: true })],
        spacing: { before: 200, after: 100 },
      })
    )
    children.push(createPathTable(params.paths))
  }

  // 해석 문단
  children.push(
    new Paragraph({
      children: [text('분석 결과 해석', { bold: true, size: 28 })],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 200 },
    })
  )

  params.interpretation.split('\n').forEach((line) => {
    if (line.trim()) {
      children.push(
        new Paragraph({
          children: [text(line.trim())],
          spacing: { after: 120 },
          indent: { firstLine: convertMillimetersToTwip(12.7) },
        })
      )
    }
  })

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
          },
        },
        children,
      },
    ],
  })
}
