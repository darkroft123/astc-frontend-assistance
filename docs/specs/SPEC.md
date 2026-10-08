========================================================
FRONTEND DE ASISTENCIA - ESPECIFICACIÓN TÉCNICA
SISTEMA ASTC
========================================================

1. DESCRIPCIÓN GENERAL
--------------------------------------------------------
El frontend de asistencia es el módulo operativo principal
para los usuarios tipo TEAM_MEMBER dentro del sistema ASTC.

Este frontend permite:

- Visualizar dashboard de asistencia
- Registrar asistencia diaria
- Gestionar ausencias y justificaciones
- Visualizar historial de asistencias
- Generar alertas automáticas por comportamiento anómalo

El sistema integra geolocalización, cámara y validación por IA
para asegurar la integridad del registro de asistencia.

Este módulo es parte crítica del control operativo del sistema.
========================================================


2. RESPONSABILIDADES DEL SISTEMA
--------------------------------------------------------
Este frontend es responsable de:

- Mostrar dashboard de métricas del usuario
- Consumir datos del assistance-service vía GraphQL
- Permitir registro de asistencia con validación biométrica básica
- Capturar ubicación GPS en tiempo real
- Capturar imagen mediante cámara del dispositivo
- Ejecutar validación de imagen mediante IA (detección de persona)
- Permitir selección de modalidad:
  - Trabajo en oficina
  - Trabajo remoto (casa)
- Generar alertas en caso de comportamiento anómalo
- Navegación a módulos internos:
  - Asistencia
  - Faltas
  - Justificaciones
  - Registro de asistencia

========================================================


3. ARQUITECTURA DEL FRONTEND
--------------------------------------------------------
Tecnología:
- Next.js (React - App Router)
- TypeScript
- TailwindCSS
- GraphQL client

Arquitectura lógica:

DashboardPage
    ↓
PeriodSelector
    ↓
GraphQL GetDashboard
    ↓
MetricCards
    ↓
Navigation Modules
    ├── Register Attendance
    ├── Absences
    ├── Justifications
    ├── Attendance History
========================================================


4. FLUJO DE DASHBOARD
--------------------------------------------------------
1. El usuario accede al dashboard
2. Se carga el período seleccionado (mes, semana, etc.)
3. Se consulta el assistance-service vía GraphQL:
   GetDashboard(fromDate, toDate)
4. Se reciben métricas:
   - totalAttendances
   - totalAbsences
   - pendingJustifications
5. Se calculan indicadores:
   - attendanceRate (%)
6. Se renderizan métricas visuales
========================================================


5. MÓDULO DE REGISTRO DE ASISTENCIA (CHECK-IN / CHECK-OUT)
--------------------------------------------------------
Rutas:
- /team-member/registrar      → Cámara + captura
- /team-member/registrar/prev → Previsualización y confirmación

Flujo de entrada:
1. Usuario hace clic en "Registrar" (QuickActions)
2. Página de cámara (registrar/page.tsx):
   - Activa cámara frontal (useCamera)
   - Detecta rostro con MediaPipe (useFaceDetection)
   - Obtiene GPS (useLocation)
   - Consulta GetTodayAttendance → decide texto del botón:
     - Sin check-in → "Registrar Ingreso" (azul)
     - Con check-in → "Marcar Salida" (verde)
3. Usuario centra rostro → botón se habilita → clic
4. Captura foto (canvas.toDataURL) → guarda en sessionStorage
5. Navega a preview (registrar/prev/page.tsx):
   - Muestra foto, GPS, hora, datos del proyecto
   - Consulta GetTodayAttendance → decide acción:
     - Sin check-in → "Confirmar y Registrar Entrada"
     - Con check-in → "Marcar Salida"
     - Ambos hechos → "Jornada completada"
6. Al confirmar:
   - registerAttendance(token, { projectId, lat, lng, photoUrl }) o
   - checkOut(token, projectId)
   - Limpia sessionStorage
   - Redirige a /team-member/asistencias ✅

Reglas:
- GPS obligatorio (alerta si no disponible)
- Rostro debe estar centrado (MediaPipe validación)
- Foto se envía como base64, backend la sube a MinIO
- No se puede registrar 2 veces (backend rechaza con "Ya registraste")
- Check-out solo si existe check-in previo

6. MÓDULO DE FALTAS
--------------------------------------------------------
Ruta: /team-member/faltas

- Período default: "Total general" (todo el histórico)
- Filtros: búsqueda por fecha/motivo, estado (todas/pendientes/justificadas)
- Tabla: FECHA | MOTIVO | ESTADO | ACCIONES
- Métricas: TOTAL, PENDIENTES, JUSTIFICADAS, SIN JUSTIFICAR
- Botón "JUSTIFICAR" en cada falta no justificada → /team-member/justificar?absenceId={id}&date={fecha}
- Estados: No justificada, Pendiente (en revisión), Justificada
- Datos desde: listAbsences() + listJustifications() (para determinar pendientes)

7. MÓDULO DE JUSTIFICACIONES
--------------------------------------------------------
Rutas:
- /team-member/justificar?absenceId={id}&date={fecha}     → Formulario de justificación
- /team-member/justificar?justificationId={id}             → Editar justificación (OBSERVATION)
- /team-member/justificaciones                             → Lista de justificaciones
- /team-member/justificaciones/{id}                        → Detalle con historial

