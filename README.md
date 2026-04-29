# Family Agent

Aplicación web para la gestión de la economía familiar, agenda, tareas y planificación del hogar con sistema multi-usuario. Optimizada para dispositivos móviles.

## Tabla de Contenidos

1. [Características](#características)
2. [Estructura del Proyecto](#estructura-del-proyecto)
3. [Stack Tecnológico](#stack-tecnológico)
4. [Requisitos](#requisitos)
5. [Instalación y Ejecución](#instalación-y-ejecución)
   - [Desarrollo (sin Docker)](#desarrollo-sin-docker)
   - [Producción con Docker](#producción-con-docker)
6. [Configuración de Variables de Entorno](#configuración-de-variables-de-entorno)
7. [Primer Inicio](#primer-inicio)
8. [Páginas y Funcionalidades](#páginas-y-funcionalidades)
   - [Core Modules](#core-modules)
   - [Home Management](#home-management)
   - [Finance](#finance)
   - [Education](#education)
   - [Lifestyle](#lifestyle)
   - [System](#system)
9. [Sistema de Tareas Programadas](#sistema-de-tareas-programadas)
   - [Notificaciones por Email](#notificaciones-por-email)
   - [Backup Automático](#backup-automático)
10. [Seguridad](#seguridad)
11. [Compartir Datos entre Usuarios](#compartir-datos-entre-usuarios)
12. [Solución de Problemas](#solución-de-problemas)

---

## Características

### Gestión Familiar
- **Contabilidad familiar**: Registro de ingresos y gastos con importación desde Excel/CSV
- **Presupuestos mensuales**: Seguimiento de presupuestos por categoría con progreso visual
- **Agenda familiar**: Eventos con soporte para recurrencia (diario, semanal, mensual) y fechas de fin
- **Dashboard**: Resumen mensual, gráficos de evolución y presupuestos

### Módulo Hogar
- **Inventario del hogar**: Electrodomésticos, muebles y electrónica con fecha de compra, garantía y manual. Avisa cuando vence la garantía.
- **Mantenimiento del hogar**: Revisión caldera, filtros aire acondicionado, ITV del coche. Tareas recurrentes con recordatorio.
- **Gestor de suscripciones**: Netflix, Spotify, gimnasio, seguros. Control de gasto mensual/anual.

### Organización Familiar
- **Seguimiento de mascotas**: Vacunas, veterinario, alimentación, medicación.
- **Gestor de viajes**: Vuelos, hoteles, actividades, presupuesto del viaje, checklist de equipaje.

### Finanzas Familiares
- **Hucha digital**: Ahorro por objetivos con progress bar visual y motivador.
- **Deudas internas**: Control de quién debe dinero a quién en la familia.
- **Comparador de facturas**: Luz, agua, gas mes a mes. Detección automática de anomalías.

### Educación y Desarrollo
- **Biblioteca familiar**: Libros físicos y ebooks. Seguimiento de quién los tiene y quién los ha leído.
- **Gestor de extraescolares**: Horarios, pagos, contacto del profesor, material necesario.

### Tareas y Lista de la Compra
- **Múltiples listas de compra**: Crea diferentes listas con nombre y color
- **Tareas familiares**: Asignables a miembros de la familia con prioridades
- **Ordenación**: Por importancia (urgente, alta, normal, baja) y fecha

### Notas
- **Tableros múltiples**: Organiza notas en diferentes tableros con nombre y color
- **Notas editables**: Edita título, contenido, categoría y mover entre tableros
- **Vistas**: Vista lista o cuadrícula
- **Búsqueda**: Filtra notas por título o contenido

### Sistema Multi-Usuario
- **Datos aislados**: Cada usuario tiene sus propios datos
- **Primer usuario = administrador**: El primer usuario registrado se crea automáticamente como administrador
- **Compartir datos**: Invita a otros usuarios a ver tus datos familiares
- **Módulos habilitables**: Activa/desactiva módulos desde tu perfil o gestor de módulos
- **Gestor de módulos**: Arrastra y suelta para reordenar módulos activos

### Inteligencia Artificial
- **Chatbot IA**: Asistente con Groq (LLaMA 3.3) para analizar tus finanzas
- **Modo SQL rápido**: Consulta tus datos en lenguaje natural

### Extra
- **Planificación de comidas**: Gestiona recetas y planifica el menú semanal
- **Restaurantes favoritos**: Guarda tus restaurantes favoritos con valoración
- **Galería de fotos**: Álbum familiar para guardar momentos especiales
- **Cumpleaños**: Recordatorio de cumpleaños del mes
- **Inventario del hogar**: Electrodomésticos, muebles, electrónica con garantías
- **Mantenimiento del hogar**: Tareas recurrentes de mantenimiento
- **Suscripciones**: Control deNetflix, Spotify, gimnasio, seguros
- **Seguimiento de mascotas**: Vacunas, veterinario, medicación
- **Gestor de viajes**: Vuelos, hoteles, presupuesto, checklist
- **Biblioteca familiar**: Libros físicos y ebooks
- **Extraescolares**: Horarios, pagos, contacto profesor
- **Hucha digital**: Ahorro por objetivos
- **Deudas internas**: Control de deudas familiares
- **Comparador de facturas**: Luz, agua, gas
- **Diseño mobile-first**: Optimizado para móvil

---

## Estructura del Proyecto

```
family-agent/
├── backend/                 # Servidor Node.js + Express
│   ├── server.js           # Servidor principal (API, BD, tareas cron)
│   ├── package.json        # Dependencias del backend
│   ├── database/           # Base de datos SQLite (se crea automáticamente)
│   └── backups/            # Backups automáticos (se crea automáticamente)
│
├── frontend/               # Aplicación React + Vite
│   ├── src/
│   │   ├── pages/         # Páginas de la aplicación
│   │   ├── components/    # Componentes reutilizables
│   │   ├── store/         # Estado global (Zustand)
│   │   ├── utils/         # Utilidades (auth, format)
│   │   └── i18n/          # Traducciones
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── docker-compose.yml     # Configuración Docker
├── .env                   # Variables de entorno (NO committed)
├── .env.example          # Ejemplo de variables de entorno
├── family_agent.db       # Base de datos SQLite (se crea automáticamente)
└── README.md
```

---

## Stack Tecnológico

- **Frontend**: React + Vite + TypeScript + TailwindCSS + Zustand
- **Backend**: Node.js + Express + sql.js (SQLite en memoria con persistencia)
- **Docker**: Multi-container con Docker Compose
- **IA**: Groq API (LLaMA 3.3)
- **Email**: Nodemailer con SMTP Gmail
- **Tareas programadas**: node-cron

---

## Requisitos

- **Node.js** 18+ (para desarrollo)
- **Docker y Docker Compose** (para producción)
- **Git**
- **Clave API Groq** (gratuita en [console.groq.com](https://console.groq.com))
- **Cuenta Gmail** con contraseña de aplicación (para notificaciones email)

---

## Instalación y Ejecución

### Desarrollo (sin Docker)

Recomendado para desarrollo y pruebas.

#### 1. Clonar el repositorio

```bash
git clone https://github.com/Tuecho/family-agent.git
cd family-agent
```

#### 2. Instalar dependencias

```bash
# Instalar dependencias del backend
cd backend
npm install

# Instalar dependencias del frontend
cd ../frontend
npm install
```

#### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita el archivo `.env` y configura:

```env
# Clave API de Groq (obrigatoria para el chat IA)
GROQ_API_KEY=tu_api_key_de_groq

# Contraseña de aplicación Gmail (para notificaciones)
# Genera una en: https://myaccount.google.com/apppasswords
SMTP_PASSWORD=tu_contraseña_de_aplicacion_gmail
```

#### 4. Iniciar el backend

```bash
cd backend
npm start
```

El backend estará disponible en: http://localhost:3000

#### 5. Iniciar el frontend

En otra terminal:

```bash
cd frontend
npm run dev
```

La aplicación estará disponible en: http://localhost:5173

---

### Producción con Docker

#### 1. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus valores:

```env
GROQ_API_KEY=tu_api_key_de_groq
SMTP_PASSWORD=tu_contraseña_de_aplicacion_gmail
```

#### 2. Construir y ejecutar

```bash
docker compose up -d --build
```

La aplicación estará disponible en http://localhost:5173

#### 3. Ver logs

```bash
docker compose logs -f
```

#### 4. Detener

```bash
docker compose down
```

---

## Configuración de Variables de Entorno

| Variable | Descripción | Obligatoria |
|----------|-------------|-------------|
| `GROQ_API_KEY` | Clave API de Groq para el chatbot IA | Solo si usas IA |
| `SMTP_PASSWORD` | Contraseña de aplicación Gmail para enviar emails | Solo si usas notificaciones |
| `CLOUDFLARE_TUNNEL_TOKEN` | Token de Cloudflare Tunnel para acceso remoto | No |

### Cómo obtener la clave de Groq

1. Ve a https://console.groq.com
2. Crea una cuenta o inicia sesión
3. Genera una nueva API key
4. Copia la clave en tu `.env`

### Cómo configurar Gmail para notificaciones

1. Ve a https://myaccount.google.com/apppasswords
2. Inicia sesión con tu cuenta Gmail
3. Genera una contraseña de aplicación (nombre: "Family Agent")
4. Usa esa contraseña en `SMTP_PASSWORD`

---

## Primer Inicio

1. Accede a la aplicación en http://localhost:5173
2. Regístrate con un nombre de usuario y contraseña
3. **El primer usuario se convertirá automáticamente en administrador**
4. Completa tu perfil (nombre, nombre de familia, ciudad, etc.)
5. ¡Listo!

---

## Páginas y Funcionalidades

La aplicación cuenta con **41 páginas** organizadas en módulos temáticos.

### Core Modules (siempre visibles)

| Módulo | Descripción |
|--------|-------------|
| Dashboard | Resumen mensual con gráficos y estadísticas |
| Contabilidad | Gestión de ingresos y gastos |
| Presupuestos | Límites mensuales por categoría |
| Agenda | Eventos con soporte de recurrencia |
| Tareas Familiares | Tareas asignables con prioridades |
| Lista de Compra | Múltiples listas con colores |
| Notas | Tableros y notas organizadas |
| Cumpleaños | Recordatorio de cumpleaños |

### Home Management

| Módulo | Descripción |
|--------|-------------|
| Inventario del Hogar | Electrodomésticos con garantías y manuales |
| Mantenimiento del Hogar | Tareas recurrentes (caldera, ITV, filtros) |
| Gestor de Suscripciones | Control de Netflix, Spotify, gimnasio... |
| Seguimiento de Mascotas | Vacunas, veterinario, medicación |

### Finance

| Módulo | Descripción |
|--------|-------------|
| Hucha Digital | Ahorro por objetivos con progreso visual |
| Deudas Internas | Control de préstamos entre miembros |
| Comparador de Facturas | Luz, agua, gas con detección de anomalías |

### Education

| Módulo | Descripción |
|--------|-------------|
| Biblioteca Familiar | Libros físicos y ebooks con seguimiento |
| Extraescolares | Horarios, pagos, material necesario |

### Lifestyle

| Módulo | Descripción |
|--------|-------------|
| Seguimiento de Hábitos | Hábitos diarios/semanales con rachas |
| Horas de Trabajo | Control de turnos y objetivos |
| Planificación de Comidas | Recetas y menú semanal |
| Gestor de Viajes | Viajes con checklist de equipaje |
| Lugares de Interés | Sitios para visitar |
| Restaurantes Favoritos | Valoración y notas |
| Galería Familiar | Álbumes de fotos |
| Aniversarios | Fechas especiales |
| Regalos | Seguimiento de regalos |

### System

| Módulo | Descripción |
|--------|-------------|
| Perfil | Configuración, notificaciones, idioma |
| Premium | Galería, contactos, libros/películas |
| Chat IA | Asistente con Groq (LLaMA 3.3) |
| Gestor de Módulos | Activar/desactivar y reordenar |
| Panel Admin | Gestión de usuarios e invitaciones |

---

### Dashboard

Página principal con resumen familiar:

- **Balance del mes**: Ingresos, gastos y balance con gráfico donut
- **Evolución (6 meses)**: Gráfico de tendencia
- **Eventos de hoy/mañana**: Próximos eventos
- **Tareas urgentes**: Las 5 más importantes
- **Presupuestos**: Estado de gastos
- **Cumpleaños**: Próximos del mes
- **Cita motivacional**: Frase diaria

### Notificaciones por Email

El backend incluye tareas programadas usando `node-cron`:


**Ubicación**: `backend/server.js` líneas 4892-5089

**Función principal**: `runDailyNotification()`

**Configuración**:
- Se ejecuta cada minuto
- Envía email solo cuando la hora local del usuario coincide con `notify_time`
- Por defecto: 22:00 (10 PM)

**Contenido del email**:
1. Saludo: "¡Hola familia [nombre]!"
2. Frase motivacional del día
3. Eventos de la próxima semana
4. Tareas pendientes (todas excepto lista de compra)
5. Estado de presupuestos
6. Comidas planificadas para mañana
7. Cumpleaños del mes

**Configuración del usuario** (tabla `notification_settings`):
- `email_enabled`: Activar/desactivar (0/1)
- `email_to`: Destinatario del email
- `smtp_host`: Servidor SMTP (por defecto smtp.gmail.com)
- `smtp_port`: Puerto SMTP (por defecto 587)
- `smtp_user`: Usuario SMTP (tu email)
- `smtp_password`: Contraseña de aplicación Gmail
- `notify_time`: Hora de envío (formato HH:MM, ej: "22:00")
- `notify_timezone`: Zona horaria (por defecto Europe/Madrid)
- `notify_events`: Incluir eventos (0/1)
- `notify_tasks`: Incluir tareas (0/1)
- `notify_budgets`: Incluir presupuestos (0/1)
- `notify_meals`: Incluir comidas (0/1)
- `notify_birthdays`: Incluir cumpleaños (0/1)

**API endpoints**:
- GET `/api/notifications/settings` - Obtener configuración
- POST `/api/notifications/settings` - Guardar configuración
- POST `/api/notifications/test` - Enviar email de prueba

### Backup Automático

**Ubicación**: `backend/server.js` líneas 5437-5480

**Función**: `scheduleBackup()`

**Configuración**:
- Se ejecuta a las 3:00 AM todos los días (`0 3 * * *`)
- Guarda en: `backend/backups/`
- Nombre: `family_agent_backup_YYYY-MM-DDTHH-MM-SS-msZ.db`
- Mantiene los últimos 7 backups (más antiguos se eliminan automáticamente)

**Ruta completa de backups**:
```
/ruta/a/family-agent/backend/backups/
```

---

## Seguridad

- **Contraseñas seguras**: Validación obligatoria (8+ caracteres, mayúsculas, minúsculas, números)
- **Auto-cierre de sesión**: La sesión expira tras 5 minutos de inactividad
- **Contraseñas hasheadas**: SHA-256 + salt
- **Datos de usuario aislados**: Cada usuario solo ve sus datos + los compartidos
- **`.env` excluido de Git**: Contiene claves sensibles
- **Validación de permisos**: Verificación de acceso a datos compartidos

---

## Compartir Datos entre Usuarios

Los usuarios pueden compartir sus datos con familiares:

1. Ve a **Perfil** → **Compartir datos**
2. Selecciona qué quieres compartir:
   - Dashboard, Contabilidad, Presupuestos, Agenda, Tareas, Notas
   - Shopping, Contacts, Recipes, Restaurants, Gallery
   - Habits, Home Inventory, Maintenance, Subscriptions
   - Pet Tracker, Travel, Savings Goals, Debts, Bills
   - Library, Extra School, Places, Anniversaries, Work Hours
3. Selecciona el usuario con quien compartir
4. El usuario receptor verá los datos compartidos en su instalación

---

## Solución de Problemas

### No llegan las notificaciones por email

1. Verifica que tienes `SMTP_PASSWORD` en `.env`
2. Comprueba que el email está habilitado en Perfil → Notificaciones
3. Revisa la contraseña de aplicación de Gmail (no es tu contraseña normal)
4. Verifica la hora de notificación configurada

### No se ven los eventos compartidos

1. Asegúrate de que los eventos están compartidos desde Perfil → Compartir datos
2. Verifica que tienes permisos de visualización

### El chat IA no responde

1. Verifica que tienes `GROQ_API_KEY` en `.env`
2. Comprueba que la API key es válida en console.groq.com

### Error de conexión con el backend

1. Asegúrate de que el backend está ejecutándose (`npm start` en backend/)
2. Verifica que el frontend está configurado para conectarse a localhost:3000

### Los cambios no se reflejan

1. Si usas Docker: `docker compose down && docker compose up -d --build`
2. Si usas desarrollo: Reinicia el servidor (`Ctrl+C` y `npm start`)

---

## Changelog

### v1.0.9 (Abril 2026)
- Módulo de Horas de Trabajo corregido:
  - Botón para resetear horas acumuladas
  - Meta semanal configurable manualmente (dejar en 0 para cálculo automático)
  - Corrección: las horas acumuladas ahora se calculan correctamente (solo una vez por semana)
  - Mostrar meta semanal en la UI
  - Cálculo automático: horas_diarias × días_laborales (por defecto 2h × 5 días = 10h)

### v1.0.8 (Abril 2026)
- Dashboard siempre visible (no se puede desactivar)
- 8 módulos activos por defecto: Dashboard, Agenda, Contabilidad, Cumpleaños, Hábitos, Lista Compra, Notas, Tareas
- Arrastrar y soltar para reordenar módulos
- Diseño de módulos en 3 columnas en escritorio
- Botón de cerrar sesión más accesible en móvil
- Backup incluye todos los nuevos módulos
- Nueva página de Módulos en el menú lateral
- Módulo de Seguimiento de Hábitos completo
- Módulo de Horas de Trabajo
- Módulo de Lugares de Interés
- Módulo de Organización Familiar
- Notificaciones push web (web-push)
- Mejoras en la importación de datos

### v1.0.7 (Abril 2026)
- Módulo Hogar: Inventario del hogar con garantías y manuales
- Módulo Hogar: Mantenimiento del hogar (caldera, filtros A/C, ITV)
- Módulo Hogar: Gestor de suscripciones (Netflix, Spotify, gimnasio...)
- Módulo Organización: Seguimiento de mascotas (vacunas, veterinario)
- Módulo Organización: Gestor de viajes y vacaciones
- Módulo Finanzas: Hucha digital / ahorro por objetivos
- Módulo Finanzas: Control de deudas internas familiares
- Módulo Finanzas: Comparador de facturas (luz, agua, gas)
- Módulo Educación: Biblioteca familiar (libros físicos y ebooks)
- Módulo Educación: Gestor de extraescolares
- Sistema de módulos habilitables desde el perfil
- Módulos disponibles: Mascotas, Educación, Cumpleaños, Contabilidad, Presupuestos

### v2.0.0 (Marzo 2026)
- Galería de Fotos Familiar
- Contactos Familiares
- Chat IA integrado
- Gestión de Recetas
- Planificación Semanal de Comidas
- Mejoras en compartir datos
- Importación de conceptos desde CSV

### v1.0.6 (Marzo 2026)
- Fix: Error al actualizar perfil
- Lista de usuarios para compartir
- Compartición de restaurantes y notas
- Backup completo en JSON y .db
- UI móvil mejorada

### Versiones anteriores
Ver historial completo en el archivo original de GitHub.

---

## Licencia

MIT

---

## Contribuir

1. Fork del repositorio
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de tus cambios (`git commit -am 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crea un Pull Request
