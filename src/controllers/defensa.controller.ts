import { FastifyReply, FastifyRequest } from 'fastify';
import { sendDefenseNotificationEmail } from '../services/email.service.js';

/**
 * DEFENSAS (PRIVADA Y PÚBLICA)
 * Control de acceso:
 * - DIRECTOR/COORDINADOR: Puede programar defensas, asignar participantes
 * - TUTOR/COMITE: Puede ver defensas donde participa y calificar
 * - ESTUDIANTE: Puede ver sus propias defensas
 */

// Helper function to check user role
const checkRole = (user: any, allowedRoles: string[]) => {
    return allowedRoles.includes(user.rol);
};

// ============================================
// DEFENSA PRIVADA
// ============================================

/**
 * Crear/Programar defensa privada
 * Acceso: DIRECTOR, COORDINADOR
 */
export const createDefensaPrivada = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const user = request.user as any;
    const { propuestaId, fechaDefensa, horaDefensa, aula } = request.body as any;

    try {
        // Verificar permisos
        if (!checkRole(user, ['DIRECTOR', 'COORDINADOR'])) {
            return reply.code(403).send({ message: 'Solo directores y coordinadores pueden programar defensas' });
        }

        // Verificar que la propuesta existe
        const propuesta = await prisma.propuesta.findUnique({
            where: { id: Number(propuestaId) }
        });

        if (!propuesta) {
            return reply.code(404).send({ message: 'Propuesta no encontrada' });
        }

        // Verificar si ya existe una defensa privada para esta propuesta
        const defensaExistente = await prisma.evaluacionDefensaPrivada.findUnique({
            where: { propuestaId: Number(propuestaId) }
        });

        if (defensaExistente) {
            return reply.code(400).send({ message: 'Ya existe una defensa privada para esta propuesta' });
        }

        const defensa = await prisma.evaluacionDefensaPrivada.create({
            data: {
                propuestaId: Number(propuestaId),
                fechaDefensa: fechaDefensa ? new Date(fechaDefensa) : null,
                horaDefensa: horaDefensa ? new Date(`1970-01-01T${horaDefensa}`) : null,
                aula,
                estado: fechaDefensa ? 'PROGRAMADA' : 'PENDIENTE'
            },
            include: {
                propuesta: {
                    select: {
                        id: true,
                        titulo: true,
                        estudiante: {
                            select: { id: true, nombres: true, apellidos: true, correoInstitucional: true }
                        }
                    }
                }
            }
        });

        // Notificar al estudiante (sin esperar a que bloquee la respuesta)
        if (fechaDefensa) {
            const fechaStr = new Date(fechaDefensa).toLocaleDateString();
            const mensaje = `Tu defensa privada ha sido programada para el ${fechaStr} a las ${horaDefensa || 'por definir'} en ${aula || 'lugar por asignar'}.`;

            await prisma.notificacion.create({
                data: {
                    mensaje,
                    usuarioId: defensa.propuesta.estudiante.id
                }
            }).catch((err: any) => request.log.error(`Error creando notificación interna: ${err.message}`));

            if ((defensa.propuesta.estudiante as any).correoInstitucional) {
                sendDefenseNotificationEmail({
                    to: (defensa.propuesta.estudiante as any).correoInstitucional,
                    nombre: `${defensa.propuesta.estudiante.nombres} ${defensa.propuesta.estudiante.apellidos}`,
                    rol: 'ESTUDIANTE',
                    tema: defensa.propuesta.titulo,
                    fecha: new Date(fechaDefensa).toISOString().split('T')[0],
                    hora: horaDefensa,
                    aula: aula || 'Por asignar',
                    tipo: 'Privada'
                }).catch((err: any) => request.log.error(`Error enviando correo a estudiante: ${err.message}`));
            }
        }

        return reply.code(201).send(defensa);
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error creando defensa privada' });
    }
};

/**
 * Obtener defensa privada por propuesta
 * Acceso: Todos los roles (con restricciones)
 */
export const getDefensaPrivadaByPropuesta = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const user = request.user as any;
    const { propuestaId } = request.params as any;

    try {
        const defensa = await prisma.evaluacionDefensaPrivada.findUnique({
            where: { propuestaId: Number(propuestaId) },
            include: {
                propuesta: {
                    select: {
                        id: true,
                        titulo: true,
                        estudiante: {
                            select: { id: true, nombres: true, apellidos: true }
                        }
                    }
                },
                participantes: {
                    include: {
                        usuario: {
                            select: { id: true, nombres: true, apellidos: true, rol: true }
                        }
                    }
                }
            }
        });

        if (!defensa) {
            return reply.code(404).send({ message: 'Defensa privada no encontrada' });
        }

        // Verificar permisos
        const isAdmin = checkRole(user, ['DIRECTOR', 'COORDINADOR']);
        const isStudent = defensa.propuesta.estudiante.id === user.id;
        const isParticipant = defensa.participantes.some(p => p.usuarioId === user.id);

        if (!isAdmin && !isStudent && !isParticipant) {
            return reply.code(403).send({ message: 'No tiene permiso para ver esta defensa' });
        }

        return defensa;
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error obteniendo defensa privada' });
    }
};

