# Family Agent

Aplicación web para la gestión de la economía familiar, agenda y planificación del hogar con sistema multi-usuario. Optimizada para dispositivos móviles.

## Características

### Gestión Familiar
- **Contabilidad familiar**: Registro de ingresos y gastos con importación desde Excel/CSV
- **Presupuestos mensuales**: Seguimiento de presupuestos por categoría con progreso visual
- **Agenda familiar**: Eventos con soporte para recurrencia (diario, semanal, mensual) y fechas de fin (eventos de varios días)
- **Dashboard**: Gráficos de evolución mensual con resumen del mes y presupuestos

### Tareas y Lista de la Compra
- **Múltiples listas de compra**: Crea diferentes listas con nombre y color (ej: "Mercadona", "Compras semana")
- **Editar/eliminar listas**: Botones visibles en cada pestaña para modificar o borrar
- **Productos editables**: Modifica nombre, cantidad y mover entre listas
- **Tareas Familiares editables**: Cambia título, descripción, fecha y prioridad
- **Menú separado**: Lista de compra y tareas familiares en botones separados del sidebar
- **Compartir listas**: Envía tu lista por WhatsApp, Telegram, Email, Facebook o X

### Notas
- **Tableros múltiples**: Organiza notas en diferentes tableros con nombre y color
- **Notas editables**: Edita título, contenido, categoría y mover entre tableros
- **Vistas**: Vista lista o cuadrícula
- **Categorías**: General, Trabajo, Familia, Personal, Importante + personalizadas
- **Búsqueda**: Filtra notas por título o contenido
- **Compartir notas**: Por WhatsApp, Telegram o copiar al portapapeles

### Sistema Multi-Usuario
- **Datos aislados**: Cada usuario tiene sus propios datos (transacciones, presupuestos, eventos, tareas, notas)
- **Primer usuario = administrador**: El primer usuario registrado se crea automáticamente como administrador
- **Compartir datos**: Invita a otros usuarios a ver tus datos familiares
- **Panel de administración**: Gestiona usuarios, FAQs, sugerencias y configuración de login
- **Personalizar login**: Cambia la imagen de login y muestra/oculta el icono del candado

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
- **Modo avanzado**: Usa IA generativa con Groq para preguntas complejas

### Extra
- **Planificación de comidas**: Gestiona recetas y planifica el menú semanal
- **Restaurantes favoritos**: Guarda tus restaurantes favoritos con valoración
- **Galería de fotos**: Álbum familiar para guardar momentos especiales
- **Premium**: Contactos familiares, Chat IA y ventas
- **Recordar posición**: Al recargar la app se mantiene en la misma página
- **Widget chat oculto**: El widget flotante se oculta automáticamente en la página de Chat IA
- **Recuperar contraseña**: Sistema de recuperación por código que caduca en 15 minutos
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

### v1.0.6 (Marzo 2026)
- **Fix: Error al actualizar perfil**: Corregido problema que impedía a usuarios normales actualizar su perfil
- **Lista de usuarios para compartir**: Al compartir datos, ahora se muestra una lista desplegable con los usuarios disponibles
- **Compartición de restaurantes y notas**: Restaurantes favoritos y tableros de notas ahora se comparten correctamente entre usuarios
- **Backup completo**: El backup (JSON y .db) ahora incluye todas las tablas: contactos, recetas, restaurantes, galeria, planificador de comidas, etc.
- **UI móvil mejorada**: Planificación de comidas optimizada para dispositivos móviles con vista de tarjetas por día

### v2.0.0 (Marzo 2026)

#### Nuevas Funcionalidades

**Premium (Sección mejorada)**
- **Galería de Fotos Familiar**: Nueva sección para guardar los mejores momentos de tu familia
  - Álbumes para organizar fotos
  - Subir fotos desde el dispositivo
  - Vista en pantalla completa (lightbox)
  - Eliminar fotos
- **Contactos Familiares**: Gestión de contactos importables desde CSV
- **Chat IA**: Asistente conversacional integrado en Premium
- **Ventas**: Formulario de contacto comercial

**Contabilidad y Presupuestos**
- **Gestión de Conceptos**: Crear, editar y eliminar conceptos directamente desde Contabilidad
- **Importar Conceptos desde CSV**: Añade múltiples conceptos de una vez desde un archivo
- Los conceptos se comparten entre Contabilidad y Presupuestos

**Tareas Familiares**
- **Asignar a miembro**: Ahora puedes asignar tareas a cualquier miembro de la familia
- Incluye opción "Yo" (usuario actual) y familiares con quienes compartes datos

**Panel de Administración**
- **Backup y Restauración**: Ahora incluye formato JSON además de .db
- **Backup JSON**: Descargar todos los datos en formato JSON
- **Restaurar JSON**: Importar datos desde archivo JSON
- **Zona de Peligro mejorada**: Diseño más limpio y profesional
- **Backup/Restauración movidos**: Funciones movidas desde Perfil al Panel de Administración

**Planificación de Comidas**
- **Gestión de Recetas**: Crea y organiza tus recetas familiares
  - Categorías: Principal, Aperitivo, Postre, Bebida, Desayuno
  - Tiempos de preparación y cocción
  - Restricciones alimentarias: Vegetariano, Vegano, Sin gluten, Sin lactosa
  - Ingredientes y instrucciones
- **Planificación Semanal**: Organiza las comidas de la semana
  - Arrastra y suelta recetas en el calendario
  - Vista por días y tipos de comida

**Mejoras del Sidebar**
- Menú Premium expandible con submenú: Galería, Contactos, Chat IA, Ventas
- Navegación más organizada para funciones premium

#### Cambios Técnicos
- Tablas de base de datos: `family_gallery`, `recipes`, `meal_plans`
- Endpoints API para galería de fotos y recetas
- Importación de conceptos en CSV para Contabilidad y Presupuestos

### v1.0.5 (Marzo 2026)
- **Múltiples listas de compra**: Crea, edita y elimina listas con nombre y color personalizado
- **Múltiples tableros de notas**: Organiza tus notas en diferentes tableros con colores
- **Notas editables**: Edita título, contenido, categoría y mueve entre tableros
- **Tareas familiares editables**: Modifica título, descripción, fecha límite y prioridad
- **Recordar última página**: Al recargar la app se mantiene en la misma sección
- **Widget chat oculto**: Se oculta automáticamente al entrar en la página de Chat IA
- **Mejorada UI de listas**: Botones de editar/eliminar visibles en las pestañas
- **Personalizar login**: Administradores pueden cambiar la imagen de login y mostrar/ocultar el candado
- **Recuperar contraseña**: Sistema de recuperación por código que caduca en 15 minutos

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
