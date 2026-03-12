import { createClient } from './client'
import type { Organization, OrgMember } from '@/types/database'

interface OrgWithRole extends Organization {
  role: string
  memberCount: number
}

export async function createOrganization(name: string, type: string): Promise<Organization> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('로그인이 필요합니다.')

  const { data: org, error } = await supabase
    .from('organizations')
    .insert({ name, type })
    .select()
    .single()

  if (error) throw new Error(`조직 생성 실패: ${error.message}`)

  // 생성자를 admin으로 추가
  await supabase
    .from('org_members')
    .insert({ org_id: org.id, user_id: user.id, role: 'admin' })

  return org as Organization
}

export async function getOrganization(orgId: string): Promise<Organization | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('organizations')
    .select()
    .eq('id', orgId)
    .single()

  if (error) return null
  return data as Organization
}

export async function getMyOrganizations(): Promise<OrgWithRole[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: memberships, error } = await supabase
    .from('org_members')
    .select(`
      role,
      organizations (
        id, name, type, created_at
      )
    `)
    .eq('user_id', user.id)

  if (error || !memberships) return []

  return memberships.map((m) => {
    const org = m.organizations as unknown as Organization
    return {
      ...org,
      role: m.role as string,
      memberCount: 0,
    }
  })
}

export async function getOrgMembers(orgId: string): Promise<(OrgMember & { userName?: string; userEmail?: string })[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('org_members')
    .select('*')
    .eq('org_id', orgId)

  if (error) throw new Error(`멤버 조회 실패: ${error.message}`)
  return (data ?? []) as (OrgMember & { userName?: string; userEmail?: string })[]
}

export async function inviteMember(orgId: string, email: string, role: string): Promise<void> {
  const supabase = createClient()

  // 이메일로 사용자 조회 (실제로는 초대 링크 방식)
  const { data: users } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  if (!users) throw new Error('해당 이메일의 사용자를 찾을 수 없습니다.')

  const { error } = await supabase
    .from('org_members')
    .insert({ org_id: orgId, user_id: users.id, role })

  if (error) throw new Error(`멤버 초대 실패: ${error.message}`)
}

export async function updateMemberRole(orgId: string, userId: string, role: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('org_members')
    .update({ role })
    .eq('org_id', orgId)
    .eq('user_id', userId)

  if (error) throw new Error(`역할 변경 실패: ${error.message}`)
}

export async function removeMember(orgId: string, userId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('org_members')
    .delete()
    .eq('org_id', orgId)
    .eq('user_id', userId)

  if (error) throw new Error(`멤버 제거 실패: ${error.message}`)
}

export async function getOrgStats(orgId: string) {
  const supabase = createClient()

  const { count: memberCount } = await supabase
    .from('org_members')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)

  const { count: projectCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)

  return {
    memberCount: memberCount ?? 0,
    projectCount: projectCount ?? 0,
  }
}
