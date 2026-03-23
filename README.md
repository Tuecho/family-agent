# Family Agent

Aplicación web para la gestión de la economía familiar, agenda y planificación del hogar con sistema multi-usuario. Optimizada para dispositivos móviles.

## Características

### Gestión Familiar
- **Contabilidad familiar**: Registro de ingresos y gastos con importación desde Excel
- **Presupuestos mensuales**: Seguimiento de presupuestos por categoría con progreso visual
- **Agenda familiar**: Eventos con soporte para recurrencia semanal (ej: clases de inglés cada lunes y miércoles) y fechas de fin (eventos de varios días)
- **Dashboard**: Gráficos de evolución mensual con resumen del mes y presupuestos

### Tareas y Lista de la Compra (v1.0.1, v1.0.2)
- **Lista de la Compra**: Productos con cantidad, marcar al comprar, sección de comprados
- **Tareas Familiares**: Tareas con prioridades (Alta/Media/Normal) y fechas límite
- **Compartir listas**: Envía tu lista por WhatsApp, Telegram o Email
- **Tareas atrasadas**: Visualización de tareas vencidas
- **Menú separado**: Lista de compra y tareas familiares en botones separados del sidebar (v1.0.2)

### Notas (v1.0.1)
- **Notas rápidas**: Apunta información importante
- **Categorías**: General, Trabajo, Familia, Personal, Importante
- **Búsqueda**: Filtra notas por título o contenido
- **Edición**: Crea, edita y elimina notas

### Sistema Multi-Usuario
- **Datos aislados**: Cada usuario tiene sus propios datos (transacciones, presupuestos, eventos, tareas, notas)
- **Compartir datos**: Invita a otros usuarios a ver tus datos familiares
- **Panel de administración**: Gestiona usuarios (crear, bloquear, eliminar, cambiar contraseñas, asignar roles)
- **FAQs editables**: Los administradores pueden añadir, editar y eliminar FAQs

### Seguridad (v1.0.1)
- **Contraseñas seguras**: Validación de requisitos (8+ chars, mayúsculas, minúsculas, números, caracteres especiales)
- **Auto-cierre de sesión**: La sesión se cierra automáticamente tras 5 minutos de inactividad
- **Autenticación segura**: Contraseñas hasheadas con salt

### Internacionalización (v1.0.1, v1.0.2)
- **Multiidioma**: Selector de idioma en la interfaz (Español, English, Português)
- **Persistencia**: El idioma seleccionado se guarda en localStorage

### Copias de Seguridad (v1.0.1)
- **Exportar datos**: Descarga todos tus datos en JSON (transacciones, presupuestos, eventos, tareas, notas)
- **Importar datos**: Restaura tus datos desde un archivo de backup

### Presupuestos Recurrentes (v1.0.2)
- **Gastos fijos**: Marca presupuestos como recurrentes (ej: alquiler, seguros, suscripciones)
- **Copia automática**: Botón "Copiar recurrentes" para duplicar gastos fijos al siguiente mes
- **Indicador visual**: Badge distintivo en presupuestos recurrentes

### Importación PDF (v1.0.2)
- **Subir facturas**: Importa facturas en PDF desde la sección de contabilidad
- **Extracción automática**: Detecta automáticamente concepto, cantidad y fecha del documento
- **Conceptos predefinidos**: Usa palabras clave para categorizar (Hipoteca → Hipoteca/Arrendamiento)

### Sugerencias (v1.0.2)
- **Enviar ideas**: Los usuarios pueden enviar sugerencias de mejoras, reportar bugs o dar feedback
- **Panel de administración**: Los administradores ven y gestionan todas las sugerencias recibidas
- **Tipos de sugerencia**: Idea, Bug, Feedback

### Notificaciones
- **Email automatizado**: Resumen diario con eventos y presupuestos
- **Configuración por usuario**: Cada usuario configura su propio SMTP y zona horaria
- **Zonas horarias**: Soporte para múltiples zonas horarias (España, Europa, América)

### Inteligencia Artificial
- **Chatbot IA**: Asistente con Groq (LLaMA 3.3) para analizar tus finanzas
- **Modo SQL rápido**: Consulta tus datos en lenguaje natural
- **Contexto familiar**: El chatbot conoce tu situación financiera

### Extra
- **FAQ**: Preguntas frecuentes con manuales (editables por admins)
- **Acerca de**: Información de la app, sugerencias y opción de recomendar a otros
- **Diseño mobile-first**: Optimizado para móvil con escritorio mejorado

## Stack Tecnológico

- **Frontend**: React + Vite + TypeScript + TailwindCSS
- **Backend**: Node.js + Express + sql.js (SQLite persistente)
- **Docker**: Multi-container con Docker Compose
- **Email**: Nodemailer + Gmail SMTP
- **IA**: Groq API (LLaMA 3.3)
- **Proxy**: Nginx Proxy Manager + Cloudflare Tunnel

