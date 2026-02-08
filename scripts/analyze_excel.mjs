import XLSX from 'xlsx';

const excelPath = 'C:\\Users\\ASUS\\Downloads\\Lista de Estudiantes por Escuela.xlsx';

try {
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    console.log('📊 Estructura del Excel:\n');
    console.log('Nombre de la hoja:', sheetName);
    console.log('\n📋 Columnas encontradas:');
    if (jsonData.length > 0) {
        const columns = Object.keys(jsonData[0]);
        columns.forEach((col, index) => {
            console.log(`  ${index + 1}. ${col}`);
        });

        console.log('\n📝 Primeras 3 filas de ejemplo:\n');
        jsonData.slice(0, 3).forEach((row, index) => {
            console.log(`Fila ${index + 1}:`);
            console.log(JSON.stringify(row, null, 2));
            console.log('---');
        });

        console.log(`\n✅ Total de registros: ${jsonData.length}`);
    } else {
        console.log('⚠️ El archivo está vacío');
    }
} catch (error) {
    console.error('❌ Error al leer el archivo:', error.message);
    console.error('Stack:', error.stack);
}
