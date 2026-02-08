import { getAreasConocimiento } from '../../controllers/areaConocimiento.controller.js';
import { FastifyInstance } from 'fastify';

export default async function (fastify: FastifyInstance, opts: any) {
    fastify.addHook('onRequest', fastify.authenticate);

    fastify.get('/', {
        schema: {
            tags: ['Áreas de Conocimiento'],
            description: 'Listar todas las áreas de conocimiento',
            security: [{ bearerAuth: [] }]
        }
    }, getAreasConocimiento);
}
