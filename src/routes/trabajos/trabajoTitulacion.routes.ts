import {
    createTrabajoTitulacion,
    getTrabajosTitulacion,
    getTrabajoTitulacionById,
    updateTrabajoTitulacion,
    getCargaTutores
} from '../../controllers/trabajoTitulacion.controller.js';
import { FastifyInstance } from 'fastify';

export default async function (fastify: FastifyInstance, opts: any) {

    fastify.addHook('onRequest', fastify.authenticate);

    // GET /stats/carga-tutores (debe ir antes de las rutas con parámetros)
    fastify.get('/stats/carga-tutores', {
        schema: {
            tags: ['Trabajos de Titulación'],
            description: 'Obtener estadísticas de carga de trabajo de tutores',
            security: [{ bearerAuth: [] }],
            response: {
                200: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'integer' },
                            nombres: { type: 'string' },
                            apellidos: { type: 'string' },
                            correoInstitucional: { type: 'string' },
                            trabajosActivos: { type: 'integer' },
                            disponible: { type: 'boolean' }
                        }
                    }
                }
            }
        },
        preHandler: async (request: any, reply: any) => {
            const user = request.user;
            if (!['DIRECTOR', 'COORDINADOR'].includes(user.rol)) {
                return reply.code(403).send({
                    message: 'Solo directores y coordinadores pueden ver la carga de tutores'
                });
            }
        }
    }, getCargaTutores);

    // POST / (Crear asignación)
    fastify.post('/', {
        schema: {
            tags: ['Trabajos de Titulación'],
            description: 'Asignar tutor a propuesta aprobada',
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                required: ['propuestaId', 'tutorId'],
                properties: {
                    propuestaId: { type: 'integer' },
                    tutorId: { type: 'integer' },
                    observaciones: { type: 'string' }
                }
            }
        },
        preHandler: async (request: any, reply: any) => {
            const user = request.user;
            if (!['DIRECTOR', 'COORDINADOR'].includes(user.rol)) {
                return reply.code(403).send({
                    message: 'Solo directores y coordinadores pueden asignar tutores'
                });
            }
        }
    }, createTrabajoTitulacion);

    // GET / (Listar todos)
    fastify.get('/', {
        schema: {
            tags: ['Trabajos de Titulación'],
            description: 'Listar trabajos de titulación con filtros opcionales',
            security: [{ bearerAuth: [] }],
            querystring: {
                type: 'object',
                properties: {
                    tutorId: { type: 'integer' },
                    estudianteId: { type: 'integer' },
                    estado: {
                        type: 'string',
                        enum: ['ACTIVO', 'FINALIZADO', 'CANCELADO']
                    }
                }
            }
        }
    }, getTrabajosTitulacion);

    // GET /:propuestaId/:tutorId (Obtener uno específico)
    fastify.get('/:propuestaId/:tutorId', {
        schema: {
            tags: ['Trabajos de Titulación'],
            description: 'Obtener trabajo de titulación específico',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    propuestaId: { type: 'integer' },
                    tutorId: { type: 'integer' }
                }
            }
        }
    }, getTrabajoTitulacionById);

    // PUT /:propuestaId/:tutorId (Actualizar)
    fastify.put('/:propuestaId/:tutorId', {
        schema: {
            tags: ['Trabajos de Titulación'],
            description: 'Actualizar estado de asignación',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    propuestaId: { type: 'integer' },
                    tutorId: { type: 'integer' }
                }
            },
            body: {
                type: 'object',
                properties: {
                    estadoAsignacion: {
                        type: 'string',
                        enum: ['ACTIVO', 'FINALIZADO', 'CANCELADO']
                    },
                    observaciones: { type: 'string' }
                }
            }
        },
        preHandler: async (request: any, reply: any) => {
            const user = request.user;
            if (!['DIRECTOR', 'COORDINADOR'].includes(user.rol)) {
                return reply.code(403).send({
                    message: 'Solo directores y coordinadores pueden actualizar asignaciones'
                });
            }
        }
    }, updateTrabajoTitulacion);
}
