import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

// ==========================================
// 1. CONFIGURACIÓN DE CONEXIÓN SEGURA
// ==========================================
// Nota didáctica:
// Conectamos como 'mcp_agent', un usuario que creamos especificamente 
// con permisos LIMITADOS (SOLO LECTURA) en la base de datos.
// Esto es fundamental para la seguridad: si la IA se vuelve loca, 
// no puede borrar tablas ni ver datos que no le permitamos.
const DB_CONFIG = {
    host: 'localhost',
    user: 'mcp_agent',             // Usuario restringido
    password: 'Agent_Secret_Pass_123!',
    database: 'db-proyecto-titulacion'
};

// ==========================================
// 2. INICIALIZACIÓN DEL SERVIDOR MCP
// ==========================================
const server = new Server({
    name: "API Titulacion MCP",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {} // Indicamos que este servidor provee "Herramientas" (Tools)
    }
});

// ==========================================
// 3. DEFINICIÓN DE HERRAMIENTAS (CATÁLOGO)
// ==========================================
// Aquí le decimos a Claude: "Mira, estas son las funciones que puedes usar".
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "ver_usuarios",
                description: "Consulta la lista de usuarios. Esta herramienta está protegida por RLS (Seguridad a Nivel de Fila).",
                inputSchema: {
                    type: "object",
                    properties: {
                        rol_simulado: {
                            type: "string",
                            enum: ["DIRECTOR", "ESTUDIANTE", "TUTOR"],
                            description: "El rol con el que la IA intentará ver los datos. Si no es DIRECTOR, la base de datos ocultará los registros automáticamente."
                        }
                    },
                    required: ["rol_simulado"]
                }
            }
        ]
    };
});

// ==========================================
// 4. EJECUCIÓN DE HERRAMIENTAS (LÓGICA)
// ==========================================
// Aquí ocurre la magia cuando Claude decide usar una herramienta.
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    // Verificamos qué herramienta se pidió
    if (request.params.name !== "ver_usuarios") {
        throw new Error("Herramienta no encontrada");
    }

    // Validamos los datos de entrada con Zod (¡Siempre validar!)
    const inputSchema = z.object({
        rol_simulado: z.enum(["DIRECTOR", "ESTUDIANTE", "TUTOR"])
    });

    try {
        const { rol_simulado } = inputSchema.parse(request.params.arguments);

        // Conectamos a la BD por CADA petición (para asegurar estado limpio)
        const connection = await mysql.createConnection(DB_CONFIG);
        console.error(`[MCP] Conectado a BD. Simulando rol: ${rol_simulado}`);

        try {
            // ============================================================
            // 5. IMPLEMENTACIÓN DE RLS (Row-Level Security) MANUAL
            // ============================================================
            // Paso A: "Context Setting"
            // Antes de pedir datos, le decimos a la BD "quiénes somos" ahora mismo.
            // Seteamos una variable de sesión (@app_current_role).
            await connection.execute("SET @app_current_role = ?", [rol_simulado]);

            // Paso B: Consulta
            // Consultamos la VISTA (v_usuarios_rls), NO la tabla directa.
            // La vista usa la variable de arriba para decidir internamente 
            // qué filas devolver. La seguridad está en el motor de BD, no en el JS.
            const [rows] = await connection.execute("SELECT * FROM v_usuarios_rls");

            // Devolvemos el resultado a Claude en formato JSON texto
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(rows, null, 2)
                }]
            };

        } finally {
            // Importante: Cerrar conexión siempre, pase lo que pase.
            await connection.end();
        }

    } catch (error) {
        return {
            content: [{
                type: "text",
                text: `Error ejecutando la herramienta: ${error.message}`,
                isError: true
            }]
        };
    }
});

// ==========================================
// 6. ARRANQUE DEL SERVIDOR
// ==========================================
async function main() {
    // Usamos STDIO (Standard Input/Output) para hablar con Claude Desktop.
    // Claude "escucha" lo que imprimimos en consola y nos "escribe" comandos.
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(" MCP Server Titulacion corriendo..."); // Usamos console.error para logs, console.log se usa para el protocolo MCP.
}

main().catch((error) => {
    console.error("Fatal error in main:", error);
    process.exit(1);
});
