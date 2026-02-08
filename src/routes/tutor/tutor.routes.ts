import { getMisEstudiantes } from '../../controllers/tutor.controller.js';
import { FastifyInstance } from 'fastify';

export default async function (fastify: FastifyInstance, opts: any) {
    fastify.addHook('onRequest', fastify.authenticate);

    // Middleware para asegurar que solo roles autorizados accedan a estas rutas
    fastify.addHook('preHandler', async (request: any, reply) => {
        const allowedRoles = ['TUTOR', 'DIRECTOR', 'COORDINADOR', 'DOCENTE_INTEGRACION'];

        // Debugging to see what's inside the user object from the token
        console.log('DEBUG [Tutor Route Access]:', {
            id: request.user?.id,
            rol: request.user?.rol,
            name: request.user?.nombre
        });

        if (!request.user || !allowedRoles.includes(request.user.rol)) {
            console.warn(`WARN [Access Denied]: User with role ${request.user?.rol} tried to access tutor routes.`);
            return reply.code(403).send({ message: 'Acceso exclusivo para Tutores y Personal Autorizado' });
        }
    });

    // GET /mis-estudiantes
    fastify.get('/mis-estudiantes', {
        schema: {
            tags: ['Tutor'],
            description: 'Listar estudiantes asignados al tutor logueado',
            security: [{ bearerAuth: [] }]
        }
    }, getMisEstudiantes);
}