/**
 * Actualizar defensa privada
 * Acceso: DIRECTOR, COORDINADOR
 */
export const updateDefensaPrivada = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const user = request.user as any;
    const { id } = request.params as any;
    const data = request.body as any;

    try {
        // Verificar permisos
        if (!checkRole(user, ['DIRECTOR', 'COORDINADOR'])) {
            return reply.code(403).send({ message: 'Solo directores y coordinadores pueden actualizar defensas' });
        }

        const updateData: any = {};
        if (data.fechaDefensa) {
            updateData.fechaDefensa = new Date(data.fechaDefensa);
            if (!data.estado) updateData.estado = 'PROGRAMADA';
        }
        if (data.horaDefensa) updateData.horaDefensa = new Date(`1970-01-01T${data.horaDefensa}`);
        if (data.aula) updateData.aula = data.aula;
        if (data.estado) updateData.estado = data.estado;
        if (data.comentarios) updateData.comentarios = data.comentarios;

        const defensa = await prisma.evaluacionDefensaPrivada.update({
            where: { id: Number(id) },
            data: updateData,
            include: {
                propuesta: {
                    select: { id: true, titulo: true, estudiante: { select: { id: true, nombres: true, apellidos: true, correoInstitucional: true } } }
                },
                participantes: {
                    include: {
                        usuario: {
                            select: { id: true, nombres: true, apellidos: true, correoInstitucional: true }
                        }
                    }
                }
            }
        });

        // Notificar cambios (estudiante y participantes)
        if (data.fechaDefensa || data.horaDefensa || data.aula) {
            const mensaje = `Se han actualizado los detalles de tu defensa privada: ${defensa.propuesta.titulo}.`;
            await prisma.notificacion.create({
                data: { mensaje, usuarioId: defensa.propuesta.estudiante.id }
            }).catch(() => { });

            if ((defensa.propuesta.estudiante as any).correoInstitucional) {
                sendDefenseNotificationEmail({
                    to: (defensa.propuesta.estudiante as any).correoInstitucional,
                    nombre: `${defensa.propuesta.estudiante.nombres} ${defensa.propuesta.estudiante.apellidos}`,
                    rol: 'ESTUDIANTE',
                    tema: defensa.propuesta.titulo,
                    fecha: defensa.fechaDefensa?.toISOString().split('T')[0] || '--',
                    hora: defensa.horaDefensa?.toLocaleTimeString() || '--',
                    aula: defensa.aula || 'Por asignar',
                    tipo: 'Privada'
                }).catch((err: any) => request.log.error(`Error enviando correo a estudiante: ${err.message}`));
            }

            for (const p of defensa.participantes) {
                const msgPart = `Se han actualizado los detalles de la defensa privada de: ${defensa.propuesta.titulo} donde participas como tribunal.`;
                await prisma.notificacion.create({
                    data: { mensaje: msgPart, usuarioId: p.usuarioId }
                }).catch(() => { });

                if ((p.usuario as any).correoInstitucional) {
                    sendDefenseNotificationEmail({
                        to: (p.usuario as any).correoInstitucional,
                        nombre: `${p.usuario.nombres} ${p.usuario.apellidos}`,
                        rol: (p as any).rol || 'Miembro del Tribunal',
                        estudianteNombre: `${defensa.propuesta.estudiante.nombres} ${defensa.propuesta.estudiante.apellidos}`,
                        tema: defensa.propuesta.titulo,
                        fecha: defensa.fechaDefensa?.toISOString().split('T')[0] || '--',
                        hora: defensa.horaDefensa?.toLocaleTimeString() || '--',
                        aula: defensa.aula || 'Por asignar',
                        tipo: 'Privada'
                    }).catch((err: any) => request.log.error(`Error enviando correo a participante: ${err.message}`));
                }
            }
        }

        return defensa;
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error actualizando defensa privada' });
    }
};

/**
 * Agregar participante a defensa privada
 * Acceso: DIRECTOR, COORDINADOR
 */
