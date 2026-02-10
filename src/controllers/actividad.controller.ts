import { FastifyReply, FastifyRequest } from 'fastify';


import * as fs from 'fs';
import * as path from 'path';
import { pipeline } from 'stream';
import util from 'util';
import { fileURLToPath } from 'url';
const pump = util.promisify(pipeline);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ACTIVIDADES

export const uploadEvidenciaFile = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        console.log("Iniciando uploadEvidenciaFile...");
        const data = await request.file();
        if (!data) {
            console.log("No se recibió archivo en request.file()");
            return reply.code(400).send({ message: 'No se subió ningún archivo' });
        }

        console.log(`Recibido archivo: ${data.filename}, mimetype: ${data.mimetype}`);

        // Usar la ruta correcta relativa a este archivo en controllers
        // src/controllers/actividad.controller.ts -> ../../uploads/evidencias
        const uploadDir = path.join(__dirname, '../../uploads/evidencias');

        if (!fs.existsSync(uploadDir)) {
            console.log(`Creando directorio de uploads: ${uploadDir}`);
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const timestamp = Date.now();
        const filename = `${timestamp}-${data.filename.replace(/\s/g, '_')}`;
        const filepath = path.join(uploadDir, filename);

        console.log(`Guardando archivo en: ${filepath}`);
        await pump(data.file, fs.createWriteStream(filepath));

        const fileUrl = `/api/v1/actividades/evidencias/file/${filename}`;
        console.log(`Archivo subido exitosamente: ${fileUrl}`);

        return reply.code(200).send({ url: fileUrl });
    } catch (error: any) {
        console.error("Error en uploadEvidenciaFile detailed:", error);
        request.log.error(error);
        return reply.code(500).send({ message: 'Error subiendo archivo', detail: error.message });
    }
};

export const serveEvidenciaFile = async (request: FastifyRequest, reply: FastifyReply) => {
    const { filename } = request.params as { filename: string };
    const filePath = path.join(__dirname, '../../uploads/evidencias', filename);

    if (!fs.existsSync(filePath)) {
        return reply.code(404).send({ message: 'Archivo no encontrado' });
    }

    const stream = fs.createReadStream(filePath);
    return reply.send(stream);
};


export const createActividad = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const {
        nombre,
        descripcion,
        propuestaId,
        tipo,
        semana,
        fechaActivacion,
        fechaEntrega,
        requisitos
    } = request.body as any;
    console.log("DEBUG BACKEND: Creating activity with body:", request.body);

    try {
        // Validación: Límite de 64 actividades por propuesta (32 Tutor + 32 Docente aprox)
        const count = await prisma.actividad.count({
            where: { propuestaId: Number(propuestaId) }
        });

        if (count >= 64) {
            return reply.code(400).send({
                message: 'Límite alcanzado: No puedes crear más de 64 actividades para esta propuesta.'
            });
        }

        const nuevaActividad = await prisma.actividad.create({
            data: {
                nombre,
                descripcion,
                propuestaId: Number(propuestaId),
                tipo: tipo || 'DOCENCIA',
                semana: semana ? Number(semana) : null,
                // Nuevos campos
                fechaActivacion: fechaActivacion ? new Date(fechaActivacion) : null,
                fechaEntrega: fechaEntrega ? new Date(fechaEntrega) : null,
                requisitos: requisitos || [],
                estado: 'NO_ENTREGADO' // Default state
            }
        });
        console.log("DEBUG BACKEND: New activity saved:", nuevaActividad);

        // NOTIFICACIÓN: Al Estudiante
        try {
            const propuesta = await prisma.propuesta.findUnique({
                where: { id: Number(propuestaId) },
                select: { fkEstudiante: true }
            });

            if (propuesta && propuesta.fkEstudiante) {
                await prisma.notificacion.create({
                    data: {
                        usuarioId: propuesta.fkEstudiante,
                        mensaje: `El tutor ha creado una nueva actividad: ${nombre}`,
                        leido: false
                    }
                });
            }
        } catch (notifError) {
            console.error('Error enviando notificación al estudiante:', notifError);
            // No bloqueamos la respuesta si falla la notificación
        }

        return reply.code(201).send(nuevaActividad);
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error creando actividad' });
    }
};

