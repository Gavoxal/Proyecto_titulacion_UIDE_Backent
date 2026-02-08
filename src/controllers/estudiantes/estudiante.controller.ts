import { FastifyRequest, FastifyReply } from 'fastify';
import * as XLSX from 'xlsx';
import bcrypt from 'bcrypt';

export const importarEstudiantes = async (request: FastifyRequest, reply: FastifyReply) => {
    // @ts-ignore
    const prisma = request.server.prisma;
    // @ts-ignore
    const parts = request.parts();
    let workbook;

    // Handle file upload manually via parts iterator to get the buffer
    for await (const part of parts) {
        if (part.type === 'file') {
            const buffer = await part.toBuffer();
            workbook = XLSX.read(buffer, { type: 'buffer' });
            // break; // Do not break immediately if there are other fields, but we assume file is main
        }
    }

    if (!workbook) {
        return reply.status(400).send({ message: 'No file uploaded' });
    }

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    // 1. Read as Array of Arrays to find the header row
    const rawData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // 2. Find the row index that contains "Cédula"
    let headerRowIndex = -1;
    for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        // Cast to string to be safe and check
        if (row.some((cell: any) => String(cell).trim() === 'Cédula')) {
            headerRowIndex = i;
            break;
        }
    }

    if (headerRowIndex === -1) {
        return reply.status(400).send({ message: 'No se encontró la columna "Cédula" en el archivo.' });
    }

    const headers = rawData[headerRowIndex].map((h: any) => String(h).trim());
    const rows = rawData.slice(headerRowIndex + 1);

    const resultados = [];
    const errores = [];

    for (const rawRow of rows) {
        // Map row array to object using headers
        const row: any = {};
        headers.forEach((header: string, index: number) => {
            // Handle duplicate headers or empty? Assume unique enough.
            row[header] = rawRow[index];
        });

        // Skip empty rows
        if (!row['Cédula'] && !row['Email UIDE']) continue;

        const cedula = row['Cédula'] ? String(row['Cédula']) : null;
        const nombreCompleto = row['Nombre Completo'];
        const email = row['Email UIDE'];

        if (!cedula || !email) {
            errores.push({ row, error: 'Falta Cédula o Email' });
            continue;
        }

        // Generate Credentials
        const username = email.split('@')[0];
        const plainPassword = 'estudiante123'; // Default password for testing
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        try {
            await prisma.$transaction(async (tx) => {
                // 1. Create or Update Usuario
                // Check if user exists
                let usuario = await tx.usuario.findUnique({ where: { cedula } });

                if (!usuario) {
                    // Split nombreCompleto for basic compatibility
                    const nameParts = nombreCompleto ? nombreCompleto.split(' ') : ['Estudiante'];
                    let nombres = '';
                    let apellidos = '';

                    // Heuristic: Last 2 are names, Rest are surnames? Or First 2 surnames?
                    // Usually in lists: "Abad Montesdeoca Nicole Belen" -> Apellidos: Abad Montesdeoca
                    if (nameParts.length >= 3) {
                        apellidos = nameParts.slice(0, 2).join(' ');
                        nombres = nameParts.slice(2).join(' ');
                    } else if (nameParts.length === 2) {
                        apellidos = nameParts[0];
                        nombres = nameParts[1];
                    } else {
                        apellidos = nameParts[0];
                        nombres = 'Sin Nombre';
                    }

                    usuario = await tx.usuario.create({
                        data: {
                            cedula,
                            nombres,
                            apellidos,
                            correoInstitucional: email,
                            rol: 'ESTUDIANTE'
                        }
                    });

                    // 2. Create Credentials in Auth
                    // @ts-ignore
                    await tx.auth.create({
                        data: {
                            username: email,
                            password: hashedPassword,
                            usuarioId: usuario.id
                        }
                    });
                }

                // 3. Create/Update Student Profile
                // @ts-ignore
                await tx.estudiantePerfil.upsert({
                    where: { usuarioId: usuario.id },
                    update: {
                        sexo: row['Sexo'],
                        estadoEscuela: row['Estado en Escuela'],
                        sede: row['Sede'],
                        escuela: row['Escuela'],
                        codigoMalla: row['Código de Malla'],
                        malla: row['Malla'],
                        periodoLectivo: row['Período Lectivo'],
                        ciudad: row['Ciudad'],
                        provincia: row['Provincia'],
                        pais: row['País']
                    },
                    create: {
                        sexo: row['Sexo'],
                        estadoEscuela: row['Estado en Escuela'],
                        sede: row['Sede'],
                        escuela: row['Escuela'],
                        codigoMalla: row['Código de Malla'],
                        malla: row['Malla'],
                        periodoLectivo: row['Período Lectivo'],
                        ciudad: row['Ciudad'],
                        provincia: row['Provincia'],
                        pais: row['País'],
                        usuarioId: usuario.id
                    }
                });

                return usuario;
            });

            // Check if it was created or found
            resultados.push({ cedula, email, status: 'Procesado' });

        } catch (error) {
            console.error('Error importing row:', error);
            errores.push({ row, error: 'Error al guardar en BD: ' + (error as Error).message });
        }
    }

    return reply.send({
        message: 'Import processed',
        creados: resultados,
        errores
    });
};
