// H.Research 데이터베이스 타입 정의

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type OrganizationType = 'university' | 'institute' | 'company'
export type OrgMemberRole = 'admin' | 'member'
export type ProjectStatus = 'active' | 'completed' | 'archived'
export type AnalysisStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface User {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  created_at: string
}

export interface Organization {
  id: string
  name: string
  type: OrganizationType
  created_at: string
}

export interface OrgMember {
  id: string
  org_id: string
  user_id: string
  role: OrgMemberRole
  created_at: string
}

export interface Project {
  id: string
  user_id: string
  org_id: string | null
  title: string
  description: string | null
  status: ProjectStatus
  created_at: string
  updated_at: string
}

export interface Dataset {
  id: string
  project_id: string
  file_name: string
  file_path: string
  row_count: number | null
  column_count: number | null
  created_at: string
}

export interface LatentVariable {
  id: string
  project_id: string
  dataset_id: string | null
  name: string
  color: string | null
  order_index: number
  created_at: string
}

export interface CanvasModel {
  id: string
  project_id: string
  name: string
  version: number
  canvas_data: Json
  created_at: string
  updated_at: string
}

export interface CanvasVersion {
  id: string
  canvas_model_id: string
  version_number: number
  canvas_data: Json
  note: string | null
  created_at: string
}

export interface AnalysisRun {
  id: string
  canvas_model_id: string
  version_id: string | null
  status: AnalysisStatus
  options: Json | null
  created_at: string
}

export interface AnalysisResult {
  id: string
  analysis_run_id: string
  result_data: Json
  interpretation_ko: string | null
  created_at: string
}

export interface Comment {
  id: string
  project_id: string
  analysis_run_id: string | null
  user_id: string
  target_type: string
  target_id: string
  content: string
  created_at: string
}

// Supabase Database 타입 (제네릭 헬퍼)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, 'created_at'> & { created_at?: string }
        Update: Partial<Omit<User, 'id'>>
      }
      organizations: {
        Row: Organization
        Insert: Omit<Organization, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Organization, 'id'>>
      }
      org_members: {
        Row: OrgMember
        Insert: Omit<OrgMember, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<OrgMember, 'id'>>
      }
      projects: {
        Row: Project
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Omit<Project, 'id'>>
      }
      datasets: {
        Row: Dataset
        Insert: Omit<Dataset, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Dataset, 'id'>>
      }
      latent_variables: {
        Row: LatentVariable
        Insert: Omit<LatentVariable, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<LatentVariable, 'id'>>
      }
      canvas_models: {
        Row: CanvasModel
        Insert: Omit<CanvasModel, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Omit<CanvasModel, 'id'>>
      }
      canvas_versions: {
        Row: CanvasVersion
        Insert: Omit<CanvasVersion, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<CanvasVersion, 'id'>>
      }
      analysis_runs: {
        Row: AnalysisRun
        Insert: Omit<AnalysisRun, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<AnalysisRun, 'id'>>
      }
      analysis_results: {
        Row: AnalysisResult
        Insert: Omit<AnalysisResult, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<AnalysisResult, 'id'>>
      }
      comments: {
        Row: Comment
        Insert: Omit<Comment, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Comment, 'id'>>
      }
    }
  }
}
