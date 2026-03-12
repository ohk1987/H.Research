"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, UserPlus, Shield, User, Trash2, Settings } from "lucide-react"

type OrgTab = 'members' | 'admin' | 'settings'

// 데모 데이터
const DEMO_MEMBERS = [
  { id: 'u1', name: '김교수', email: 'kim@snu.ac.kr', role: 'admin', lastAccess: '2026-03-13' },
  { id: 'u2', name: '이연구원', email: 'lee@snu.ac.kr', role: 'member', lastAccess: '2026-03-12' },
  { id: 'u3', name: '박학생', email: 'park@snu.ac.kr', role: 'member', lastAccess: '2026-03-10' },
  { id: 'u4', name: '최학생', email: 'choi@snu.ac.kr', role: 'member', lastAccess: '2026-02-15' },
]

export default function OrganizationPage() {
  const params = useParams()
  const orgId = params.orgId as string
  const [activeTab, setActiveTab] = useState<OrgTab>('members')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [showInvite, setShowInvite] = useState(false)

  const isAdmin = true // 데모: 관리자로 가정

  const handleInvite = useCallback(() => {
    if (!inviteEmail.trim()) return
    // TODO: Supabase 초대
    setInviteEmail('')
    setShowInvite(false)
  }, [inviteEmail])

  const tabs = [
    { key: 'members' as const, label: '멤버 관리' },
    ...(isAdmin ? [{ key: 'admin' as const, label: '관리자 대시보드' }] : []),
    { key: 'settings' as const, label: '설정' },
  ]

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/organizations">
              <Button variant="ghost" size="icon-sm">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">서울대학교 경영학과</h1>
          </div>
        </div>
      </header>

      {/* 탭 */}
      <div className="border-b">
        <div className="mx-auto flex max-w-5xl px-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                if (tab.key === 'admin') {
                  window.location.href = `/organizations/${orgId}/admin`
                  return
                }
                setActiveTab(tab.key)
              }}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* 멤버 관리 */}
        {activeTab === 'members' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <Button onClick={() => setShowInvite(!showInvite)}>
                <UserPlus className="size-4" />
                멤버 초대
              </Button>
            </div>

            {showInvite && (
              <Card>
                <CardContent className="flex items-end gap-3 py-4">
                  <label className="flex flex-1 flex-col gap-1">
                    <span className="text-xs text-muted-foreground">이메일</span>
                    <Input
                      placeholder="초대할 이메일 주소"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">역할</span>
                    <select
                      className="rounded-md border bg-background px-3 py-2 text-sm"
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                    >
                      <option value="member">멤버</option>
                      <option value="admin">관리자</option>
                    </select>
                  </label>
                  <Button onClick={handleInvite} disabled={!inviteEmail.trim()}>
                    초대
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="py-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 text-left font-medium">이름</th>
                      <th className="py-3 text-left font-medium">이메일</th>
                      <th className="py-3 text-center font-medium">역할</th>
                      <th className="py-3 text-right font-medium">마지막 접속</th>
                      {isAdmin && <th className="py-3 text-center font-medium">관리</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {DEMO_MEMBERS.map((m) => {
                      const daysSince = Math.floor(
                        (Date.now() - new Date(m.lastAccess).getTime()) / 86400000
                      )
                      return (
                        <tr key={m.id} className={`border-b last:border-0 ${daysSince > 30 ? 'text-muted-foreground/50' : ''}`}>
                          <td className="py-3">{m.name}</td>
                          <td className="py-3">{m.email}</td>
                          <td className="py-3 text-center">
                            {m.role === 'admin' ? (
                              <span className="inline-flex items-center gap-1 text-xs">
                                <Shield className="size-3 text-primary" /> 관리자
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs">
                                <User className="size-3" /> 멤버
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-right text-xs">
                            {m.lastAccess}
                            {daysSince > 30 && <span className="ml-1 text-amber-500">(미사용)</span>}
                          </td>
                          {isAdmin && (
                            <td className="py-3 text-center">
                              <button
                                type="button"
                                className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 설정 */}
        {activeTab === 'settings' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">조직 설정</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">조직 이름</span>
                <Input defaultValue="서울대학교 경영학과" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">조직 유형</span>
                <select className="rounded-md border bg-background px-3 py-2 text-sm" defaultValue="university">
                  <option value="university">대학</option>
                  <option value="institute">연구소</option>
                  <option value="company">기업</option>
                </select>
              </label>
              <Button className="w-fit">저장</Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
