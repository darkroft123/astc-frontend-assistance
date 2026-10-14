// ==========================================
// CENTRAL MOCK DATA FOR LOCAL DEVELOPMENT
// ==========================================

export const MOCK_USER = {
  id: "user-002",
  sub: "user-002",
  email: "colaborador@astc.joyit.io",
  username: "colaborador-carlos",
  firstName: "Carlos",
  lastName: "Mamani",
  role: "USER",
  avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
  exp: Math.floor(Date.now() / 1000) + 86400 * 30,
};

export const MOCK_PROJECTS = [
  {
    id: "proj-101",
    name: "test06",
    code: "TEST06",
    workStartTime: "08:00:00",
    workEndTime: "17:00:00",
    graceMinutes: 10,
    timezone: "America/Lima",
    vacationEligibilityDays: 30,
    holidays: ["2026-10-08", "2026-11-01", "2026-12-25"],
  },
];

export const MOCK_TODAY_ATTENDANCE = {
  id: "att-today-002",
  userId: "user-002",
  projectId: "proj-101",
  date: new Date().toISOString().split("T")[0],
  checkIn: "08:05:00",
  checkOut: null,
  status: "ASISTENCIA",
};

export const MOCK_DASHBOARD_USER = {
  totalAttendances: 22,
  totalAbsences: 1,
  pendingJustifications: 0,
  porcentajeAsistencia: 95.6,
};

export const MOCK_ATTENDANCES_LIST = [
  {
    id: "att-u1",
    userId: "user-002",
    userName: "Carlos Mamani",
    userEmail: "colaborador@astc.joyit.io",
    projectId: "proj-101",
    projectName: "test06",
    date: "2026-10-14",
    checkIn: "08:05",
    checkOut: null,
    status: "ASISTENCIA",
  },
  {
    id: "att-u2",
    userId: "user-002",
    userName: "Carlos Mamani",
    userEmail: "colaborador@astc.joyit.io",
    projectId: "proj-101",
    projectName: "test06",
    date: "2026-10-13",
    checkIn: "08:00",
    checkOut: "17:02",
    status: "ASISTENCIA",
  },
];

export const MOCK_JUSTIFICATIONS_LIST = [
  {
    id: "just-u1",
    usuario: "Carlos Mamani",
    usuarioId: "user-002",
    motivo: "Trámite personal documentado",
    fecha: "2026-10-10",
    estado: "APROBADA",
    descripcion: "Cita para renovación de documento.",
    submittedAt: "2026-10-10T12:00:00Z",
  },
];

export const MOCK_VACATIONS_LIST = [
  {
    id: "vac-u1",
    userId: "user-002",
    startDate: "2026-12-20",
    endDate: "2026-12-31",
    businessDays: 9,
    status: "APROBADA",
    reason: "Vacaciones de fin de año",
    createdAt: "2026-09-15",
  },
];

export const MOCK_SCHEDULE = {
  id: "sched-u1",
  name: "Turno Regular 40h",
  shiftType: "REGULAR",
  expectedStartTime: "08:00:00",
  expectedEndTime: "17:00:00",
  graceMinutes: 10,
};
