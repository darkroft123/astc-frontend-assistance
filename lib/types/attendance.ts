// GraphQL-style types for the attendance management system

export type AttendanceStatus = "PRESENTE" | "FALTA" | "TARDE"
export type JustificationStatus = "PENDING" | "SUBMITTED" | "OBSERVATION" | "APPROVED" | "REJECTED"
export type LocationType = "En Casa" | "Oficina" | "Cliente"

export interface User {
  id: string
  name: string
  email: string
  role: string
  project: string
  avatarUrl?: string
}

export interface DashboardMetrics {
  totalAttendances: number
  totalAbsences: number
  pendingJustifications: number
  approvedJustifications: number
}

export interface AttendanceRecord {
  id: string
  date: string
  checkInTime: string
  status: AttendanceStatus
  location: LocationType
  photoUrl?: string
}

export interface AbsenceRecord {
  id: string
  date: string
  reason: string
  hasJustification: boolean
  justificationId?: string
}

export interface JustificationRecord {
  id: string
  date: string
  absenceId: string
  reason: string
  documentUrl?: string
  status: JustificationStatus
  submittedAt: string
  reviewedAt?: string
  reviewerNotes?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    size: number
    total: number
    totalPages: number
  }
}

// GraphQL Response types
export interface GetDashboardResponse {
  data: {
    getDashboard: {
      user: User
      metrics: DashboardMetrics
    }
  }
}

export interface ListAttendanceResponse {
  data: {
    listAttendance: PaginatedResponse<AttendanceRecord>
  }
}

export interface ListAbsencesResponse {
  data: {
    listAbsences: PaginatedResponse<AbsenceRecord>
  }
}

export interface ListJustificationsResponse {
  data: {
    listJustifications: PaginatedResponse<JustificationRecord>
  }
}

export interface RegisterAttendanceInput {
  project: string
  location: LocationType
  photoUrl?: string
}

export interface JustifyAbsenceInput {
  absenceId: string
  reason: string
  documentUrl?: string
}
