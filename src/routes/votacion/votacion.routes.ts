
import {
    submitVotacion,
    getVotacionesByEstudiante,
    getVotacionesByPropuesta,
    getVotacionesByTutor,
    getAllVotaciones,
    deleteVotacion,
    getVotacionesSummary
} from '../../controllers/votacion.controller.js';
import { FastifyInstance } from 'fastify';

export default async function (fastify: FastifyInstance, opts: any) {

    fastify.addHook('onRequest', fastify.authenticate);

    // POST / (Crear/Actualizar votación)
    fastify.post('/', {
        schema: {
            tags: ['Votación de Tutores'],
            description: 'Votar por tutor (Solo ESTUDIANTE)',
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                required: ['tutorId', 'propuestaId', 'prioridad'],
                properties: {
                    tutorId: { type: 'integer' },
                    propuestaId: { type: 'integer' },
                    prioridad: { type: 'integer', minimum: 1, maximum: 3 },
                    justificacion: { type: 'string' }
                }
            }
        }
    }, submitVotacion);

    // GET /estudiante/:estudianteId (Obtener votaciones por estudiante)
    fastify.get('/estudiante/:estudianteId', {
        schema: {
            tags: ['Votación de Tutores'],
            description: 'Obtener votaciones por estudiante',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: { estudianteId: { type: 'integer' } }
            }
        }
    }, getVotacionesByEstudiante);

    // GET /propuesta/:propuestaId (Obtener votaciones por propuesta)
    fastify.get('/propuesta/:propuestaId', {
        schema: {
            tags: ['Votación de Tutores'],
            description: 'Obtener votaciones por propuesta',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: { propuestaId: { type: 'integer' } }
            }
        }
    }, getVotacionesByPropuesta);

    // GET /tutor/:tutorId (Obtener votaciones recibidas por tutor)
    fastify.get('/tutor/:tutorId', {
        schema: {
            tags: ['Votación de Tutores'],
            description: 'Obtener votaciones recibidas por tutor',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: { tutorId: { type: 'integer' } }
            }
        }
    }, getVotacionesByTutor);

    // GET /all (Obtener todas las votaciones - DIRECTOR/COORDINADOR)
    fastify.get('/all', {
        schema: {
            tags: ['Votación de Tutores'],
            description: 'Obtener todas las votaciones (Solo DIRECTOR/COORDINADOR)',
            security: [{ bearerAuth: [] }]
        }
    }, getAllVotaciones);

    // GET /summary (Obtener resumen de votaciones - DIRECTOR/COORDINADOR)
    fastify.get('/summary', {
        schema: {
            tags: ['Votación de Tutores'],
            description: 'Obtener resumen de votaciones para dashboard (Solo DIRECTOR/COORDINADOR)',
            security: [{ bearerAuth: [] }]
        }
    }, getVotacionesSummary);

    // DELETE /:id (Eliminar votación)
    fastify.delete('/:id', {
        schema: {
            tags: ['Votación de Tutores'],
            description: 'Eliminar votación (Solo ESTUDIANTE propietario)',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: { id: { type: 'integer' } }
            }
        }
    }, deleteVotacion);

}
