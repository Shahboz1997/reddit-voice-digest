# Commit helper for Git 2.30 on Windows when `git commit` fails with "unknown option trailer".
# Uses the real git.exe (not IDE wrappers). Usage:
#   .\scripts\git-commit.ps1 -Message "your message"
#   .\scripts\git-commit.ps1 -Message "fix lint" -All

param(
  [Parameter(Mandatory = $true)]
  [string]$Message,
  [switch]$All
)

$ErrorActionPreference = "Stop"
$git = "C:\Program Files\Git\cmd\git.exe"

if (-not (Test-Path $git)) {
  $git = "git"
}

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if ($All) {
  & $git add -A
}

$status = & $git status --porcelain
if (-not $status) {
  Write-Host "Nothing to commit."
  exit 0
}

# Prefer normal commit via git.exe (bypasses broken wrappers).
& $git commit -m $Message
if ($LASTEXITCODE -eq 0) {
  Write-Host "Committed with git commit."
  exit 0
}

Write-Host "git commit failed; using commit-tree fallback..."

$tree = (& $git write-tree).Trim()
$parent = (& $git rev-parse HEAD).Trim()
$commit = (& $git commit-tree $tree -p $parent -m $Message).Trim()
$branch = (& $git branch --show-current).Trim()
& $git update-ref "refs/heads/$branch" $commit
& $git reset --hard $commit

Write-Host "Committed: $commit ($branch)"
