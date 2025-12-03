# Script PowerShell para restaurar archivos desde copias *.backup* en el repo.
# Uso: abrir PowerShell en la carpeta del proyecto y ejecutar:
#   .\restore_from_backups.ps1
# El script crea un respaldo de los archivos actuales en .\restore_backup\{timestamp}\ antes de restaurar.

$root = Split-Path -Path $MyInvocation.MyCommand.Path -Parent
Set-Location $root

$timestamp = (Get-Date).ToString("yyyyMMdd_HHmmss")
$backupDir = Join-Path $root ".restore_backup\$timestamp"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

# Patrones a buscar (ajusta si necesitas más)
$patterns = @("*.*.backup*.ts","*.*.backup*.py","*.*.backup*.html","*.*.backup*.css","*.*.backup*.json*","*.*.backup*.css*","*.backup*")

$found = @()
foreach ($pattern in $patterns) {
    $items = Get-ChildItem -Path $root -Recurse -File -Include $pattern -ErrorAction SilentlyContinue
    foreach ($it in $items) {
        $found += $it
    }
}

if ($found.Count -eq 0) {
    Write-Host "No se encontraron archivos de respaldo (*.backup*) en el proyecto." -ForegroundColor Yellow
    exit 0
}

foreach ($f in $found) {
    # calcular ruta original: eliminar la primera aparición de ".backup" y todo lo que sigue hasta la última extensión repetida
    $full = $f.FullName
    # replace pattern: remove ".backup" and following segments like ".fullfix.ts" keeping final extension
    $orig = $full -replace '\.backup[^\\]*',''
    # Si el original no existe, intentar con otras heurísticas:
    if (-not (Test-Path $orig)) {
        # intentar eliminar ".backup" y la última etiqueta repetida conservando extensión
        $parts = [System.IO.Path]::GetFileName($full) -split '\.backup'
        $basename = $parts[0]
        $ext = [System.IO.Path]::GetExtension($full)
        $dir = [System.IO.Path]::GetDirectoryName($full)
        $candidate = Join-Path $dir ($basename + $ext)
        if (Test-Path $candidate) { $orig = $candidate }
    }

    # asegurar directorio destino existe
    $origDir = Split-Path $orig -Parent
    if (-not (Test-Path $origDir)) {
        New-Item -ItemType Directory -Path $origDir -Force | Out-Null
    }

    # respaldar el actual (si existe) antes de sobrescribir
    if (Test-Path $orig) {
        $rel = $orig.Substring($root.Length).TrimStart('\')
        $destBackup = Join-Path $backupDir $rel
        $destDir = Split-Path $destBackup -Parent
        if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
        Copy-Item -Path $orig -Destination $destBackup -Force
        Write-Host "Respaldo creado: $destBackup"
    }

    try {
        Copy-Item -Path $full -Destination $orig -Force
        Write-Host "Restaurado: $orig  <=  $($f.FullName)" -ForegroundColor Green
    } catch {
        Write-Host "Error restaurando $full -> $orig : $_" -ForegroundColor Red
    }
}

Write-Host "`nRestauración completada. Archivos restaurados: $($found.Count). Respaldo original guardado en $backupDir" -ForegroundColor Cyan
