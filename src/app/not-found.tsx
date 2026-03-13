import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileQuestion, Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <FileQuestion className="mb-4 size-12 text-muted-foreground" />
      <h1 className="mb-2 text-2xl font-bold">페이지를 찾을 수 없습니다</h1>
      <p className="mb-8 text-muted-foreground">
        요청하신 페이지가 존재하지 않거나 이동되었습니다.
      </p>
      <div className="flex gap-3">
        <Link href="/">
          <Button variant="outline">
            <Home className="size-4" />
            처음으로
          </Button>
        </Link>
        <Link href="/projects">
          <Button>
            프로젝트 목록으로
          </Button>
        </Link>
      </div>
    </div>
  )
}
