import { FastifyInstance } from 'fastify';
// @ts-ignore
import { importarEstudiantes } from '../../controllers/estudiantes/estudiante.controller.js';

async function estudianteRoutes(fastify: FastifyInstance) {
    fastify.post('/importar-excel', {
        preHandler: [fastify.authenticate, async (request: any, reply: any) => {
            const user = request.user;
            if (!['DIRECTOR', 'COORDINADOR'].includes(user.rol)) {
                return reply.code(403).send({ message: 'No tienes permisos para importar estudiantes' });
            }
        }]
    }, importarEstudiantes);
}

export default estudianteRoutes;
