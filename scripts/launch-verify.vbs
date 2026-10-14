Dim sh, rc
Set sh = CreateObject("WScript.Shell")
rc = sh.Run("powershell.exe -NoProfile -ExecutionPolicy Bypass -File ""C:\Users\BISHOPICE\.cline\data\workspaces\chat\dpc-gadget-hub\scripts\p2verify-final.ps1""", 0, False)
