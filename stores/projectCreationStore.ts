import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type ProjectStepKey = 'identity' | 'definition' | 'build' | 'collaboration' | 'publish'

export interface ProjectDraftData {
  id?: string // The DB project ID once created
  name: string
  project_type: string
  tagline: string
  logo_url: string | null
  cover_image_url: string | null
  
  description: string
  problem_statement: string
  goals: string
  primary_domain: string
  domains: string[]
  
  stage: string
  technologies: string[]
  repository_url: string
  is_open_source: boolean
  license: string
  
  collaboration_status: 'solo' | 'has_collaborators' | 'looking_for_collaborators' | 'open_to_contributors'
  collaborators: any[]
  looking_for_roles: any[]
  
  visibility: 'public' | 'unlisted' | 'private'
  show_in_explore: boolean
  show_on_profile: boolean
}

interface ProjectCreationStore {
  // Data
  data: ProjectDraftData
  currentStep: ProjectStepKey
  isSaving: boolean
  hasUnsavedChanges: boolean
  lastSavedAt: string | null

  // Actions
  setCurrentStep: (step: ProjectStepKey) => void
  updateData: (partial: Partial<ProjectDraftData>) => void
  setSaving: (saving: boolean) => void
  markSaved: () => void
  reset: () => void
  hydrateFromServer: (draft: Partial<ProjectDraftData>) => void
}

const initialData: ProjectDraftData = {
  name: '',
  project_type: 'personal',
  tagline: '',
  logo_url: null,
  cover_image_url: null,
  description: '',
  problem_statement: '',
  goals: '',
  primary_domain: '',
  domains: [],
  stage: 'idea',
  technologies: [],
  repository_url: '',
  is_open_source: false,
  license: '',
  collaboration_status: 'solo',
  collaborators: [],
  looking_for_roles: [],
  visibility: 'public',
  show_in_explore: true,
  show_on_profile: true,
}

export const useProjectCreationStore = create<ProjectCreationStore>()(
  persist(
    (set) => ({
      data: initialData,
      currentStep: 'identity',
      isSaving: false,
      hasUnsavedChanges: false,
      lastSavedAt: null,

      setCurrentStep: (step) => set({ currentStep: step }),
      
      updateData: (partial) => set((s) => ({
        data: { ...s.data, ...partial },
        hasUnsavedChanges: true,
      })),
      
      setSaving: (saving) => set({ isSaving: saving }),
      
      markSaved: () => set({ hasUnsavedChanges: false, lastSavedAt: new Date().toISOString() }),
      
      reset: () => set({
        data: initialData,
        currentStep: 'identity',
        isSaving: false,
        hasUnsavedChanges: false,
        lastSavedAt: null
      }),

      hydrateFromServer: (draft) => set((s) => ({
        data: { ...s.data, ...draft },
        hasUnsavedChanges: false
      }))
    }),
    {
      name: 'dsrt-project-draft',
      storage: createJSONStorage(() => localStorage),
    }
  )
)