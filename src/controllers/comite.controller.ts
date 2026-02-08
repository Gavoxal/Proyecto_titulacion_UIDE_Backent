import { FastifyReply, FastifyRequest } from 'fastify';

export const asignarJurado = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const { usuarioId, propuestaId, rol } = request.body as any;

    try {
        const asignacion = await prisma.comite.create({
            data: {
                usuarioId: Number(usuarioId),
                propuestaId: Number(propuestaId),
                rol, // JURADO_1, JURADO_2, PRESIDENTE
                fechaAsignada: new Date()
            }
        });
        return reply.code(201).send(asignacion);
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error asignando jurado' });
    }
};

export const getComiteByPropuesta = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const { propuestaId } = request.params as any;

    try {
        const comite = await prisma.comite.findMany({
            where: { propuestaId: Number(propuestaId) },
            include: {
                usuario: {
                    select: { nombres: true, apellidos: true, correoInstitucional: true, rol: true }
                }
            }
        });
        return comite;
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error obteniendo comité' });
    }
};

export const agendarDefensa = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const { propuestaId } = request.params as any;
    const { fechaDefensa } = request.body as any;

    try {
        // Ahora la fecha de defensa está en la Propuesta
        await prisma.propuesta.update({
            where: { id: Number(propuestaId) },
            data: { fechaDefensa: new Date(fechaDefensa) }
        });
        return reply.send({ message: 'Fecha de defensa actualizada exitosamente' });
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error agendando defensa' });
    }
};

export const calificarDefensa = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const { propuestaId } = request.params as any;
    const { calificacion } = request.body as any;
    const usuario = request.user as any;

    try {
        // Un jurado califica SU asignacion
        const asignacion = await prisma.comite.findFirst({
            where: {
                propuestaId: Number(propuestaId),
                usuarioId: usuario.id
            }
        });

        if (!asignacion) {
            return reply.code(404).send({ message: 'No eres parte del comité de esta propuesta' });
        }

        await prisma.comite.update({
            where: {
                usuarioId_propuestaId: {
                    usuarioId: usuario.id,
                    propuestaId: Number(propuestaId)
                }
            },
            data: {
                calificacion: Number(calificacion)
                // Resultado final se gestiona en Propuesta
            }
        });

        return reply.send({ message: 'Calificación registrada' });

    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error calificando defensa' });
    }
};
