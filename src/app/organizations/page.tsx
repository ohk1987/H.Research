"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Building2, Users, Shield } from "lucide-react"

// 데모 데이터
const DEMO_ORGS = [
  { id: 'org1', name: '서울대학교 경영학과', type: 'university', role: 'member', memberCount: 24 },
  { id: 'org2', name: 'ABC 연구소', type: 'institute', role: 'admin', memberCount: 8 },
]

const typeLabels: Record<string, string> = {
  university: '대학',
  institute: '연구소',
  company: '기업',
}

export default function OrganizationsPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold">내 조직</h1>
          <Link href="/organizations/new">
            <Button>
              <Plus className="size-4" />
              새 조직 만들기
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {DEMO_ORGS.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Building2 className="size-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">아직 소속된 조직이 없습니다.</p>
              <Link href="/organizations/new">
                <Button className="mt-4">조직 만들기</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {DEMO_ORGS.map((org) => (
              <Link key={org.id} href={`/organizations/${org.id}`}>
                <Card className="cursor-pointer transition-shadow hover:shadow-md">
                  <CardContent className="py-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="font-semibold">{org.name}</h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {typeLabels[org.type] ?? org.type}
                        </p>
                      </div>
                      {org.role === 'admin' && (
                        <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          <Shield className="size-3" />
                          관리자
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="size-3.5" />
                      {org.memberCount}명
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
