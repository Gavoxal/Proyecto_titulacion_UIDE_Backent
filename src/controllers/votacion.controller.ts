import { FastifyReply, FastifyRequest } from 'fastify';

/**
 * VOTACIÓN DE TUTORES
 * Control de acceso:
 * - ESTUDIANTE: Puede crear y ver sus propias votaciones
 * - DIRECTOR/COORDINADOR: Puede ver todas las votaciones y asignar tutores
 */

// Helper function to check user role
const checkRole = (user: any, allowedRoles: string[]) => {
    return allowedRoles.includes(user.rol);
};

/**
 * Crear/Actualizar votación de tutor
 * Acceso: ESTUDIANTE
 * Un estudiante puede votar por 3 tutores (prioridad 1, 2, 3)
 */
export const submitVotacion = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const user = request.user as any;
    const { tutorId, propuestaId, prioridad, justificacion } = request.body as any;

    try {
        // Verificar que el usuario sea ESTUDIANTE
        if (!checkRole(user, ['ESTUDIANTE'])) {
            return reply.code(403).send({ message: 'Solo los estudiantes pueden votar por tutores' });
        }

        // Verificar que la propuesta pertenece al estudiante
        const propuesta = await prisma.propuesta.findUnique({
            where: { id: Number(propuestaId) }
        });

        if (!propuesta || propuesta.fkEstudiante !== user.id) {
            return reply.code(403).send({ message: 'No tiene permiso para votar en esta propuesta' });
        }

        // Verificar que la prioridad sea válida (1, 2, o 3)
        if (![1, 2, 3].includes(Number(prioridad))) {
            return reply.code(400).send({ message: 'La prioridad debe ser 1, 2 o 3' });
        }

        // Verificar que el tutor existe y tiene rol TUTOR
        const tutor = await prisma.usuario.findUnique({
            where: { id: Number(tutorId) }
        });

        if (!tutor || tutor.rol !== 'TUTOR') {
            return reply.code(400).send({ message: 'El usuario seleccionado no es un tutor válido' });
        }

        // Verificar si ya existe una votación para esta prioridad
        const votacionExistente = await prisma.votacionTutor.findFirst({
            where: {
                estudianteId: user.id,
                propuestaId: Number(propuestaId),
                prioridad: Number(prioridad)
            }
        });

        let votacion;
        if (votacionExistente) {
            // Actualizar votación existente
            votacion = await prisma.votacionTutor.update({
                where: { id: votacionExistente.id },
                data: {
                    tutorId: Number(tutorId),
                    justificacion
                },
                include: {
                    tutor: {
                        select: { id: true, nombres: true, apellidos: true, correoInstitucional: true }
                    }
                }
            });
        } else {
            // Crear nueva votación
            votacion = await prisma.votacionTutor.create({
                data: {
                    estudianteId: user.id,
                    tutorId: Number(tutorId),
                    propuestaId: Number(propuestaId),
                    prioridad: Number(prioridad),
                    justificacion
                },
                include: {
                    tutor: {
                        select: { id: true, nombres: true, apellidos: true, correoInstitucional: true }
                    }
                }
            });
        }

        return reply.code(201).send(votacion);
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error registrando votación' });
    }
};

/**
 * Obtener votaciones de un estudiante
 * Acceso: ESTUDIANTE (propias), DIRECTOR, COORDINADOR (todas)
 */
export const getVotacionesByEstudiante = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const user = request.user as any;
    const { estudianteId } = request.params as any;

    try {
        // Verificar permisos
        const isAdmin = checkRole(user, ['DIRECTOR', 'COORDINADOR']);
        const isOwnStudent = user.id === Number(estudianteId);

        if (!isAdmin && !isOwnStudent) {
            return reply.code(403).send({ message: 'No tiene permiso para ver estas votaciones' });
        }

        const votaciones = await prisma.votacionTutor.findMany({
            where: { estudianteId: Number(estudianteId) },
            include: {
                tutor: {
                    select: { id: true, nombres: true, apellidos: true, correoInstitucional: true }
                },
                propuesta: {
                    select: { id: true, titulo: true }
                }
            },
            orderBy: { prioridad: 'asc' }
        });

        return reply.code(200).send(votaciones);
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error obteniendo votaciones' });
    }
};

/**
 * Obtener votaciones por propuesta
 * Acceso: ESTUDIANTE (de su propuesta), DIRECTOR, COORDINADOR
 */
export const getVotacionesByPropuesta = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const user = request.user as any;
    const { propuestaId } = request.params as any;

    try {
        // Obtener la propuesta
        const propuesta = await prisma.propuesta.findUnique({
            where: { id: Number(propuestaId) }
        });

        if (!propuesta) {
            return reply.code(404).send({ message: 'Propuesta no encontrada' });
        }

        // Verificar permisos
        const isAdmin = checkRole(user, ['DIRECTOR', 'COORDINADOR']);
        const isStudent = propuesta.fkEstudiante === user.id;

        if (!isAdmin && !isStudent) {
            return reply.code(403).send({ message: 'No tiene permiso para ver estas votaciones' });
        }

        const votaciones = await prisma.votacionTutor.findMany({
            where: { propuestaId: Number(propuestaId) },
            include: {
                tutor: {
                    select: { id: true, nombres: true, apellidos: true, correoInstitucional: true }
                },
                estudiante: {
                    select: { id: true, nombres: true, apellidos: true }
                }
            },
            orderBy: { prioridad: 'asc' }
        });

        return reply.code(200).send(votaciones);
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error obteniendo votaciones' });
    }
};

