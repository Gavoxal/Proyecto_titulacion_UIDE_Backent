import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import crypto from "crypto";
import { sendEmail } from "./services/email.service.js";
import path from "path";
import { fileURLToPath } from "url";

// Configurar dotenv para buscar en la raíz del proyecto
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
// Asumiendo que mcp-server.js está en src/, root es ..
// Intentar cargar desde la raíz explicita si no se ha cargado
dotenv.config({ path: path.join(rootDir, ".env") });

console.error(`[MCP] Iniciando desde: ${process.cwd()}`);
console.error(`[MCP] DATABASE_URL loaded: ${!!process.env.DATABASE_URL}`);
console.error(`[MCP] GMAIL_USER loaded: ${!!process.env.GMAIL_USER}`);
console.error(`[MCP] GMAIL_PASS loaded: ${!!process.env.GMAIL_PASS}`);
if (process.env.GMAIL_USER) {
    console.error(`[MCP] GMAIL_USER value: ${process.env.GMAIL_USER.substring(0, 5)}***`);
}



// ==========================================
// 1. CONFIGURACIÓN DE CONEXIÓN
// ==========================================
// Función para obtener configuración de la base de datos desde DATABASE_URL
function getDbConfigFromUrl() {
    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL no definida, usando fallback inseguro o limitado.");
        return {
            host: 'localhost',
            user: 'mcp_agent',
            password: 'Agent_Secret_Pass_123!',
            database: 'db-proyecto-titulacion'
        };
    }
    try {
        const url = new URL(process.env.DATABASE_URL);
        return {
            host: url.hostname,
            user: url.username,
            password: url.password,
            database: url.pathname.substring(1),
            port: url.port ? parseInt(url.port) : 3306
        };
    } catch (e) {
        console.error("Error parseando DATABASE_URL", e);
        return {
            host: 'localhost',
            user: 'mcp_agent',
            password: 'Agent_Secret_Pass_123!',
            database: 'db-proyecto-titulacion'
        };
    }
}

const DB_CONFIG = getDbConfigFromUrl();

// ==========================================
// 2. UTILIDADES DE AUTENTICACIÓN
// ==========================================
function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

// ==========================================
// 3. INICIALIZACIÓN DEL SERVIDOR MCP
// ==========================================
const server = new Server({
    name: "API Titulacion MCP",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {}
    }
});

// ==========================================
// 4. DEFINICIÓN DE HERRAMIENTAS (CATÁLOGO)
// ==========================================
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "solicitar_codigo",
                description: "Paso 1: Solicita un código de autenticación que será enviado a tu correo electrónico.",
                inputSchema: {
                    type: "object",
                    properties: {
                        email: { type: "string", description: "El correo electrónico institucional del usuario." }
                    },
                    required: ["email"]
                }
            },
            {
                name: "verificar_codigo",
                description: "Paso 2: Verifica el código enviado al correo para obtener un token de sesión.",
                inputSchema: {
                    type: "object",
                    properties: {
                        email: { type: "string" },
                        codigo: { type: "string", description: "El código de 6 dígitos recibido." }
                    },
                    required: ["email", "codigo"]
                }
            },
            {
                name: "ver_mi_dashboard",
                description: "Obtiene la información personalizada. Requiere autenticación previa.",
                inputSchema: {
                    type: "object",
                    properties: {
                        auth_token: {
                            type: "string",
                            description: "Token obtenido con verificar_codigo."
                        },
                        // Mantenemos estos para simular el contexto de RLS una vez autenticado,
                        // o podríamos derivarlos del usuario autenticado si la lógica lo permite.
                        // Por simplicidad y seguridad, validaremos que el token pertenezca al usuario real.
                        // Pero RLS necesita variables de sesión. 
                        // En este diseño: El token valida QUE PUEDES EJECUTAR. 
                        // ¿De dónde sacamos el rol y ID? -> Deberíamos buscar el usuario por email en la DB.
                    },
                    required: ["auth_token"]
                }
            },
            {
                name: "listar_usuarios",
                description: "Lista los usuarios registrados en el sistema. Requiere autenticación.",
                inputSchema: {
                    type: "object",
                    properties: {
                        auth_token: {
                            type: "string",
                            description: "Token obtenido con verificar_codigo."
                        }
                    },
                    required: ["auth_token"]
                }
            }
        ]
    };
});

