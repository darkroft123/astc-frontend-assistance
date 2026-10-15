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
    name: "testo6",
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
  date: "2026-09-02",
  checkIn: "08:52:00",
  checkOut: "09:07:00",
  status: "EARLY",
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

export const MOCK_NOTIFICATIONS = [
  {
    id: "notif-01",
    notificationCode: "AST00012",
    title: "Justificación enviada",
    body: "Hola mamanigutierrezcarlos123, se ha recibido su justificación para la ausencia del día 2026-09-02. ID: 8432261f-e26a. Estado: Enviado. Será revisada a la brevedad.",
    icon: null,
    color: null,
    actionLink: "/team-member/justificaciones",
    read: false,
    createdAt: "2026-09-02T10:30:00.000Z",
  },
  {
    id: "notif-02",
    notificationCode: "AST00012",
    title: "Justificación enviada",
    body: "Hola mamanigutierrezcarlos123, se ha recibido su justificación para la ausencia del día 2026-09-02. ID: 8432261f-e26a. Estado: Borrador. Será revisada a la brevedad.",
    icon: null,
    color: null,
    actionLink: "/team-member/justificaciones",
    read: false,
    createdAt: "2026-09-02T09:15:00.000Z",
  },
  {
    id: "notif-03",
    notificationCode: "AST00009",
    title: "Salida temprana",
    body: "Hola mamanigutierrezcarlos123, se ha registrado su salida temprana el día 2026-09-02. Estado: Salida temprana. Proyecto: 2454b982-751d. Recuerde cumplir su horario.",
    icon: null,
    color: null,
    actionLink: "/team-member/asistencias",
    read: false,
    createdAt: "2026-09-02T08:00:00.000Z",
  },
  {
    id: "notif-04",
    notificationCode: "AST00012",
    title: "Justificación enviada",
    body: "Hola mamanigutierrezcarlos123, se ha recibido su justificación para la ausencia del día 2026-09-02. ID: 8432261f-e26a. Estado: Enviado. Será revisada a la brevedad.",
    icon: null,
    color: null,
    actionLink: "/team-member/justificaciones",
    read: false,
    createdAt: "2026-09-02T07:45:00.000Z",
  },
  ...Array.from({ length: 24 }).map((_, i) => ({
    id: `notif-${i + 5}`,
    notificationCode: i % 2 === 0 ? "AST00012" : "AST00009",
    title: i % 2 === 0 ? "Justificación enviada" : "Salida temprana",
    body: i % 2 === 0
      ? `Hola mamanigutierrezcarlos123, se ha recibido su justificación para la ausencia del día 2026-09-0${(i % 5) + 1}. ID: ${Math.random().toString(16).substring(2, 10)}. Estado: Enviado. Será revisada a la brevedad.`
      : `Hola mamanigutierrezcarlos123, se ha registrado su salida temprana el día 2026-09-0${(i % 5) + 1}. Estado: Salida temprana. Recuerde cumplir su horario.`,
    icon: null,
    color: null,
    actionLink: i % 2 === 0 ? "/team-member/justificaciones" : "/team-member/asistencias",
    read: false,
    createdAt: `2026-09-02T0${Math.max(1, 7 - (i % 6))}:00:00.000Z`,
  })),
];