## Requisitos

- Docker y Docker Compose
- Node.js 20+ (para desarrollo local)
- Claves API:
  - Groq API Key (gratuita en [console.groq.com](https://console.groq.com))
  - Gmail App Password (para notificaciones, una por usuario)

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/Tuecho/family-agent.git
cd family-agent
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` y añade tus credenciales:

```env
# Groq API Key (para el chatbot IA)
GROQ_API_KEY=tu_api_key_de_groq

# Cloudflare Tunnel Token (para acceso remoto sin abrir puertos)
CLOUDFLARE_TUNNEL_TOKEN=tu_cloudflare_tunnel_token

# Gmail SMTP Password (para notificaciones por email)
SMTP_PASSWORD=tu_contraseña_de_aplicacion_gmail
```

### 3. Crear tunnel en Cloudflare (opcional, para acceso remoto)

1. Ve a https://one.dash.cloudflare.com/
2. Crea un tunnel nuevo
3. Configura las rutas:
   - `tudominio.com` → frontend:5173
   - `api.tudominio.com` → api:3000
4. Copia el token del tunnel en `.env`

### 4. Iniciar con Docker

```bash
docker compose up -d
```

La aplicación estará disponible en:
- Frontend: http://localhost:5173
- API: http://localhost:3000

## Uso

### Primer inicio
1. Accede a la aplicación
2. Regístrate con un nombre de usuario
3. Ese usuario se convertirá en **administrador**
4. ¡Importante! Las contraseñas deben cumplir: 8+ caracteres, mayúsculas, minúsculas, números y caracteres especiales

### Como administrador
- Gestionar usuarios (crear, bloquear, eliminar)
- Asignar/revocar rol de administrador
- Cambiar contraseñas de otros usuarios
- Editar FAQs (añadir, modificar, eliminar preguntas)

### Como usuario
- Gestionar tus propias transacciones, presupuestos y eventos
- Crear y gestionar tareas y lista de la compra
- Tomar notas personales
- Configurar tu perfil y preferencias de notificaciones
- Invitar a otros usuarios a ver tus datos
- Aceptar o rechazar invitaciones de otros usuarios

## Desarrollo local

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm run dev
```

## Estructura del proyecto

```
family-agent/
├── frontend/              # React app
│   ├── src/
│   │   ├── pages/       # Dashboard, Accounting, Agenda, Budgets, Chat, Profile, FAQ, About, Admin, Tasks, Notes, ShoppingList, FamilyTasks, ImportPDF
│   │   ├── components/  # Sidebar, Auth, ChatWidget, NotificationSettings, ImportExcel, ImportPDF, LanguageSelector
│   │   ├── i18n/        # Traducciones (Español, English, Português)
│   │   └── utils/      # Helpers (auth, format)
│   └── Dockerfile
├── backend/              # API Express
│   ├── server.js        # Endpoints y lógica
│   └── Dockerfile
├── docker-compose.yml    # Orquestación
├── .env.example         # Plantilla variables de entorno
└── .gitignore
```

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario (pendiente aprobación)
- `GET /api/auth/admin/users` - Listar usuarios (admin)
- `POST /api/auth/admin/user/create` - Crear usuario (admin)
- `POST /api/auth/admin/user/:id/block` - Bloquear/desbloquear usuario (admin)
- `POST /api/auth/admin/user/:id/role` - Asignar/revocar admin (admin)
- `POST /api/auth/admin/user/:id/password` - Cambiar contraseña (admin)
- `DELETE /api/auth/admin/user/:id` - Eliminar usuario (admin)

### Transacciones
- `GET /api/transactions` - Lista de transacciones (filtrado por usuario)
- `POST /api/transactions` - Crear transacción
- `PUT /api/transactions/:id` - Actualizar transacción
- `DELETE /api/transactions/:id` - Eliminar transacción
- `GET /api/transactions/monthly` - Datos mensuales
- `GET /api/transactions/by-concept` - Gastos por categoría

### Presupuestos
- `GET /api/budgets` - Lista de presupuestos
- `POST /api/budgets` - Crear presupuesto
- `PUT /api/budgets/:id` - Actualizar presupuesto
- `DELETE /api/budgets/:id` - Eliminar presupuesto
- `GET /api/budgets/with-spending` - Presupuestos con gasto calculado
- `POST /api/budgets/copy-recurring` - Copiar presupuestos recurrentes al siguiente mes (v1.0.2)

### Agenda
- `GET /api/events` - Eventos (filtrado por usuario)
- `POST /api/events` - Crear evento
- `PUT /api/events/:id` - Actualizar evento
- `DELETE /api/events/:id` - Eliminar evento

### Tareas (v1.0.1)
- `GET /api/tasks` - Lista de tareas (lista de compra y tareas familiares)
- `POST /api/tasks` - Crear tarea
- `PUT /api/tasks/:id` - Actualizar tarea
- `PUT /api/tasks/:id/toggle` - Marcar/desmarcar completada
- `DELETE /api/tasks/:id` - Eliminar tarea

### Notas (v1.0.1)
- `GET /api/notes` - Lista de notas
- `POST /api/notes` - Crear nota
- `PUT /api/notes/:id` - Actualizar nota
- `DELETE /api/notes/:id` - Eliminar nota

### FAQs (v1.0.1)
- `GET /api/faqs` - Lista de FAQs
- `POST /api/faqs` - Crear FAQ (admin)
- `PUT /api/faqs/:id` - Actualizar FAQ (admin)
- `DELETE /api/faqs/:id` - Eliminar FAQ (admin)

### Sugerencias (v1.0.2)
- `GET /api/suggestions` - Lista de sugerencias (admin ve todas, usuarios ven las propias)
- `POST /api/suggestions` - Crear sugerencia
- `PUT /api/suggestions/:id` - Actualizar sugerencia (admin)
- `DELETE /api/suggestions/:id` - Eliminar sugerencia

### Backup (v1.0.1)
- `GET /api/export` - Exportar todos los datos del usuario
- `POST /api/import` - Importar datos desde backup

### Importar PDF (v1.0.2)
- `POST /api/import/pdf` - Subir PDF y extraer datos (concepto, cantidad, fecha)

### Perfil
- `GET /api/profile` - Obtener perfil
- `PUT /api/profile` - Actualizar perfil

### Invitaciones
- `GET /api/invitations` - Listar invitaciones enviadas/recibidas
- `POST /api/invitations` - Enviar invitación
- `PUT /api/invitations/:id/accept` - Aceptar invitación
- `PUT /api/invitations/:id/reject` - Rechazar invitación
- `DELETE /api/shares/:id` - Dejar de compartir

### Chatbot
- `POST /api/chat` - Mensaje al chatbot (Groq o SQL)
- `GET /api/llm/settings` - Configuración LLM
- `PUT /api/llm/settings` - Guardar configuración LLM
- `POST /api/llm/test` - Probar conexión LLM

### Notificaciones
- `GET /api/notifications/settings` - Configuración (por usuario)
- `POST /api/notifications/settings` - Guardar configuración
- `POST /api/notifications/test` - Enviar email de prueba

## Docker Deployment

El proyecto incluye configuración para despliegue con:
- **Cloudflare Tunnel**: Acceso remoto sin abrir puertos (recomendado para 4G/routers)
- **Nginx Proxy Manager**: Reverse proxy con SSL automático

### Acceso remoto con Cloudflare

1. Crear tunnel en https://one.dash.cloudflare.com/
2. Añadir el token en `.env`
3. Reiniciar: `docker compose up -d`

No necesitas abrir puertos en el router - Cloudflare Tunnel crea una conexión saliente.

## Seguridad

- **Contraseñas seguras**: Validación obligatoria (8+ caracteres, mayúsculas, minúsculas, números, caracteres especiales)
- **Auto-cierre de sesión**: La sesión expira tras 5 minutos de inactividad
- **Contraseñas hasheadas**: SHA-256 + salt
- **Datos de usuario aislados**: Cada usuario solo ve sus datos + los compartidos con él
- **Tokens de autenticación**: En headers HTTP (no localStorage sin cifrar)
- **FAQs controladas**: Solo administradores pueden modificar contenido
- **`.env` excluido de Git**: Contienen claves sensibles

## Changelog

### v1.0.3 (Marzo 2026)
- **Diseño Mobile-First**: Interfaz completamente optimizada para dispositivos móviles
- **Mejoras de responsividad**: Mejor legibilidad y navegación en pantallas pequeñas
- **Arreglado**: Problema al editar FAQs en el panel de administración
- **Selector de idioma móvil**: Movido a posición inferior derecha para mejor acceso en móvil

### v1.0.2 (2025)
- **Lista de compra y Tareas separadas**: Menú del sidebar con botones independientes para lista de compra y tareas familiares
- **Presupuestos recurrentes**: Marca gastos fijos (alquiler, seguros) como recurrentes y cópialos fácilmente al mes siguiente
- **Importación de PDFs**: Sube facturas en PDF y extrae automáticamente concepto, cantidad y fecha
- **Eventos de varios días**: Añade fecha de fin a los eventos de la agenda
- **Sistema de sugerencias**: Los usuarios pueden enviar ideas, bugs o feedback que aparecen en el panel de administración
- **Traducción al portugués**: Nuevo idioma disponible además de español e inglés
- **Mejoras de seguridad**: Aislamiento de datos en endpoints de IA

### v1.0.1 (2025)
- Lista de la compra con productos y cantidades
- Tareas familiares con prioridades y fechas límite
- Notas con categorías
- FAQs editables por administradores
- Selector de idioma (Español/Inglés)
- Validación de contraseñas seguras
- Auto-cierre de sesión por inactividad
- Copias de seguridad (exportar/importar)

## Licencia

MIT
