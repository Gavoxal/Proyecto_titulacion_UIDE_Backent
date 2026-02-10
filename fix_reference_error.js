import fs from 'fs';

const filePath = 'src/controllers/defensa.controller.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Normalize for replacement
content = content.replace(/\r\n/g, '\n');

// Fix private defense section
content = content.replace(
    /\/\/ Robustez: Siempre usar el rol real del usuario si es válido para el tribunal\n\s*const rolesPermitidos = \['TUTOR', 'COMITE', 'DIRECTOR', 'COORDINADOR'\];/g,
    `// Robustez: Siempre usar el rol real del usuario si es válido para el tribunal
        let finalTipo: any = tipoParticipante;
        const rolesPermitidos = ['TUTOR', 'COMITE', 'DIRECTOR', 'COORDINADOR'];`
);

// Fix public defense section (it might match multiple times or slightly differently)
// Actually the regex above should match both if they are identical. 
// Let's use a more robust replacement that handles potential slightly different indentations or multiple occurrences.

fs.writeFileSync(filePath, content);
console.log('Archivo actualizado: finalTipo declarado');
