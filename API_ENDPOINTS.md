# Documentación de API - Proyecto Titulación UIDE

Esta documentación detalla todos los endpoints disponibles en el backend `v1`.

Base URL: `/api/v1`

## 1. Autenticación (`/auth`)
| Método | Ruta | Descripción | Rol Requerido | Parámetros (Body) |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/login` | Iniciar sesión | Público | `correo` (email), `clave` (string) |

## 2. Usuarios (`/usuarios`)
| Método | Ruta | Descripción | Rol Requerido | Parámetros |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/` | Listar todos los usuarios | Autenticado | - |
| **GET** | `/:id` | Obtener usuario por ID | Autenticado | `id` (param) |
| **POST** | `/` | Crear usuario | DIRECTOR, COORDINADOR | `cedula`, `nombres`, `apellidos`, `correo`, `clave`, `rol` |
| **PUT** | `/:id` | Actualizar usuario | Autenticado | `nombres`, `apellidos`, `rol`, `clave` |
| **DELETE** | `/:id` | Eliminar usuario | DIRECTOR, COORDINADOR | `id` (param) |

## 3. Estudiantes (`/estudiantes`)
| Método | Ruta | Descripción | Rol Requerido | Parámetros |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/importar-excel` | Importar estudiantes masivamente | DIRECTOR, COORDINADOR | **Multipart:** archivo excel |

## 4. Tutores (`/tutor`)
| Método | Ruta | Descripción | Rol Requerido | Parámetros |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/mis-estudiantes` | Listar estudiantes asignados | TUTOR | - |

## 5. Áreas de Conocimiento (`/areas-conocimiento`)
| Método | Ruta | Descripción | Rol Requerido | Parámetros |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/` | Listar todas las áreas | Autenticado | - |

## 6. Propuestas (`/propuestas`)
| Método | Ruta | Descripción | Rol Requerido | Parámetros |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/` | Listar propuestas | Autenticado | - |
| **GET** | `/:id` | Obtener propuesta | Autenticado | `id` (param) |
| **POST** | `/upload` | Subir archivo de propuesta | ESTUDIANTE | **Multipart:** archivo |
| **GET** | `/file/:filename` | Descargar archivo | Autenticado | `filename` (param) |
| **POST** | `/` | Crear propuesta | ESTUDIANTE | `titulo`, `objetivos`, `areaConocimientoId`, `archivoUrl`, `carrera`, `malla`, `problematica`, `alcance` |
| **PUT** | `/:id` | Editar propuesta | Dueño/Admin | `titulo`, `objetivos`, ... |
| **PUT** | `/:id/estado` | Aprobar/Rechazar propuesta | DIRECTOR, COORDINADOR | `estado` (PENDIENTE, APROBADA, RECHAZADA) |
| **PUT** | `/:id/revision` | Revisión técnica de propuesta | DIRECTOR, COORDINADOR | `estadoRevision` (APROBADO, CORRECCION), `comentariosRevision` |
| **DELETE** | `/:id` | Eliminar propuesta | DIRECTOR, COORDINADOR | `id` (param) |

## 7. Actividades (`/actividades`)
| Método | Ruta | Descripción | Rol Requerido | Parámetros |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/propuesta/:propuestaId` | Listar actividades | Autenticado | `propuestaId` (param). Query: `tipo` |
| **POST** | `/` | Crear actividad | TUTOR, DOCENTE | `nombre`, `descripcion`, `propuestaId`, `tipo`, `fechaEntrega` |
| **GET** | `/:id` | Obtener actividad | Autenticado | `id` (param) |
| **PUT** | `/:id` | Actualizar actividad | TUTOR, DOCENTE | `nombre`, `descripcion`, `fechaEntrega` |
| **DELETE** | `/:id` | Eliminar actividad | TUTOR, DOCENTE | `id` (param) |
| **POST** | `/evidencias/upload` | Subir archivo de evidencia | ESTUDIANTE | **Multipart:** archivo |
| **POST** | `/:actividadId/evidencias` | Registrar evidencia | ESTUDIANTE | `actividadId` (param), `archivoUrl`, `contenido`, `semana` |
| **GET** | `/evidencias/:id` | Ver evidencia | Autenticado | `id` (param) |
| **GET** | `/file/:filename` | Descargar archivo evidencia | Autenticado | `filename` (param) |
| **PUT** | `/evidencias/:id/calificar` | Calificar evidencia | TUTOR, DOCENTE | `calificacion` (0-10), `feedback`, `observaciones` |

## 8. Comentarios (`/comentarios`)
| Método | Ruta | Descripción | Rol Requerido | Parámetros |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/evidencia/:evidenciaId` | Comentarios de evidencia | Autenticado | `evidenciaId` (param) |
| **GET** | `/propuesta/:propuestaId` | Comentarios de propuesta | Autenticado | `propuestaId` (param) |
| **POST** | `/` | Crear comentario | Autenticado | `descripcion`, `evidenciaId` (opcional), `propuestaId` (opcional) |
| **DELETE** | `/:id` | Eliminar comentario | Autor/Admin | `id` (param) |

