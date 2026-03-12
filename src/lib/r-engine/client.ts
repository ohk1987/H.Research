const R_ENGINE_URL = process.env.R_ENGINE_URL || 'http://localhost:8000'

export async function callREngine<T>(
  endpoint: string,
  data: unknown,
  timeoutMs = 60000
): Promise<T> {
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
      throw new Error(`R 엔진 응답 시간 초과 (${timeoutMs / 1000}초)`)
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}
