
import mysql from 'mysql2/promise';

const DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'proyectotesis', // Corrected DB name
    multipleStatements: true
};

async function setupEstudianteRLS() {
    console.log('🎓 Configurando RLS para Estudiantes...\n');

    const connection = await mysql.createConnection(DB_CONFIG);

    try {
        // 1. Crear función para obtener cédula del estudiante
        console.log('📝 Creando función get_student_cedula()...');
        await connection.query(`DROP FUNCTION IF EXISTS get_student_cedula;`);
        await connection.query(`
            CREATE FUNCTION get_student_cedula() RETURNS VARCHAR(15)
            CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
            DETERMINISTIC
            READS SQL DATA
            BEGIN
                RETURN @student_cedula;
            END;
        `);

        // 2. Vista de perfil estudiante
        console.log('📊 Creando vista v_perfil_estudiante...');
        await connection.query(`DROP VIEW IF EXISTS v_perfil_estudiante;`);
        await connection.query(`
            CREATE VIEW v_perfil_estudiante AS
            SELECT 
                u.id,
                u.cedula,
                u.nombres,
                u.apellidos,
                u.correo_institucional,
                u.rol,
                ep.sede,
                ep.escuela,
                ep.periodo_lectivo,
                ep.ciudad,
                ep.provincia
            FROM usuarios u
            LEFT JOIN estudiantes_perfil ep ON u.id = ep.usuario_id
            WHERE u.cedula COLLATE utf8mb4_unicode_ci = get_student_cedula() COLLATE utf8mb4_unicode_ci;
        `);

        // 3. Vista de propuestas
        console.log('📊 Creando vista v_propuestas_estudiante...');
        await connection.query(`DROP VIEW IF EXISTS v_propuestas_estudiante;`);
        // Updated to link areas_conocimiento and trabajo_titulacion
        await connection.query(`
            CREATE VIEW v_propuestas_estudiante AS
            SELECT 
                p.id,
                p.titulo,
                p.objetivos,
                p.problematica,
                ac.nombre AS area_investigacion,
                p.estado,
                p.fecha_publicacion AS fecha_aprobacion,
                CONCAT(t.nombres, ' ', t.apellidos) AS tutor_nombre,
                t.correo_institucional AS tutor_correo
            FROM propuestas p
            INNER JOIN usuarios e ON p.fk_estudiante = e.id
            LEFT JOIN areas_conocimiento ac ON p.area_conocimiento_id = ac.id
            LEFT JOIN trabajo_titulacion tt ON p.id = tt.propuestas_id
            LEFT JOIN usuarios t ON tt.fk_tutor_id = t.id
            WHERE e.cedula COLLATE utf8mb4_unicode_ci = get_student_cedula() COLLATE utf8mb4_unicode_ci;
        `);

        // 4. Vista de actividades
        console.log('📊 Creando vista v_actividades_estudiante...');
        await connection.query(`DROP VIEW IF EXISTS v_actividades_estudiante;`);
        await connection.query(`
            CREATE VIEW v_actividades_estudiante AS
            SELECT 
                a.id AS id,
                a.nombre,
                a.descripcion,
                p.titulo AS propuesta_titulo,
                COUNT(ev.id) AS evidencias_entregadas
            FROM actividades a
            INNER JOIN propuestas p ON a.propuesta_id = p.id
            INNER JOIN usuarios e ON p.fk_estudiante = e.id
            LEFT JOIN evidencia ev ON a.id = ev.actividad_id
            WHERE e.cedula COLLATE utf8mb4_unicode_ci = get_student_cedula() COLLATE utf8mb4_unicode_ci
            GROUP BY a.id, a.nombre, a.descripcion, p.titulo;
        `);

        // 5. Vista de tareas pendientes
        console.log('📊 Creando vista v_tareas_pendientes_estudiante...');
        await connection.query(`DROP VIEW IF EXISTS v_tareas_pendientes_estudiante;`);
        await connection.query(`
            CREATE VIEW v_tareas_pendientes_estudiante AS
            SELECT 
                a.id AS id,
                a.nombre AS actividad,
                a.descripcion,
                p.titulo AS propuesta,
                COALESCE(ev.estado, 'NO_ENTREGADO') AS estado,
                ev.fecha_entrega AS ultima_entrega
            FROM actividades a
            INNER JOIN propuestas p ON a.propuesta_id = p.id
            INNER JOIN usuarios e ON p.fk_estudiante = e.id
            LEFT JOIN evidencia ev ON a.id = ev.actividad_id
            WHERE e.cedula COLLATE utf8mb4_unicode_ci = get_student_cedula() COLLATE utf8mb4_unicode_ci
              AND (ev.estado IS NULL OR ev.estado = 'NO_ENTREGADO');
        `);

        // 6. Vista de evidencias/avances
        console.log('📊 Creando vista v_avances_estudiante...');
        await connection.query(`DROP VIEW IF EXISTS v_avances_estudiante;`);
        await connection.query(`
            CREATE VIEW v_avances_estudiante AS
            SELECT 
                ev.id,
                ev.semana,
                ev.contenido,
                ev.archivo_url,
                ev.fecha_entrega,
                ev.estado,
                ev.calificacion,
                a.nombre AS actividad_nombre,
                p.titulo AS propuesta_titulo
            FROM evidencia ev
            INNER JOIN actividades a ON ev.actividad_id = a.id
            INNER JOIN propuestas p ON a.propuesta_id = p.id
            INNER JOIN usuarios e ON p.fk_estudiante = e.id
            WHERE e.cedula COLLATE utf8mb4_unicode_ci = get_student_cedula() COLLATE utf8mb4_unicode_ci
            ORDER BY ev.fecha_entrega DESC;
        `);

        // 7. Asignar permisos al agente MCP
        console.log('🔑 Asignando permisos a mcp_agent...');

        const vistas = [
            'v_perfil_estudiante',
            'v_propuestas_estudiante',
            'v_actividades_estudiante',
            'v_tareas_pendientes_estudiante',
            'v_avances_estudiante'
        ];

        // Create user if not exists (Basic check, usually idempotent grant works)
        await connection.query(`CREATE USER IF NOT EXISTS 'mcp_agent'@'%' IDENTIFIED BY 'mcp_password';`);

        for (const vista of vistas) {
            await connection.query(`
                GRANT SELECT ON \`proyectotesis\`.${vista} TO 'mcp_agent'@'%';
            `);
        }

        await connection.query(`
            GRANT EXECUTE ON FUNCTION \`proyectotesis\`.get_student_cedula TO 'mcp_agent'@'%';
        `);

        await connection.query('FLUSH PRIVILEGES;');

        console.log('\n✅ Configuración RLS para Estudiantes completada!\n');
        console.log('📋 Vistas creadas:');
        console.log('   ✓ v_perfil_estudiante');
        console.log('   ✓ v_propuestas_estudiante');
        console.log('   ✓ v_actividades_estudiante');
        console.log('   ✓ v_tareas_pendientes_estudiante');
        console.log('   ✓ v_avances_estudiante');
        console.log('\n🔐 Permisos asignados a: mcp_agent');

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

setupEstudianteRLS().catch(console.error);