## 9. Prerrequisitos (`/prerequisitos`)
| Método | Ruta | Descripción | Rol Requerido | Parámetros |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/` | Mis prerrequisitos | ESTUDIANTE | - |
| **GET** | `/status` | Verificar si puede crear propuesta | ESTUDIANTE | - |
| **POST** | `/upload` | Subir archivo prerrequisito | ESTUDIANTE | **Multipart:** archivo |
| **POST** | `/` | Registrar prerrequisito | ESTUDIANTE | `prerequisitoId`, `archivoUrl` |
| **GET** | `/dashboard` | Dashboard cumplimiento | DIRECTOR, COORDINADOR | - |
| **PUT** | `/:id/validar` | Validar prerrequisito | DIRECTOR, COORDINADOR | `cumplido` (boolean) |

## 10. Bitácora (`/bitacora`)
| Método | Ruta | Descripción | Rol Requerido | Parámetros |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/` | Crear reunión | TUTOR | `estudianteId`, `propuestaId`, `fecha`, `horaInicio`, `horaFin`, `modalidad`, `resumen` |
| **GET** | `/tutor/:tutorId` | Listar por tutor | Autenticado | `tutorId` (param) |
| **GET** | `/estudiante/:estudianteId` | Listar por estudiante | Autenticado | `estudianteId` (param) |
| **GET** | `/propuesta/:propuestaId` | Listar por propuesta | Autenticado | `propuestaId` (param) |
| **GET** | `/:id` | Obtener reunión | Autenticado | `id` (param) |
| **PUT** | `/:id` | Actualizar reunión | TUTOR (Dueño) | `fecha`, `horaInicio`, `resumen`, etc. |
| **DELETE** | `/:id` | Eliminar reunión | TUTOR (Dueño) | `id` (param) |

## 11. Votación de Tutores (`/votacion`)
| Método | Ruta | Descripción | Rol Requerido | Parámetros |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/` | Votar por tutor | ESTUDIANTE | `tutorId`, `propuestaId`, `prioridad` (1-3), `justificacion` |
| **GET** | `/estudiante/:estudianteId` | Mis votaciones | ESTUDIANTE | `estudianteId` (param) |
| **GET** | `/tutor/:tutorId` | Votos recibidos | TUTOR | `tutorId` (param) |
| **GET** | `/summary` | Resumen para asignación | DIRECTOR, COORDINADOR | - |
| **DELETE** | `/:id` | Eliminar voto | ESTUDIANTE | `id` (param) |

## 12. Defensas (`/defensas`)
| Método | Ruta | Descripción | Rol Requerido | Parámetros |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/privada` | Programar defensa privada | DIRECTOR, COORDINADOR | `propuestaId`, `fechaDefensa`, `horaDefensa`, `aula` |
| **GET** | `/privada/propuesta/:propuestaId` | Obtener defensa privada | Autenticado | `propuestaId` (param) |
| **PUT** | `/privada/:id` | Actualizar defensa privada | DIRECTOR, COORDINADOR | `fechaDefensa`, `estado`... |
| **PUT** | `/privada/:id/finalizar` | Aprobar/Rechazar privada | DIRECTOR, COORDINADOR | `estado` (APROBADA/RECHAZADA), `comentarios` |
| **POST** | `/privada/:evaluacionId/participantes`| Asignar jurado/tutor | DIRECTOR, COORDINADOR | `usuarioId`, `tipoParticipante` (TUTOR/COMITE) |
| **PUT** | `/privada/:evaluacionId/calificar` | Calificar privada | PARTICIPANTE | `calificacion`, `comentario` |
| **POST** | `/publica` | Programar defensa pública | DIRECTOR, COORDINADOR | (Igual a privada) |
| **GET** | `/publica/propuesta/:propuestaId` | Obtener defensa pública | Autenticado | `propuestaId` (param) |

## 13. Entregables Finales (`/entregables`)
| Método | Ruta | Descripción | Rol Requerido | Parámetros |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/upload` | Subir archivo entregable | ESTUDIANTE | **Multipart:** archivo |
| **POST** | `/` | Registrar entregable | ESTUDIANTE | `propuestasId`, `urlArchivo`, `tipo` (TESIS, ARTICULO...) |
| **GET** | `/propuesta/:propuestaId` | Listar entregables | Autenticado | `propuestaId` (param) |
