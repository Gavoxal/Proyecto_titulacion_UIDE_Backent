$file = "c:\Users\ASUS\Desktop\cuato semestre\proyecto-final\Proyecto_titulacion_UIDE_Backent_v2\src\controllers\defensa.controller.ts"
$content = Get-Content $file -Raw

# Remove the estudiantePerfil blocks that contain periodoIngreso
$content = $content -replace '(?m)^(\s+)estudiantePerfil:\s*\{\s*\r?\n\s+select:\s*\{\s*periodoIngreso:\s*true\s*\}\s*\r?\n\s+\},\s*\r?\n', ''

# Write back
$content | Set-Content $file -NoNewline

Write-Host "Fixed defensa.controller.ts - removed estudiantePerfil references"
