# Frontend Assistance (Team Member UI)

Frontend para el rol Team Member del sistema ASTC - dashboard de asistencia y gestión de justificaciones.

## Stack Tecnológico

- Next.js 14+ (React - App Router)
- TypeScript
- TailwindCSS
- GraphQL Client

## Descripción

El frontend de asistencia es el módulo operativo principal para usuarios tipo TEAM_MEMBER. Permite:

- Visualizar dashboard de asistencia
- Registrar asistencia diaria (check-in/check-out)
- Gestionar ausencias y justificaciones
- Visualizar historial de asistencias
- Generar alertas automáticas por comportamiento anómalo

**Puerto:** 3000

## Arquitectura

```
frontend-assistance/
├── app/
│   └── team-member/
│       ├── page.tsx              # Dashboard principal
│       ├── registrar/            # Registro de asistencia
│       ├── asistencias/          # Historial de asistencias
│       ├── faltas/               # Lista de faltas
│       └── justificaciones/      # Gestión de justificaciones
├── features/
│   └── pm/
├── components/
├── hooks/
├── lib/
└── app/services/
    └── assistance.service.ts     # Servicio GraphQL
```

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/team-member` | Dashboard principal |
| `/team-member/registrar` | Registro de asistencia (cámara + GPS) |
| `/team-member/registrar/prev` | Previsualización y confirmación |
| `/team-member/asistencias` | Historial de asistencias |
| `/team-member/faltas` | Lista de faltas |
| `/team-member/justificar` | Formulario de justificación |
| `/team-member/justificaciones` | Lista de justificaciones |
| `/team-member/justificaciones/[id]` | Detalle con historial |

## Funcionalidades

### Dashboard
- Métricas: Total asistencias, faltas, justificaciones pendientes
- QuickActions: Registrar, Justificar, Ver faltas, Ver asistencias
- Gráfico circular de % asistencia

### Registro de Asistencia
- Cámara frontal con detección de rostro (MediaPipe)
- GPS obligatorio
- Validación por IA
- Check-in / Check-out

### Justificaciones
- Crear justificación con documento adjunto
- Estados: PENDING → SUBMITTED → APPROVED/REJECTED
- Historial de cambios

## Variables de Entorno

| Variable | Descripción |
|----------|-------------|
| `NODE_OPTIONS` | Opciones de memoria Node.js |

## Ejecución Local

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build
npm run build
```

## Docker

```bash
# Puerto mapeado: 3000:3000
docker compose up -d frontend-assistance
```

## Integraciones

- **Gateway (Apollo)**: Consumo de GraphQL
- **assistance-service**: Datos de asistencia
- **Google Maps API**: Geolocalización
- **MediaPipe**: Detección de rostro
