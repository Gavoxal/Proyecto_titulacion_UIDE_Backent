# API Titulación - Sistema de Gestión UIDE

Backend completo para el Sistema de Gestión de Titulación de la UIDE. Incluye API REST con Fastify, esquema de base de datos normalizado, y servidor MCP para integración con IA.

---

## 🗄️ Base de Datos v5 (Última Actualización)

### Migración Completa a Esquema v5

Se realizó una refactorización completa del esquema de base de datos para mejorar normalización, escalabilidad y flexibilidad.

#### 📊 Cambios Principales

**1. Áreas de Conocimiento (Nuevo Catálogo)**
- **Antes:** Campo ENUM `area_investigacion` en propuestas
- **Ahora:** Tabla `areas_conocimiento` con relación FK
- **Beneficio:** Flexibilidad para agregar/modificar áreas sin cambiar código

```sql
CREATE TABLE areas_conocimiento (
    id INT PRIMARY KEY AUTO_INCREMENT,
    codigo VARCHAR(50) UNIQUE,
    nombre VARCHAR(191),
    descripcion TEXT
);
```

Áreas disponibles:
- **CDIA** - Ciencia de Datos e Inteligencia Artificial
- **GITD** - Gestión de la Información y Transformación Digital
- **ITIC** - Infraestructura TI y Ciberseguridad
- **IEET** - Innovación, Emprendimiento y Ética Tecnológica
- **PDS** - Programación y Desarrollo de Software

**2. Sistema de Prerrequisitos Normalizado**
- **Antes:** Tabla única `prerequisitos` con datos redundantes
- **Ahora:** Dos tablas separadas:
  - `catalogo_prerequisitos` - Catálogo maestro de requisitos
  - `estudiante_prerequisitos` - Cumplimiento por estudiante
- **Beneficio:** Eliminación de redundancia, fácil agregar nuevos requisitos

**3. Relaciones Simplificadas**
- `actividades` → vinculación directa a `propuestas` (eliminado campo `usuarios_id`)
- `comite` → vinculación directa a `propuestas` (renombrado FK)
- Estandarización de nombres de columnas a `snake_case`

**4. Normalización de IDs**
- Todos los IDs primarios ahora se llaman `id` (antes: `idActividades`, `idComentarios`, etc.)
- FKs estandarizadas: `usuario_id`, `actividad_id`, `evidencia_id`, `propuesta_id`

---

## 🔄 Migración de Base de Datos

### Archivo SQL Completo
El archivo `base de datos v5.sql` contiene:
- ✅ Creación de todas las tablas con el nuevo esquema
- ✅ Datos iniciales (áreas de conocimiento, prerrequisitos)
- ✅ Usuario administrador por defecto
- ✅ Vistas de seguridad para MCP

### Pasos para Migrar

```bash
# 1. Crear nueva base de datos
mysql -u root -p -e "CREATE DATABASE titulacion_v5;"

# 2. Importar esquema v5
mysql -u root -p titulacion_v5 < "base de datos v5.sql"

# 3. Actualizar .env
DATABASE_URL="mysql://root:password@localhost:3306/titulacion_v5"

# 4. Regenerar Prisma Client
npx prisma generate
```

---

## 🚀 Actualizaciones Recientes

### ✨ Backend Adaptado a v5 (Febrero 2026)

**Prisma Schema Actualizado:**
- ✅ 3 nuevos modelos: `AreaConocimiento`, `CatalogoPrerequisito`, `EstudiantePrerequisito`
- ✅ 7 modelos actualizados con nuevas relaciones y nombres de columnas
- ✅ Todas las relaciones FK corregidas

**Controllers Refactorizados:**
- ✅ `prerequisito.controller.ts` - Refactorización completa con 9 endpoints
- ✅ `propuesta.controller.ts` - Uso de `areaConocimientoId` en lugar de ENUM
- ✅ `actividad.controller.ts` - Vinculación directa a propuestas
- ✅ `comentario.controller.ts` - Columnas renombradas

**Nuevos Endpoints:**

```typescript
// Catálogo de Prerrequisitos (Admin)
GET    /prerequisitos/catalogo
POST   /prerequisitos/catalogo

// Cumplimiento de Estudiantes
POST   /prerequisitos                    // Subir evidencia
GET    /prerequisitos                    // Ver cumplimientos
PUT    /prerequisitos/:id/validate       // Validar (Director)
DELETE /prerequisitos/:id

// Dashboard y Validación
GET    /prerequisitos/dashboard          // Dashboard completo (Director)
GET    /prerequisitos/check              // Verificar si puede crear propuesta

// Áreas de Conocimiento
GET    /areas-conocimiento               // Listar áreas disponibles
```

