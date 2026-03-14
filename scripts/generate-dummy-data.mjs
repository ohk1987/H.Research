/**
 * 더미 데이터 생성 스크립트
 * 사회과학 연구용 3종 데이터셋 생성
 *
 * 실행: node scripts/generate-dummy-data.mjs
 */

import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = join(__dirname, '..', 'public', 'dummy-data')

// ─── 난수 생성 (시드 고정) ───
let seed = 42
function seededRandom() {
  seed = (seed * 16807 + 0) % 2147483647
  return (seed - 1) / 2147483646
}

// Box-Muller 표준정규분포
function randn() {
  let u, v, s
  do {
    u = 2 * seededRandom() - 1
    v = 2 * seededRandom() - 1
    s = u * u + v * v
  } while (s >= 1 || s === 0)
  return u * Math.sqrt(-2 * Math.log(s) / s)
}

// Cholesky 분해
function cholesky(matrix) {
  const n = matrix.length
  const L = Array.from({ length: n }, () => new Array(n).fill(0))
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0
      for (let k = 0; k < j; k++) sum += L[i][k] * L[j][k]
      if (i === j) {
        L[i][j] = Math.sqrt(Math.max(0.001, matrix[i][i] - sum))
      } else {
        L[i][j] = (matrix[i][j] - sum) / L[j][j]
      }
    }
  }
  return L
}

// 다변량 정규분포 생성
function mvnorm(n, means, sigma) {
  const p = means.length
  const L = cholesky(sigma)
  const result = []
  for (let i = 0; i < n; i++) {
    const z = Array.from({ length: p }, () => randn())
    const x = new Array(p)
    for (let j = 0; j < p; j++) {
      let val = means[j]
      for (let k = 0; k <= j; k++) val += L[j][k] * z[k]
      x[j] = val
    }
    result.push(x)
  }
  return result
}

// 연속값 → Likert 척도로 변환 (1~maxScale)
function toLikert(val, maxScale = 5) {
  return Math.max(1, Math.min(maxScale, Math.round(val)))
}

// 역문항 처리 (6 - x + 1 = 7 - x for 5-point scale ⟹ maxScale + 1 - x)
function reverseCode(val, maxScale = 5) {
  return maxScale + 1 - val
}

// 결측치 랜덤 삽입 (약 rate 비율)
function insertMissing(rows, headers, rate = 0.02) {
  // 인구통계·group_id 컬럼은 결측 삽입 안 함
  const skipCols = new Set(['gender', 'age', 'tenure', 'dept', 'group_id', 'team_size', 'academic_rank', 'field', 'pub_count'])
  for (let i = 0; i < rows.length; i++) {
    for (let j = 0; j < headers.length; j++) {
      if (skipCols.has(headers[j])) continue
      if (seededRandom() < rate) {
        rows[i][j] = ''
      }
    }
  }
}

// 약간의 비정규성 추가 (왜도)
function addSkew(val, amount = 0.3) {
  return val + amount * (val - 3) * seededRandom()
}

// CSV 문자열 생성
function toCsv(headers, rows) {
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(row.map(v => v === '' ? '' : String(v)).join(','))
  }
  return lines.join('\n')
}

