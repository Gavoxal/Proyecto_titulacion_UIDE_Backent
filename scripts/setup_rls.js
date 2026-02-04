import mysql from 'mysql2/promise';

// Configuración de conexión ADMINISTRATIVA
// Usamos 'root' aquí porque necesitamos permisos para CREAR usuarios y vistas.
const DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'db-proyecto-titulacion',
    multipleStatements: true
};

async function setupRLS() {
    console.log(' Conectando como Administrador...');
    const connection = await mysql.createConnection(DB_CONFIG);

    try {
        // ============================================================
        // PASO 1: Crear el "Agente" (Usuario Restringido)
        // ============================================================
        // Este es el usuario que usará el código JS (mcp-server.js).
        // Le damos una contraseña y permisos mínimos (USAGE significa "puede conectar").
        console.log(' Configurando usuario mcp_agent...');
        await connection.query(`
            CREATE USER IF NOT EXISTS 'mcp_agent'@'%' IDENTIFIED BY 'Agent_Secret_Pass_123!';
        `);
        await connection.query(`GRANT USAGE ON *.* TO 'mcp_agent'@'%';`);

        // ============================================================
        // PASO 2: Superar limitación de MySQL Views
        // ============================================================
        // Las Vistas en MySQL a veces no pueden leer variables (@variable) directamente
        // por temas de caché.
        // SOLUCIÓN: Creamos una función simple que solo devuelve el valor de la variable.
        console.log(' Creando función auxiliar get_app_role()...');

        await connection.query(`DROP FUNCTION IF EXISTS get_app_role;`);

        // Esta función lee la memoria de la sesión actual
        await connection.query(`
            CREATE FUNCTION get_app_role() RETURNS VARCHAR(50) 
            DETERMINISTIC 
            READS SQL DATA
            BEGIN
                RETURN @app_current_role; -- Esta es la variable "mágica"
            END;
        `);

        // ============================================================
        // PASO 3: Crear la VISTA SEGURA (Row-Level Security)
        // ============================================================
        // En lugar de que la IA consulte la tabla 'usuarios' directamente,
        // consultará esta vista 'v_usuarios_rls'.
        // Función para leer ID de usuario actual
        await connection.query(`DROP FUNCTION IF EXISTS get_app_user_id;`);
        await connection.query(`
            CREATE FUNCTION get_app_user_id() RETURNS INT
            DETERMINISTIC 
            READS SQL DATA
            BEGIN
                RETURN @app_current_user_id;
            END;
        `);

        // ============================================================
        // PASO 3: Crear VISTAS SEGURAS (RLS)
        // ============================================================

        // 3.1 Vista Usuarios
        console.log(' Creando Vista Segura v_usuarios_rls...');
        await connection.query(`DROP VIEW IF EXISTS v_usuarios_rls;`);
        await connection.query(`
            CREATE VIEW v_usuarios_rls AS
            SELECT *
            FROM usuarios
            WHERE 
                get_app_role() IN ('DIRECTOR', 'COORDINADOR', 'DOCENTE_INTEGRACION')
                OR id = get_app_user_id();
        `);

        // 3.2 Vista Propuestas
        console.log(' Creando Vista Segura v_propuestas_rls...');
        await connection.query(`DROP VIEW IF EXISTS v_propuestas_rls;`);
        await connection.query(`
            CREATE VIEW v_propuestas_rls AS
            SELECT p.*, 
                   CONCAT(e.nombres, ' ', e.apellidos) as estudiante_nombre,
                   CONCAT(t.nombres, ' ', t.apellidos) as tutor_nombre
            FROM propuestas p
            LEFT JOIN usuarios e ON p.fk_estudiante = e.id
            LEFT JOIN usuarios t ON p.tutor_id = t.id
            WHERE 
                get_app_role() IN ('DIRECTOR', 'COORDINADOR', 'DOCENTE_INTEGRACION')
                OR (get_app_role() = 'TUTOR' AND p.tutor_id = get_app_user_id())
                OR (get_app_role() = 'ESTUDIANTE' AND p.fk_estudiante = get_app_user_id());
        `);

        // 3.3 Vista Actividades
        console.log(' Creando Vista Segura v_actividades_rls...');
        await connection.query(`DROP VIEW IF EXISTS v_actividades_rls;`);
        await connection.query(`
            CREATE VIEW v_actividades_rls AS
            SELECT a.*
            FROM Actividades a
            INNER JOIN propuestas p ON a.propuestas_id = p.id
            WHERE 
                get_app_role() IN ('DIRECTOR', 'COORDINADOR', 'DOCENTE_INTEGRACION')
                OR (get_app_role() = 'TUTOR' AND p.tutor_id = get_app_user_id())
                OR (get_app_role() = 'ESTUDIANTE' AND p.fk_estudiante = get_app_user_id());
        `);

        // ============================================================
        // PASO 4: Asignar Permisos Específicos
        // ============================================================
        // Solo permitimos al agente:
        // 1. Ver la vista (SELECT)
        // 2. Ejecutar la función (EXECUTE)
        // NO tiene acceso directo a la tabla 'usuarios' original.
        console.log(' Asignando permisos limitados...');
        await connection.query(`
            GRANT SELECT ON \`db-proyecto-titulacion\`.v_usuarios_rls TO 'mcp_agent'@'%';
        `);
        await connection.query(`
            GRANT SELECT ON \`db-proyecto-titulacion\`.v_propuestas_rls TO 'mcp_agent'@'%';
        `);
        await connection.query(`
            GRANT SELECT ON \`db-proyecto-titulacion\`.v_actividades_rls TO 'mcp_agent'@'%';
        `);
        await connection.query(`
            GRANT EXECUTE ON FUNCTION \`db-proyecto-titulacion\`.get_app_role TO 'mcp_agent'@'%';
        `);
        await connection.query(`
            GRANT EXECUTE ON FUNCTION \`db-proyecto-titulacion\`.get_app_user_id TO 'mcp_agent'@'%';
        `);

        await connection.query('FLUSH PRIVILEGES;'); // Aplicar cambios

        console.log(' Configuración RLS completada: El ecosistema seguro está listo.');

    } catch (error) {
        console.error(' Error configurando RLS:', error);
    } finally {
        await connection.end();
    }
}

setupRLS();
