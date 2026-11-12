# MobiMatch PostgreSQL Backup Script (Windows) with 7-Day Rolling Retention
param(
    [string]$BackupDir = "$PSScriptRoot\..\backups",
    [string]$DbName = "mobimatch",
    [string]$User = "postgres"
)

$dateStr = Get-Date -Format "yyyyMMdd_HHmmss"
if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$backupFile = Join-Path $BackupDir "mobimatch_$dateStr.sql"
Write-Host "Starting backup for $DbName to $backupFile..."

& "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -U $User -h localhost -d $DbName -f $backupFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backup succeeded: $backupFile"
    # Remove files older than 7 days
    Get-ChildItem -Path $BackupDir -Filter "mobimatch_*.sql" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } | Remove-Item -Force
} else {
    Write-Error "Backup failed with exit code $LASTEXITCODE"
}

