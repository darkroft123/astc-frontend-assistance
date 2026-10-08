import type {
  User,
  DashboardMetrics,
  AttendanceRecord,
  AbsenceRecord,
  JustificationRecord,
  GetDashboardResponse,
  ListAttendanceResponse,
  ListAbsencesResponse,
  ListJustificationsResponse,
} from "@/lib/types/attendance"

// Current user mock
export const mockUser: User = {
  id: "usr_01HXYZ123ABC",
  name: "Carlos Mamani Gutierrez",
  email: "carlos.mamani@empresa.com",
  role: "Empleado",
  project: "Desing",
}

// Dashboard metrics mock
export const mockDashboardMetrics: DashboardMetrics = {
  totalAttendances: 15,
  totalAbsences: 2,
  pendingJustifications: 0,
  approvedJustifications: 2,
}

// Attendance records mock
export const mockAttendanceRecords: AttendanceRecord[] = [
  {
    id: "att_001",
    date: "24/02/2026",
    checkInTime: "08:00",
    status: "PRESENTE",
    location: "En Casa",
  },
  {
    id: "att_002",
    date: "24/02/2026",
    checkInTime: "08:00",
    status: "FALTA",
    location: "En Casa",
  },
  {
    id: "att_003",
    date: "24/02/2026",
    checkInTime: "08:00",
    status: "TARDE",
    location: "En Casa",
  },
  {
    id: "att_004",
    date: "24/02/2026",
    checkInTime: "08:00",
    status: "PRESENTE",
    location: "En Casa",
  },
  {
    id: "att_005",
    date: "23/02/2026",
    checkInTime: "08:15",
    status: "TARDE",
    location: "Oficina",
  },
  {
    id: "att_006",
    date: "22/02/2026",
    checkInTime: "07:55",
    status: "PRESENTE",
    location: "En Casa",
  },
  {
    id: "att_007",
    date: "21/02/2026",
    checkInTime: "08:00",
    status: "PRESENTE",
    location: "Cliente",
  },
  {
    id: "att_008",
    date: "20/02/2026",
    checkInTime: "08:00",
    status: "FALTA",
    location: "En Casa",
  },
]

// Absence records mock
export const mockAbsenceRecords: AbsenceRecord[] = [
  {
    id: "abs_001",
    date: "24/02/2026",
    reason: "Ausencia sin justificacion",
    hasJustification: false,
  },
  {
    id: "abs_002",
    date: "24/02/2026",
    reason: "Ausencia sin justificacion",
    hasJustification: false,
  },
  {
    id: "abs_003",
    date: "24/02/2026",
    reason: "Ausencia sin justificacion",
    hasJustification: false,
  },
  {
    id: "abs_004",
    date: "24/02/2026",
    reason: "Ausencia sin justificacion",
    hasJustification: false,
  },
]

// Justification records mock
export const mockJustificationRecords: JustificationRecord[] = [
  {
    id: "jst_001",
    date: "24/02/2026",
    absenceId: "abs_001",
    reason: "ENFERMEDAD",
    status: "APROBADA",
    submittedAt: "24/02/2026 10:30",
    reviewedAt: "24/02/2026 14:00",
  },
  {
    id: "jst_002",
    date: "24/02/2026",
    absenceId: "abs_002",
    reason: "ENFERMEDAD",
    status: "APROBADA",
    submittedAt: "23/02/2026 09:15",
    reviewedAt: "23/02/2026 16:45",
  },
  {
    id: "jst_003",
    date: "24/02/2026",
    absenceId: "abs_003",
    reason: "ENFERMEDAD",
    status: "APROBADA",
    submittedAt: "22/02/2026 11:00",
    reviewedAt: "22/02/2026 15:30",
  },
  {
    id: "jst_004",
    date: "24/02/2026",
    absenceId: "abs_004",
    reason: "ENFERMEDAD",
    status: "PENDIENTE",
    submittedAt: "21/02/2026 08:45",
  },
]

// GraphQL-style response mocks
export const mockGetDashboardResponse: GetDashboardResponse = {
  data: {
    getDashboard: {
      user: mockUser,
      metrics: mockDashboardMetrics,
    },
  },
}

export const mockListAttendanceResponse: ListAttendanceResponse = {
  data: {
    listAttendance: {
      data: mockAttendanceRecords,
      pagination: {
        page: 1,
        size: 10,
        total: mockAttendanceRecords.length,
        totalPages: 1,
      },
    },
  },
}

export const mockListAbsencesResponse: ListAbsencesResponse = {
  data: {
    listAbsences: {
      data: mockAbsenceRecords,
      pagination: {
        page: 1,
        size: 10,
        total: mockAbsenceRecords.length,
        totalPages: 1,
      },
    },
  },
}

export const mockListJustificationsResponse: ListJustificationsResponse = {
  data: {
    listJustifications: {
      data: mockJustificationRecords,
      pagination: {
        page: 1,
        size: 10,
        total: mockJustificationRecords.length,
        totalPages: 1,
      },
    },
  },
}