/**
 * Obtener votaciones recibidas por un tutor
 * Acceso: TUTOR (propias), DIRECTOR, COORDINADOR (todas)
 */
export const getVotacionesByTutor = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const user = request.user as any;
    const { tutorId } = request.params as any;

    try {
        // Verificar permisos
        const isAdmin = checkRole(user, ['DIRECTOR', 'COORDINADOR']);
        const isOwnTutor = user.id === Number(tutorId);

        if (!isAdmin && !isOwnTutor) {
            return reply.code(403).send({ message: 'No tiene permiso para ver estas votaciones' });
        }

        const votaciones = await prisma.votacionTutor.findMany({
            where: { tutorId: Number(tutorId) },
            include: {
                estudiante: {
                    select: { id: true, nombres: true, apellidos: true, correoInstitucional: true }
                },
                propuesta: {
                    select: { id: true, titulo: true }
                }
            },
            orderBy: [
                { prioridad: 'asc' },
                { fechaVotacion: 'desc' }
            ]
        });

        return reply.code(200).send(votaciones);
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error obteniendo votaciones' });
    }
};

/**
 * Obtener todas las votaciones (para asignación de tutores)
 * Acceso: DIRECTOR, COORDINADOR
 */
export const getAllVotaciones = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const user = request.user as any;

    try {
        // Verificar que sea DIRECTOR o COORDINADOR
        if (!checkRole(user, ['DIRECTOR', 'COORDINADOR'])) {
            return reply.code(403).send({ message: 'Solo directores y coordinadores pueden ver todas las votaciones' });
        }

        const votaciones = await prisma.votacionTutor.findMany({
            include: {
                estudiante: {
                    select: { id: true, nombres: true, apellidos: true, correoInstitucional: true }
                },
                tutor: {
                    select: { id: true, nombres: true, apellidos: true, correoInstitucional: true }
                },
                propuesta: {
                    select: { id: true, titulo: true, estado: true }
                }
            },
            orderBy: [
                { propuestaId: 'asc' },
                { prioridad: 'asc' }
            ]
        });

        return reply.code(200).send(votaciones);
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error obteniendo votaciones' });
    }
};

/**
 * Eliminar votación
 * Acceso: ESTUDIANTE (solo sus propias votaciones antes de asignación)
 */
export const deleteVotacion = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const user = request.user as any;
    const { id } = request.params as any;

    try {
        // Verificar que sea estudiante
        if (!checkRole(user, ['ESTUDIANTE'])) {
            return reply.code(403).send({ message: 'Solo los estudiantes pueden eliminar votaciones' });
        }

        // Verificar que la votación existe y pertenece al estudiante
        const votacion = await prisma.votacionTutor.findUnique({
            where: { id: Number(id) }
        });

        if (!votacion) {
            return reply.code(404).send({ message: 'Votación no encontrada' });
        }

        if (votacion.estudianteId !== user.id) {
            return reply.code(403).send({ message: 'No tiene permiso para eliminar esta votación' });
        }

        // Verificar que no se haya asignado tutor aún
        const asignacion = await prisma.trabajoTitulacion.findFirst({
            where: {
                propuestasId: votacion.propuestaId,
                fkTutorId: votacion.tutorId
            }
        });

        if (asignacion) {
            return reply.code(400).send({ message: 'No se puede eliminar la votación porque ya se asignó el tutor' });
        }

        await prisma.votacionTutor.delete({
            where: { id: Number(id) }
        });

        return reply.code(204).send();
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error eliminando votación' });
    }
};

/**
 * Obtener resumen de votaciones para dashboard del director
 * Acceso: DIRECTOR, COORDINADOR
 */
export const getVotacionesSummary = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const user = request.user as any;

    try {
        // Verificar que sea DIRECTOR o COORDINADOR
        if (!checkRole(user, ['DIRECTOR', 'COORDINADOR'])) {
            return reply.code(403).send({ message: 'Solo directores y coordinadores pueden ver el resumen' });
        }

        // Contar votaciones por tutor y prioridad
        const votaciones = await prisma.votacionTutor.groupBy({
            by: ['tutorId', 'prioridad'],
            _count: {
                id: true
            }
        });

        // Obtener información de tutores
        const tutorIds = [...new Set(votaciones.map(v => v.tutorId))];
        const tutores = await prisma.usuario.findMany({
            where: {
                id: { in: tutorIds }
            },
            select: {
                id: true,
                nombres: true,
                apellidos: true,
                correoInstitucional: true
            }
        });

        // Formatear respuesta
        const summary = tutores.map(tutor => {
            const prioridad1 = votaciones.find(v => v.tutorId === tutor.id && v.prioridad === 1)?._count.id || 0;
            const prioridad2 = votaciones.find(v => v.tutorId === tutor.id && v.prioridad === 2)?._count.id || 0;
            const prioridad3 = votaciones.find(v => v.tutorId === tutor.id && v.prioridad === 3)?._count.id || 0;

            return {
                tutor,
                votaciones: {
                    prioridad1,
                    prioridad2,
                    prioridad3,
                    total: prioridad1 + prioridad2 + prioridad3
                }
            };
        });

        return summary.sort((a, b) => b.votaciones.total - a.votaciones.total);
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error obteniendo resumen de votaciones' });
    }
};