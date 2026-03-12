// crypto.randomUUID() 기반 8자리 토큰
export function generateGroupToken(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 8)
}

// 응답자 토큰 (중복방지용)
export function generateRespondentToken(): string {
  return crypto.randomUUID()
}
