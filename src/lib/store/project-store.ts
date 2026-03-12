import { create } from 'zustand'
import type { ParsedFileData, LatentVariable, VariableColor } from '@/types/variables'

interface ProjectState {
  projectId: string | null
  projectName: string | null
  uploadedFile: { name: string; size: number } | null
  uploadedData: ParsedFileData | null
  latentVariables: LatentVariable[]

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
}

let nextId = 1
function generateId() {
  return `temp_${Date.now()}_${nextId++}`
}

export const useProjectStore = create<ProjectState>((set) => ({
  projectId: null,
  projectName: null,
  uploadedFile: null,
  uploadedData: null,
  latentVariables: [],

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
      // 다른 잠재변수에서 이미 할당된 경우 제거
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
}))
