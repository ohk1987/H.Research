"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowLeft, Plus, Trash2, Copy, Check, QrCode, ExternalLink, Rocket,
} from "lucide-react"
import QRCode from "qrcode"
import { generateGroupToken } from "@/lib/utils/token"

interface GroupLink {
  id: string
  name: string
  token: string
  description: string
}

export default function SurveyDeployPage() {
  const params = useParams()
  const projectId = params.id as string
  const formId = projectId // 임시: formId = projectId

  const [title, setTitle] = useState('연구 설문조사')
  const [description, setDescription] = useState('')
  const [targetResponses, setTargetResponses] = useState(200)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [preventDuplicate, setPreventDuplicate] = useState(true)
  const [groups, setGroups] = useState<GroupLink[]>([])
  const [newGroupName, setNewGroupName] = useState('')
  const [deployed, setDeployed] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const surveyUrl = `${baseUrl}/survey/${formId}`

  // 그룹 추가
  const addGroup = useCallback(() => {
    if (!newGroupName.trim()) return
    const token = generateGroupToken()
    setGroups((prev) => [
      ...prev,
      {
        id: `group_${Date.now()}`,
        name: newGroupName.trim(),
        token,
        description: '',
      },
    ])
    setNewGroupName('')
  }, [newGroupName])

  // 그룹 삭제
  const removeGroup = useCallback((id: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== id))
  }, [])

  // 링크 복사
  const copyLink = useCallback(async (url: string, id: string) => {
    await navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }, [])

  // QR 코드 다운로드
  const downloadQR = useCallback(async (url: string, name: string) => {
    const canvas = document.createElement('canvas')
    await QRCode.toCanvas(canvas, url, { width: 300, margin: 2 })
    const link = document.createElement('a')
    link.download = `QR_${name}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [])

  // 배포 시작
  const handleDeploy = useCallback(() => {
    setDeployed(true)
    // TODO: Supabase에 설문 상태 업데이트
  }, [])

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href={`/projects/${projectId}/survey/builder`}>
              <Button variant="ghost" size="icon-sm">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">배포 설정</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex flex-col gap-6">
          {/* 기본 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">기본 설정</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">설문 제목</span>
                <input
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">설문 설명</span>
                <textarea
                  className="min-h-[60px] rounded-md border bg-background px-3 py-2 text-sm"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="응답자에게 표시할 설문 설명을 입력하세요"
                />
              </label>
              <div className="grid grid-cols-3 gap-4">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">목표 응답 수</span>
                  <input
                    type="number"
                    min={1}
                    className="rounded-md border bg-background px-3 py-2 text-sm"
                    value={targetResponses}
                    onChange={(e) => setTargetResponses(Number(e.target.value))}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">시작일</span>
                  <input
                    type="date"
                    className="rounded-md border bg-background px-3 py-2 text-sm"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">마감일</span>
                  <input
                    type="date"
                    className="rounded-md border bg-background px-3 py-2 text-sm"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </label>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={preventDuplicate}
                  onChange={(e) => setPreventDuplicate(e.target.checked)}
                  className="size-4 rounded border"
                />
                <span className="text-sm">중복 응답 방지 (토큰 기반)</span>
              </label>
            </CardContent>
          </Card>

          {/* 그룹 링크 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">그룹 링크</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-xs text-muted-foreground">
                그룹별 고유 링크를 생성하면 응답자의 소속 그룹이 자동으로 태깅됩니다.
                HLM/다층분석 시 집단 변수로 활용됩니다.
              </p>

              {/* 그룹 추가 */}
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder="그룹명 (예: 1팀, A반)"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addGroup()}
                />
                <Button onClick={addGroup} disabled={!newGroupName.trim()}>
                  <Plus className="size-4" />
                  그룹 추가
                </Button>
              </div>

              {/* 그룹 목록 */}
              {groups.length > 0 && (
                <div className="rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium">그룹명</th>
                        <th className="px-3 py-2 text-left font-medium">링크</th>
                        <th className="px-3 py-2 text-center font-medium">QR</th>
                        <th className="px-3 py-2 text-center font-medium">삭제</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groups.map((g) => {
                        const groupUrl = `${surveyUrl}?g=${g.token}`
                        return (
                          <tr key={g.id} className="border-b last:border-0">
                            <td className="px-3 py-2 font-medium">{g.name}</td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1">
                                <span className="max-w-[200px] truncate text-xs text-muted-foreground">
                                  {groupUrl}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => copyLink(groupUrl, g.id)}
                                  className="rounded p-1 hover:bg-muted"
                                >
                                  {copiedId === g.id ? (
                                    <Check className="size-3.5 text-green-600" />
                                  ) : (
                                    <Copy className="size-3.5" />
                                  )}
                                </button>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => downloadQR(groupUrl, g.name)}
                                className="rounded p-1 hover:bg-muted"
                              >
                                <QrCode className="size-4" />
                              </button>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeGroup(g.id)}
                                className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {groups.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  그룹 없이 배포하면 단일 링크로 모든 응답을 수집합니다.
                </p>
              )}
            </CardContent>
          </Card>

          {/* 배포 */}
          {!deployed ? (
            <Button onClick={handleDeploy} size="lg" className="w-full">
              <Rocket className="size-4" />
              배포 시작
            </Button>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-green-600">배포 완료</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {/* 기본 링크 */}
                <div className="flex items-center justify-between rounded-md bg-muted/50 p-3">
                  <div>
                    <span className="text-xs text-muted-foreground">기본 설문 링크</span>
                    <p className="text-sm font-medium">{surveyUrl}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => copyLink(surveyUrl, 'base')}
                    >
                      {copiedId === 'base' ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                      복사
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => downloadQR(surveyUrl, '설문')}
                    >
                      <QrCode className="size-3.5" />
                      QR
                    </Button>
                  </div>
                </div>

                {/* 그룹별 링크 */}
                {groups.map((g) => {
                  const groupUrl = `${surveyUrl}?g=${g.token}`
                  return (
                    <div key={g.id} className="flex items-center justify-between rounded-md bg-muted/50 p-3">
                      <div>
                        <span className="text-xs text-muted-foreground">{g.name}</span>
                        <p className="text-sm font-medium">{groupUrl}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => copyLink(groupUrl, g.id)}
                        >
                          {copiedId === g.id ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                          복사
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => downloadQR(groupUrl, g.name)}
                        >
                          <QrCode className="size-3.5" />
                          QR
                        </Button>
                      </div>
                    </div>
                  )
                })}

                <Link href={`/projects/${projectId}/survey/dashboard`}>
                  <Button variant="outline" className="w-full">
                    <ExternalLink className="size-4" />
                    응답 현황 대시보드로 이동
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
