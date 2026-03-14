"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowLeft, Plus, Trash2, Copy, Check, QrCode, ExternalLink, Rocket,
  AlertTriangle, Info, StopCircle,
} from "lucide-react"
import QRCode from "qrcode"
import { generateGroupToken } from "@/lib/utils/token"
import SurveySteps from "@/components/survey/SurveySteps"

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
  const [titleError, setTitleError] = useState(false)
  const [description, setDescription] = useState('')
  const [targetResponses, setTargetResponses] = useState(200)
  const [preventDuplicate, setPreventDuplicate] = useState(true)
  const [groups, setGroups] = useState<GroupLink[]>([])
  const [newGroupName, setNewGroupName] = useState('')
  const [deployed, setDeployed] = useState(false)
  const [closed, setClosed] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // 모달
  const [showStartModal, setShowStartModal] = useState(false)
  const [showEndModal, setShowEndModal] = useState(false)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const surveyUrl = `${baseUrl}/survey/${formId}`

  // 데모 문항 수 (실제로는 스토어에서 가져옴)
  const questionCount = 15
  const pageCount = 3

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

  // 수집 시작 전 유효성 검사
  const handleStartClick = useCallback(() => {
    if (!title.trim()) {
      setTitleError(true)
      return
    }
    setTitleError(false)
    setShowStartModal(true)
  }, [title])

  // 수집 시작 확정
  const handleConfirmStart = useCallback(() => {
    setDeployed(true)
    setShowStartModal(false)
    // TODO: Supabase에 설문 상태 업데이트 (status: 'active')
  }, [])

  // 수집 종료
  const handleEndCollection = useCallback(() => {
    setClosed(true)
    setShowEndModal(false)
    // TODO: Supabase에 설문 상태 업데이트 (status: 'closed')
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
            <h1 className="text-xl font-bold">설문 설정</h1>
          </div>
          <SurveySteps current={2} />
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
                <span className="text-xs text-muted-foreground">
                  설문 제목 <span className="text-red-500">*</span>
                </span>
                <input
                  className={`rounded-md border bg-background px-3 py-2 text-sm ${
                    titleError ? 'border-red-400 ring-1 ring-red-400' : ''
                  }`}
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value)
                    if (e.target.value.trim()) setTitleError(false)
                  }}
                  placeholder="설문 제목을 입력하세요"
                />
                {titleError && (
                  <span className="text-xs text-red-500">설문 제목을 입력해주세요.</span>
                )}
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
              <div className="grid grid-cols-2 gap-4">
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
                <label className="flex items-end gap-2 pb-2">
                  <input
                    type="checkbox"
                    checked={preventDuplicate}
                    onChange={(e) => setPreventDuplicate(e.target.checked)}
                    className="size-4 rounded border"
                  />
                  <span className="text-sm">중복 응답 방지 (토큰 기반)</span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* 그룹 링크 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">그룹 링크</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {/* 안내 문구 */}
              <div className="flex gap-2 rounded-lg border border-blue-100 bg-blue-50/50 p-3">
                <Info className="mt-0.5 size-4 shrink-0 text-blue-500" />
                <div className="text-xs leading-relaxed text-blue-700">
                  <p className="font-medium">그룹 링크가 필요하신가요?</p>
                  <p className="mt-1">
                    동일한 설문을 여러 팀/조직에 배포하고 HLM 다층분석을 계획하신다면
                    그룹 링크를 추가하세요. 그룹 링크 없이 배포하면 단일 링크로 수집됩니다.
                  </p>
                </div>
              </div>

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
                  그룹 없이 수집하면 단일 링크로 모든 응답을 수집합니다.
                </p>
              )}
            </CardContent>
          </Card>

          {/* 수집 시작 / 수집 중 / 수집 종료 */}
          {!deployed ? (
            <Button onClick={handleStartClick} size="lg" className="w-full">
              <Rocket className="size-4" />
              수집 시작
            </Button>
          ) : closed ? (
            <Card className="border-slate-300 bg-slate-50">
              <CardContent className="py-6 text-center">
                <StopCircle className="mx-auto mb-2 size-8 text-slate-400" />
                <p className="text-sm font-medium text-slate-500">수집이 종료되었습니다</p>
                <p className="mt-1 text-xs text-slate-400">링크가 비활성화되어 더 이상 응답을 받지 않습니다.</p>
                <Link href={`/projects/${projectId}/survey/dashboard`}>
                  <Button variant="outline" className="mt-4">
                    <ExternalLink className="size-4" />
                    수집 현황으로 이동
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base text-green-600">
                  <span>수집 중</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEndModal(true)}
                    className="text-red-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <StopCircle className="size-3.5" />
                    수집 종료
                  </Button>
                </CardTitle>
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
                    수집 현황으로 이동
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* 수집 시작 확인 모달 */}
      {showStartModal && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setShowStartModal(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-white p-6 shadow-lg">
            <h3 className="text-base font-semibold text-[#1E2A3A]">
              설문을 시작하기 전에 확인해주세요
            </h3>
            <div className="mt-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-[#1E2A3A]">
                <Check className="size-4 text-emerald-500" />
                문항 수: {questionCount}개 ({pageCount}페이지)
              </div>
              <div className="flex items-center gap-2 text-sm text-[#1E2A3A]">
                <Check className="size-4 text-emerald-500" />
                그룹 링크: {groups.length > 0 ? `${groups.length}개` : '단일 링크'}
              </div>
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-md bg-amber-50 p-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
              <p className="text-xs leading-relaxed text-amber-700">
                수집 시작 후 문항을 수정하면 기존 응답 데이터와 불일치가 발생할 수 있습니다.
                문항 수정이 필요한 경우 새 설문을 만드는 것을 권장합니다.
              </p>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowStartModal(false)}>
                취소
              </Button>
              <Button onClick={handleConfirmStart}>
                <Rocket className="size-4" />
                수집 시작
              </Button>
            </div>
          </div>
        </>
      )}

      {/* 수집 종료 확인 모달 */}
      {showEndModal && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setShowEndModal(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-white p-6 shadow-lg">
            <h3 className="text-base font-semibold text-[#1E2A3A]">
              수집을 종료하시겠습니까?
            </h3>
            <div className="mt-4 flex items-start gap-2 rounded-md bg-red-50 p-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-500" />
              <p className="text-xs leading-relaxed text-red-700">
                수집을 종료하면 링크가 비활성화되고 더 이상 응답을 받지 않습니다.
                종료 후에는 다시 활성화할 수 없습니다.
              </p>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEndModal(false)}>
                취소
              </Button>
              <Button
                variant="destructive"
                onClick={handleEndCollection}
              >
                <StopCircle className="size-4" />
                수집 종료
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
