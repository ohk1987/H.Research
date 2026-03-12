import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">H.Research</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          한국 사회과학 연구자를 위한 통계 분석 플랫폼
        </p>
      </div>
      <Link href="/projects">
        <Button size="lg">프로젝트 시작하기</Button>
      </Link>
    </div>
  );
}
