import { FastifyReply, FastifyRequest } from 'fastify';

// ACTIVIDADES

export const createActividad = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const {
        nombre,
        descripcion,
        propuestaId,
        tipo,
        fechaActivacion,
        fechaEntrega,
        requisitos
    } = request.body as any;

    try {
        const nuevaActividad = await prisma.actividad.create({
            data: {
                nombre,
                descripcion,
                propuestaId: Number(propuestaId),
                tipo: tipo || 'DOCENCIA',
                // Nuevos campos
                fechaActivacion: fechaActivacion ? new Date(fechaActivacion) : null,
                fechaEntrega: fechaEntrega ? new Date(fechaEntrega) : null,
                requisitos: requisitos || [],
                estado: 'NO_ENTREGADO' // Default state
            }
        });
        return reply.code(201).send(nuevaActividad);
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error creando actividad' });
    }
};

export const getActividadesByPropuesta = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const { propuestaId } = request.params as any;
    const { tipo } = request.query as any;

    try {
        const where: any = { propuestaId: Number(propuestaId) };
        if (tipo) {
            where.tipo = tipo; // Filter by tipo if provided
        }

        const actividades = await prisma.actividad.findMany({
            where,
            include: {
                evidencias: true
            }
        });
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

        if (!actividad) {
            return reply.code(404).send({ message: 'Actividad no encontrada' });
        }
        return actividad;
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error obteniendo actividad' });
    }
};

export const updateActividad = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const { id } = request.params as any;
    const data = request.body as any;

    try {
        const actividadActualizada = await prisma.actividad.update({
            where: { id: Number(id) },
            data
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

    try {
        const nuevaEvidencia = await prisma.evidencia.create({
            data: {
                semana: Number(semana),
                contenido,
                archivoUrl,
                actividadId: Number(actividadId),
                estado: 'ENTREGADO'
            }
        });

        return reply.code(201).send(nuevaEvidencia);
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

/**
 * Calificar evidencia - TUTOR
 * Acceso: TUTOR
 */
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
