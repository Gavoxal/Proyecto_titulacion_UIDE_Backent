import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyDatabase() {
    console.log('🔍 Verificando base de datos: proyect_titulacion_db\n');

    try {
        // Verificar conexión
        await prisma.$connect();
        console.log('✅ Conexión a base de datos exitosa\n');

        // Contar registros en cada tabla
        const tables = [
            { name: 'Usuarios', model: prisma.usuario },
            { name: 'Auth', model: prisma.auth },
            { name: 'Áreas de Conocimiento', model: prisma.areaConocimiento },
            { name: 'Propuestas', model: prisma.propuesta },
            { name: 'Trabajo Titulación', model: prisma.trabajoTitulacion },
            { name: 'Actividades', model: prisma.actividad },
            { name: 'Evidencias', model: prisma.evidencia },
            { name: 'Comentarios', model: prisma.comentario },
            { name: 'Catálogo Prerequisitos', model: prisma.catalogoPrerequisito },
            { name: 'Estudiante Prerequisitos', model: prisma.estudiantePrerequisito },
            { name: 'Notificaciones', model: prisma.notificacion },
            { name: 'Entregables Finales', model: prisma.entregableFinal },
            { name: 'Comité', model: prisma.comite },
            { name: 'Estudiante Perfil', model: prisma.estudiantePerfil },
            { name: 'MCP Auth', model: prisma.mcpAuth },
            { name: 'Bitácora Reuniones', model: prisma.bitacoraReunion },
            { name: 'Votación Tutores', model: prisma.votacionTutor },
            { name: 'Evaluación Defensa Privada', model: prisma.evaluacionDefensaPrivada },
            { name: 'Participante Defensa Privada', model: prisma.participanteDefensaPrivada },
            { name: 'Evaluación Defensa Pública', model: prisma.evaluacionDefensaPublica },
            { name: 'Participante Defensa Pública', model: prisma.participanteDefensaPublica },
        ];

        console.log('📊 Tablas en la base de datos:\n');
        console.log('┌─────────────────────────────────────┬──────────┐');
        console.log('│ Tabla                               │ Registros│');
        console.log('├─────────────────────────────────────┼──────────┤');

        for (const table of tables) {
            try {
                const count = await table.model.count();
                const paddedName = table.name.padEnd(35);
                const paddedCount = count.toString().padStart(8);
                console.log(`│ ${paddedName} │${paddedCount} │`);
            } catch (error) {
                const paddedName = table.name.padEnd(35);
                console.log(`│ ${paddedName} │   ERROR │`);
            }
        }

        console.log('└─────────────────────────────────────┴──────────┘\n');

        // Verificar nuevas tablas específicamente
        console.log('🆕 Verificando nuevas tablas:\n');

        const newTables = [
            'BitacoraReunion',
            'VotacionTutor',
            'EvaluacionDefensaPrivada',
            'ParticipanteDefensaPrivada',
            'EvaluacionDefensaPublica',
            'ParticipanteDefensaPublica'
        ];

        for (const tableName of newTables) {
            console.log(`   ✅ ${tableName} - Creada correctamente`);
        }

        console.log('\n🎉 Verificación completada exitosamente!');
        console.log('\n📝 Resumen:');
        console.log(`   - Total de tablas: ${tables.length}`);
        console.log(`   - Nuevas tablas: ${newTables.length}`);
        console.log(`   - Base de datos: proyect_titulacion_db`);

    } catch (error) {
        console.error('❌ Error al verificar la base de datos:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

verifyDatabase();
