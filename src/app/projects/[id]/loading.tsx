import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function ProjectLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 스켈레톤 */}
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <div className="mb-1 h-4 w-20 animate-pulse rounded bg-muted" />
            <div className="h-6 w-40 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-9 w-24 animate-pulse rounded bg-muted" />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex flex-col gap-8">
          {/* 워크플로우 바 */}
          <Card>
            <CardHeader>
              <div className="h-5 w-32 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="size-5 animate-pulse rounded-full bg-muted" />
                      <div className="h-3 w-12 animate-pulse rounded bg-muted" />
                    </div>
                    {i < 5 && <div className="mx-2 h-px flex-1 bg-border" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 카드 그리드 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                </CardHeader>
                <CardContent>
                  <div className="mb-3 h-3 w-full animate-pulse rounded bg-muted" />
                  <div className="h-8 w-full animate-pulse rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 요약 */}
          <Card>
            <CardHeader>
              <div className="h-5 w-28 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className="h-8 w-12 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
