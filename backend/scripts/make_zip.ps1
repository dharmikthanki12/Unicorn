Add-Type -AssemblyName System.IO.Compression.FileSystem

$destDir = "C:\Users\ISHA THANKI1\Desktop\unicorn"
$staging = Join-Path $env:TEMP ("unicorn_staging_" + [Guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $staging -Force | Out-Null

Copy-Item -Path (Join-Path $destDir "backend") -Destination (Join-Path $staging "backend") -Recurse
Copy-Item -Path (Join-Path $destDir "src") -Destination (Join-Path $staging "src") -Recurse
Copy-Item -Path (Join-Path $destDir "public") -Destination (Join-Path $staging "public") -Recurse
Copy-Item -Path (Join-Path $destDir "contracts") -Destination (Join-Path $staging "contracts") -Recurse
Copy-Item -Path (Join-Path $destDir "package.json") -Destination $staging
Copy-Item -Path (Join-Path $destDir "vite.config.js") -Destination $staging
Copy-Item -Path (Join-Path $destDir "index.html") -Destination $staging
Copy-Item -Path (Join-Path $destDir "start-dev.js") -Destination $staging
Copy-Item -Path (Join-Path $destDir ".env.example") -Destination $staging
Copy-Item -Path (Join-Path $destDir "README.md") -Destination $staging
Copy-Item -Path (Join-Path $destDir "UNICORN_COMPLETE_SYSTEM_WORKFLOW.md") -Destination $staging

$zipPath = Join-Path $destDir "unicorn-full-project.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
[System.IO.Compression.ZipFile]::CreateFromDirectory($staging, $zipPath)
Remove-Item -Path $staging -Recurse -Force

Get-Item $zipPath | Select-Object Name, Length, FullName