// ════════════════════════════════════════════════════
// Dataset 1: 조절된 매개모형 (PROCESS Model 58)
// ════════════════════════════════════════════════════
function generateDataset1() {
  console.log('Generating Dataset 1: 조절된 매개모형 (n=320)...')

  const N = 320
  // 6개 잠재변수의 잠재점수 생성
  // JD, EE, DP, PC, SS, TI
  // 상관 구조: JD→EE=.55, JD→DP=.48, EE→TI=.62, DP→TI=.44
  // PC는 JD와 부적 상관 -.25, SS는 EE와 부적 상관 -.30
  const latentCorr = [
    // JD     EE     DP     PC     SS     TI
    [1.00,  0.55,  0.48, -0.25, -0.15,  0.45],  // JD
    [0.55,  1.00,  0.52, -0.30, -0.35,  0.62],  // EE
    [0.48,  0.52,  1.00, -0.20, -0.25,  0.44],  // DP
    [-0.25, -0.30, -0.20, 1.00,  0.40, -0.35],  // PC
    [-0.15, -0.35, -0.25, 0.40,  1.00, -0.30],  // SS
    [0.45,  0.62,  0.44, -0.35, -0.30,  1.00],  // TI
  ]

  const latentMeans = [3.2, 3.0, 2.8, 3.5, 3.3, 2.9]
  const latentScores = mvnorm(N, latentMeans, latentCorr)

  // 각 잠재변수에서 관측문항 생성 (요인부하량 반영)
  const items = {
    jd: { count: 6, loadings: [0.75, 0.80, 0.72, 0.78, 0.70, 0.76], reverse: [2, 4] }, // jd3, jd5
    ee: { count: 6, loadings: [0.82, 0.85, 0.79, 0.83, 0.80, 0.84], reverse: [] },
    dp: { count: 5, loadings: [0.76, 0.73, 0.78, 0.80, 0.77], reverse: [1] }, // dp2
    pc: { count: 8, loadings: [0.80, 0.83, 0.78, 0.75, 0.82, 0.79, 0.74, 0.81], reverse: [3, 6] }, // pc4, pc7
    ss: { count: 5, loadings: [0.79, 0.82, 0.77, 0.80, 0.83], reverse: [] },
    ti: { count: 6, loadings: [0.81, 0.84, 0.78, 0.80, 0.76, 0.82], reverse: [4] }, // ti5
  }

  const latentKeys = ['jd', 'ee', 'dp', 'pc', 'ss', 'ti']
  const headers = []

  // 문항 헤더
  for (const key of latentKeys) {
    for (let i = 1; i <= items[key].count; i++) {
      headers.push(`${key}${i}`)
    }
  }
  // 인구통계
  headers.push('gender', 'age', 'tenure', 'dept')

  const rows = []
  for (let p = 0; p < N; p++) {
    const row = []
    for (let li = 0; li < latentKeys.length; li++) {
      const key = latentKeys[li]
      const info = items[key]
      const latent = latentScores[p][li]

      for (let q = 0; q < info.count; q++) {
        const loading = info.loadings[q]
        const error = randn() * Math.sqrt(1 - loading * loading) * 0.8
        let val = addSkew(latent + error * 0.7, 0.15)
        val = toLikert(val)

        // 역문항은 역코딩 상태로 저장 (분석 시 역코딩 복원)
        if (info.reverse.includes(q)) {
          val = reverseCode(val)
        }
        row.push(val)
      }
    }

    // 인구통계
    row.push(
      seededRandom() < 0.52 ? 1 : 2,  // gender
      Math.floor(seededRandom() * 36) + 20,  // age 20~55
      Math.floor(seededRandom() * 30) + 1,   // tenure 1~30
      Math.floor(seededRandom() * 5) + 1     // dept 1~5
    )
    rows.push(row)
  }

  // 결측치 삽입
  insertMissing(rows, headers, 0.02)

  const csv = toCsv(headers, rows)
  writeFileSync(join(OUTPUT_DIR, 'dataset1_moderated_mediation.csv'), csv)
  console.log(`  → ${N}행 × ${headers.length}열 저장 완료`)
  return { rows: N, cols: headers.length, headers }
}

