import bcrypt from 'bcrypt';
import { FastifyReply, FastifyRequest } from 'fastify';
import { sendCredentialsEmail } from '../services/email.service.js';
import * as fs from 'fs';
import * as path from 'path';


export const getUsuarios = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const { rol } = request.query as { rol?: string };

    try {
        const where: any = {};
        if (rol) {
            if (rol.includes(',')) {
                where.rol = { in: rol.split(',') };
            } else {
                where.rol = rol;
            }
        }

        const usuarios = await prisma.usuario.findMany({
            where,
            orderBy: {
                apellidos: 'asc'
            },
            select: {
                id: true,
                cedula: true,
                nombres: true,
                apellidos: true,
                correoInstitucional: true,
                rol: true,
                // @ts-ignore
                designacion: true,
                createdAt: true,
                estudiantePerfil: true
            }
        });
        return reply.code(200).send(usuarios);
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error recuperando usuarios' });
    }
};

export const getUsuarioById = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const { id } = request.params as any;
    try {
        const usuario = await prisma.usuario.findUnique({
            where: { id: Number(id) },
            select: {
                id: true,
                cedula: true,
                nombres: true,
                apellidos: true,
                correoInstitucional: true,
                rol: true,
                // @ts-ignore
                designacion: true,
                createdAt: true,
                estudiantePerfil: true
            }
        });
        if (!usuario) {
            return reply.code(404).send({ message: 'Usuario no encontrado' });
        }
        return reply.code(200).send(usuario);
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error recuperando usuario' });
    }
};

export const createUsuario = async (request: FastifyRequest, reply: FastifyReply) => {
    // @ts-ignore
    const prisma = request.server.prisma;
    const { cedula, nombres, apellidos, correo, clave, rol, designacion } = request.body as any;

    try {
        const safeCorreo = correo?.trim();
        const safeClave = clave?.trim();
        const safeCedula = cedula?.trim();

        const hashedPassword = await bcrypt.hash(safeClave, 10);

        const result = await prisma.$transaction(async (tx) => {
            const nuevoUsuario = await tx.usuario.create({
                data: {
                    cedula: safeCedula,
                    nombres,
                    apellidos,
                    correoInstitucional: safeCorreo,
                    rol: rol || 'ESTUDIANTE',
                    // @ts-ignore
                    designacion
                }
            });

            await tx.auth.create({
                data: {
                    username: safeCorreo,
                    password: hashedPassword,
                    usuarioId: nuevoUsuario.id
                }
            });

            return nuevoUsuario;
        });

        // Enviar correo de credenciales (sin esperar a que bloquee la respuesta)
        sendCredentialsEmail(safeCorreo, `${nombres} ${apellidos}`, safeClave).catch((err: any) => {
            request.log.error(`Error enviando correo a ${safeCorreo}: ${err.message}`);
        });

        return reply.code(201).send(result);
    } catch (error) {
        request.log.error(error);
        if ((error as any).code === 'P2002') {
            const target = (error as any).meta?.target || '';
            if (target.includes('correo')) {
                return reply.code(400).send({ message: 'El Correo Institucional ya está registrado.' });
            }
            if (target.includes('cedula')) {
                return reply.code(400).send({ message: 'La Cédula ya está registrada.' });
            }
            return reply.code(400).send({ message: 'Cédula o Correo ya registrado.' });
        }
        return reply.code(500).send({ message: 'Error creando usuario' });
    }
};

export const updateUsuario = async (request: FastifyRequest, reply: FastifyReply) => {
    // @ts-ignore
    const prisma = request.server.prisma;
    const { id } = request.params as any;
    const data = request.body as any;

    try {
        // Separar clave del resto de datos
        const { clave, ...usuarioData } = data;

        await prisma.$transaction(async (tx) => {
            // Actualizar usuario
            await tx.usuario.update({
                where: { id: Number(id) },
                data: {
                    ...usuarioData,
                    updatedAt: new Date()
                }
            });

            // Si hay clave, actualizar Auth
            if (clave) {
                const hashedPassword = await bcrypt.hash(clave, 10);
                await tx.auth.update({
                    where: { usuarioId: Number(id) },
                    data: { password: hashedPassword }
                });
            }
        });

        const usuarioActualizado = await prisma.usuario.findUnique({ where: { id: Number(id) } });
        return usuarioActualizado;
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error actualizando usuario' });
    }
};

export const deleteUsuario = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = request.server.prisma;
    const { id } = request.params as any;

    try {
        await prisma.usuario.delete({
            where: { id: Number(id) }
        });
        return reply.code(204).send();
    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error eliminando usuario' });
    }
};

/**
 * Carga masiva de usuarios
 * POST /api/v1/usuarios/bulk
 */

// Helper para generar contraseña aleatoria
function generateRandomPassword(length = 10) {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
    let password = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
        password += charset.charAt(Math.floor(Math.random() * n));
    }
    return password;
}

