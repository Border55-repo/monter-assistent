param([int]$Port = 4174)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Installer Node.js LTS før du starter appen.' }
if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'node_modules'))) { npm install; if ($LASTEXITCODE -ne 0) { throw 'Installasjonen mislyktes.' } }
if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'dist/index.html'))) { npm run build; if ($LASTEXITCODE -ne 0) { throw 'Byggingen mislyktes.' } }
Write-Host "Montér Assistent: http://127.0.0.1:$Port/"
Write-Host 'Stopp serveren med Ctrl+C. Ingen data publiseres eksternt.'
npm run preview -- --port $Port --strictPort
