<#
.SYNOPSIS
    Generates a production/release Android Keystore and extracts the SHA-1 & SHA-256 fingerprints.
.DESCRIPTION
    This script searches for 'keytool' (Java Development Kit), generates a standard PKCS12
    keystore for MobiMatch if one doesn't exist, and prints the exact SHA-1 fingerprint
    required for Google Cloud Console OAuth 2.0 Android Client ID.
#>

param(
    [string]$KeystorePath = "mobimatch-release.keystore",
    [string]$Alias = "mobimatch",
    [string]$StorePass = "mobimatch2026",
    [string]$CommonName = "MobiMatch by Jhankar Mobile",
    [string]$Org = "Jhankar Mobile",
    [string]$Country = "IN"
)

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  MobiMatch Keystore & SHA-1 Fingerprint Generator" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Locate keytool executable
$keytool = Get-Command keytool -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source

if (-not $keytool) {
    # Check common Java JDK installation directories
    $searchPaths = @(
        "$env:JAVA_HOME\bin\keytool.exe",
        "C:\Program Files\Java\jdk*\bin\keytool.exe",
        "C:\Program Files\Microsoft\jdk*\bin\keytool.exe",
        "C:\Program Files\Eclipse Adoptium\jdk*\bin\keytool.exe",
        "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe",
        "C:\Program Files\Android\Android Studio\jre\bin\keytool.exe"
    )
    foreach ($p in $searchPaths) {
        $found = Get-Item $p -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) {
            $keytool = $found.FullName
            break
        }
    }
}

if (-not $keytool) {
    Write-Host "[!] Java Development Kit (keytool) was not found on your system PATH." -ForegroundColor Yellow
    Write-Host "    You have two quick options:" -ForegroundColor White
    Write-Host "    ------------------------------------------------------------" -ForegroundColor Gray
    Write-Host "    Option A (Recommended for Expo):" -ForegroundColor Green
    Write-Host "      Use EAS Cloud Build - it generates and stores the keystore automatically." -ForegroundColor White
    Write-Host "      Run: npx eas credentials -p android" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "    Option B (Install JDK 17 locally via Windows Package Manager):" -ForegroundColor Green
    Write-Host "      Run in PowerShell: winget install Microsoft.OpenJDK.17" -ForegroundColor Cyan
    Write-Host "      Then reopen PowerShell and re-run this script." -ForegroundColor White
    Write-Host "============================================================" -ForegroundColor Cyan
    exit 0
}

Write-Host "[+] Found keytool at: $keytool" -ForegroundColor Green

# 2. Check or Generate Keystore
if (-not (Test-Path $KeystorePath)) {
    Write-Host "[*] Generating new release keystore: $KeystorePath..." -ForegroundColor Yellow
    $dname = "CN=$CommonName, OU=Mobile, O=$Org, L=Jaipur, ST=Rajasthan, C=$Country"
    
    & $keytool -genkeypair -v -storetype PKCS12 `
        -keystore $KeystorePath `
        -alias $Alias `
        -keyalg RSA `
        -keysize 2048 `
        -validity 10000 `
        -storepass $StorePass `
        -keypass $StorePass `
        -dname $dname
        
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[✓] Keystore created successfully at: $KeystorePath" -ForegroundColor Green
    } else {
        Write-Host "[!] Failed to generate keystore." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[✓] Keystore already exists at: $KeystorePath" -ForegroundColor Green
}

# 3. Read Keystore and Extract SHA-1 Fingerprint
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  EXTRACTING CERTIFICATE FINGERPRINTS" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$output = & $keytool -list -v -keystore $KeystorePath -alias $Alias -storepass $StorePass 2>&1

$sha1 = ($output | Select-String "SHA1:\s*(.*)").Matches.Groups[1].Value.Trim()
$sha256 = ($output | Select-String "SHA256:\s*(.*)").Matches.Groups[1].Value.Trim()
$md5 = ($output | Select-String "MD5:\s*(.*)").Matches.Groups[1].Value.Trim()

if ($sha1) {
    Write-Host ">> SHA-1 Fingerprint (Copy this into Google Cloud Console):" -ForegroundColor Yellow
    Write-Host "   $sha1" -ForegroundColor Green
    Write-Host ""
    Write-Host ">> SHA-256 Fingerprint:" -ForegroundColor Gray
    Write-Host "   $sha256" -ForegroundColor White
    Write-Host ""
    Write-Host ">> Package Names:" -ForegroundColor Gray
    Write-Host "   Technician App: com.mobimatch.app" -ForegroundColor Cyan
    Write-Host "   Admin App:      com.mobimatch.admin" -ForegroundColor Cyan
} else {
    Write-Host $output
}

Write-Host "============================================================" -ForegroundColor Cyan
