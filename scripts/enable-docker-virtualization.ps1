# Enable Windows features required for Docker Desktop / WSL2
$ErrorActionPreference = "Continue"
$log = "$env:TEMP\enable-virt-features.log"
function Log($m) { "$(Get-Date -Format o) $m" | Tee-Object -FilePath $log -Append }

Log "Enabling VirtualMachinePlatform..."
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart | Tee-Object -FilePath $log -Append

Log "Enabling Microsoft-Windows-Subsystem-Linux..."
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart | Tee-Object -FilePath $log -Append

Log "Enabling HypervisorPlatform (optional)..."
dism.exe /online /enable-feature /featurename:HypervisorPlatform /all /norestart | Tee-Object -FilePath $log -Append

Log "Setting WSL default version to 2..."
wsl --set-default-version 2 2>&1 | Tee-Object -FilePath $log -Append

Log "Ensuring hypervisor launch type is Auto..."
bcdedit /set hypervisorlaunchtype Auto 2>&1 | Tee-Object -FilePath $log -Append

Log "DONE. A reboot is usually required."
notepad $log