// ════════════════════════════════════════════════════
// Dataset 2: HLM 다층분석
// ════════════════════════════════════════════════════
function generateDataset2() {
  console.log('Generating Dataset 2: HLM 다층분석 (n=300, 30팀)...')

  const TEAMS = 30
  const TEAM_SIZES = []
  let totalN = 0

  // 팀 크기 생성 (8~12명, 총 300명 맞춤)
  for (let t = 0; t < TEAMS; t++) {
    const size = Math.floor(seededRandom() * 5) + 8 // 8~12
    TEAM_SIZES.push(size)
    totalN += size
  }
  // 총 300명이 되도록 마지막 팀 크기 조정
  const diff = 300 - totalN
  TEAM_SIZES[TEAMS - 1] = Math.max(8, TEAM_SIZES[TEAMS - 1] + diff)
  totalN = TEAM_SIZES.reduce((a, b) => a + b, 0)

  // Level 2 변수: 팀별 잠재점수 생성
  // TL(변혁적 리더십), PS(팀 심리안전감)
  const teamCorr = [
    [1.00, 0.55],  // TL-PS 상관
    [0.55, 1.00],
  ]
  const teamMeans = [3.5, 3.6]
  const teamScores = mvnorm(TEAMS, teamMeans, teamCorr)

  // Level 2 문항 생성 (팀별 고정값)
  const teamItemsTL = [] // 6문항
  const teamItemsPS = [] // 5문항

  for (let t = 0; t < TEAMS; t++) {
    const tlItems = []
    for (let q = 0; q < 6; q++) {
      const loading = 0.78 + seededRandom() * 0.1
      const val = toLikert(teamScores[t][0] + randn() * Math.sqrt(1 - loading * loading) * 0.5)
      tlItems.push(val)
    }
    teamItemsTL.push(tlItems)

    const psItems = []
    for (let q = 0; q < 5; q++) {
      const loading = 0.80 + seededRandom() * 0.08
      const val = toLikert(teamScores[t][1] + randn() * Math.sqrt(1 - loading * loading) * 0.5)
      psItems.push(val)
    }
    teamItemsPS.push(psItems)
  }

  // Level 1: 개인 수준
  // AU(자율성), IM(내재동기), IB(혁신행동)
  // TL→IM (교차수준), AU→IM, IM→IB
  // PS가 IM→IB 조절

  const headers = []
  // Level 1 문항
  for (let i = 1; i <= 4; i++) headers.push(`au${i}`)
  for (let i = 1; i <= 5; i++) headers.push(`im${i}`)
  for (let i = 1; i <= 6; i++) headers.push(`ib${i}`)
  // Level 2 문항
  for (let i = 1; i <= 6; i++) headers.push(`tl${i}`)
  for (let i = 1; i <= 5; i++) headers.push(`ps${i}`)
  // 인구통계
  headers.push('gender', 'age', 'tenure', 'group_id', 'team_size')

  const rows = []

  for (let t = 0; t < TEAMS; t++) {
    const teamSize = TEAM_SIZES[t]
    const tlEffect = teamScores[t][0] // 팀 리더십 효과
    const psEffect = teamScores[t][1] // 팀 심리안전감

    // 팀 내 개인 잠재변수 생성
    // AU, IM, IB  (ICC ~ .18 시뮬레이션)
    for (let m = 0; m < teamSize; m++) {
      const row = []

      // 개인 수준 잠재점수
      const au = 3.2 + randn() * 0.8
      // IM은 TL과 AU에 영향받음 (교차수준 효과)
      const im = 1.5 + 0.25 * tlEffect + 0.35 * au + randn() * 0.6
      // IB는 IM에 영향받고, PS가 조절
      const psModeration = 0.1 * (psEffect - 3.5) // 평균 중심화된 조절효과
      const ib = 1.0 + (0.45 + psModeration) * im + randn() * 0.5

      // AU 문항 (4개)
      for (let q = 0; q < 4; q++) {
        const loading = 0.75 + q * 0.02
        const val = toLikert(au + randn() * Math.sqrt(1 - loading * loading) * 0.6)
        row.push(val)
      }

      // IM 문항 (5개, im3 역문항)
      for (let q = 0; q < 5; q++) {
        const loading = 0.78 + q * 0.015
        let val = toLikert(im + randn() * Math.sqrt(1 - loading * loading) * 0.6)
        if (q === 2) val = reverseCode(val) // im3
        row.push(val)
      }

      // IB 문항 (6개)
      for (let q = 0; q < 6; q++) {
        const loading = 0.76 + q * 0.02
        const val = toLikert(ib + randn() * Math.sqrt(1 - loading * loading) * 0.5)
        row.push(val)
      }

      // Level 2 문항 (팀 내 동일값 — 약간의 개인차 반영)
      for (let q = 0; q < 6; q++) {
        // 팀원마다 TL 평가가 약간 다름 (rwg 시뮬레이션)
        const baseVal = teamItemsTL[t][q]
        const jitter = seededRandom() < 0.82 ? 0 : (seededRandom() < 0.5 ? -1 : 1)
        row.push(Math.max(1, Math.min(5, baseVal + jitter)))
      }
      for (let q = 0; q < 5; q++) {
        const baseVal = teamItemsPS[t][q]
        const jitter = seededRandom() < 0.85 ? 0 : (seededRandom() < 0.5 ? -1 : 1)
        row.push(Math.max(1, Math.min(5, baseVal + jitter)))
      }

      // 인구통계
      row.push(
        seededRandom() < 0.48 ? 1 : 2,
        Math.floor(seededRandom() * 30) + 25,
        Math.floor(seededRandom() * 15) + 1,
        t + 1,  // group_id (1~30)
        teamSize
      )
      rows.push(row)
    }
  }

  // 결측치 삽입 (Level 2와 group_id 제외)
  insertMissing(rows, headers, 0.015)

  const csv = toCsv(headers, rows)
  writeFileSync(join(OUTPUT_DIR, 'dataset2_hlm_multilevel.csv'), csv)
  console.log(`  → ${rows.length}행 × ${headers.length}열, ${TEAMS}팀 저장 완료`)
  return { rows: rows.length, cols: headers.length, teams: TEAMS, headers }
}