export const addParticipanteDefensaPrivada = async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('DEBUG: Iniciando addParticipanteDefensaPrivada');
    const prisma = request.server.prisma;
    const user = request.user as any;
    const { evaluacionId } = request.params as any;
    const { usuarioId, tipoParticipante, rol } = request.body as any;

    try {
        // Verificar permisos
        if (!checkRole(user, ['DIRECTOR', 'COORDINADOR'])) {
            return reply.code(403).send({ message: 'Solo directores y coordinadores pueden asignar participantes' });
        }

        // Verificar que el usuario existe y tiene el rol apropiado
        const usuario = await prisma.usuario.findUnique({
            where: { id: Number(usuarioId) }
        });

        if (!usuario) {
            return reply.code(404).send({ message: 'Usuario no encontrado' });
        }

        // Robustez: Siempre usar el rol real del usuario si es válido para el tribunal
        let finalTipo: any = tipoParticipante;
        const rolesPermitidos = ['TUTOR', 'COMITE', 'DIRECTOR', 'COORDINADOR'];
        if (rolesPermitidos.includes(usuario.rol)) {
            finalTipo = usuario.rol as any;
        } else {
            return reply.code(400).send({ message: `El usuario con rol ${usuario.rol} no puede ser miembro del tribunal` });
        }

        // Verificar que la evaluación existe antes del upsert
        const checkEval = await prisma.evaluacionDefensaPrivada.findUnique({
            where: { id: Number(evaluacionId) }
        });
        if (!checkEval) {
            console.error('DEBUG: Evaluación no encontrada:', evaluacionId);
            return reply.code(404).send({ message: 'Evaluación de defensa no encontrada' });
        }
        console.log('DEBUG: Procediendo con upsert para participante:', usuarioId);
        const participante = await prisma.participanteDefensaPrivada.upsert({
            where: {
                evaluacionId_usuarioId: {
                    evaluacionId: Number(evaluacionId),
                    usuarioId: Number(usuarioId)
                }
            },
            update: {
                tipoParticipante: finalTipo,
                rol
            },
            create: {
                evaluacionId: Number(evaluacionId),
                usuarioId: Number(usuarioId),
                tipoParticipante: finalTipo,
                rol
            },
            include: {
                usuario: {
                    select: { id: true, nombres: true, apellidos: true, rol: true, correoInstitucional: true }
                }
            }
        });

        // Notificar al participante (sin esperar a que bloquee la respuesta)
        const evaluacion = await prisma.evaluacionDefensaPrivada.findUnique({
            where: { id: Number(evaluacionId) },
            include: {
                propuesta: {
                    include: {
                        estudiante: true
                    }
                }
            }
        });

        if (evaluacion) {
            // Notificar al estudiante
            await prisma.notificacion.create({
                data: {
                    mensaje: `Se ha asignado a ${participante.usuario.nombres} ${participante.usuario.apellidos} como ${rol || 'miembro'} del tribunal para tu defensa privada.`,
                    usuarioId: evaluacion.propuesta.estudiante.id
                }
            }).catch(() => { });

            // Notificar al participante
            await prisma.notificacion.create({
                data: {
                    mensaje: `Has sido asignado como ${rol || 'miembro'} del tribunal para la defensa privada de: ${evaluacion.propuesta.titulo}.`,
                    usuarioId: participante.usuarioId
                }
            }).catch(() => { });

            if (evaluacion.fechaDefensa && (participante.usuario as any).correoInstitucional) {
                sendDefenseNotificationEmail({
                    to: (participante.usuario as any).correoInstitucional,
                    nombre: `${participante.usuario.nombres} ${participante.usuario.apellidos}`,
                    rol: rol || 'Miembro del Tribunal',
                    estudianteNombre: `${evaluacion.propuesta.estudiante.nombres} ${evaluacion.propuesta.estudiante.apellidos}`,
                    tema: evaluacion.propuesta.titulo,
                    fecha: evaluacion.fechaDefensa.toISOString().split('T')[0],
                    hora: evaluacion.horaDefensa?.toLocaleTimeString() || '--:--',
                    aula: evaluacion.aula || 'Por asignar',
                    tipo: 'Privada'
                }).catch((err: any) => request.log.error(`Error enviando correo a participante: ${err.message}`));
            }
        }

        return reply.code(201).send(participante);
    } catch (error: any) {
        console.error('DEBUG ERROR DETALLADO:', error);
        request.log.error(error);
        return reply.code(500).send({ message: 'Error agregando participante: ' + (error.message || 'Error desconocido') });
    }
};

/**
 * Calificar defensa privada (por participante)
 * Acceso: TUTOR, COMITE (solo si son participantes)
 */