### 🔐 MCP con Autenticación (Enero 2026)

**Sistema de Autenticación de 2 Pasos:**
1. `solicitar_codigo(email)` - Envía código de 6 dígitos al correo
2. `verificar_codigo(email, codigo)` - Retorna token JWT de sesión
3. Todas las herramientas requieren `auth_token` válido

**Tabla de Autenticación MCP:**
```sql
CREATE TABLE mcp_auth (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(191) UNIQUE,
    codigo VARCHAR(6),
    token VARCHAR(500),
    expira_codigo DATETIME,
    expira_token DATETIME
);
```

**Seguridad RLS (Row-Level Security):**
- Usuario restringido: `mcp_agent` (solo lectura)
- Vista segura: `v_usuarios_rls`
- Filtrado dinámico basado en rol autenticado

### 📊 Lógica de Negocio Implementada

**Validación de Prerrequisitos:**
- ❌ Bloqueo de creación de propuestas si faltan prerrequisitos
- ✅ Validación dinámica contra catálogo activo
- 📊 Dashboard pivoteado para directores

**Diferenciación de Actividades:**
- `DOCENCIA` - Tareas de clase
- `TUTORIA` - Retroalimentación de tesis
- `INVESTIGACION` - Actividades de investigación

**Importación Inteligente de Estudiantes:**
- Detección automática de fila de encabezados en Excel
- Separación automática de "Nombre Completo" en Nombres/Apellidos
- Manejo robusto de filas vacías y títulos

---

## 🛠️ Configuración e Instalación

### Prerrequisitos
- Node.js v18+
- MySQL 8.0+
- npm o yarn

### Instalación

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd api_titulacion

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 4. Crear base de datos
mysql -u root -p -e "CREATE DATABASE titulacion_v5;"

# 5. Importar esquema
mysql -u root -p titulacion_v5 < "base de datos v5.sql"

# 6. Generar Prisma Client
npx prisma generate

# 7. (Opcional) Setup de seguridad MCP
node scripts/setup_rls.js
```

### Variables de Entorno (.env)

```env
# Base de Datos
DATABASE_URL="mysql://root:password@localhost:3306/titulacion_v5"

# JWT
JWT_SECRET="tu-secreto-super-seguro-aqui"

# Email (para códigos MCP)
EMAIL_USER="tu-email@gmail.com"
EMAIL_PASS="tu-app-password"

# Servidor
PORT=3000
HOST="0.0.0.0"
```

### Ejecución

```bash
# Modo desarrollo (con hot-reload)
npm run dev

# Servidor MCP (manual)
npm run mcp

# Producción
npm start
```

---

## 🤖 Integración con Claude Desktop (MCP)

Para usar las herramientas de este proyecto en Claude Desktop:

**1. Ubicar archivo de configuración:**
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`

**2. Agregar servidor MCP:**

```json
{
  "mcpServers": {
    "api-titulacion": {
      "command": "node",
      "args": [
        "C:\\ruta\\absoluta\\api_titulacion\\src\\mcp-server.js"
      ]
    }
  }
}
```

**3. Reiniciar Claude Desktop**

**4. Uso en Claude:**

```
Usuario: Necesito ver la lista de usuarios del sistema
Claude: [Solicita código de autenticación]
Usuario: Mi email es director@uide.edu.ec
Claude: [Envía código por email]
Usuario: El código es 123456
Claude: [Autentica y muestra usuarios según rol]
```

---

## 📚 Estructura del Proyecto

```
api_titulacion/
├── prisma/
│   └── schema.prisma           # Schema de Prisma (v5)
├── scripts/
│   ├── setup_rls.js            # Setup de seguridad RLS
│   └── debug_user.ts           # Script de debug
├── src/
│   ├── controllers/            # Controladores de endpoints
│   │   ├── auth.controller.ts
│   │   ├── propuesta.controller.ts
│   │   ├── prerequisito.controller.ts
│   │   ├── actividad.controller.ts
│   │   ├── comentario.controller.ts
│   │   └── estudiante.controller.ts
│   ├── routes/                 # Definición de rutas
│   ├── services/               # Lógica de negocio
│   │   └── email.service.js
│   ├── utils/                  # Utilidades
│   │   ├── jwt.ts
│   │   └── password.ts
│   ├── mcp-server.js           # Servidor MCP
│   └── app.ts                  # Aplicación principal
├── base de datos v5.sql        # Schema SQL completo
├── .env                        # Variables de entorno
├── package.json
└── README.md
```

