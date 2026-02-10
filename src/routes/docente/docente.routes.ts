import { FastifyInstance } from 'fastify';
import { getTodosEstudiantesNotasDocente } from '../../controllers/docente.controller.js';

export default async function (fastify: FastifyInstance, opts: any) {
    fastify.addHook('onRequest', fastify.authenticate);

    // Middleware de seguridad
    fastify.addHook('preHandler', async (request: any, reply) => {
        const allowedRoles = ['DOCENTE_INTEGRACION', 'DIRECTOR', 'COORDINADOR'];
        if (!request.user || !allowedRoles.includes(request.user.rol)) {
            return reply.code(403).send({ message: 'Acceso restringido a Docentes de Integración y Personal Autorizado' });
        }
    });

    // GET /estudiantes-notas
    fastify.get('/estudiantes-notas', {
        schema: {
            tags: ['Docente'],
            description: 'Obtener notas de TODOS los estudiantes asignados (Vista Docente)',
            security: [{ bearerAuth: [] }]
        }
    }, getTodosEstudiantesNotasDocente);
}
