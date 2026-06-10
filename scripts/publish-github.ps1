param(
  [string]$Message = ""
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

if ([string]::IsNullOrWhiteSpace($Message)) {
  $Message = "Update stock discipline assistant " + (Get-Date -Format "yyyy-MM-dd HH:mm")
}

git add .

$status = git status --short
if (-not $status) {
  Write-Output "No changes to commit."
  exit 0
}

git commit -m $Message
git push origin main
