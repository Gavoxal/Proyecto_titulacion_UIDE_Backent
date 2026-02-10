import {
    // Defensa Privada
    createDefensaPrivada,
    getDefensaPrivadaByPropuesta,
    updateDefensaPrivada,
    addParticipanteDefensaPrivada,
    calificarDefensaPrivada,
    finalizarDefensaPrivada,
    // Defensa Pública
    createDefensaPublica,
    getDefensaPublicaByPropuesta,
    updateDefensaPublica,
    addParticipanteDefensaPublica,
    calificarDefensaPublica,
    finalizarDefensaPublica,
    getDefensasJurado,
    getComentariosDefensaPrivada,
    getComentariosDefensaPublica
} from '../../controllers/defensa.controller.js';
import { FastifyInstance } from 'fastify';

export default async function (fastify: FastifyInstance, opts: any) {

    fastify.addHook('onRequest', fastify.authenticate);

    // ============================================
    // DEFENSA PRIVADA
    // ============================================

    // POST /privada (Crear/Programar defensa privada)
    fastify.post('/privada', {
        schema: {
            tags: ['Defensas'],
            description: 'Crear/Programar defensa privada (Solo DIRECTOR/COORDINADOR)',
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                required: ['propuestaId'],
                properties: {
                    propuestaId: { type: 'integer' },
                    fechaDefensa: { type: 'string', format: 'date' },
                    horaDefensa: { type: 'string' },
                    aula: { type: 'string' }
                }
            }
        }
    }, createDefensaPrivada);

    // GET /privada/propuesta/:propuestaId (Obtener defensa privada por propuesta)
    fastify.get('/privada/propuesta/:propuestaId', {
        schema: {
            tags: ['Defensas'],
            description: 'Obtener defensa privada por propuesta',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: { propuestaId: { type: 'integer' } }
            }
        }
    }, getDefensaPrivadaByPropuesta);

    // PUT /privada/:id (Actualizar defensa privada)
    fastify.put('/privada/:id', {
        schema: {
            tags: ['Defensas'],
            description: 'Actualizar defensa privada (Solo DIRECTOR/COORDINADOR)',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: { id: { type: 'integer' } }
            },
            body: {
                type: 'object',
                properties: {
                    fechaDefensa: { type: 'string', format: 'date' },
                    horaDefensa: { type: 'string' },
                    aula: { type: 'string' },
                    estado: { type: 'string', enum: ['PENDIENTE', 'PROGRAMADA', 'REALIZADA', 'APROBADA', 'RECHAZADA', 'BLOQUEADA'] },
                    comentarios: { type: 'string' }
                }
            }
        }
    }, updateDefensaPrivada);

    // POST /privada/:evaluacionId/participantes (Agregar participante a defensa privada)
    fastify.post('/privada/:evaluacionId/participantes', {
        schema: {
            tags: ['Defensas'],
            description: 'Agregar participante a defensa privada (Solo DIRECTOR/COORDINADOR)',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: { evaluacionId: { type: 'integer' } }
            },
            body: {
                type: 'object',
                required: ['usuarioId'],
                properties: {
                    usuarioId: { type: 'integer' },
                    tipoParticipante: { type: 'string', enum: ['TUTOR', 'COMITE', 'INTERNO', 'DIRECTOR', 'COORDINADOR'] },
                    rol: { type: 'string' }
                }
            }
        }
    }, addParticipanteDefensaPrivada);

    // PUT /privada/:evaluacionId/calificar (Calificar defensa privada)
    fastify.put('/privada/:evaluacionId/calificar', {
        schema: {
            tags: ['Defensas'],
            description: 'Calificar defensa privada (Solo participantes)',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: { evaluacionId: { type: 'integer' } }
            },
            body: {
                type: 'object',
                properties: {
                    calificacion: { type: 'number', minimum: 0, maximum: 10 },
                    comentario: { type: 'string' }
                }
            }
        }
    }, calificarDefensaPrivada);

    // PUT /privada/:id/finalizar (Finalizar defensa privada)
    fastify.put('/privada/:id/finalizar', {
        schema: {
            tags: ['Defensas'],
            description: 'Aprobar/Rechazar defensa privada (Solo DIRECTOR/COORDINADOR)',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: { id: { type: 'integer' } }
            },
            body: {
                type: 'object',
                required: ['estado'],
                properties: {
                    estado: { type: 'string', enum: ['APROBADA', 'RECHAZADA'] },
                    comentarios: { type: 'string' }
                }
            }
        }
    }, finalizarDefensaPrivada);

    // GET /privada/:evaluacionId/comentarios (Obtener todos los comentarios de jurado)
    fastify.get('/privada/:evaluacionId/comentarios', {
        schema: {
            tags: ['Defensas'],
            description: 'Obtener todos los comentarios de jurado para una defensa privada (Solo DIRECTOR/COORDINADOR)',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: { evaluacionId: { type: 'integer' } }
            }
        }
    }, getComentariosDefensaPrivada);

    // ============================================
    // DEFENSA PÚBLICA
    // ============================================

    // POST /publica (Crear/Programar defensa pública)
    fastify.post('/publica', {
        schema: {
            tags: ['Defensas'],
            description: 'Crear/Programar defensa pública (Solo DIRECTOR/COORDINADOR)',
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                required: ['propuestaId'],
                properties: {
                    propuestaId: { type: 'integer' },
                    fechaDefensa: { type: 'string', format: 'date' },
                    horaDefensa: { type: 'string' },
                    aula: { type: 'string' }
                }
            }
        }
    }, createDefensaPublica);

    // GET /publica/propuesta/:propuestaId (Obtener defensa pública por propuesta)
    fastify.get('/publica/propuesta/:propuestaId', {
        schema: {
            tags: ['Defensas'],
            description: 'Obtener defensa pública por propuesta',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: { propuestaId: { type: 'integer' } }
            }
        }
    }, getDefensaPublicaByPropuesta);

    // PUT /publica/:id (Actualizar defensa pública)
    fastify.put('/publica/:id', {
        schema: {
            tags: ['Defensas'],
            description: 'Actualizar defensa pública (Solo DIRECTOR/COORDINADOR)',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: { id: { type: 'integer' } }
            },
            body: {
                type: 'object',
                properties: {
                    fechaDefensa: { type: 'string', format: 'date' },
                    horaDefensa: { type: 'string' },
                    aula: { type: 'string' },
                    estado: { type: 'string', enum: ['PENDIENTE', 'PROGRAMADA', 'REALIZADA', 'APROBADA', 'RECHAZADA', 'BLOQUEADA'] },
                    comentarios: { type: 'string' }
                }
            }
        }
    }, updateDefensaPublica);

    // POST /publica/:evaluacionId/participantes (Agregar participante a defensa pública)
    fastify.post('/publica/:evaluacionId/participantes', {
        schema: {
            tags: ['Defensas'],
            description: 'Agregar participante a defensa pública (Solo DIRECTOR/COORDINADOR)',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: { evaluacionId: { type: 'integer' } }
            },
            body: {
                type: 'object',
                required: ['usuarioId'],
                properties: {
                    usuarioId: { type: 'integer' },
                    tipoParticipante: { type: 'string', enum: ['TUTOR', 'COMITE', 'INTERNO', 'DIRECTOR', 'COORDINADOR'] },
                    rol: { type: 'string' }
                }
            }
        }
    }, addParticipanteDefensaPublica);

    // PUT /publica/:evaluacionId/calificar (Calificar defensa pública)
    fastify.put('/publica/:evaluacionId/calificar', {
        schema: {
            tags: ['Defensas'],
            description: 'Calificar defensa pública (Solo participantes)',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: { evaluacionId: { type: 'integer' } }
            },
            body: {
                type: 'object',
                properties: {
                    calificacion: { type: 'number', minimum: 0, maximum: 10 },
                    comentario: { type: 'string' }
                }
            }
        }
    }, calificarDefensaPublica);

    // PUT /publica/:id/finalizar (Finalizar defensa pública)
    fastify.put('/publica/:id/finalizar', {
        schema: {
            tags: ['Defensas'],
            description: 'Aprobar/Rechazar defensa pública (Solo DIRECTOR/COORDINADOR)',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: { id: { type: 'integer' } }
            },
            body: {
                type: 'object',
                required: ['estado'],
                properties: {
                    estado: { type: 'string', enum: ['APROBADA', 'RECHAZADA'] },
                    comentarios: { type: 'string' }
                }
            }
        }
    }, finalizarDefensaPublica);

    // GET /publica/:evaluacionId/comentarios (Obtener todos los comentarios de jurado)
    fastify.get('/publica/:evaluacionId/comentarios', {
        schema: {
            tags: ['Defensas'],
            description: 'Obtener todos los comentarios de jurado para una defensa pública (Solo DIRECTOR/COORDINADOR)',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: { evaluacionId: { type: 'integer' } }
            }
        }
    }, getComentariosDefensaPublica);

    // ============================================
    // CONSULTAS JURADO / TUTOR
    // ============================================

    // GET /jurado (Obtener todas las defensas donde es jurado/participante)
    fastify.get('/jurado', {
        schema: {
            tags: ['Defensas'],
            description: 'Obtener mis defensas asignadas (Tutor/Jurado)',
            security: [{ bearerAuth: [] }]
        }
    }, getDefensasJurado);

}