---

## 🔌 API Endpoints Principales

### Autenticación
```
POST   /auth/login              # Login con email/password
POST   /auth/register           # Registro de usuario
```

### Propuestas
```
GET    /propuestas              # Listar propuestas (filtrado por rol)
POST   /propuestas              # Crear propuesta (requiere prerrequisitos)
GET    /propuestas/:id          # Ver detalle
PUT    /propuestas/:id          # Actualizar
DELETE /propuestas/:id          # Eliminar
PUT    /propuestas/:id/estado   # Cambiar estado (Director)
```

### Prerrequisitos
```
GET    /prerequisitos/catalogo  # Ver catálogo
POST   /prerequisitos/catalogo  # Crear requisito (Admin)
POST   /prerequisitos           # Subir evidencia
GET    /prerequisitos           # Ver cumplimientos
PUT    /prerequisitos/:id/validate  # Validar (Director)
GET    /prerequisitos/dashboard # Dashboard completo
GET    /prerequisitos/check     # Verificar acceso
```

### Actividades
```
GET    /actividades/propuesta/:id  # Por propuesta
POST   /actividades                # Crear actividad
GET    /actividades/:id            # Ver detalle
PUT    /actividades/:id            # Actualizar
DELETE /actividades/:id            # Eliminar
```

### Evidencias
```
POST   /actividades/:id/evidencias       # Subir evidencia
GET    /evidencias/:id                   # Ver detalle
PUT    /evidencias/:id                   # Actualizar
DELETE /evidencias/:id                   # Eliminar
PUT    /evidencias/:id/calificar         # Calificar (Tutor)
```

### Estudiantes
```
GET    /estudiantes             # Listar estudiantes
POST   /estudiantes/import      # Importar desde Excel
GET    /estudiantes/:id         # Ver perfil completo
```

---

## 🔒 Control de Acceso (RBAC)

### Roles Disponibles
- **ESTUDIANTE** - Crear propuestas, subir evidencias, ver sus datos
- **TUTOR** - Ver estudiantes asignados, calificar evidencias, crear actividades
- **DIRECTOR** - Acceso completo, validar prerrequisitos, asignar tutores
- **COORDINADOR** - Similar a Director
- **COMITE** - Calificar defensas

### Middleware de Autorización

```typescript
// Ejemplo de uso en rutas
fastify.get('/prerequisitos/dashboard', {
    preHandler: [
        fastify.authenticate,
        fastify.authorize(['DIRECTOR', 'COORDINADOR'])
    ]
}, getPrerequisitosDashboard);
```

---

## 📖 Documentación API

### Swagger UI
Acceder a la documentación interactiva en:
```
http://localhost:3000/documentation
```

### Postman Collection
Importar la colección desde `/docs/postman_collection.json`

---

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests con cobertura
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

---

## 📝 Notas de Desarrollo

### Seguridad
- ✅ Contraseñas hasheadas con bcrypt
- ✅ Autenticación JWT
- ✅ CORS configurado
- ✅ Validación de inputs con Ajv
- ⚠️ En producción: mover secretos a variables de entorno

### Prisma
- Ejecutar `npx prisma generate` después de cambios en schema
- Usar `npx prisma studio` para explorar datos visualmente
- Migraciones: `npx prisma migrate dev`

### MCP
- El servidor MCP corre en proceso separado
- Logs en `console.error()` para debugging (no interfiere con JSON-RPC)
- Tokens expiran en 24 horas

---

## 🐛 Troubleshooting

### Error: "Cannot find module '@prisma/client'"
```bash
npx prisma generate
```

### Error: "Access denied for user 'mcp_agent'"
```bash
node scripts/setup_rls.js
```

### Error: "Port 3000 already in use"
```bash
# Cambiar PORT en .env
PORT=3001
```

### Prisma Client desactualizado
```bash
# Después de cambios en schema.prisma
npx prisma generate
```

---

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

---

## 📄 Licencia

Este proyecto es privado y propiedad de la Universidad Internacional del Ecuador (UIDE).

---

## 👥 Autores

- **Equipo de Desarrollo** - Sistema de Titulación UIDE
- **Fecha:** Febrero 2026
- **Versión:** 5.0.0

---

## 📞 Soporte

Para reportar problemas o solicitar ayuda:
- Email: soporte.titulacion@uide.edu.ec
- Issues: [GitHub Issues](link-al-repo)
