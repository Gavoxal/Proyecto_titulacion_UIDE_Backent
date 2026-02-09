import { getDirectorStats } from '../../controllers/dashboard.controller.js';
import { FastifyInstance } from 'fastify';

export default async function (fastify: FastifyInstance, opts: any) {
    // Hook de seguridad global para validar auth
    fastify.addHook('onRequest', fastify.authenticate);

    // GET /stats
    fastify.get('/stats', {
        schema: {
            description: 'Obtener estadísticas globales para el dashboard del director',
            tags: ['Dashboard'],
            security: [{ bearerAuth: [] }],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        students: { type: 'integer' },
                        proposals: { type: 'integer' },
                        defenses: { type: 'integer' }
                    }
                }
            }
        },
        preHandler: async (request: any, reply: any) => {
            const user = request.user as any;
            if (!['DIRECTOR', 'COORDINADOR'].includes(user.rol)) {
                return reply.code(403).send({ message: 'No tienes permisos para ver estas estadísticas' });
            }
        }
    }, getDirectorStats);
}