export const calificarDefensaPrivada = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const user = request.user as any;
    const { evaluacionId } = request.params as any;
    const { calificacion, comentario } = request.body as any;

    try {
        // Verificar que el usuario es participante
        const participante = await prisma.participanteDefensaPrivada.findUnique({
            where: {
                evaluacionId_usuarioId: {
                    evaluacionId: Number(evaluacionId),
                    usuarioId: user.id
                }
            }
        });

        if (!participante) {
            return reply.code(403).send({ message: 'No es participante de esta defensa' });
        }

        // Actualizar calificación del participante
        const participanteActualizado = await prisma.participanteDefensaPrivada.update({
            where: {
                evaluacionId_usuarioId: {
                    evaluacionId: Number(evaluacionId),
                    usuarioId: user.id
                }
            },
            data: {
                calificacion: calificacion ? Number(calificacion) : null,
                comentario
            }
        });

        // Calcular promedio de calificaciones si todos han calificado
        const todosParticipantes = await prisma.participanteDefensaPrivada.findMany({
            where: { evaluacionId: Number(evaluacionId) }
        });

        const calificaciones = todosParticipantes
            .map(p => Number(p.calificacion))
            .filter(c => c !== null && !isNaN(c)) as number[];

        if (calificaciones.length === todosParticipantes.length && calificaciones.length > 0) {
            const promedio = calificaciones.reduce((a, b) => a + b, 0) / calificaciones.length;
            const nuevoEstado = promedio >= 7 ? 'APROBADA' : 'RECHAZADA';

            const defensaActualizada = await prisma.evaluacionDefensaPrivada.update({
                where: { id: Number(evaluacionId) },
                data: {
                    calificacion: promedio,
                    estado: nuevoEstado,
                    fechaEvaluacion: new Date()
                },
                include: {
                    propuesta: true
                }
            });

            // Si se aprueba, desbloquear la defensa pública
            if (nuevoEstado === 'APROBADA') {
                const defensaPublica = await prisma.evaluacionDefensaPublica.findUnique({
                    where: { propuestaId: defensaActualizada.propuestaId }
                });

                if (defensaPublica && defensaPublica.estado === 'BLOQUEADA') {
                    await prisma.evaluacionDefensaPublica.update({
                        where: { id: defensaPublica.id },
                        data: { estado: 'PENDIENTE' }
                    });
                }
            }
        }

        return participanteActualizado;
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error calificando defensa' });
    }
};

/**
 * Aprobar/Rechazar defensa privada
 * Acceso: DIRECTOR, COORDINADOR
 */
export const finalizarDefensaPrivada = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const user = request.user as any;
    const { id } = request.params as any;
    const { estado, comentarios } = request.body as any; // APROBADA o RECHAZADA

    try {
        // Verificar permisos
        if (!checkRole(user, ['DIRECTOR', 'COORDINADOR'])) {
            return reply.code(403).send({ message: 'Solo directores y coordinadores pueden finalizar defensas' });
        }

        if (!['APROBADA', 'RECHAZADA'].includes(estado)) {
            return reply.code(400).send({ message: 'Estado debe ser APROBADA o RECHAZADA' });
        }

        const defensa = await prisma.evaluacionDefensaPrivada.update({
            where: { id: Number(id) },
            data: {
                estado,
                comentarios,
                fechaEvaluacion: new Date()
            },
            include: {
                propuesta: true
            }
        });

        // Si se aprueba, desbloquear la defensa pública
        if (estado === 'APROBADA') {
            const defensaPublica = await prisma.evaluacionDefensaPublica.findUnique({
                where: { propuestaId: defensa.propuestaId }
            });

            if (defensaPublica && defensaPublica.estado === 'BLOQUEADA') {
                await prisma.evaluacionDefensaPublica.update({
                    where: { id: defensaPublica.id },
                    data: { estado: 'PENDIENTE' }
                });
            }
        }

        return defensa;
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error finalizando defensa privada' });
    }
};

// ============================================
// DEFENSA PÚBLICA
// ============================================

/**
 * Crear/Programar defensa pública
 * Acceso: DIRECTOR, COORDINADOR
 */
export const createDefensaPublica = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const user = request.user as any;
    const { propuestaId, fechaDefensa, horaDefensa, aula } = request.body as any;

    try {
        // Verificar permisos
        if (!checkRole(user, ['DIRECTOR', 'COORDINADOR'])) {
            return reply.code(403).send({ message: 'Solo directores y coordinadores pueden programar defensas' });
        }

        // Verificar que existe defensa privada aprobada
        const defensaPrivada = await prisma.evaluacionDefensaPrivada.findUnique({
            where: { propuestaId: Number(propuestaId) }
        });

        if (!defensaPrivada || (defensaPrivada.estado !== 'APROBADA' && (!defensaPrivada.calificacion || Number(defensaPrivada.calificacion) < 7))) {
            return reply.code(400).send({ message: 'La defensa privada debe estar aprobada primero (nota >= 7.0)' });
        }

        // Verificar si ya existe
        const defensaExistente = await prisma.evaluacionDefensaPublica.findUnique({
            where: { propuestaId: Number(propuestaId) }
        });

        if (defensaExistente) {
            return reply.code(400).send({ message: 'Ya existe una defensa pública para esta propuesta' });
        }

        const defensa = await prisma.evaluacionDefensaPublica.create({
            data: {
                propuestaId: Number(propuestaId),
                fechaDefensa: fechaDefensa ? new Date(fechaDefensa) : null,
                horaDefensa: horaDefensa ? new Date(`1970-01-01T${horaDefensa}`) : null,
                aula,
                estado: fechaDefensa ? 'PROGRAMADA' : 'PENDIENTE'
            },
            include: {
                propuesta: {
                    select: {
                        id: true,
                        titulo: true,
                        estudiante: {
                            select: { id: true, nombres: true, apellidos: true, correoInstitucional: true }
                        }
                    }
                }
            }
        });

        // Notificar al estudiante (sin esperar a que bloquee la respuesta)
        if (fechaDefensa) {
            const fechaStr = new Date(fechaDefensa).toLocaleDateString();
            const mensaje = `Tu defensa pública ha sido programada para el ${fechaStr} a las ${horaDefensa || 'por definir'} en ${aula || 'lugar por asignar'}.`;

            await prisma.notificacion.create({
                data: {
                    mensaje,
                    usuarioId: defensa.propuesta.estudiante.id
                }
            }).catch((err: any) => request.log.error(`Error creando notificación interna: ${err.message}`));

            if ((defensa.propuesta.estudiante as any).correoInstitucional) {
                sendDefenseNotificationEmail({
                    to: (defensa.propuesta.estudiante as any).correoInstitucional,
                    nombre: `${defensa.propuesta.estudiante.nombres} ${defensa.propuesta.estudiante.apellidos}`,
                    rol: 'ESTUDIANTE',
                    tema: defensa.propuesta.titulo,
                    fecha: new Date(fechaDefensa).toISOString().split('T')[0],
                    hora: horaDefensa,
                    aula: aula || 'Por asignar',
                    tipo: 'Pública'
                }).catch((err: any) => request.log.error(`Error enviando correo a estudiante: ${err.message}`));
            }
        }

        return reply.code(201).send(defensa);
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error creando defensa pública' });
    }
};

