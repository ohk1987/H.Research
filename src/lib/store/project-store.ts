import { create } from 'zustand'
import type { Node, Edge } from '@xyflow/react'
import type { ParsedFileData, LatentVariable, VariableColor } from '@/types/variables'

export interface CanvasVersion {
  id: string
  name: string
  nodes: Node[]
  edges: Edge[]
  savedAt: string
}

interface ProjectState {
  projectId: string | null
  projectName: string | null
  uploadedFile: { name: string; size: number } | null
  uploadedData: ParsedFileData | null
  latentVariables: LatentVariable[]

  // 캔버스
  canvasNodes: Node[]
  canvasEdges: Edge[]
  currentVersionId: string | null
  versions: CanvasVersion[]
  lastSavedAt: string | null

  // 프로젝트
  setProject: (id: string, name: string) => void

  // 파일 업로드
  setUploadedData: (file: { name: string; size: number }, data: ParsedFileData) => void

  // 잠재변수 관리
  addLatentVariable: (name: string, color: VariableColor) => void
  removeLatentVariable: (id: string) => void
  updateLatentVariable: (id: string, updates: Partial<Pick<LatentVariable, 'name' | 'color'>>) => void
  assignItemToVariable: (variableId: string, item: { columnName: string; sampleValues: (string | number)[] }) => void
  unassignItem: (variableId: string, itemId: string) => void
  toggleItemReverse: (variableId: string, itemId: string) => void
  reorderVariables: (fromIndex: number, toIndex: number) => void

  // 캔버스
  setCanvasNodes: (nodes: Node[]) => void
  setCanvasEdges: (edges: Edge[]) => void
  saveVersion: (name: string) => void
  loadVersion: (versionId: string) => void
}

let nextId = 1
function generateId() {
  return `temp_${Date.now()}_${nextId++}`
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projectId: null,
  projectName: null,
  uploadedFile: null,
  uploadedData: null,
  latentVariables: [],

  // 캔버스
  canvasNodes: [],
  canvasEdges: [],
  currentVersionId: null,
  versions: [],
  lastSavedAt: null,

  setProject: (id, name) => set({ projectId: id, projectName: name }),

  setUploadedData: (file, data) => set({ uploadedFile: file, uploadedData: data }),

  addLatentVariable: (name, color) =>
    set((state) => ({
      latentVariables: [
        ...state.latentVariables,
        { id: generateId(), name, color, items: [] },
      ],
    })),

  removeLatentVariable: (id) =>
    set((state) => ({
      latentVariables: state.latentVariables.filter((v) => v.id !== id),
    })),

  updateLatentVariable: (id, updates) =>
    set((state) => ({
      latentVariables: state.latentVariables.map((v) =>
        v.id === id ? { ...v, ...updates } : v
      ),
    })),

  assignItemToVariable: (variableId, item) =>
    set((state) => {
      const cleaned = state.latentVariables.map((v) => ({
        ...v,
        items: v.items.filter((i) => i.columnName !== item.columnName),
      }))
      return {
        latentVariables: cleaned.map((v) =>
          v.id === variableId
            ? {
                ...v,
                items: [
                  ...v.items,
                  {
                    id: generateId(),
                    columnName: item.columnName,
                    isReversed: false,
                    sampleValues: item.sampleValues,
                  },
                ],
              }
            : v
        ),
      }
    }),

  unassignItem: (variableId, itemId) =>
    set((state) => ({
      latentVariables: state.latentVariables.map((v) =>
        v.id === variableId
          ? { ...v, items: v.items.filter((i) => i.id !== itemId) }
          : v
      ),
    })),

  toggleItemReverse: (variableId, itemId) =>
    set((state) => ({
      latentVariables: state.latentVariables.map((v) =>
        v.id === variableId
          ? {
              ...v,
              items: v.items.map((i) =>
                i.id === itemId ? { ...i, isReversed: !i.isReversed } : i
              ),
            }
          : v
      ),
    })),

  reorderVariables: (fromIndex, toIndex) =>
    set((state) => {
      const newVars = [...state.latentVariables]
      const [moved] = newVars.splice(fromIndex, 1)
      newVars.splice(toIndex, 0, moved)
      return { latentVariables: newVars }
    }),

  // 캔버스
  setCanvasNodes: (nodes) => set({ canvasNodes: nodes }),
  setCanvasEdges: (edges) => set({ canvasEdges: edges }),

  saveVersion: (name) => {
    const state = get()
    const version: CanvasVersion = {
      id: generateId(),
      name,
      nodes: state.canvasNodes,
      edges: state.canvasEdges,
      savedAt: new Date().toISOString(),
    }
    set((s) => ({
      versions: [...s.versions, version],
      currentVersionId: version.id,
      lastSavedAt: version.savedAt,
    }))
  },

  loadVersion: (versionId) => {
    const state = get()
    const version = state.versions.find((v) => v.id === versionId)
    if (version) {
      set({
        canvasNodes: version.nodes,
        canvasEdges: version.edges,
        currentVersionId: version.id,
      })
    }
  },
}))
