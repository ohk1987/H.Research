# H.Research

사회과학 연구자를 위한 통계 분석 SaaS

연구 설계 → 설문 배포 → 데이터 수집 → SEM 분석 → 한국어 자동 해석 → APA 보고서까지 하나의 워크플로우로.

## 기술 스택

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS → Vercel
- **Database**: Supabase (PostgreSQL + Auth + RLS + Realtime + Storage)
- **Canvas**: React Flow
- **R Engine**: R + Plumber (Docker) → Railway
- **AI 해석**: Claude API (Anthropic)

## 로컬 개발 환경 설정

### 1. 환경변수 설정

`.env.local.example`을 참고해 `.env.local` 생성:

```bash
cp .env.local.example .env.local
```

필수 환경변수:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
R_ENGINE_URL=http://localhost:8000
ANTHROPIC_API_KEY=your-anthropic-key
```

### 2. Supabase 마이그레이션

Supabase 대시보드 SQL 편집기에서 순서대로 실행:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_survey_schema.sql`
3. `supabase/migrations/003_org_lab_schema.sql`

### 3. 개발 서버

```bash
npm install
npm run dev
```

### 4. R 엔진 로컬 실행 (선택)

```bash
cd r-engine
docker build -t h-research-r-engine .
docker run -p 8000:8000 h-research-r-engine
```

## 배포 가이드

### Railway R 엔진

- Docker Hub 이미지: `hankyeloh/h-research-r-engine:latest`
- Root Directory: `r-engine`
- 환경변수: `PORT` (Railway 자동 설정)
- 헬스체크: `GET /health`

### Vercel 프론트엔드

1. GitHub 레포 연결
2. 환경변수 5개 설정:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `R_ENGINE_URL`
   - `ANTHROPIC_API_KEY`
3. 배포 트리거: `main` 브랜치 push

## 주요 기능

- **설문 설계**: 잠재변수 정의 → 문항 작성 → 역문항 지정 → 표본 크기 계산
- **설문 배포**: 링크/QR 코드 → 그룹 링크(HLM) → 실시간 응답 대시보드
- **모델 캔버스**: React Flow 기반 시각적 모델 설계 → 구조 자동 인식
- **통계 분석**: CFA, SEM, 매개/조절분석, PROCESS, PLS-SEM, MGA, HLM
- **기초 분석**: 기술통계, t검정, ANOVA, 상관분석, 교차분석, CMV
- **한국어 해석**: APA 7판 학술 문체 자동 생성 (규칙 기반 + Claude API)
- **보고서 출력**: Word (.docx) / PDF 내보내기
- **랩 협업**: 검토 요청 → 코멘트 → 승인 워크플로우

## 라이선스

Private - All rights reserved
