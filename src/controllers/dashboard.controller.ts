import { FastifyReply, FastifyRequest } from 'fastify';

export const getDirectorStats = async (request: FastifyRequest, reply: FastifyReply) => {
    // @ts-ignore
    const prisma = request.server.prisma;

    try {
        // 1. Contar estudiantes
        const studentsCount = await prisma.usuario.count({
            where: { rol: 'ESTUDIANTE' }
        });

        // 2. Contar propuestas pendientes
        const proposalsCount = await prisma.propuesta.count({
            where: { estado: 'PENDIENTE' }
        });

        // 3. Contar defensas programadas (Privadas y Públicas)
        // Defensas privadas programadas
        const privateDefensesCount = await prisma.evaluacionDefensaPrivada.count({
            where: { estado: 'PROGRAMADA' }
        });

        // Defensas públicas programadas
        const publicDefensesCount = await prisma.evaluacionDefensaPublica.count({
            where: { estado: 'PROGRAMADA' }
        });

        return reply.code(200).send({
            students: studentsCount,
            proposals: proposalsCount,
            defenses: privateDefensesCount + publicDefensesCount
        });

    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error al obtener estadísticas del dashboard' });
    }
};