/**
 * Obtener defensa pública por propuesta
 * Acceso: Todos los roles (con restricciones)
 */
export const getDefensaPublicaByPropuesta = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const user = request.user as any;
    const { propuestaId } = request.params as any;

    try {
        const defensa = await prisma.evaluacionDefensaPublica.findUnique({
            where: { propuestaId: Number(propuestaId) },
            include: {
                propuesta: {
                    select: {
                        id: true,
                        titulo: true,
                        estudiante: {
                            select: { id: true, nombres: true, apellidos: true }
                        }
                    }
                },
                participantes: {
                    include: {
                        usuario: {
                            select: { id: true, nombres: true, apellidos: true, rol: true }
                        }
                    }
                }
            }
        });

        if (!defensa) {
            return reply.code(404).send({ message: 'Defensa pública no encontrada' });
        }

        // Verificar permisos
        const isAdmin = checkRole(user, ['DIRECTOR', 'COORDINADOR']);
        const isStudent = defensa.propuesta.estudiante.id === user.id;
        const isParticipant = defensa.participantes.some(p => p.usuarioId === user.id);

        if (!isAdmin && !isStudent && !isParticipant) {
            return reply.code(403).send({ message: 'No tiene permiso para ver esta defensa' });
        }

        return defensa;
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error obteniendo defensa pública' });
    }
};

/**
 * Actualizar defensa pública
 * Acceso: DIRECTOR, COORDINADOR
 */
export const updateDefensaPublica = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const user = request.user as any;
    const { id } = request.params as any;
    const data = request.body as any;

    try {
        // Verificar permisos
        if (!checkRole(user, ['DIRECTOR', 'COORDINADOR'])) {
            return reply.code(403).send({ message: 'Solo directores y coordinadores pueden actualizar defensas' });
        }

        const updateData: any = {};
        if (data.fechaDefensa) {
            updateData.fechaDefensa = new Date(data.fechaDefensa);
            if (!data.estado) updateData.estado = 'PROGRAMADA';
        }
        if (data.horaDefensa) updateData.horaDefensa = new Date(`1970-01-01T${data.horaDefensa}`);
        if (data.aula) updateData.aula = data.aula;
        if (data.estado) updateData.estado = data.estado;
        if (data.comentarios) updateData.comentarios = data.comentarios;

        const defensa = await prisma.evaluacionDefensaPublica.update({
            where: { id: Number(id) },
            data: updateData,
            include: {
                propuesta: {
                    select: { id: true, titulo: true, estudiante: { select: { id: true, nombres: true, apellidos: true, correoInstitucional: true } } }
                },
                participantes: {
                    include: {
                        usuario: {
                            select: { id: true, nombres: true, apellidos: true, correoInstitucional: true }
                        }
                    }
                }
            }
        });

        // Notificar cambios (estudiante y participantes)
        if (data.fechaDefensa || data.horaDefensa || data.aula) {
            const mensaje = `Se han actualizado los detalles de tu defensa pública: ${defensa.propuesta.titulo}.`;
            await prisma.notificacion.create({
                data: { mensaje, usuarioId: defensa.propuesta.estudiante.id }
            }).catch(() => { });

            if ((defensa.propuesta.estudiante as any).correoInstitucional) {
                sendDefenseNotificationEmail({
                    to: (defensa.propuesta.estudiante as any).correoInstitucional,
                    nombre: `${defensa.propuesta.estudiante.nombres} ${defensa.propuesta.estudiante.apellidos}`,
                    rol: 'ESTUDIANTE',
                    tema: defensa.propuesta.titulo,
                    fecha: defensa.fechaDefensa?.toISOString().split('T')[0] || '--',
                    hora: defensa.horaDefensa?.toLocaleTimeString() || '--',
                    aula: defensa.aula || 'Por asignar',
                    tipo: 'Pública'
                }).catch((err: any) => request.log.error(`Error enviando correo a estudiante: ${err.message}`));
            }

            for (const p of defensa.participantes) {
                const msgPart = `Se han actualizado los detalles de la defensa pública de: ${defensa.propuesta.titulo} donde participas como tribunal.`;
                await prisma.notificacion.create({
                    data: { mensaje: msgPart, usuarioId: p.usuarioId }
                }).catch(() => { });

                if ((p.usuario as any).correoInstitucional) {
                    sendDefenseNotificationEmail({
                        to: (p.usuario as any).correoInstitucional,
                        nombre: `${p.usuario.nombres} ${p.usuario.apellidos}`,
                        rol: (p as any).rol || 'Miembro del Tribunal',
                        estudianteNombre: `${defensa.propuesta.estudiante.nombres} ${defensa.propuesta.estudiante.apellidos}`,
                        tema: defensa.propuesta.titulo,
                        fecha: defensa.fechaDefensa?.toISOString().split('T')[0] || '--',
                        hora: defensa.horaDefensa?.toLocaleTimeString() || '--',
                        aula: defensa.aula || 'Por asignar',
                        tipo: 'Pública'
                    }).catch((err: any) => request.log.error(`Error enviando correo a participante: ${err.message}`));
                }
            }
        }

        return defensa;
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error actualizando defensa pública' });
    }
};