Flujo de creación:
1. Usuario llena motivo (textarea) + documento opcional (PDF/JPG/PNG, máx 5MB)
2. Clic en "Enviar justificación":
   - saveJustification(token, { absenceId, description, fileBase64 })
     → Guarda con status PENDING, sube documento a MinIO
   - submitJustification(token, saved.id)
     → Cambia status a SUBMITTED, registra submittedAt e history
   - Redirige a /team-member/justificaciones ✅

Lista de justificaciones:
- Período default: mes actual
- Filtros: búsqueda por motivo, estado (todos/borradores/enviados/observación/aprobadas/rechazadas)
- Métricas: TOTAL, APROBADAS, PENDIENTES, % APROB.
- Tabla: FECHA | MOTIVO | DOCUMENTO | OBSERVACIÓN | ESTADO | ACCIONES
- Acciones:
  - 👁 Ver detalle (siempre)
  - ✏️ Editar (solo PENDING u OBSERVATION)
  - 📤 Enviar/Reenviar (solo PENDING u OBSERVATION)

Detalle de justificación:
- Timeline de historial con iconos por estado:
  - PENDING → "Justificación creada"
  - SUBMITTED → "Enviada para revisión"
  - OBSERVATION → "El Jefe de Proyecto solicitó correcciones"
  - APPROVED → "Aprobada por el Jefe de Proyecto"
  - REJECTED → "Rechazada por el Jefe de Proyecto"
- Cada entrada muestra: evento, fecha, usuario, comentario
- Datos desde: getJustificationDetail() → incluye history[]

- Crear justificación de ausencia
- Adjuntar documento o evidencia
- Describir motivo
- Enviar solicitud al sistema

Estados de justificación:

- PENDING
- APPROVED
- REJECTED

Las justificaciones son revisadas por el Project Manager.
========================================================


8. MÓDULO DE AUSENCIAS
--------------------------------------------------------
El usuario puede visualizar:

- Historial de faltas
- Faltas justificadas
- Faltas no justificadas

Se alimenta desde el assistance-service.
========================================================


9. VALIDACIÓN POR IA (SISTEMA EXTERNO)
--------------------------------------------------------
El sistema utiliza IA para:

- Detectar presencia de persona en imagen
- Validar rostro visible
- Evitar imágenes falsas o inválidas

Si la IA falla:
→ Se bloquea el registro
→ Se genera alerta automática
========================================================


10. REGLAS DE NEGOCIO
--------------------------------------------------------
- No se permite asistencia sin ubicación GPS
- No se permite asistencia sin validación de imagen
- Toda anomalía genera alerta automática
- El usuario no puede modificar registros históricos
- Todas las acciones quedan registradas en backend
========================================================


11. SEGURIDAD
--------------------------------------------------------
- JWT obligatorio para todas las consultas
- Token validado en cada request
- Sin token → acceso bloqueado
- Validación de rol TEAM_MEMBER obligatoria
- Datos sensibles nunca almacenados en frontend
========================================================


12. INTEGRACIÓN CON BACKEND
--------------------------------------------------------
Servicios utilizados:

- assistance-service (GraphQL principal)
- project-manager-service (alertas)
- AI validation service (imagen)
- geolocation API (browser GPS)

Endpoint principal:
http://assistance-service:8082/graphql
========================================================


13. UI PRINCIPAL
--------------------------------------------------------
Pantallas:

- Dashboard principal (/team-member)
- Registro de asistencia (/team-member/registrar + /prev)
- Historial de asistencias (/team-member/asistencias)
- Lista de faltas (/team-member/faltas)
- Justificar falta (/team-member/justificar)
- Lista de justificaciones (/team-member/justificaciones)
- Detalle de justificación con historial (/team-member/justificaciones/[id])

Componentes:

- MetricCard (5 colores: emerald, rose, amber, violet, blue)
- QuickActions (2x2 grid: Registrar/Marcar Salida, Justificar, Ver Faltas, Ver Asistencias)
- GeneralSummaryCard (gráfico circular de % asistencia + leyenda)
- PeriodSelector (selector de período)
- DataTable (tabla genérica con paginación)
- SubMetricCard (métricas en línea)
- StatusBadge (badge de estado)
- UserProfileCard (avatar + nombre + correo)

QuickActions dinámico:
- Consulta GetTodayAttendance al montar
- Si hay check-in sin check-out → botón "Marcar Salida" (esmeralda)
- Si no hay check-in → botón "Registrar" (violeta)
- Resto de botones fijos: Justificar, Ver Faltas, Ver Asistencias
========================================================


14. FLUJO GLOBAL DEL SISTEMA
--------------------------------------------------------
LOGIN FRONTEND
      ↓
AUTH SERVICE (JWT)
      ↓
ASSISTANCE FRONTEND
      ↓
GRAPHQL REQUESTS
      ↓
VALIDACIONES:
   - GPS
   - IA cámara
   - horario
      ↓
REGISTRO O ALERTA
      ↓
PROJECT MANAGER NOTIFICATION
========================================================


15. CARACTERÍSTICAS TÉCNICAS
--------------------------------------------------------
- Next.js App Router
- React Hooks
- GraphQL API consumption
- Real-time GPS tracking
- Camera integration (getUserMedia)
- AI image validation (external service)
- Stateless authentication (JWT)
========================================================


16. REGLAS CRÍTICAS DEL SISTEMA
--------------------------------------------------------
- Sin GPS no hay asistencia
- Sin imagen no hay asistencia
- Toda anomalía genera alerta
- El sistema es auditado completamente
- El Project Manager recibe todas las alertas
========================================================


FIN DEL DOCUMENTO
========================================================