export const getActividadesByPropuesta = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const { propuestaId } = request.params as any;
    // const { tipo } = request.query as any; // Removed as per instruction

    try {
        // const where: any = { propuestaId: Number(propuestaId) }; // Modified as per instruction
        // if (tipo) { // Modified as per instruction
        //     where.tipo = tipo; // Filter by tipo if provided // Modified as per instruction
        // } // Modified as per instruction

        const actividades = await (prisma.actividad as any).findMany({
            where: { propuestaId: Number(propuestaId) },
            include: {
                evidencias: true,
                propuesta: true
            },
            orderBy: {
                id: 'asc'
            }
        });

        // Debug log para ver el estado de todas las actividades antes de enviarlas
        console.log(`DEBUG BACKEND [getActividadesByPropuesta]: Fetching activities for prop ${propuestaId}`);
        actividades.forEach((a: any) => {
            console.log(`  - ID: ${a.id} | Titulo: ${a.nombre.substring(0, 10)} | Sem: ${a.semana} | Tipo: ${a.tipo}`);
        });

        // Lógica de "Lazy Creation" para ceros automáticos
        const now = new Date();

        // Iteramos las actividades para verificar fechas vencidas
        for (let i = 0; i < actividades.length; i++) {
            const actividad = actividades[i];

            // Si tiene fecha de entrega, ya pasó, y NO tiene evidencias
            if (actividad.fechaEntrega && new Date(actividad.fechaEntrega) < now && actividad.evidencias.length === 0) {
                console.log(`Auto-assigning 0 for activity ${actividad.id} (expired)`);

                try {
                    // Crear evidencia con nota 0
                    const nuevaEvidencia = await prisma.evidencia.create({
                        data: {
                            semana: actividad.semana || (i + 1), // Usar semana de la actividad o fallback al orden
                            contenido: 'Asignación automática por falta de entrega (Plazo vencido).',
                            archivoUrl: null,
                            actividadId: actividad.id,
                            estado: 'NO_ENTREGADO',
                            calificacionTutor: 0,
                            feedbackTutor: 'No se registró entrega en el plazo establecido.',
                            fechaCalificacionTutor: now,
                            estadoRevisionTutor: 'APROBADO', // Técnicamente aprobado el 0
                            fechaEntrega: now
                        }
                    });

                    // Actualizar el objeto en memoria para retornarlo actualizado
                    actividad.evidencias.push(nuevaEvidencia as any);
                    actividad.estado = 'NO_ENTREGADO'; // Asegurar estado en actividad

                } catch (err) {
                    console.error(`Error auto-assigning 0 for activity ${actividad.id}:`, err);
                    // Continuamos, no bloqueamos el request
                }
            }
        }

        console.log(`DEBUG BACKEND [getActividadesByPropuesta]: Returning ${actividades.length} activities`);
        if (actividades.length > 0) {
            console.log("DEBUG BACKEND [getActividadesByPropuesta]: Sample Activity (First):", {
                id: actividades[0].id,
                nombre: actividades[0].nombre,
                semana: (actividades[0] as any).semana
            });
        }
        return actividades;
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error obteniendo actividades' });
    }
};

export const getActividadById = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const { id } = request.params as any;

    try {
        const actividad = await prisma.actividad.findUnique({
            where: { id: Number(id) },
            include: { evidencias: true }
        });

        if (!actividad) return reply.code(404).send({ message: 'Actividad no encontrada' });
        return actividad;
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error obteniendo actividad' });
    }
};

export const updateActividad = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const { id } = request.params as any;
    const { nombre, descripcion, estado, fechaEntrega, semana } = request.body as any;

    try {
        const actividadActualizada = await prisma.actividad.update({
            where: { id: Number(id) },
            data: {
                nombre,
                descripcion,
                estado,
                semana: semana ? Number(semana) : undefined,
                fechaEntrega: fechaEntrega ? new Date(fechaEntrega) : undefined
            }
        });
        return actividadActualizada;
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error actualizando actividad' });
    }
};

export const deleteActividad = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const { id } = request.params as any;

    try {
        await prisma.actividad.delete({
            where: { id: Number(id) }
        });
        return reply.code(204).send();
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error eliminando actividad' });
    }
};


// EVIDENCIAS