/**
 * Agregar participante a defensa pública
 * Acceso: DIRECTOR, COORDINADOR
 */
export const addParticipanteDefensaPublica = async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('DEBUG: Iniciando addParticipanteDefensaPublica');
    const prisma = request.server.prisma;
    const user = request.user as any;
    const { evaluacionId } = request.params as any;
    const { usuarioId, tipoParticipante, rol } = request.body as any;

    try {
        // Verificar permisos
        if (!checkRole(user, ['DIRECTOR', 'COORDINADOR'])) {
            return reply.code(403).send({ message: 'Solo directores y coordinadores pueden asignar participantes' });
        }

        // Verificar que el usuario existe y tiene el rol apropiado
        const usuario = await prisma.usuario.findUnique({
            where: { id: Number(usuarioId) }
        });

        if (!usuario) {
            return reply.code(404).send({ message: 'Usuario no encontrado' });
        }

        // Robustez: Siempre usar el rol real del usuario si es válido para el tribunal
        let finalTipo: any = tipoParticipante;
        const rolesPermitidos = ['TUTOR', 'COMITE', 'DIRECTOR', 'COORDINADOR'];
        if (rolesPermitidos.includes(usuario.rol)) {
            finalTipo = usuario.rol as any;
        } else {
            return reply.code(400).send({ message: `El usuario con rol ${usuario.rol} no puede ser miembro del tribunal` });
        }

        // Verificar que la evaluación existe antes del upsert
        const checkEval = await prisma.evaluacionDefensaPublica.findUnique({
            where: { id: Number(evaluacionId) }
        });
        if (!checkEval) {
            console.error('DEBUG: Evaluación no encontrada:', evaluacionId);
            return reply.code(404).send({ message: 'Evaluación de defensa no encontrada' });
        }
        console.log('DEBUG: Procediendo con upsert para participante:', usuarioId);
        const participante = await prisma.participanteDefensaPublica.upsert({
            where: {
                evaluacionId_usuarioId: {
                    evaluacionId: Number(evaluacionId),
                    usuarioId: Number(usuarioId)
                }
            },
            update: {
                tipoParticipante: finalTipo,
                rol
            },
            create: {
                evaluacionId: Number(evaluacionId),
                usuarioId: Number(usuarioId),
                tipoParticipante: finalTipo,
                rol
            },
            include: {
                usuario: {
                    select: { id: true, nombres: true, apellidos: true, rol: true, correoInstitucional: true }
                }
            }
        });

        // Notificar al participante (sin esperar a que bloquee la respuesta)
        const evaluacion = await prisma.evaluacionDefensaPublica.findUnique({
            where: { id: Number(evaluacionId) },
            include: {
                propuesta: {
                    include: {
                        estudiante: true
                    }
                }
            }
        });

        if (evaluacion) {
            // Notificar al estudiante
            await prisma.notificacion.create({
                data: {
                    mensaje: `Se ha asignado a ${participante.usuario.nombres} ${participante.usuario.apellidos} como ${rol || 'miembro'} del tribunal para tu defensa pública.`,
                    usuarioId: evaluacion.propuesta.estudiante.id
                }
            }).catch(() => { });

            // Notificar al participante
            await prisma.notificacion.create({
                data: {
                    mensaje: `Has sido asignado como ${rol || 'miembro'} del tribunal para la defensa pública de: ${evaluacion.propuesta.titulo}.`,
                    usuarioId: participante.usuarioId
                }
            }).catch(() => { });

            if (evaluacion.fechaDefensa && (participante.usuario as any).correoInstitucional) {
                sendDefenseNotificationEmail({
                    to: (participante.usuario as any).correoInstitucional,
                    nombre: `${participante.usuario.nombres} ${participante.usuario.apellidos}`,
                    rol: rol || 'Miembro del Tribunal',
                    estudianteNombre: `${evaluacion.propuesta.estudiante.nombres} ${evaluacion.propuesta.estudiante.apellidos}`,
                    tema: evaluacion.propuesta.titulo,
                    fecha: evaluacion.fechaDefensa.toISOString().split('T')[0],
                    hora: evaluacion.horaDefensa?.toLocaleTimeString() || '--:--',
                    aula: evaluacion.aula || 'Por asignar',
                    tipo: 'Pública'
                }).catch((err: any) => request.log.error(`Error enviando correo a participante: ${err.message}`));
            }
        }

        return reply.code(201).send(participante);
    } catch (error: any) {
        console.error('DEBUG ERROR DETALLADO:', error);
        request.log.error(error);
        return reply.code(500).send({ message: 'Error agregando participante: ' + (error.message || 'Error desconocido') });
    }
};

