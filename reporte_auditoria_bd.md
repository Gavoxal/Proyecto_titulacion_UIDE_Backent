# Auditoría de Base de Datos y Schema (Prisma)

Este documento detalla el análisis del archivo `schema.prisma` para el proyecto de Titulación, identificando puntos fuertes, riesgos y recomendaciones para un entorno de producción.

## 1. Análisis de Normalización y Estructura

### ✅ Puntos Fuertes
*   **Separación Usuario/Auth:** Es una excelente práctica de seguridad. Desacopla la identidad (quién eres) de las credenciales (cómo entras), facilitando futuras integraciones (SSO, OAuth).
*   **Perfil Estudiante Separado:** La tabla `Estudiante` evita que la tabla `Usuario` sea "sparsa" (llena de nulos) para usuarios administrativos.
*   **Uso de Enums:** `Rol`, `EstadoPropuesta`, `TipoActividad` garantizan integridad de datos a nivel de aplicación.

### ⚠️ Riesgo: "Solo un Docente de Integración"
El usuario indicó que **solo habrá un Docente de Integración**.
*   **Estado Actual:** No existe un campo `docenteId` en la tabla `Propuesta` o `Estudiante`. El sistema asume que cualquiera con el rol `DOCENTE_INTEGRACION` puede ver todo.
*   **Riesgo:** Si a futuro la universidad abre un "Paralelo B" con otro profesor, el sistema colapsará porque ambos profesores verían a todos los estudiantes mezclados.
*   **Recomendación:** Aunque hoy sea solo uno, **es técnicamente más seguro agregar `docente_asignado_id`** en el futuro. Por ahora, el sistema funcionará bajo la premisa "Global View" (Ver todos los registros).

## 2. Integridad Referencial (`onDelete`)

Actualmente, el esquema **carece de definiciones explícitas de cascada (`onDelete: Cascade`)**. Esto es crítico en producción.

| Relación Riesgosa | Problema Potencial | Recomendación |
| :--- | :--- | :--- |
| `Usuario` -> `Propuesta` | ¿Si se borra un estudiante, qué pasa con su propuesta? Hoy dará error de FK. | Agregar `onDelete: Cascade` o `SetNull`. |
| `Propuesta` -> `Actividad` | Si se elimina una propuesta, las actividades quedan huérfanas o bloquean el borrado. | **URGENTE:** Agregar `onDelete: Cascade`. |
| `Actividad` -> `Evidencia` | Evidencias zombis si se borra la actividad. | **URGENTE:** Agregar `onDelete: Cascade`. |

## 3. Tipos de Datos y Performance

*   **`Decimal(4,2)` para Calificaciones:** Permite valores como `10.00`. Es correcto.
*   **`VarChar(191)` en MySQL:** Es el estándar para compatibilidad con índices `utf8mb4`. Correcto.
*   **Índices Faltantes:**
    *   `Propuesta`: Debería tener index por `estado` y `tutorId` para reportes rápidos.
    *   `Evidencia`: Index por `estado` (saber cuántos faltan entregar).

## 4. Auditoría (Logs)

*   **Falta Trazabilidad:** Las tablas tienen `createdAt`/`updatedAt` (bien), pero no sabemos **QUIÉN** hizo el cambio.
*   **Recomendación:** Para un sistema académico, se sugiere una tabla histórica `PropuestaLog` o `AuditLog` para saber si un tutor aprobó y luego rechazó.

## 5. Resumen de Mejoras Inmediatas (Action Items)

1.  [ ] **Security:** Agregar `onDelete: Cascade` en `Actividad` y `Evidencia` para evitar errores de integridad al limpiar datos de prueba.
2.  [ ] **Performance:** Agregar índices compuestos en `Comite` (`usuariosId`, `propuestasId`) - *Ya existe (PK compuesta), bien.*
3.  [ ] **Future-Proofing:** Documentar claramente que la lógica del Docente de Integración es global por Rol.

---
**Conclusión:** El esquema es sólido para una v1. No tiene errores estructurales graves, pero necesita ajustes en las reglas de borrado (`onDelete`) para no ser una pesadilla de mantenimiento operativa.
