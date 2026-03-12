export interface ReviewRequest {
  id: string
  projectId: string
  canvasVersionId: string
  requestedBy: string
  requestedTo: string
  message?: string
  status: 'pending' | 'reviewing' | 'commented' | 'approved'
  createdAt: string
  updatedAt: string
}

export interface ReviewComment {
  id: string
  reviewRequestId: string
  authorId: string
  authorName?: string
  targetType: 'canvas_node' | 'canvas_edge' | 'result_table' | 'interpretation' | 'fit_index'
  targetId?: string
  content: string
  isResolved: boolean
  createdAt: string
}

export interface VersionApproval {
  id: string
  canvasVersionId: string
  approvedBy: string
  reviewRequestId: string
  note?: string
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message?: string
  link?: string
  isRead: boolean
  createdAt: string
}

export interface LabMember {
  id: string
  orgId: string
  supervisorId: string
  studentId: string
  studentName?: string
  studentEmail?: string
  supervisorName?: string
  createdAt: string
}

export interface ProjectShare {
  id: string
  projectId: string
  projectTitle?: string
  sharedBy: string
  sharedWith: string
  canComment: boolean
  canApprove: boolean
  createdAt: string
}