export const createEvidencia = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const { actividadId } = request.params as any;
    const { semana, contenido, archivoUrl } = request.body as any;
    const usuario = request.user as any;

    try {
        // Validación: No permitir semanas superiores a 16
        if (Number(semana) > 16) {
            return reply.code(400).send({
                message: 'Límite alcanzado: No se pueden registrar evidencias para más de 16 semanas.'
            });
        }

        const nuevaEvidencia = await prisma.evidencia.create({
            data: {
                semana: Number(semana),
                contenido,
                archivoUrl,
                actividadId: Number(actividadId),
                estado: 'ENTREGADO'
            }
        });

        // Vincular comentario del estudiante si existe contenido
        if (contenido && usuario?.id) {
            await prisma.comentario.create({
                data: {
                    descripcion: contenido,
                    evidenciaId: nuevaEvidencia.id,
                    usuarioId: usuario.id
                }
            });
        }

        // Actualizar el estado de la actividad principal a ENTREGADO
        await prisma.actividad.update({
            where: { id: Number(actividadId) },
            data: { estado: 'ENTREGADO' }
        });

        // NOTIFICACIÓN: Al Tutor
        try {
            // Buscamos el tutor a través de Actividad -> Propuesta -> TrabajoTitulacion
            const actividad = await prisma.actividad.findUnique({
                where: { id: Number(actividadId) },
                include: {
                    propuesta: {
                        include: {
                            trabajosTitulacion: {
                                where: { estadoAsignacion: 'ACTIVO' }
                            }
                        }
                    }
                }
            });

            // Fetch student details from DB to ensure we have the name
            let estudianteNombre = 'El estudiante';
            if (usuario && usuario.id) {
                const estudianteDb = await prisma.usuario.findUnique({
                    where: { id: Number(usuario.id) },
                    select: { nombres: true, apellidos: true }
                });
                if (estudianteDb) {
                    estudianteNombre = `${estudianteDb.nombres} ${estudianteDb.apellidos}`;
                }
            }

            const actividadNombre = actividad?.nombre || 'la actividad';

            const tutores = actividad?.propuesta?.trabajosTitulacion || [];

            for (const trabajo of tutores) {
                if (trabajo.fkTutorId) {
                    await prisma.notificacion.create({
                        data: {
                            usuarioId: trabajo.fkTutorId,
                            mensaje: `${estudianteNombre} ha entregado una evidencia en: ${actividadNombre}`,
                            leido: false
                        }
                    });
                }
            }

        } catch (notifError) {
            console.error('Error enviando notificación al tutor:', notifError);
        }

        const evidenciaConComentarios = await prisma.evidencia.findUnique({
            where: { id: nuevaEvidencia.id },
            include: { comentarios: true }
        });

        return reply.code(201).send(evidenciaConComentarios);
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error creando evidencia' });
    }
};

export const getEvidenciaById = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const { id } = request.params as any;

    try {
        const evidencia = await prisma.evidencia.findUnique({
            where: { id: Number(id) },
            include: { comentarios: true }
        });

        if (!evidencia) {
            return reply.code(404).send({ message: 'Evidencia no encontrada' });
        }
        return evidencia;
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error obteniendo evidencia' });
    }
};

export const updateEvidencia = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const { id } = request.params as any;
    const { contenido, archivoUrl } = request.body as any;

    try {
        const evidenciaActualizada = await prisma.evidencia.update({
            where: { id: Number(id) },
            data: { contenido, archivoUrl }
        });
        return evidenciaActualizada;
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error actualizando evidencia' });
    }
};

export const deleteEvidencia = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const { id } = request.params as any;

    try {
        await prisma.evidencia.delete({
            where: { id: Number(id) }
        });
        return reply.code(204).send();
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error eliminando evidencia' });
    }
};

