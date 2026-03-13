# H.Research 배포 체크리스트

## 배포 순서

1. **Supabase 마이그레이션** — 001 → 002 → 003 순서 실행
2. **Railway R 엔진** — 배포 확인 (`/health` 응답 `{"status":"ok"}`)
3. **Vercel 프론트엔드** — 환경변수 설정 후 배포

## 환경변수 확인

| 변수 | 설정 위치 | 비고 |
|------|---------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel | Supabase 대시보드에서 확인 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel | Supabase 대시보드에서 확인 |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel | 서버 전용, 절대 클라이언트 노출 금지 |
| `R_ENGINE_URL` | Vercel | Railway 배포 URL (예: `https://xxx.up.railway.app`) |
| `ANTHROPIC_API_KEY` | Vercel | Claude API 키 |
| `PORT` | Railway | Railway 자동 설정 |

## E2E 시나리오 체크리스트

### 시나리오 1: 기본 연구 플로우

- [ ] 회원가입 → 프로젝트 생성
- [ ] 잠재변수 설계 (3개 변수, 각 3문항)
- [ ] 설문 생성 및 배포
- [ ] 테스트 응답 입력
- [ ] 캔버스 자동 연결
- [ ] CFA 실행 → 결과 확인
- [ ] 한국어 해석 생성
- [ ] Word 보고서 다운로드

### 시나리오 2: 랩 협업 플로우

- [ ] 학생: 프로젝트 공유
- [ ] 교수: 검토 요청 수신
- [ ] 교수: 코멘트 작성
- [ ] 학생: 알림 수신
- [ ] 교수: 버전 승인

### 시나리오 3: HLM 플로우

- [ ] 그룹 링크 3개 생성
- [ ] 그룹별 응답 입력
- [ ] rwg·ICC 사전 검증
- [ ] HLM Null 모델 실행
- [ ] Random Intercept 결과 확인

### 시나리오 4: 기초 분석 플로우

- [ ] 데이터 업로드 (Excel)
- [ ] 기술통계 실행
- [ ] t검정 실행 → Cohen's d 확인
- [ ] ANOVA 실행 → 사후검정 확인
- [ ] 상관분석 실행

### 시나리오 5: 보고서 생성

- [ ] 분석 완료 후 보고서 페이지 진입
- [ ] APA 형식 Word 다운로드
- [ ] KCI 형식 Word 다운로드
- [ ] 한국어 해석 포함 확인

## 트러블슈팅

### R 엔진 연결 실패

```
R 엔진 응답 시간 초과
```

- Railway 대시보드에서 R 엔진 상태 확인
- `/health` 엔드포인트 직접 호출
- `R_ENGINE_URL` 환경변수 확인 (trailing slash 없어야 함)

### Supabase 인증 오류

- `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 확인
- Supabase 대시보드에서 Auth 설정 확인
- RLS 정책이 올바르게 설정되었는지 확인

### 빌드 오류

```bash
npm run build  # TypeScript + ESLint 검사 포함
npm run lint   # ESLint만 실행
```