// ==========================================
// 5. EJECUCIÓN DE HERRAMIENTAS (LÓGICA)
// ==========================================
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const connection = await mysql.createConnection(DB_CONFIG);
    console.error("[MCP] CallToolRequest received. Tool:", request.params.name);

    try {
        // --- TOOL: SOLICITAR CODIGO ---
        if (request.params.name === "solicitar_codigo") {
            console.error("[MCP] Tool: solicitar_codigo called");
            let { email } = request.params.arguments;
            email = email.trim();
            console.error(`[MCP] Tool: solicitar_codigo. Email: '${email}'`);

            // 1. Verificar si existe el usuario (opcional, pero recomendado)
            const [users] = await connection.execute("SELECT id FROM usuarios WHERE correo_institucional = ?", [email]);
            console.error(`[MCP] User search result count: ${users.length}`);

            if (users.length === 0) {
                console.error(`[MCP] Error: User not found for email '${email}'`);
                return {
                    content: [{ type: "text", text: "Error: Correo no registrado en el sistema. Asegúrate de usar tu correo institucional." }]
                };
            }

            // 1.5 Invalidate previous active codes for this email
            await connection.execute(
                "UPDATE mcp_auth SET expires_at = NOW() WHERE email = ? AND expires_at > NOW()",
                [email]
            );

            // 2. Generar y guardar código
            const codigo = generateCode();
            // Expira en 15 mins
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

            console.error(`[MCP] Generated code: ${codigo} for user ${email}`);

            await connection.execute(
                "INSERT INTO mcp_auth (email, codigo, expires_at) VALUES (?, ?, ?)",
                [email, codigo, expiresAt]
            );

            // 3. Enviar correo via email service
            console.error(`[MCP] Attempting to send email...`);
            const emailResult = await sendEmail(
                email,
                "Tu Código de Verificación MCP",
                `Tu código es: ${codigo}\n\nÚsalo en la herramienta verificar_codigo.`
            );
            console.error(`[MCP] Email result:`, emailResult);

            if (!emailResult.success) {
                return {
                    content: [{ type: "text", text: `Error enviando correo: ${emailResult.message}. Por favor, verifica la configuración de GMAIL_USER y GMAIL_PASS en el archivo .env` }]
                };
            }

            return {
                content: [{ type: "text", text: `Código enviado a ${email}. Revisa tu bandeja de entrada.` }]
            };
        }

        // --- TOOL: VERIFICAR CODIGO ---
        else if (request.params.name === "verificar_codigo") {
            let { email, codigo } = request.params.arguments;
            email = email.trim();
            codigo = codigo.trim();

            console.error(`[MCP] Tool: verificar_codigo. Email: '${email}', Code: '${codigo}'`);

            // 1. Buscar código válido, no expirado y NO usado
            const [rows] = await connection.execute(
                `SELECT * FROM mcp_auth 
                 WHERE email = ? AND codigo = ? AND expires_at > NOW() AND token IS NULL
                 ORDER BY created_at DESC LIMIT 1`,
                [email, codigo]
            );

            if (rows.length === 0) {
                console.error(`[MCP] Verification failed. Code not found/expired.`);
                return {
                    content: [{ type: "text", text: "Error: Código inválido o expirado." }]
                };
            }

            // 2. Generar Token
            const token = generateToken();
            await connection.execute(
                "UPDATE mcp_auth SET token = ? WHERE id = ?",
                [token, rows[0].id]
            );
            console.error(`[MCP] Verification success. Token generated.`);

            return {
                content: [{ type: "text", text: `Autenticación exitosa. Tu TOKEN es: ${token}\n\nUsa este token en 'ver_mi_dashboard' (parametro: auth_token).` }]
            };
        }

        // --- TOOL: VER MI DASHBOARD ---
        else if (request.params.name === "ver_mi_dashboard") {
            const { auth_token } = request.params.arguments;

            if (!auth_token) {
                return { content: [{ type: "text", text: "Error: se requiere auth_token." }] };
            }

            // 1. Validar Token y obtener Email
            const [authRows] = await connection.execute(
                "SELECT email FROM mcp_auth WHERE token = ?",
                [auth_token]
            );

            if (authRows.length === 0) {
                return { content: [{ type: "text", text: "Error: Token inválido." }] };
            }

            const email = authRows[0].email;

            // 2. Obtener datos reales del usuario basado en el email
            const [users] = await connection.execute(
                "SELECT id, rol, nombres, cedula FROM usuarios WHERE correo_institucional = ?",
                [email]
            );

            if (users.length === 0) {
                return { content: [{ type: "text", text: "Error: Usuario no encontrado para este email." }] };
            }

            const usuario = users[0];

            // Solo permitir estudiantes por ahora con este set de vistas
            if (usuario.rol !== 'ESTUDIANTE') {
                // Fallback o manejo para otros roles si fuera necesario
            }

            console.error(`[MCP] Autenticado: ${email} -> Rol=${usuario.rol}, ID=${usuario.id}, Cedula=${usuario.cedula}`);

            try {
                // A. Context Setting RLS (Usando la cédula para el estudiante)
                await connection.execute("SET @student_cedula = ?", [usuario.cedula]);

                // B. Consultas a las Vistas RLS de Estudiante
                const [perfil] = await connection.execute("SELECT * FROM v_perfil_estudiante");
                const [propuestas] = await connection.execute("SELECT * FROM v_propuestas_estudiante");
                const [actividades] = await connection.execute("SELECT * FROM v_actividades_estudiante");
                const [pendientes] = await connection.execute("SELECT * FROM v_tareas_pendientes_estudiante");
                const [avances] = await connection.execute("SELECT * FROM v_avances_estudiante LIMIT 5");

                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify({
                            mensaje: `Bienvenido Estudiante ${usuario.nombres}`,
                            perfil: perfil[0],
                            propuestas: propuestas,
                            actividades_resumen: actividades,
                            tareas_pendientes: pendientes,
                            ultimos_avances: avances
                        }, null, 2)
                    }]
                };

            } catch (innerError) {
                throw innerError;
            }
        }

        // --- TOOL: LISTAR USUARIOS ---
        else if (request.params.name === "listar_usuarios") {
            const { auth_token } = request.params.arguments;

            if (!auth_token) {
                return { content: [{ type: "text", text: "Error: Se requiere auth_token." }] };
            }

            // 1. Validar Token
            const [authRows] = await connection.execute(
                "SELECT email FROM mcp_auth WHERE token = ?",
                [auth_token]
            );

            if (authRows.length === 0) {
                return { content: [{ type: "text", text: "Error: Token inválido o sesión expirada." }] };
            }

            // 2. Obtener usuarios
            const [users] = await connection.execute(
                "SELECT id, nombres, apellidos, correo_institucional, rol FROM usuarios ORDER BY apellidos ASC"
            );

            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(users, null, 2)
                }]
            };
        }
        else {
            throw new Error("Herramienta no encontrada");
        }

    } catch (error) {
        return {
            content: [{
                type: "text",
                text: `Error del Servidor: ${error.message}`,
                isError: true
            }]
        };
    } finally {
        await connection.end();
    }
});

// ==========================================
// 6. ARRANQUE DEL SERVIDOR
// ==========================================
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(" MCP Server Titulacion (Auth Enabled) corriendo...");
}

main().catch((error) => {
    console.error("Fatal error in main:", error);
    process.exit(1);
});

