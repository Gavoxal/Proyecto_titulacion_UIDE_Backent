
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    console.log("Fixing permissions for 'mcp_agent'...");

    // 1. Validar conexión Admin
    if (!process.env.DATABASE_URL) {
        console.error("No DATABASE_URL found in .env");
        process.exit(1);
    }

    try {
        const connection = await mysql.createConnection(process.env.DATABASE_URL);

        // 2. Definir permisos necesarios
        // El agente mcp necesita:
        // - Leer usuarios (para verificar email)
        // - Insertar/Leer/Actualizar mcp_auth (para flows de codigos)
        // - Leer las vistas RLS (para ver dashboard)
        // - Configurar variables de sesion (SET @...) - Esto usualmente no requiere grant especifico en MySQL moderno si conecta, pero ...

        const grants = [
            "GRANT SELECT ON usuarios TO 'mcp_agent'@'localhost'",
            "GRANT SELECT, INSERT, UPDATE ON mcp_auth TO 'mcp_agent'@'localhost'",
            "GRANT SELECT ON v_propuestas_rls TO 'mcp_agent'@'localhost'",
            "GRANT SELECT ON v_actividades_rls TO 'mcp_agent'@'localhost'",
            "GRANT SELECT ON v_usuarios_rls TO 'mcp_agent'@'localhost'"
            // "GRANT USAGE ON *.* TO 'mcp_agent'@'localhost'" // Ya debe tenerlo
        ];

        for (const query of grants) {
            try {
                await connection.execute(query);
                console.log(`[OK] ${query}`);
            } catch (e) {
                console.error(`[ERROR] Failed to execute: ${query}`, e.message);
                // No salimos, intentamos los demás
            }
        }

        console.log("Permissions update finished.");
        await connection.end();

    } catch (e) {
        console.error("Fatal error connecting as admin:", e);
    }
}

main();
