import { FastifyReply, FastifyRequest } from 'fastify';

export const getAreasConocimiento = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    try {
        const areas = await prisma.areaConocimiento.findMany({
            orderBy: { nombre: 'asc' }
        });
        return areas;
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error obteniendo áreas de conocimiento' });
    }
};
