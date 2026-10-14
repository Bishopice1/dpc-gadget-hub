$env:PATH = "C:\Program Files\nodejs;$env:PATH"
Set-Location 'C:\Users\BISHOPICE\.cline\data\workspaces\chat\dpc-gadget-hub'
$out = "$env:TEMP\p2verify4.txt"
"=== START $(Get-Date -Format o) ===" | Out-File $out -Encoding utf8
"--- tsc --noEmit ---" | Out-File $out -Append -Encoding utf8
& 'C:\Program Files\nodejs\npx.cmd' tsc --noEmit 2>&1 | Out-File $out -Append -Encoding utf8
"tsc exit=$LASTEXITCODE" | Out-File $out -Append -Encoding utf8
"--- eslint ---" | Out-File $out -Append -Encoding utf8
& 'C:\Program Files\nodejs\npx.cmd' eslint . 2>&1 | Out-File $out -Append -Encoding utf8
"eslint exit=$LASTEXITCODE" | Out-File $out -Append -Encoding utf8
"--- next build ---" | Out-File $out -Append -Encoding utf8
& 'C:\Program Files\nodejs\npx.cmd' next build 2>&1 | Out-File $out -Append -Encoding utf8
"build exit=$LASTEXITCODE" | Out-File $out -Append -Encoding utf8
"=== DONE $(Get-Date -Format o) ===" | Out-File $out -Append -Encoding utf8