// ════════════════════════════════════════════════════
// Dataset 3: 척도개발·타당화
// ════════════════════════════════════════════════════
function generateDataset3() {
  console.log('Generating Dataset 3: 척도개발·타당화 (n=400)...')

  const N = 400

  // 5요인 상관행렬
  // IS, DA, RV, CC, SE
  const factorCorr = [
    [1.00, 0.55, 0.48, 0.42, 0.38],  // IS
    [0.55, 1.00, 0.52, 0.40, 0.35],  // DA
    [0.48, 0.52, 1.00, 0.45, 0.33],  // RV
    [0.42, 0.40, 0.45, 1.00, 0.50],  // CC
    [0.38, 0.35, 0.33, 0.50, 1.00],  // SE
  ]

  const factorMeans = [3.4, 3.2, 3.3, 3.5, 3.6]
  const factorScores = mvnorm(N, factorMeans, factorCorr)

  const factors = {
    is: { count: 6, loadings: [0.74, 0.78, 0.80, 0.72, 0.77, 0.79], reverse: [3] },      // is4
    da: { count: 6, loadings: [0.76, 0.80, 0.73, 0.79, 0.71, 0.77], reverse: [2, 4] },    // da3, da5
    rv: { count: 6, loadings: [0.78, 0.82, 0.75, 0.80, 0.77, 0.81], reverse: [] },
    cc: { count: 6, loadings: [0.77, 0.74, 0.80, 0.78, 0.82, 0.76], reverse: [1] },       // cc2
    se: { count: 6, loadings: [0.79, 0.76, 0.81, 0.78, 0.73, 0.75], reverse: [4, 5] },    // se5, se6
  }

  const factorKeys = ['is', 'da', 'rv', 'cc', 'se']
  const headers = []

  for (const key of factorKeys) {
    for (let i = 1; i <= factors[key].count; i++) {
      headers.push(`${key}${i}`)
    }
  }
  headers.push('research_performance', 'tech_anxiety', 'gender', 'age', 'academic_rank', 'field', 'pub_count')

  const rows = []
  for (let p = 0; p < N; p++) {
    const row = []
    let totalScore = 0

    for (let fi = 0; fi < factorKeys.length; fi++) {
      const key = factorKeys[fi]
      const info = factors[key]
      const latent = factorScores[p][fi]
      totalScore += latent

      for (let q = 0; q < info.count; q++) {
        const loading = info.loadings[q]
        const error = randn() * Math.sqrt(1 - loading * loading) * 0.7
        let val = toLikert(addSkew(latent + error * 0.65, 0.1))

        if (info.reverse.includes(q)) {
          val = reverseCode(val)
        }
        row.push(val)
      }
    }

    // 준거변수
    const avgScore = totalScore / 5
    // 연구성과: RDLS 총점과 r=.48 상관
    const resPerf = toLikert(0.48 * avgScore + (1 - 0.48) * 3.2 + randn() * 0.7)
    // 기술불안: RDLS 총점과 r=-.39 (역방향)
    const techAnx = toLikert(-0.39 * (avgScore - 3.3) + 3.0 + randn() * 0.8)
    row.push(resPerf, techAnx)

    // 인구통계
    row.push(
      seededRandom() < 0.45 ? 1 : 2,                   // gender
      Math.floor(seededRandom() * 35) + 25,             // age 25~59
      Math.floor(seededRandom() * 5) + 1,               // academic_rank 1~5
      Math.floor(seededRandom() * 6) + 1,               // field 1~6
      Math.floor(seededRandom() * seededRandom() * 50)   // pub_count 0~50 (right-skewed)
    )
    rows.push(row)
  }

  insertMissing(rows, headers, 0.02)

  const csv = toCsv(headers, rows)
  writeFileSync(join(OUTPUT_DIR, 'dataset3_scale_validation.csv'), csv)
  console.log(`  → ${N}행 × ${headers.length}열 저장 완료`)
  return { rows: N, cols: headers.length, headers }
}

// ─── 실행 ───
console.log('=== H.Research 더미 데이터 생성 ===\n')
const d1 = generateDataset1()
const d2 = generateDataset2()
const d3 = generateDataset3()
console.log('\n=== 생성 완료 ===')
console.log(`Dataset 1: ${d1.rows}행 × ${d1.cols}열 (조절된 매개모형)`)
console.log(`Dataset 2: ${d2.rows}행 × ${d2.cols}열, ${d2.teams}팀 (HLM 다층분석)`)
console.log(`Dataset 3: ${d3.rows}행 × ${d3.cols}열 (척도개발·타당화)`)