/**
 * Calificar defensa pública (por participante)
 * Acceso: TUTOR, COMITE (solo si son participantes)
 */
export const calificarDefensaPublica = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const user = request.user as any;
    const { evaluacionId } = request.params as any;
    const { calificacion, comentario } = request.body as any;

    try {
        // Verificar que el usuario es participante
        const participante = await prisma.participanteDefensaPublica.findUnique({
            where: {
                evaluacionId_usuarioId: {
                    evaluacionId: Number(evaluacionId),
                    usuarioId: user.id
                }
            }
        });

        if (!participante) {
            return reply.code(403).send({ message: 'No es participante de esta defensa' });
        }

        // Actualizar calificación del participante
        const participanteActualizado = await prisma.participanteDefensaPublica.update({
            where: {
                evaluacionId_usuarioId: {
                    evaluacionId: Number(evaluacionId),
                    usuarioId: user.id
                }
            },
            data: {
                calificacion: calificacion ? Number(calificacion) : null,
                comentario
            }
        });

        // Calcular promedio de calificaciones si todos han calificado
        const todosParticipantes = await prisma.participanteDefensaPublica.findMany({
            where: { evaluacionId: Number(evaluacionId) }
        });

        const calificaciones = todosParticipantes
            .map(p => Number(p.calificacion))
            .filter(c => c !== null && !isNaN(c)) as number[];

        if (calificaciones.length === todosParticipantes.length && calificaciones.length > 0) {
            const promedio = calificaciones.reduce((a, b) => a + b, 0) / calificaciones.length;
            const nuevoEstado = promedio >= 7 ? 'APROBADA' : 'RECHAZADA';

            await prisma.evaluacionDefensaPublica.update({
                where: { id: Number(evaluacionId) },
                data: {
                    calificacion: promedio,
                    estado: nuevoEstado,
                    fechaEvaluacion: new Date()
                }
            });

            // Actualizar resultado final en la propuesta
            const evaluacion = await prisma.evaluacionDefensaPublica.findUnique({
                where: { id: Number(evaluacionId) }
            });

            if (evaluacion) {
                await prisma.propuesta.update({
                    where: { id: evaluacion.propuestaId },
                    data: {
                        resultadoDefensa: nuevoEstado === 'APROBADA' ? 'APROBADO' : 'REPROBADO'
                    }
                });
            }
        }

        return participanteActualizado;
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error calificando defensa' });
    }
};

/**
 * Finalizar defensa pública
 * Acceso: DIRECTOR, COORDINADOR
 */
export const finalizarDefensaPublica = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const user = request.user as any;
    const { id } = request.params as any;
    const { estado, comentarios } = request.body as any; // APROBADA o RECHAZADA

    try {
        // Verificar permisos
        if (!checkRole(user, ['DIRECTOR', 'COORDINADOR'])) {
            return reply.code(403).send({ message: 'Solo directores y coordinadores pueden finalizar defensas' });
        }

        if (!['APROBADA', 'RECHAZADA'].includes(estado)) {
            return reply.code(400).send({ message: 'Estado debe ser APROBADA o RECHAZADA' });
        }

        const defensa = await prisma.evaluacionDefensaPublica.update({
            where: { id: Number(id) },
            data: {
                estado,
                comentarios,
                fechaEvaluacion: new Date()
            }
        });

        return defensa;
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error finalizando defensa pública' });
    }
};

