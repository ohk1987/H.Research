import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function OrganizationsLoading() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="h-7 w-32 animate-pulse rounded bg-muted" />
          <div className="h-9 w-28 animate-pulse rounded bg-muted" />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="size-10 animate-pulse rounded-lg bg-muted" />
                  <div className="flex-1">
                    <div className="mb-1 h-5 w-28 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="flex flex-col items-center gap-1">
                      <div className="h-6 w-8 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-12 animate-pulse rounded bg-muted" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
