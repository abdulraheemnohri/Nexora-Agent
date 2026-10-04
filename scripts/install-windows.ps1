$ErrorActionPreference="Stop"
$root=(Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$bin=Join-Path $env:USERPROFILE ".nexora"; New-Item -ItemType Directory -Force $bin | Out-Null
$cmd='@echo off'+[char]13+[char]10+'node "'+$root+'\bin\nexora.js" %*'
Set-Content (Join-Path $bin "nexora.cmd") $cmd
Write-Host "Nexora CLI installed at $bin. Add this directory to PATH if needed."