export const calificarEvidenciaTutor = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const { id } = request.params as any;
    const { calificacion, feedback } = request.body as any;
    const usuario = request.user as any;

    try {
        // Verificar que el usuario sea TUTOR
        if (usuario.rol !== 'TUTOR') {
            return reply.code(403).send({ message: 'Solo los tutores pueden calificar' });
        }

        // Actualizar calificación del tutor
        const evidencia = await prisma.evidencia.update({
            where: { id: Number(id) },
            data: {
                calificacionTutor: calificacion ? Number(calificacion) : null,
                feedbackTutor: feedback,
                fechaCalificacionTutor: new Date(),
                estadoRevisionTutor: calificacion ? 'APROBADO' : 'PENDIENTE'
            }
        });

        // Calcular calificación final si ambas calificaciones existen
        if (evidencia.calificacionTutor && evidencia.calificacionDocente) {
            const calificacionFinal =
                (Number(evidencia.calificacionTutor) * Number(evidencia.ponderacionTutor)) +
                (Number(evidencia.calificacionDocente) * Number(evidencia.ponderacionDocente));

            await prisma.evidencia.update({
                where: { id: Number(id) },
                data: { calificacionFinal }
            });
        }

        // Crear comentario si existe feedback
        if (feedback) {
            await prisma.comentario.create({
                data: {
                    descripcion: feedback,
                    evidenciaId: Number(id),
                    usuarioId: usuario.id
                }
            });
        }

        const evidenciaActualizada = await prisma.evidencia.findUnique({
            where: { id: Number(id) },
            include: { comentarios: true }
        });

        return evidenciaActualizada;
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error calificando evidencia' });
    }
};

/**
 * Calificar evidencia - DOCENTE INTEGRACIÓN
 * Acceso: DOCENTE_INTEGRACION
 */
export const calificarEvidenciaDocente = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const { id } = request.params as any;
    const { calificacion, feedback } = request.body as any;
    const usuario = request.user as any;

    try {
        // Verificar que el usuario sea DOCENTE_INTEGRACION
        if (usuario.rol !== 'DOCENTE_INTEGRACION') {
            return reply.code(403).send({ message: 'Solo los docentes de integración pueden calificar' });
        }

        // Actualizar calificación del docente
        const evidencia = await prisma.evidencia.update({
            where: { id: Number(id) },
            data: {
                calificacionDocente: calificacion ? Number(calificacion) : null,
                feedbackDocente: feedback,
                fechaCalificacionDocente: new Date(),
                estadoRevisionDocente: calificacion ? 'APROBADO' : 'PENDIENTE'
            }
        });

        // Calcular calificación final si ambas calificaciones existen
        if (evidencia.calificacionTutor && evidencia.calificacionDocente) {
            const calificacionFinal =
                (Number(evidencia.calificacionTutor) * Number(evidencia.ponderacionTutor)) +
                (Number(evidencia.calificacionDocente) * Number(evidencia.ponderacionDocente));

            await prisma.evidencia.update({
                where: { id: Number(id) },
                data: { calificacionFinal }
            });
        }

        // Crear comentario si existe feedback
        if (feedback) {
            await prisma.comentario.create({
                data: {
                    descripcion: feedback,
                    evidenciaId: Number(id),
                    usuarioId: usuario.id
                }
            });
        }

        const evidenciaActualizada = await prisma.evidencia.findUnique({
            where: { id: Number(id) },
            include: { comentarios: true }
        });

        return evidenciaActualizada;
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error calificando evidencia' });
    }
};

/**
 * Listar todas las evidencias (Docente Integración)
 */
export const getEvidencias = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    try {
        const evidencias = await prisma.evidencia.findMany({
            include: {
                actividad: {
                    include: {
                        propuesta: {
                            include: {
                                estudiante: {
                                    select: { nombres: true, apellidos: true }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { fechaEntrega: 'desc' }
        });
        return evidencias;
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error obteniendo evidencias' });
    }
};

/**
 * Actualizar estado de revisión
 * Acceso: TUTOR, DOCENTE_INTEGRACION
 */
export const updateEstadoRevision = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const { id } = request.params as any;
    const { estado, comentario } = request.body as any;
    const usuario = request.user as any;

    try {
        const updateData: any = {};

        if (usuario.rol === 'TUTOR') {
            updateData.estadoRevisionTutor = estado;
        } else if (usuario.rol === 'DOCENTE_INTEGRACION') {
            updateData.estadoRevisionDocente = estado;
        } else {
            return reply.code(403).send({ message: 'No tiene permiso para actualizar el estado' });
        }

        const evidencia = await prisma.evidencia.update({
            where: { id: Number(id) },
            data: updateData
        });

        // Crear comentario si existe
        if (comentario) {
            await prisma.comentario.create({
                data: {
                    descripcion: comentario,
                    evidenciaId: Number(id),
                    usuarioId: usuario.id
                }
            });
        }

        return evidencia;
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error actualizando estado' });
    }
};