/**
 * Obtener todas las defensas (privadas y públicas) donde el usuario es jurado/participante
 * Acceso: TUTOR, COMITE, DOCENTE_INTEGRACION
 */
export const getDefensasJurado = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const user = request.user as any;

    try {
        // Obtener defensas privadas
        const defensasPrivadas = await prisma.evaluacionDefensaPrivada.findMany({
            where: {
                participantes: {
                    some: { usuarioId: user.id }
                }
            },
            include: {
                propuesta: {
                    select: {
                        id: true,
                        titulo: true,
                        estudiante: {
                            select: {
                                nombres: true,
                                apellidos: true
                            }
                        },
                        entregablesFinales: {
                            where: { isActive: true },
                            select: {
                                id: true,
                                tipo: true,
                                urlArchivo: true
                            }
                        }
                    }
                },
                participantes: {
                    where: { usuarioId: user.id }
                }
            }
        });

        // Obtener defensas públicas
        const defensasPublicas = await prisma.evaluacionDefensaPublica.findMany({
            where: {
                participantes: {
                    some: { usuarioId: user.id }
                }
            },
            include: {
                propuesta: {
                    select: {
                        id: true,
                        titulo: true,
                        estudiante: {
                            select: {
                                nombres: true,
                                apellidos: true
                            }
                        },
                        entregablesFinales: {
                            where: { isActive: true },
                            select: {
                                id: true,
                                tipo: true,
                                urlArchivo: true
                            }
                        }
                    }
                },
                participantes: {
                    where: { usuarioId: user.id }
                }
            }
        });

        // Formatear respuesta unificada
        const privadasCtx = defensasPrivadas.map(d => ({
            id: d.id,
            tipo: 'PRIVADA',
            tema: d.propuesta.titulo,
            estudiante: `${d.propuesta.estudiante.nombres} ${d.propuesta.estudiante.apellidos}`,
            fecha: d.fechaDefensa,
            hora: d.horaDefensa,
            aula: d.aula,
            estado: d.estado,
            rol: d.participantes[0]?.rol || d.participantes[0]?.tipoParticipante,
            calificacion: d.participantes[0]?.calificacion || null,
            comentario: d.participantes[0]?.comentario || null,
            propuestaId: d.propuestaId,
            entregablesFinales: d.propuesta.entregablesFinales || []
        }));

        const publicasCtx = defensasPublicas.map(d => ({
            id: d.id,
            tipo: 'PUBLICA',
            tema: d.propuesta.titulo,
            estudiante: `${d.propuesta.estudiante.nombres} ${d.propuesta.estudiante.apellidos}`,
            fecha: d.fechaDefensa,
            hora: d.horaDefensa,
            aula: d.aula,
            estado: d.estado,
            rol: d.participantes[0]?.rol || d.participantes[0]?.tipoParticipante,
            calificacion: d.participantes[0]?.calificacion || null,
            comentario: d.participantes[0]?.comentario || null,
            propuestaId: d.propuestaId,
            entregablesFinales: d.propuesta.entregablesFinales || []
        }));

        // Combinar y ordenar por fecha descendente (más recientes primero)
        const todas = [...privadasCtx, ...publicasCtx].sort((a, b) => {
            const dateA = a.fecha ? new Date(a.fecha).getTime() : 0;
            const dateB = b.fecha ? new Date(b.fecha).getTime() : 0;
            return dateB - dateA;
        });

        return todas;
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error obteniendo defensas del jurado' });
    }
};

/**
 * Obtener comentarios de todos los participantes de una defensa privada
 */
export const getComentariosDefensaPrivada = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const { evaluacionId } = request.params as any;

    try {
        const participantes = await prisma.participanteDefensaPrivada.findMany({
            where: { evaluacionId: Number(evaluacionId) },
            include: {
                usuario: {
                    select: { nombres: true, apellidos: true, rol: true }
                }
            }
        });

        const formatted = participantes.map(p => ({
            nombreJurado: `${p.usuario.nombres} ${p.usuario.apellidos}`,
            rol: p.rol || p.tipoParticipante,
            calificacion: p.calificacion,
            comentario: p.comentario
        }));

        return formatted;
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error obteniendo comentarios de defensa privada' });
    }
};

/**
 * Obtener comentarios de todos los participantes de una defensa pública
 */
export const getComentariosDefensaPublica = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const { evaluacionId } = request.params as any;

    try {
        const participantes = await prisma.participanteDefensaPublica.findMany({
            where: { evaluacionId: Number(evaluacionId) },
            include: {
                usuario: {
                    select: { nombres: true, apellidos: true, rol: true }
                }
            }
        });

        const formatted = participantes.map(p => ({
            nombreJurado: `${p.usuario.nombres} ${p.usuario.apellidos}`,
            rol: p.rol || p.tipoParticipante,
            calificacion: p.calificacion,
            comentario: p.comentario
        }));

        return formatted;
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error obteniendo comentarios de defensa pública' });
    }
};