export const bulkCreateUsuarios = async (request: FastifyRequest, reply: FastifyReply) => {
    // @ts-ignore
    const prisma = request.server.prisma;
    const { usuarios } = request.body as { usuarios: any[] };

    if (!usuarios || !Array.isArray(usuarios)) {
        return reply.code(400).send({ message: 'Formato inválido. Se espera un array "usuarios".' });
    }

    console.log('📦 Bulk Upload Recibido. Cantidad:', usuarios.length);

    const resultados = {
        exitosos: [] as any[],
        omitidos: [] as any[], // Duplicados
        fallidos: [] as any[],
        total: usuarios.length,
        detalles: {
            exitosos: [] as any[],
            omitidos: [] as any[],
            fallidos: [] as any[]
        }
    };

    try {
        for (const usuarioData of usuarios) {
            try {
                const { cedula, nombres, apellidos, correo, rol, perfil } = usuarioData;

                // Validar campos requeridos
                if (!cedula || !nombres || !apellidos || !correo) {
                    console.log(`[BULK] Faltan campos para Cédula: ${cedula}, Correo: ${correo}`);
                    resultados.fallidos.push(cedula || 'desconocido');
                    resultados.detalles.fallidos.push({
                        cedula: cedula || 'desconocido',
                        error: 'Campos requeridos faltantes'
                    });
                    continue;
                }

                // Sanitize
                const safeCorreo = correo.toString().trim();
                const safeCedula = cedula.toString().trim();

                console.log(`[BULK] Procesando: ${safeCedula} - ${safeCorreo}`);

                // Verificar si ya existe
                const existente = await prisma.usuario.findFirst({
                    where: {
                        OR: [
                            { cedula: safeCedula },
                            { correoInstitucional: safeCorreo }
                        ]
                    }
                });

                if (existente) {
                    console.log(`[BULK] USUARIO EXISTE (ID: ${existente.id}). Omitiendo...`);
                    resultados.omitidos.push(safeCedula);
                    resultados.detalles.omitidos.push({
                        cedula: safeCedula,
                        nombre: `${nombres} ${apellidos}`,
                        motivo: 'Ya registrado'
                    });
                    continue;
                } else {
                    console.log(`[BULK] Usuario NO encontrado. Creando...`);
                }

                // Generar contraseña aleatoria si no viene (o forzarla siempre)
                const rawPassword = generateRandomPassword();
                const hashedPassword = await bcrypt.hash(rawPassword, 10);

                // Preparar datos de creación
                const createData: any = {
                    cedula: safeCedula,
                    nombres,
                    apellidos,
                    correoInstitucional: safeCorreo,
                    rol: rol || 'ESTUDIANTE',
                    auth: {
                        create: {
                            username: safeCorreo, // Usar correo como username
                            password: hashedPassword
                        }
                    }
                };

                // Si es estudiante y tiene perfil, agregar relación
                if ((!rol || rol === 'ESTUDIANTE') && perfil) {
                    createData.estudiantePerfil = {
                        create: {
                            sexo: perfil.sexo,
                            estadoEscuela: perfil.estadoEscuela,
                            sede: perfil.sede,
                            escuela: perfil.escuela,
                            codigoMalla: perfil.codigoMalla,
                            malla: perfil.malla,
                            periodoLectivo: perfil.periodoLectivo,
                            ciudad: perfil.ciudad,
                            provincia: perfil.provincia,
                            pais: perfil.pais
                        }
                    };
                }

                const nuevoUsuario = await prisma.usuario.create({
                    data: createData,
                    select: {
                        id: true,
                        cedula: true,
                        nombres: true,
                        apellidos: true,
                        correoInstitucional: true,
                        rol: true
                    }
                });

                console.log(`[BULK] Usuario Creado: ${nuevoUsuario.id}`);
                resultados.exitosos.push(safeCedula);
                resultados.detalles.exitosos.push(nuevoUsuario);

                // Enviar correo con la contraseña generada
                try {
                    console.log(`[BULK] Enviando correo a ${safeCorreo}...`);
                    await sendCredentialsEmail(safeCorreo, `${nombres} ${apellidos}`, rawPassword);
                } catch (emailError) {
                    console.error(`Error enviando correo a ${safeCorreo}`, emailError);
                }

            } catch (error: any) {
                console.error(`[BULK] Error procesando ${usuarioData.cedula}:`, error);
                resultados.fallidos.push(usuarioData.cedula || 'desconocido');
                resultados.detalles.fallidos.push({
                    cedula: usuarioData.cedula || 'desconocido',
                    error: error.message || 'Error desconocido'
                });
            }
        }

        console.log(`✅ Carga finalizada: ${resultados.exitosos.length} creados, ${resultados.omitidos.length} omitidos, ${resultados.fallidos.length} fallidos`);
        return reply.code(200).send(resultados);

    } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({
            message: 'Error en carga masiva',
            error: error.message
        });
    }
};

export const changePassword = async (request: FastifyRequest, reply: FastifyReply) => {
    // @ts-ignore
    const prisma = request.server.prisma;
    const user = request.user as any;
    const { claveActual, nuevaClave } = request.body as any;

    if (!claveActual || !nuevaClave) {
        return reply.code(400).send({ message: 'Se requieren claveActual y nuevaClave' });
    }

    try {
        // Obtener auth actual para verificar contraseña
        const auth = await prisma.auth.findUnique({
            where: { usuarioId: Number(user.id) }
        });

        if (!auth) {
            return reply.code(404).send({ message: 'Credenciales no encontradas para este usuario' });
        }

        // Verificar contraseña actual
        const cleanHash = auth.password.replace(/^\$2y\$/, '$2b$'); // Compatibilidad hashes PHP/Laravel si hubiere
        const valid = await bcrypt.compare(claveActual, cleanHash);

        if (!valid) {
            return reply.code(401).send({ message: 'La contraseña actual es incorrecta' });
        }

        // Hashear nueva contraseña
        const hashedPassword = await bcrypt.hash(nuevaClave, 10);

        // Actualizar
        await prisma.auth.update({
            where: { usuarioId: Number(user.id) },
            data: { password: hashedPassword }
        });

        return reply.code(200).send({ message: 'Contraseña actualizada exitosamente' });

    } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Error al cambiar la contraseña' });
    }
};
