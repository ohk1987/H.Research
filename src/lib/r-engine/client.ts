const R_ENGINE_URL = process.env.R_ENGINE_URL || 'http://localhost:8000'

const DEFAULT_TIMEOUT = 30000
const MAX_RETRIES = 2

export async function callREngine<T>(
  endpoint: string,
  data: unknown,
  timeoutMs = DEFAULT_TIMEOUT
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(`${R_ENGINE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: controller.signal,
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        throw new Error(
          `R 엔진 오류 (${response.status}): ${errorText || '알 수 없는 오류'}`
        )
      }

      return response.json()
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        lastError = new Error(`R 엔진 응답 시간 초과 (${timeoutMs / 1000}초)`)
      } else {
        lastError = error instanceof Error ? error : new Error(String(error))
      }

      // 마지막 시도가 아니면 재시도
      if (attempt < MAX_RETRIES) {
        // 재시도 전 짧은 대기
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
        continue
      }
    } finally {
      clearTimeout(timeout)
    }
  }

  throw new Error(
    lastError?.message ||
    '분석 서버에 일시적 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
  )
}
