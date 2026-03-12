# CLAUDE.md — H.Research 개발 가이드

> Claude Code가 이 프로젝트에서 작업할 때 반드시 따라야 하는 지침입니다.
> 작업 전 반드시 `docs/PRD.md`를 읽고 전체 서비스 맥락을 파악하세요.

---

## 프로젝트 개요

**H.Research**: 한국 사회과학 연구자를 위한 통계 분석 SaaS  
**타겟**: 사회과학 석·박사, 교수, 연구소 연구원  
**핵심 플로우**: 설문 설계 → 데이터 수집 → 모델 캔버스 → SEM 분석 → 한국어 자동 해석 → 보고서

---

## 기술 스택

```
Frontend     Next.js 14 (App Router) + TypeScript + Tailwind CSS
Canvas       React Flow
Backend API  Next.js API Routes
Database     Supabase (PostgreSQL + Auth + Realtime + Storage)
통계 엔진    R + Plumber → Docker → Railway
AI 해석      Claude API (Anthropic)
배포         Vercel (프론트) + Railway (R 엔진)
버전 관리    GitHub
```

---

## 디렉토리 구조

```
/
├── src/
│   ├── app/              Next.js App Router 페이지
│   ├── components/
│   │   └── ui/           기본 UI 컴포넌트 (Button, Input, Card 등)
│   ├── lib/
│   │   └── supabase/     Supabase 클라이언트 (client.ts, server.ts)
│   └── types/            TypeScript 타입 정의
├── r-engine/             R 통계 엔진
│   ├── plumber.R
│   ├── Dockerfile
│   └── packages.R
├── supabase/
│   └── migrations/       DB 마이그레이션 SQL
├── docs/
│   └── PRD.md            서비스 기획 문서 (필독)
└── CLAUDE.md             이 파일
```

---

## 개발 원칙

### 1. 작업 전 확인
- 새 작업 시작 전 반드시 `docs/PRD.md` 관련 섹션 확인
- 현재 Phase와 단계를 파악하고 해당 범위 내에서만 작업
- 모호한 요구사항은 가정으로 진행하지 말고 질문

### 2. 코드 품질
- TypeScript strict 모드 준수, `any` 타입 사용 금지
- 컴포넌트는 단일 책임 원칙 (한 컴포넌트가 하나의 역할만)
- 함수명·변수명은 영어, 주석은 한국어로 작성
- API Route는 반드시 에러 핸들링 포함

### 3. Supabase 사용 규칙
- 클라이언트 컴포넌트: `src/lib/supabase/client.ts` 사용
- 서버 컴포넌트·API Route: `src/lib/supabase/server.ts` 사용
- 모든 테이블에 RLS 활성화 필수
- 민감 데이터(데이터셋·분석 결과)는 반드시 RLS 정책으로 접근 제어

### 4. R 엔진 연동
- R 엔진 호출은 반드시 `R_ENGINE_URL` 환경변수 사용
- 분석 요청 시 타임아웃 설정 필수 (기본 60초)
- R 엔진 응답은 항상 JSON 형태로 반환
- 분석 실패 시 사용자에게 한국어 에러 메시지 표시

### 5. 환경변수
- 실제 값은 절대 코드에 하드코딩 금지
- 새 환경변수 추가 시 `.env.local.example`에도 반드시 추가
- 클라이언트에서 사용하는 변수만 `NEXT_PUBLIC_` 접두사 사용

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
R_ENGINE_URL
ANTHROPIC_API_KEY
```

---

## 커밋 규칙

```
feat:     새 기능 추가
fix:      버그 수정
refactor: 기능 변경 없는 코드 개선
style:    포맷·스타일 변경
docs:     문서 수정
chore:    빌드·설정 변경
test:     테스트 추가·수정
```

**예시:**
```
feat: implement file upload and variable configuration
feat: add React Flow canvas with latent variable nodes
fix: correct CFA result parsing from R engine response
```

하나의 커밋은 하나의 완결된 작업 단위. 작업 완료 시 커밋 메시지 제안 필수.

---

## 현재 개발 단계

```
Phase 0  기반 구축 (완료 목표: Week 4)
  [x] Next.js 프로젝트 초기화
  [x] Supabase 연동 및 DB 스키마
  [x] R 엔진 Docker 구성
  [x] 기본 UI 컴포넌트

Phase 1  MVP (Week 5~16)
  [ ] 데이터 업로드 + 변수 설정
  [ ] 모델 캔버스 기본
  [ ] 분석 엔진 연동
  [ ] 한국어 해석 + 기본 출력
```

> 현재 단계 완료 후 체크박스를 업데이트하세요.

---

## 주요 비즈니스 로직 주의사항

### 권한 모델
- 사용자는 본인 프로젝트에만 접근 가능
- 조직 관리자는 진행 상황만 조회 (데이터·모델·결과 접근 불가)
- 랩 지도교수는 학생이 공유한 프로젝트에만 접근 가능
- RLS로 반드시 서버 레벨에서 강제

### 분석 정확도
- 통계 결과는 소수점 3자리까지 표시
- R 엔진 결과와 프론트엔드 표시 값이 일치해야 함
- 반올림·포맷 처리는 표시 단계에서만 수행

### 한국어 해석
- 자동 해석은 APA 7판 학술 문체 준수
- β·t·p·95% CI 값은 반드시 수치와 함께 서술
- Claude API 호출 시 system prompt에 통계 해석 지침 포함

### 역문항 처리
- 역문항 데이터는 원점수와 역코딩 값을 모두 저장
- 분석 시 역코딩 값 자동 적용 (사용자가 별도 처리 불필요)

---

## 작업 완료 체크리스트

각 작업 완료 후 확인:

- [ ] TypeScript 컴파일 오류 없음 (`npm run build`)
- [ ] 린트 오류 없음 (`npm run lint`)
- [ ] 환경변수 `.env.local.example` 업데이트
- [ ] 새 테이블/컬럼 추가 시 마이그레이션 파일 생성
- [ ] RLS 정책 적용 여부 확인
- [ ] 커밋 메시지 규칙 준수
