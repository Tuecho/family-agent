# Family Agent

Aplicación web para la gestión de la economía familiar, agenda y planificación del hogar con sistema multi-usuario. Optimizada para dispositivos móviles.

## Características

### Gestión Familiar
- **Contabilidad familiar**: Registro de ingresos y gastos con importación desde Excel/CSV
- **Presupuestos mensuales**: Seguimiento de presupuestos por categoría con progreso visual
- **Agenda familiar**: Eventos con soporte para recurrencia (diario, semanal, mensual) y fechas de fin (eventos de varios días)
- **Dashboard**: Gráficos de evolución mensual con resumen del mes y presupuestos

### Tareas y Lista de la Compra
- **Lista de la Compra**: Productos con cantidad, marcar al comprar, sección de comprados
- **Tareas Familiares**: Tareas con prioridades (Alta/Media/Normal) y fechas límite
- **Menú separado**: Lista de compra y tareas familiares en botones separados del sidebar
- **Compartir listas**: Envía tu lista por WhatsApp, Telegram, Email, Facebook o X

### Notas
- **Notas rápidas**: Apunta información importante
- **Categorías**: General, Trabajo, Familia, Personal, Importante
- **Búsqueda**: Filtra notas por título o contenido

### Sistema Multi-Usuario
- **Datos aislados**: Cada usuario tiene sus propios datos (transacciones, presupuestos, eventos, tareas, notas)
- **Primer usuario = administrador**: El primer usuario registrado se crea automáticamente como administrador
- **Compartir datos**: Invita a otros usuarios a ver tus datos familiares
- **Panel de administración**: Gestiona usuarios, FAQs y sugerencias

### Importación
- **Excel/CSV**: Importa transacciones desde archivos .xlsx, .xls o .csv
- **PDF**: Sube facturas y extrae automáticamente concepto, cantidad y fecha
- **Base de datos**: Importa backups completos .db (solo administradores)

### Sugerencias
- **Enviar ideas**: Los usuarios pueden enviar sugerencias de mejoras, reportar bugs o dar feedback
- **Panel de administración**: Los administradores ven y gestionan todas las sugerencias

### Inteligencia Artificial
- **Chatbot IA**: Asistente con Groq (LLaMA 3.3) para analizar tus finanzas
- **Modo SQL rápido**: Consulta tus datos en lenguaje natural

### Internacionalización
- **Multiidioma**: Selector de idioma (Español, English, Português)

### Extra
- **FAQ**: Preguntas frecuentes editables por admins
- **Acerca de**: Información de la app, sugerencias y compartir
- **Diseño mobile-first**: Optimizado para móvil con escritorio mejorado

## Stack Tecnológico

- **Frontend**: React + Vite + TypeScript + TailwindCSS
- **Backend**: Node.js + Express + sql.js (SQLite persistente)
- **Docker**: Multi-container con Docker Compose
- **IA**: Groq API (LLaMA 3.3)

## Requisitos

- Docker y Docker Compose
- Clave API Groq (gratuita en [console.groq.com](https://console.groq.com))

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

Edita `.env` y añade tu clave de Groq:

```env
GROQ_API_KEY=tu_api_key_de_groq
```

### 3. Iniciar con Docker

```bash
docker compose up -d
```

La aplicación estará disponible en:
- Frontend: http://localhost:5173
- API: http://localhost:3000

## Primer inicio

1. Accede a la aplicación en http://localhost:5173
2. Regístrate con un nombre de usuario
3. **Ese primer usuario se convertirá automáticamente en administrador**
4. ¡Listo!

## Seguridad

- **Contraseñas seguras**: Validación obligatoria (8+ caracteres, mayúsculas, minúsculas, números)
- **Auto-cierre de sesión**: La sesión expira tras 5 minutos de inactividad
- **Contraseñas hasheadas**: SHA-256 + salt
- **Datos de usuario aislados**: Cada usuario solo ve sus datos + los compartidos
- **`.env` excluido de Git**: Contiene claves sensibles

## Changelog

### v1.0.4 (Marzo 2026)
- **Importar CSV**: Soporte para archivos .csv además de Excel
- **Botones compartir**: WhatsApp, Telegram, Facebook y X
- **Importar DB**: Subir backups .db con barra de progreso
- **Filtro meses**: Mejorado en contabilidad
- **Primer usuario = admin**: Registro automático como administrador
- **Repetición eventos**: Diario, semanal y mensual
- **Arreglado**: Problema de autenticación con usuarios activos

### v1.0.3 (Marzo 2026)
- **Diseño Mobile-First**: Interfaz completamente optimizada para dispositivos móviles
- **FAQ arreglado**: Ya se guardan las ediciones correctamente
- **Repetición de eventos**: Añadido soporte para diario, semanal y mensual
- **Importar CSV**: Soporte para archivos .csv además de Excel
- **Botones compartir**: WhatsApp, Telegram, Facebook y X en "Acerca de"
- **Barra de progreso**: Al importar bases de datos .db
- **Primer usuario = admin**: El primer registro se crea automáticamente como administrador

### v1.0.2 (Marzo 2026)
- Lista de compra y tareas separadas en el menú
- Presupuestos recurrentes
- Eventos de varios días
- Importación de PDFs
- Sistema de sugerencias
- Portugués añadido

## Licencia

MIT
