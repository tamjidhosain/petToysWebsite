<#
    RAM Cleaner for Windows
    -----------------------
    Frees up physical memory (RAM) on Windows 10 / 11.

    What it can do:
      - Show memory usage and the programs using the most RAM
      - Quick Clean : trims the working set of every running process
                      (pushes unused pages out of RAM; apps keep running)
      - Deep Clean  : Quick Clean + flushes the modified page list and
                      purges the standby list / file cache (needs Admin)
      - Close a program you pick from the list
      - Open Windows "Startup apps" settings so fewer apps launch at boot
      - Uninstall apps silently (no websites / pop-ups) and remove leftover
        files, folders, services, scheduled tasks and registry entries

    Usage:
      Double-click RamCleaner.bat (recommended), or run in PowerShell:
        powershell -ExecutionPolicy Bypass -File .\RamCleaner.ps1
        powershell -ExecutionPolicy Bypass -File .\RamCleaner.ps1 -Quick
        powershell -ExecutionPolicy Bypass -File .\RamCleaner.ps1 -Deep
#>

[CmdletBinding()]
param(
    [switch]$Quick,   # run Quick Clean and exit
    [switch]$Deep,    # run Deep Clean and exit (requires Admin)
    [switch]$Auto,    # keep running and clean whenever RAM use passes -Threshold
    [int]$Threshold = 85,
    [int]$Interval = 60
)

$ErrorActionPreference = 'Stop'

# ---------------------------------------------------------------------------
# Native Windows API helpers
# ---------------------------------------------------------------------------
if (-not ('RamTools' -as [type])) {
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

public static class RamTools
{
    [DllImport("psapi.dll", SetLastError = true)]
    static extern bool EmptyWorkingSet(IntPtr hProcess);

    [DllImport("kernel32.dll", SetLastError = true)]
    static extern IntPtr OpenProcess(uint access, bool inherit, int pid);

    [DllImport("kernel32.dll", SetLastError = true)]
    static extern bool CloseHandle(IntPtr h);

    [DllImport("kernel32.dll")]
    static extern IntPtr GetCurrentProcess();

    [DllImport("ntdll.dll")]
    static extern int NtSetSystemInformation(int infoClass, ref int info, int length);

    [DllImport("advapi32.dll", SetLastError = true)]
    static extern bool OpenProcessToken(IntPtr h, uint access, out IntPtr token);

    [DllImport("advapi32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    static extern bool LookupPrivilegeValue(string system, string name, out long luid);

    [DllImport("advapi32.dll", SetLastError = true)]
    static extern bool AdjustTokenPrivileges(IntPtr token, bool disableAll,
        ref TOKEN_PRIVILEGES newState, int len, IntPtr prev, IntPtr retLen);

    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    struct TOKEN_PRIVILEGES { public int Count; public long Luid; public int Attributes; }

    const uint PROCESS_SET_QUOTA = 0x0100;
    const uint PROCESS_QUERY_LIMITED_INFORMATION = 0x1000;
    const int  SystemMemoryListInformation = 80;

    // Memory list commands
    public const int MemoryEmptyWorkingSets   = 2;
    public const int MemoryFlushModifiedList  = 3;
    public const int MemoryPurgeStandbyList   = 4;
    public const int MemoryPurgeLowPriorityStandbyList = 5;

    public static bool EnablePrivilege(string name)
    {
        IntPtr token;
        if (!OpenProcessToken(GetCurrentProcess(), 0x0020 | 0x0008, out token)) return false;
        try
        {
            long luid;
            if (!LookupPrivilegeValue(null, name, out luid)) return false;
            TOKEN_PRIVILEGES tp = new TOKEN_PRIVILEGES();
            tp.Count = 1; tp.Luid = luid; tp.Attributes = 2; // SE_PRIVILEGE_ENABLED
            if (!AdjustTokenPrivileges(token, false, ref tp, 0, IntPtr.Zero, IntPtr.Zero)) return false;
            return Marshal.GetLastWin32Error() == 0; // 1300 = not all assigned
        }
        finally { CloseHandle(token); }
    }

    public static bool TrimProcess(int pid)
    {
        IntPtr h = OpenProcess(PROCESS_SET_QUOTA | PROCESS_QUERY_LIMITED_INFORMATION, false, pid);
        if (h == IntPtr.Zero) return false;
        try { return EmptyWorkingSet(h); }
        finally { CloseHandle(h); }
    }

    // Returns NTSTATUS (0 = success)
    public static int MemoryListCommand(int command)
    {
        int cmd = command;
        return NtSetSystemInformation(SystemMemoryListInformation, ref cmd, sizeof(int));
    }
}
'@
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
function Test-IsAdmin {
    $id = [Security.Principal.WindowsIdentity]::GetCurrent()
    (New-Object Security.Principal.WindowsPrincipal $id).IsInRole(
        [Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Format-Size([double]$bytes) {
    if ($bytes -ge 1GB) { return '{0:N2} GB' -f ($bytes / 1GB) }
    if ($bytes -ge 1MB) { return '{0:N0} MB' -f ($bytes / 1MB) }
    return '{0:N0} KB' -f ($bytes / 1KB)
}

function Get-MemoryInfo {
    $os = Get-CimInstance Win32_OperatingSystem
    $total = [double]$os.TotalVisibleMemorySize * 1KB
    $free  = [double]$os.FreePhysicalMemory * 1KB
    $info = [ordered]@{
        Total     = $total
        Available = $free
        Used      = $total - $free
        Percent   = [math]::Round((($total - $free) / $total) * 100, 1)
        Standby   = $null
        Modified  = $null
    }
    try {
        $m = Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory
        $info.Standby  = [double]$m.StandbyCacheCoreBytes + [double]$m.StandbyCacheNormalPriorityBytes +
                         [double]$m.StandbyCacheReserveBytes
        $info.Modified = [double]$m.ModifiedPageListBytes
    } catch { }
    [pscustomobject]$info
}

function Show-Bar([double]$percent) {
    $width = 40
    $filled = [int][math]::Round($width * $percent / 100)
    $color = if ($percent -ge 85) { 'Red' } elseif ($percent -ge 65) { 'Yellow' } else { 'Green' }
    Write-Host '  [' -NoNewline
    Write-Host ('#' * $filled) -NoNewline -ForegroundColor $color
    Write-Host ('.' * ($width - $filled)) -NoNewline -ForegroundColor DarkGray
    Write-Host ("] {0}% used" -f $percent)
}

function Show-MemoryStatus {
    $m = Get-MemoryInfo
    Write-Host ''
    Write-Host '  MEMORY STATUS' -ForegroundColor Cyan
    Show-Bar $m.Percent
    Write-Host ("  Total: {0}   In use: {1}   Free: {2}" -f (Format-Size $m.Total), (Format-Size $m.Used), (Format-Size $m.Available))
    if ($null -ne $m.Standby) {
        Write-Host ("  Standby cache: {0}   Modified (waiting to be written): {1}" -f (Format-Size $m.Standby), (Format-Size $m.Modified)) -ForegroundColor DarkGray
    }
    return $m
}

function Get-TopProcesses([int]$count = 15) {
    Get-Process | Where-Object { $_.Id -ne 0 -and $_.Id -ne 4 } |
        Group-Object ProcessName | ForEach-Object {
            [pscustomobject]@{
                Name      = $_.Name
                Instances = $_.Count
                Memory    = ($_.Group | Measure-Object WorkingSet64 -Sum).Sum
                Ids       = $_.Group.Id
            }
        } | Sort-Object Memory -Descending | Select-Object -First $count
}

function Show-TopProcesses([int]$count = 15) {
    $list = @(Get-TopProcesses $count)
    Write-Host ''
    Write-Host '  PROGRAMS USING THE MOST RAM' -ForegroundColor Cyan
    Write-Host ('  {0,-3} {1,-32} {2,6} {3,12}' -f '#', 'Program', 'Count', 'RAM')
    Write-Host ('  ' + ('-' * 56)) -ForegroundColor DarkGray
    for ($i = 0; $i -lt $list.Count; $i++) {
        $p = $list[$i]
        Write-Host ('  {0,-3} {1,-32} {2,6} {3,12}' -f ($i + 1), $p.Name, $p.Instances, (Format-Size $p.Memory))
    }
    return $list
}

function Invoke-QuickClean {
    Write-Host ''
    Write-Host '  Trimming working sets of running processes...' -ForegroundColor Cyan
    [void][RamTools]::EnablePrivilege('SeDebugPrivilege')   # lets admin trim other users' processes
    $before = (Get-MemoryInfo).Available
    $ok = 0; $skipped = 0
    foreach ($p in Get-Process) {
        if ($p.Id -le 4) { continue }
        if ([RamTools]::TrimProcess($p.Id)) { $ok++ } else { $skipped++ }
    }
    Start-Sleep -Milliseconds 800
    $after = (Get-MemoryInfo).Available
    Write-Host ("  Trimmed {0} processes ({1} skipped - protected or no access)." -f $ok, $skipped)
    Report-Freed $before $after
}

function Invoke-DeepClean {
    if (-not (Test-IsAdmin)) {
        Write-Host ''
        Write-Host '  Deep Clean needs Administrator rights.' -ForegroundColor Yellow
        Write-Host '  Close this window and run RamCleaner.bat again, then click "Yes" on the UAC prompt.' -ForegroundColor Yellow
        return
    }
    Write-Host ''
    Write-Host '  Running Deep Clean...' -ForegroundColor Cyan
    $before = (Get-MemoryInfo).Available

    foreach ($priv in 'SeProfileSingleProcessPrivilege', 'SeIncreaseQuotaPrivilege', 'SeDebugPrivilege') {
        [void][RamTools]::EnablePrivilege($priv)
    }

    $steps = @(
        @{ Name = 'Empty all working sets';   Cmd = [RamTools]::MemoryEmptyWorkingSets },
        @{ Name = 'Flush modified page list'; Cmd = [RamTools]::MemoryFlushModifiedList },
        @{ Name = 'Purge standby list';       Cmd = [RamTools]::MemoryPurgeStandbyList }
    )
    foreach ($s in $steps) {
        $status = [RamTools]::MemoryListCommand($s.Cmd)
        if ($status -eq 0) {
            Write-Host ("  [OK]   {0}" -f $s.Name) -ForegroundColor Green
        } else {
            Write-Host ("  [FAIL] {0} (status 0x{1:X8})" -f $s.Name, $status) -ForegroundColor Red
        }
    }
    Start-Sleep -Milliseconds 800
    $after = (Get-MemoryInfo).Available
    Report-Freed $before $after
}

function Report-Freed([double]$before, [double]$after) {
    $diff = $after - $before
    if ($diff -gt 0) {
        Write-Host ("  Freed about {0}. Free RAM now: {1}" -f (Format-Size $diff), (Format-Size $after)) -ForegroundColor Green
    } else {
        Write-Host ("  Free RAM now: {0} (memory was already in good shape)." -f (Format-Size $after)) -ForegroundColor Green
    }
}

# ---------------------------------------------------------------------------
# Shared: pick a program from a list and close it
# ---------------------------------------------------------------------------
$script:CriticalProcesses = 'csrss','wininit','winlogon','services','lsass','smss','svchost','System',
    'Registry','dwm','explorer','MsMpEng','fontdrvhost','Memory Compression','powershell','pwsh',
    'conhost','audiodg','sihost','ctfmon','spoolsv','WmiPrvSE','Idle','Secure System'

function Select-FromList($list, [string]$action) {
    Write-Host ''
    $choice = Read-Host ("  Enter the # of the program to {0} (blank to cancel)" -f $action)
    if ([string]::IsNullOrWhiteSpace($choice)) { return $null }
    $n = 0
    if (-not [int]::TryParse($choice, [ref]$n) -or $n -lt 1 -or $n -gt $list.Count) {
        Write-Host '  Invalid choice.' -ForegroundColor Yellow; return $null
    }
    $target = $list[$n - 1]
    if ($script:CriticalProcesses -contains $target.Name) {
        Write-Host ("  '{0}' is a Windows system process and should not be touched." -f $target.Name) -ForegroundColor Red
        return $null
    }
    return $target
}

function Stop-ProgramGroup($target) {
    Write-Host ("  This will close ALL {0} '{1}' window(s)/process(es). Unsaved work will be lost." -f $target.Instances, $target.Name) -ForegroundColor Yellow
    $confirm = Read-Host '  Type Y to confirm'
    if ($confirm -notmatch '^[Yy]') { Write-Host '  Cancelled.'; return $false }
    foreach ($id in $target.Ids) {
        try { Stop-Process -Id $id -Force -ErrorAction Stop } catch { }
    }
    Start-Sleep -Seconds 1
    Write-Host ("  Closed '{0}'." -f $target.Name) -ForegroundColor Green
    return $true
}

function Invoke-CloseProgram {
    $list = @(Show-TopProcesses 20)
    $target = Select-FromList $list 'close'
    if (-not $target) { return }
    $before = (Get-MemoryInfo).Available
    if (Stop-ProgramGroup $target) { Report-Freed $before (Get-MemoryInfo).Available }
}

# ---------------------------------------------------------------------------
# CPU tools
# ---------------------------------------------------------------------------
function Get-CpuLoad {
    try {
        $v = (Get-CimInstance Win32_PerfFormattedData_PerfOS_Processor -Filter "Name='_Total'").PercentProcessorTime
        return [math]::Min(100, [double]$v)
    } catch {
        try { return [double](Get-CimInstance Win32_Processor | Measure-Object LoadPercentage -Average).Average }
        catch { return $null }
    }
}

function Show-CpuStatus {
    $load = Get-CpuLoad
    $cpu = $null
    try { $cpu = Get-CimInstance Win32_Processor | Select-Object -First 1 } catch { }
    Write-Host ''
    Write-Host '  CPU STATUS' -ForegroundColor Cyan
    if ($null -ne $load) { Show-Bar ([math]::Round($load, 1)) }
    if ($cpu) {
        Write-Host ("  {0}  ({1} cores / {2} threads, {3} MHz)" -f $cpu.Name.Trim(), $cpu.NumberOfCores,
            $cpu.NumberOfLogicalProcessors, $cpu.CurrentClockSpeed) -ForegroundColor DarkGray
    }
}

# Measures CPU use per program over a short sample window.
function Get-TopCpuProcesses([int]$count = 15, [int]$sampleMs = 1500) {
    $cores = [Environment]::ProcessorCount
    $first = @{}
    foreach ($p in Get-Process) {
        if ($p.Id -eq 0) { continue }
        try { $first[$p.Id] = $p.TotalProcessorTime.TotalMilliseconds } catch { }
    }
    $sw = [Diagnostics.Stopwatch]::StartNew()
    Start-Sleep -Milliseconds $sampleMs
    $elapsed = $sw.Elapsed.TotalMilliseconds
    $rows = foreach ($p in Get-Process) {
        if (-not $first.ContainsKey($p.Id)) { continue }
        try { $t = $p.TotalProcessorTime.TotalMilliseconds } catch { continue }
        if ($null -eq $t -or $null -eq $first[$p.Id]) { continue }
        [pscustomobject]@{ Name = $p.ProcessName; Id = $p.Id; Cpu = ($t - $first[$p.Id]) / $elapsed / $cores * 100 }
    }
    $rows | Group-Object Name | ForEach-Object {
        [pscustomobject]@{
            Name      = $_.Name
            Instances = $_.Count
            Cpu       = [math]::Round(($_.Group | Measure-Object Cpu -Sum).Sum, 1)
            Ids       = $_.Group.Id
        }
    } | Sort-Object Cpu -Descending | Select-Object -First $count
}

function Show-TopCpuProcesses([int]$count = 15) {
    Write-Host ''
    Write-Host '  Measuring CPU usage for 1.5 seconds...' -ForegroundColor DarkGray
    $list = @(Get-TopCpuProcesses $count)
    Write-Host ''
    Write-Host '  PROGRAMS USING THE MOST CPU' -ForegroundColor Cyan
    Write-Host ('  {0,-3} {1,-32} {2,6} {3,8}' -f '#', 'Program', 'Count', 'CPU %')
    Write-Host ('  ' + ('-' * 52)) -ForegroundColor DarkGray
    for ($i = 0; $i -lt $list.Count; $i++) {
        $p = $list[$i]
        $color = if ($p.Cpu -ge 25) { 'Red' } elseif ($p.Cpu -ge 10) { 'Yellow' } else { 'Gray' }
        Write-Host ('  {0,-3} {1,-32} {2,6} {3,7}%' -f ($i + 1), $p.Name, $p.Instances, $p.Cpu) -ForegroundColor $color
    }
    return $list
}

function Invoke-LowerPriority {
    $list = @(Show-TopCpuProcesses 20)
    $target = Select-FromList $list 'change priority of'
    if (-not $target) { return }
    Write-Host ''
    Write-Host '  1) Below Normal  (gives other apps more CPU - recommended)'
    Write-Host '  2) Idle / Low    (only runs when the CPU is otherwise free)'
    Write-Host '  3) Normal        (restore default)'
    $p = Read-Host '  Choose priority'
    $class = switch ($p) { '1' { 'BelowNormal' } '2' { 'Idle' } '3' { 'Normal' } default { $null } }
    if (-not $class) { Write-Host '  Cancelled.'; return }
    $ok = 0; $fail = 0
    foreach ($id in $target.Ids) {
        try { (Get-Process -Id $id -ErrorAction Stop).PriorityClass = $class; $ok++ } catch { $fail++ }
    }
    Write-Host ("  Set '{0}' to {1} priority ({2} process(es) changed, {3} failed)." -f $target.Name, $class, $ok, $fail) -ForegroundColor Green
    Write-Host '  This lasts until the program is restarted.' -ForegroundColor DarkGray
}

function Invoke-CloseCpuProgram {
    $list = @(Show-TopCpuProcesses 20)
    $target = Select-FromList $list 'close'
    if (-not $target) { return }
    [void](Stop-ProgramGroup $target)
}

# ---------------------------------------------------------------------------
# Temp files
# ---------------------------------------------------------------------------
function Get-FolderSize([string]$path) {
    if (-not (Test-Path $path)) { return 0 }
    $s = (Get-ChildItem $path -Recurse -Force -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
    if ($s) { return [double]$s } else { return 0 }
}

function Invoke-TempClean {
    $folders = @($env:TEMP, (Join-Path $env:LOCALAPPDATA 'Temp'))
    if (Test-IsAdmin) { $folders += (Join-Path $env:WINDIR 'Temp') }
    $folders = $folders | Where-Object { $_ } | Select-Object -Unique
    Write-Host ''
    Write-Host '  Cleaning temporary files (files in use are skipped)...' -ForegroundColor Cyan
    $total = 0
    foreach ($f in $folders) {
        $before = Get-FolderSize $f
        Get-ChildItem $f -Force -ErrorAction SilentlyContinue | ForEach-Object {
            Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
        }
        $freed = [math]::Max(0, $before - (Get-FolderSize $f))
        $total += $freed
        Write-Host ("  {0,-45} freed {1}" -f $f, (Format-Size $freed))
    }
    Write-Host ("  Total disk space freed: {0}" -f (Format-Size $total)) -ForegroundColor Green
    if (-not (Test-IsAdmin)) { Write-Host '  (Run as Administrator to also clean C:\Windows\Temp)' -ForegroundColor DarkGray }
}

# ---------------------------------------------------------------------------
# Uninstaller (silent uninstall, pop-up blocking, leftover cleanup)
# ---------------------------------------------------------------------------
$script:BrowserNames = 'msedge','chrome','firefox','brave','opera','opera_gx','vivaldi','iexplore'
$script:BlockedCount = 0
$script:GenericNames = 'Microsoft','Microsoft Corporation','Windows','Common Files','Intel','Intel Corporation',
    'NVIDIA','NVIDIA Corporation','AMD','Advanced Micro Devices, Inc.','Google','Google LLC','Mozilla',
    'Packages','Temp','Programs','Apple','Apple Inc.','Adobe','Adobe Inc.','Steam','Realtek','Dell','HP',
    'Lenovo','ASUS','Package Cache','Installer','Program Files','Program Files (x86)','ProgramData',
    'Users','AppData','Local','Roaming','Default','Update','Updater','Uninstall','Setup','Tools','Driver','Drivers'

function Test-Contains([string]$hay, [string]$needle) {
    if (-not $hay -or -not $needle) { return $false }
    return $hay.IndexOf($needle, [StringComparison]::OrdinalIgnoreCase) -ge 0
}

function Test-InFolder([string]$path, [string]$folder) {
    if (-not $path -or -not $folder) { return $false }
    $f = $folder.TrimEnd('\')
    return ($path.TrimEnd('\') -ieq $f) -or $path.StartsWith($f + '\', [StringComparison]::OrdinalIgnoreCase)
}

function Limit-Text([string]$s, [int]$n) {
    if (-not $s) { return '' }
    if ($s.Length -gt $n) { return $s.Substring(0, $n - 1) + '~' }
    return $s
}

function Get-CleanAppName([string]$name) {
    $n = $name -replace '\s*\((x64|x86|64-bit|32-bit|64 bit|32 bit)\)', ''
    $n = $n -replace '\s+v?\d+(\.\d+)+.*$', ''
    $n = $n -replace '\s+(x64|x86)$', ''
    return $n.Trim()
}

# Never allow deleting system or shared top-level folders.
function Test-SafeToDelete([string]$path) {
    if ([string]::IsNullOrWhiteSpace($path)) { return $false }
    try { $full = [IO.Path]::GetFullPath($path.Trim().Trim('"')).TrimEnd('\') } catch { return $false }
    if ($full.Length -le 3) { return $false }   # drive root
    $protected = @($env:WINDIR, $env:ProgramFiles, ${env:ProgramFiles(x86)}, $env:ProgramW6432, $env:ProgramData,
        (Split-Path $env:USERPROFILE -Parent), $env:USERPROFILE, $env:APPDATA, $env:LOCALAPPDATA,
        (Join-Path $env:LOCALAPPDATA 'Programs'), (Join-Path $env:LOCALAPPDATA 'Packages'), $env:TEMP,
        (Join-Path $env:ProgramFiles 'Common Files'), (Join-Path $env:ProgramFiles 'WindowsApps'),
        [Environment]::GetFolderPath('Desktop'), [Environment]::GetFolderPath('MyDocuments'),
        [Environment]::GetFolderPath('StartMenu'), [Environment]::GetFolderPath('CommonStartMenu'),
        [Environment]::GetFolderPath('Programs'), [Environment]::GetFolderPath('CommonPrograms'),
        (Join-Path $env:USERPROFILE 'Downloads'), (Join-Path $env:USERPROFILE 'OneDrive'))
    if (${env:ProgramFiles(x86)}) { $protected += (Join-Path ${env:ProgramFiles(x86)} 'Common Files') }
    foreach ($p in $protected) { if ($p -and ($full -ieq $p.TrimEnd('\'))) { return $false } }
    if (Test-InFolder $full $env:WINDIR) { return $false }
    if (Test-InFolder $full (Join-Path $env:ProgramFiles 'WindowsApps')) { return $false }
    return $true
}

function Get-InstalledApps {
    $apps = New-Object System.Collections.Generic.List[object]
    $keys = @(
        @{ Path = 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall';             Scope = 'All users' },
        @{ Path = 'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall'; Scope = 'All users' },
        @{ Path = 'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall';             Scope = 'Current user' }
    )
    foreach ($k in $keys) {
        if (-not (Test-Path $k.Path)) { continue }
        foreach ($sub in Get-ChildItem $k.Path -ErrorAction SilentlyContinue) {
            try { $p = Get-ItemProperty -LiteralPath $sub.PSPath -ErrorAction Stop } catch { continue }
            if (-not $p.DisplayName) { continue }
            if ($p.SystemComponent -eq 1) { continue }
            if ($p.ParentKeyName -or ($p.ReleaseType -match 'Update|Hotfix')) { continue }
            $size = $null
            if ($p.EstimatedSize) { $size = [math]::Round([double]$p.EstimatedSize / 1024) }
            $apps.Add([pscustomobject]@{
                Type                 = 'Desktop'
                Name                 = ([string]$p.DisplayName).Trim()
                Publisher            = [string]$p.Publisher
                Version              = [string]$p.DisplayVersion
                SizeMB               = $size
                UninstallString      = [string]$p.UninstallString
                QuietUninstallString = [string]$p.QuietUninstallString
                InstallLocation      = [string]$p.InstallLocation
                DisplayIcon          = [string]$p.DisplayIcon
                IsMsi                = ($p.WindowsInstaller -eq 1)
                KeyName              = $sub.PSChildName
                RegPath              = $sub.PSPath
                Package              = $null
            })
        }
    }
    try {
        foreach ($pkg in Get-AppxPackage -ErrorAction Stop) {
            if ($pkg.IsFramework -or $pkg.NonRemovable -or $pkg.IsResourcePackage -or $pkg.SignatureKind -eq 'System') { continue }
            $apps.Add([pscustomobject]@{
                Type = 'Store'; Name = $pkg.Name; Publisher = ($pkg.Publisher -replace '^CN=([^,]+).*$', '$1')
                Version = [string]$pkg.Version; SizeMB = $null; UninstallString = $null; QuietUninstallString = $null
                InstallLocation = $pkg.InstallLocation; DisplayIcon = $null; IsMsi = $false
                KeyName = $null; RegPath = $null; Package = $pkg
            })
        }
    } catch { }
    $apps | Group-Object { "$($_.Type)|$($_.Name)" } | ForEach-Object { $_.Group[0] } | Sort-Object Name
}

function Show-AppList($list) {
    Write-Host ''
    Write-Host ('  {0,-4} {1,-44} {2,-7} {3,-24} {4,8}' -f '#', 'Name', 'Type', 'Publisher', 'Size')
    Write-Host ('  ' + ('-' * 91)) -ForegroundColor DarkGray
    for ($i = 0; $i -lt $list.Count; $i++) {
        $a = $list[$i]
        $size = ''
        if ($a.SizeMB) { $size = '{0:N0} MB' -f $a.SizeMB }
        Write-Host ('  {0,-4} {1,-44} {2,-7} {3,-24} {4,8}' -f ($i + 1), (Limit-Text $a.Name 44), $a.Type, (Limit-Text $a.Publisher 24), $size)
    }
}

function Split-CommandLine([string]$cmd) {
    $cmd = $cmd.Trim()
    if ($cmd.StartsWith('"')) {
        $end = $cmd.IndexOf('"', 1)
        if ($end -gt 0) { return @($cmd.Substring(1, $end - 1), $cmd.Substring($end + 1).Trim()) }
    }
    $i = $cmd.ToLower().IndexOf('.exe')
    if ($i -ge 0) { return @($cmd.Substring(0, $i + 4), $cmd.Substring($i + 4).Trim()) }
    $parts = $cmd.Split(' ', 2)
    if ($parts.Count -gt 1) { return @($parts[0], $parts[1]) }
    return @($parts[0], '')
}

# Works out the silent switch for common installer types.
function Get-SilentArgs([string]$exe, [string]$existing) {
    $leaf = [IO.Path]::GetFileName($exe).ToLower()
    if ($leaf -eq 'update.exe' -and $existing -match '--uninstall') { return '-s' }         # Squirrel (Discord, etc.)
    if ($leaf -match '^unins\d{3}\.exe$') { return '/VERYSILENT /SUPPRESSMSGBOXES /NORESTART' } # Inno Setup
    $text = ''
    try {
        $fi = Get-Item -LiteralPath $exe -ErrorAction Stop
        if ($fi.Length -lt 30MB) { $text = [Text.Encoding]::ASCII.GetString([IO.File]::ReadAllBytes($fi.FullName)) }
    } catch { }
    if ($text -match 'Inno Setup') { return '/VERYSILENT /SUPPRESSMSGBOXES /NORESTART' }
    if ($text -match 'Nullsoft|NSIS') { return ('/S _?=' + (Split-Path $exe -Parent)) }   # NSIS, run in place
    return $null
}

function Get-AppFolder($app) {
    $cands = @()
    if ($app.InstallLocation) { $cands += $app.InstallLocation }
    if ($app.UninstallString -and $app.UninstallString -notmatch 'msiexec|rundll32') {
        $cands += (Split-Path ([Environment]::ExpandEnvironmentVariables((Split-CommandLine $app.UninstallString)[0])) -Parent)
    }
    if ($app.DisplayIcon) {
        $icon = [Environment]::ExpandEnvironmentVariables((($app.DisplayIcon -split ',')[0]).Trim().Trim('"'))
        if ($icon) { $cands += (Split-Path $icon -Parent) }
    }
    foreach ($c in $cands) {
        if (-not $c) { continue }
        $c = [Environment]::ExpandEnvironmentVariables($c.Trim().Trim('"')).TrimEnd('\')
        if ($c -and (Test-SafeToDelete $c) -and -not (Test-InFolder $c $env:TEMP) -and
            -not (Test-InFolder $c (Join-Path $env:ProgramData 'Package Cache'))) { return $c }
    }
    return $null
}

# Returns the name of another installed app that lives in this folder (so we don't delete it).
function Test-FolderShared([string]$folder, $app, $all) {
    foreach ($o in $all) {
        if ($o.Type -ne 'Desktop' -or $o.Name -eq $app.Name) { continue }
        foreach ($p in @($o.InstallLocation, $o.UninstallString, $o.DisplayIcon)) {
            if (-not $p) { continue }
            $q = [Environment]::ExpandEnvironmentVariables($p).Trim().Trim('"')
            if (Test-InFolder $q $folder) { return $o.Name }
        }
    }
    return $null
}

# Closes browser windows that were opened by the uninstaller (feedback pages, ads, surveys).
function Stop-NewBrowsers($before) {
    $filter = ($script:BrowserNames | ForEach-Object { "Name='$_.exe'" }) -join ' OR '
    try { $procs = @(Get-CimInstance Win32_Process -Filter $filter -ErrorAction Stop) } catch { return }
    $browserPids = @{}
    foreach ($p in $procs) { $browserPids[[int]$p.ProcessId] = $true }
    foreach ($p in $procs) {
        $id = [int]$p.ProcessId
        if ($before.ContainsKey($id)) { continue }
        if ($browserPids.ContainsKey([int]$p.ParentProcessId)) { continue }   # child of a browser, not a new window
        try { Stop-Process -Id $id -Force -ErrorAction Stop; $script:BlockedCount++ } catch { }
    }
}

function Wait-Uninstaller($proc, $before, [string]$folder) {
    $deadline = (Get-Date).AddMinutes(15)
    while ((Get-Date) -lt $deadline) {
        Stop-NewBrowsers $before
        $running = $false
        try { $running = -not $proc.HasExited } catch { $running = [bool](Get-Process -Id $proc.Id -ErrorAction SilentlyContinue) }
        if (-not $running) {
            $new = @(Get-Process | Where-Object { -not $before.ContainsKey($_.Id) })
            # Programs the uninstaller launched from the app folder (e.g. "are you sure?" app windows)
            foreach ($p in $new) {
                if ($folder -and $p.Path -and (Test-InFolder $p.Path $folder)) {
                    try { Stop-Process -Id $p.Id -Force -ErrorAction Stop; $script:BlockedCount++ } catch { }
                }
            }
            # Uninstallers that copy themselves to Temp and keep running there
            $helpers = @($new | Where-Object {
                ($_.Path -and (Test-InFolder $_.Path $env:TEMP)) -or ($_.ProcessName -match '^(Au_|Un_A|_iu|unins)')
            })
            if ($helpers.Count -eq 0) { break }
        }
        Start-Sleep -Milliseconds 500
    }
    for ($i = 0; $i -lt 8; $i++) { Stop-NewBrowsers $before; Start-Sleep -Milliseconds 500 }
}

function Invoke-AppUninstall($app, [string]$folder) {
    if ($app.Type -eq 'Store') {
        try {
            if (Test-IsAdmin) {
                try { Remove-AppxPackage -Package $app.Package.PackageFullName -AllUsers -ErrorAction Stop }
                catch { Remove-AppxPackage -Package $app.Package.PackageFullName -ErrorAction Stop }
                # Stop it from coming back for new user accounts
                Get-AppxProvisionedPackage -Online -ErrorAction SilentlyContinue |
                    Where-Object { $_.DisplayName -eq $app.Name } |
                    ForEach-Object { Remove-AppxProvisionedPackage -Online -PackageName $_.PackageName -ErrorAction SilentlyContinue | Out-Null }
            } else {
                Remove-AppxPackage -Package $app.Package.PackageFullName -ErrorAction Stop
            }
            Write-Host '  [OK]   Store app removed.' -ForegroundColor Green
            return $true
        } catch {
            Write-Host ("  [FAIL] {0}" -f $_.Exception.Message) -ForegroundColor Red
            return $false
        }
    }

    $guid = $null
    if ($app.KeyName -match '^\{[0-9A-Fa-f\-]{36}\}$') { $guid = $app.KeyName }
    elseif ($app.UninstallString -match '\{[0-9A-Fa-f\-]{36}\}') { $guid = $Matches[0] }

    if ($guid -and ($app.IsMsi -or $app.UninstallString -match 'msiexec')) {
        $exe = 'msiexec.exe'; $argList = "/x $guid /qn /norestart"
        Write-Host '  Windows Installer package - removing silently...'
    } elseif ($app.QuietUninstallString) {
        $exe, $argList = Split-CommandLine $app.QuietUninstallString
        Write-Host '  Using the app''s own silent uninstall command...'
    } elseif ($app.UninstallString) {
        $exe, $argList = Split-CommandLine $app.UninstallString
        $exe = [Environment]::ExpandEnvironmentVariables($exe)
        $silent = Get-SilentArgs $exe $argList
        if ($silent) {
            $argList = ($argList + ' ' + $silent).Trim()
            Write-Host '  Silent mode detected - removing without any windows...'
        } else {
            Write-Host '  This uninstaller has no known silent mode, so its window will open.' -ForegroundColor Yellow
            Write-Host '  Click through it. Any browser pop-ups it opens will be closed automatically.' -ForegroundColor Yellow
        }
    } else {
        Write-Host '  This app has no uninstaller registered. Use Force remove instead.' -ForegroundColor Yellow
        return $false
    }

    $exe = [Environment]::ExpandEnvironmentVariables($exe.Trim('"'))
    if ($exe.Contains('\') -and -not (Test-Path -LiteralPath $exe)) {
        Write-Host ("  The uninstaller is missing ({0}) - the app is broken." -f $exe) -ForegroundColor Yellow
        Write-Host '  Its leftovers will be removed in the next step.' -ForegroundColor Yellow
        return $false
    }

    $before = @{}
    foreach ($p in Get-Process) { $before[$p.Id] = $true }
    try {
        if ($argList) { $proc = Start-Process -FilePath $exe -ArgumentList $argList -PassThru -ErrorAction Stop }
        else          { $proc = Start-Process -FilePath $exe -PassThru -ErrorAction Stop }
    } catch {
        Write-Host ("  [FAIL] Could not start the uninstaller: {0}" -f $_.Exception.Message) -ForegroundColor Red
        return $false
    }
    Write-Host '  Waiting for the uninstaller to finish...' -ForegroundColor DarkGray
    Wait-Uninstaller $proc $before $folder

    $code = $null
    try { $code = $proc.ExitCode } catch { }
    if ($exe -eq 'msiexec.exe' -and $code -notin 0, 1605, 3010, $null) {
        Write-Host ("  [WARN] Windows Installer returned error {0}." -f $code) -ForegroundColor Yellow
        return $false
    }
    if ($code -eq 3010) { Write-Host '  A restart is needed to finish removing this app.' -ForegroundColor Yellow }
    Write-Host '  [OK]   Uninstaller finished.' -ForegroundColor Green
    return $true
}

function Find-Leftovers($app, $all, [string]$folder) {
    $items = New-Object System.Collections.Generic.List[object]
    $seen = @{}
    $add = {
        param($kind, $target, $desc)
        $key = "$kind|$target".ToLower()
        if (-not $seen.ContainsKey($key)) { $seen[$key] = $true; $items.Add([pscustomobject]@{ Kind = $kind; Target = $target; Desc = $desc }) }
    }
    $clean  = Get-CleanAppName $app.Name
    $nameOk = ($clean.Length -ge 4) -and ($script:GenericNames -notcontains $clean)
    $pub    = ([string]$app.Publisher).Trim()
    $pubOk  = $pub -and ($script:GenericNames -notcontains $pub) -and ($pub.IndexOfAny([IO.Path]::GetInvalidFileNameChars()) -lt 0)

    if ($app.Type -eq 'Store') {
        $pkgData = Join-Path $env:LOCALAPPDATA ('Packages\' + $app.Package.PackageFamilyName)
        if (Test-Path -LiteralPath $pkgData) { & $add 'Folder' $pkgData 'App data folder' }
        return $items
    }

    if ($folder) {
        $shared = Test-FolderShared $folder $app $all
        if ($shared) {
            Write-Host ("  Note: {0} also contains '{1}', so that folder will be kept." -f $folder, $shared) -ForegroundColor Yellow
        } elseif (Test-Path -LiteralPath $folder) {
            & $add 'Folder' $folder 'Install folder'
        }
    }

    # Data folders named after the app
    $names = @()
    if ($nameOk) { $names += $clean }
    if ($folder) {
        $leaf = Split-Path $folder -Leaf
        if ($leaf.Length -ge 4 -and $script:GenericNames -notcontains $leaf) { $names += $leaf }
    }
    $roots = @($env:ProgramFiles, ${env:ProgramFiles(x86)}, $env:ProgramData, $env:APPDATA, $env:LOCALAPPDATA,
               (Join-Path $env:LOCALAPPDATA 'Programs')) | Where-Object { $_ } | Select-Object -Unique
    foreach ($r in $roots) {
        foreach ($n in ($names | Select-Object -Unique)) {
            if ($n.IndexOfAny([IO.Path]::GetInvalidFileNameChars()) -ge 0) { continue }
            $cands = @(Join-Path $r $n)
            if ($pubOk) { $cands += (Join-Path (Join-Path $r $pub) $n) }
            foreach ($c in $cands) {
                if ((Test-Path -LiteralPath $c -PathType Container) -and (Test-SafeToDelete $c) -and -not (Test-FolderShared $c $app $all)) {
                    & $add 'Folder' $c 'Leftover data folder'
                }
            }
        }
    }

    # Services
    if ($folder) {
        try {
            Get-CimInstance Win32_Service -ErrorAction Stop | Where-Object { Test-Contains $_.PathName $folder } |
                ForEach-Object { & $add 'Service' $_.Name ("Service: {0}" -f $_.DisplayName) }
        } catch { }
    }

    # Scheduled tasks (updaters, "helpers", etc.)
    try {
        $pattern = [WildcardPattern]::Escape(($clean -replace '\s', '')) + '*'
        foreach ($t in Get-ScheduledTask -ErrorAction Stop) {
            $hit = $false
            foreach ($a in $t.Actions) {
                if ($folder -and ((Test-Contains $a.Execute $folder) -or (Test-Contains $a.Arguments $folder))) { $hit = $true }
            }
            if (-not $hit -and $nameOk -and $t.TaskPath -notlike '\Microsoft\*' -and
                (($t.TaskName -replace '\s', '') -like $pattern)) { $hit = $true }
            if ($hit) { & $add 'Task' ($t.TaskPath + '|' + $t.TaskName) ("Scheduled task: {0}{1}" -f $t.TaskPath, $t.TaskName) }
        }
    } catch { }

    # Startup entries
    $runKeys = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run',
               'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run',
               'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Run'
    foreach ($rk in $runKeys) {
        if (-not (Test-Path $rk)) { continue }
        $key = Get-Item $rk
        foreach ($vn in $key.GetValueNames()) {
            $val = [string]$key.GetValue($vn)
            if (($folder -and (Test-Contains $val $folder)) -or ($nameOk -and $vn -ieq $clean)) {
                & $add 'RunValue' "$rk|$vn" ("Startup entry: {0}" -f $vn)
            }
        }
    }

    # Shortcuts
    $shell = $null
    try { $shell = New-Object -ComObject WScript.Shell } catch { }
    $lnkRoots = @([Environment]::GetFolderPath('StartMenu'), [Environment]::GetFolderPath('CommonStartMenu'),
                  [Environment]::GetFolderPath('Desktop'), [Environment]::GetFolderPath('CommonDesktopDirectory'))
    foreach ($lr in $lnkRoots) {
        if (-not $lr -or -not (Test-Path -LiteralPath $lr)) { continue }
        if ($shell -and $folder) {
            foreach ($l in Get-ChildItem -LiteralPath $lr -Recurse -Filter *.lnk -ErrorAction SilentlyContinue) {
                $tp = $null
                try { $tp = $shell.CreateShortcut($l.FullName).TargetPath } catch { }
                if ($tp -and (Test-InFolder $tp $folder)) { & $add 'File' $l.FullName ("Shortcut: {0}" -f $l.Name) }
            }
        }
        if ($nameOk -and $clean.IndexOfAny([IO.Path]::GetInvalidFileNameChars()) -lt 0) {
            $sm = Join-Path $lr ('Programs\' + $clean)
            if (Test-Path -LiteralPath $sm -PathType Container) { & $add 'Folder' $sm 'Start Menu folder' }
        }
    }

    # Registry
    if ($app.RegPath -and (Test-Path -LiteralPath $app.RegPath)) {
        & $add 'RegKey' $app.RegPath 'Uninstall entry (removes it from the installed apps list)'
    }
    if ($nameOk) {
        foreach ($hive in 'HKCU:\Software', 'HKLM:\SOFTWARE', 'HKLM:\SOFTWARE\WOW6432Node') {
            $cands = @("$hive\$clean")
            if ($pubOk) { $cands += "$hive\$pub\$clean" }
            foreach ($c in $cands) {
                if (Test-Path -LiteralPath $c) { & $add 'RegKey' $c ("Registry: {0}" -f $c) }
            }
        }
    }
    return $items
}

function Remove-Leftovers($items) {
    $order = @{ Service = 0; Task = 1; RunValue = 2; File = 3; RegKey = 4; Folder = 5 }
    $items = @($items | Sort-Object { $order[$_.Kind] })

    foreach ($i in $items | Where-Object Kind -eq 'Service') {
        try { Stop-Service -Name $i.Target -Force -ErrorAction Stop } catch { }
    }
    foreach ($f in $items | Where-Object Kind -eq 'Folder') {
        Get-Process | Where-Object { $_.Path -and (Test-InFolder $_.Path $f.Target) } |
            ForEach-Object { try { Stop-Process -Id $_.Id -Force -ErrorAction Stop } catch { } }
    }
    Start-Sleep -Milliseconds 500

    $ok = 0; $fail = 0
    foreach ($i in $items) {
        try {
            switch ($i.Kind) {
                'Service'  { $out = & sc.exe delete $i.Target 2>&1; if ($LASTEXITCODE -ne 0) { throw ($out -join ' ') } }
                'Task'     { $tp, $tn = $i.Target -split '\|', 2; Unregister-ScheduledTask -TaskPath $tp -TaskName $tn -Confirm:$false -ErrorAction Stop }
                'RunValue' { $k, $v = $i.Target -split '\|', 2; Remove-ItemProperty -LiteralPath $k -Name $v -ErrorAction Stop }
                'File'     { if (Test-Path -LiteralPath $i.Target) { Remove-Item -LiteralPath $i.Target -Force -ErrorAction Stop } }
                'RegKey'   { if (Test-Path -LiteralPath $i.Target) { Remove-Item -LiteralPath $i.Target -Recurse -Force -ErrorAction Stop } }
                'Folder'   { if (Test-Path -LiteralPath $i.Target) { Remove-Item -LiteralPath $i.Target -Recurse -Force -ErrorAction Stop } }
            }
            $ok++
            Write-Host ("  [OK]   {0}" -f $i.Desc) -ForegroundColor Green
        } catch {
            $fail++
            Write-Host ("  [FAIL] {0} - {1}" -f $i.Desc, $_.Exception.Message) -ForegroundColor Red
        }
    }
    Write-Host ''
    Write-Host ("  Removed {0} item(s), {1} failed." -f $ok, $fail)
    if ($fail -gt 0) {
        Write-Host '  Some items are locked or need Administrator rights. Restart the PC and run this again to finish.' -ForegroundColor Yellow
    }
}

function Invoke-Uninstaller {
    if (-not (Test-IsAdmin)) {
        Write-Host ''
        Write-Host '  Tip: run as Administrator to remove apps installed for all users.' -ForegroundColor Yellow
    }
    Write-Host ''
    Write-Host '  Loading installed apps...' -ForegroundColor DarkGray
    $all = @(Get-InstalledApps)
    $target = $null
    while (-not $target) {
        Write-Host ''
        $q = Read-Host '  Type part of an app name to search (blank = show all, Q = back)'
        if ($q -match '^[Qq]$') { return }
        $list = @($all | Where-Object { -not $q -or (Test-Contains $_.Name $q) -or (Test-Contains $_.Publisher $q) })
        if ($list.Count -eq 0) { Write-Host '  No apps match that search.' -ForegroundColor Yellow; continue }
        Show-AppList $list
        Write-Host ''
        $choice = Read-Host '  Enter the # of the app to uninstall (blank = search again)'
        $n = 0
        if ([int]::TryParse($choice, [ref]$n) -and $n -ge 1 -and $n -le $list.Count) { $target = $list[$n - 1] }
    }

    $folder = $null
    if ($target.Type -eq 'Desktop') { $folder = Get-AppFolder $target }
    Write-Host ''
    Write-Host ("  App:       {0}" -f $target.Name) -ForegroundColor Cyan
    Write-Host ("  Publisher: {0}" -f $target.Publisher)
    Write-Host ("  Version:   {0}" -f $target.Version)
    Write-Host ("  Type:      {0}" -f $target.Type)
    if ($folder) { Write-Host ("  Folder:    {0}" -f $folder) }
    Write-Host ''
    Write-Host '  1) Uninstall silently, then remove leftovers (recommended)'
    Write-Host '  2) Force remove - skip the app''s uninstaller (for broken / stubborn apps)'
    $mode = Read-Host '  Choose (blank = cancel)'
    if ($mode -notin '1', '2') { Write-Host '  Cancelled.'; return }

    if (Test-IsAdmin) {
        $rp = Read-Host '  Create a System Restore point first? (Y/n)'
        if ($rp -notmatch '^[Nn]') {
            Write-Host '  Creating restore point (this can take a minute)...' -ForegroundColor DarkGray
            try {
                Checkpoint-Computer -Description ("Before removing {0}" -f (Limit-Text $target.Name 40)) -RestorePointType APPLICATION_UNINSTALL -ErrorAction Stop
                Write-Host '  [OK]   Restore point created.' -ForegroundColor Green
            } catch {
                Write-Host ("  [WARN] Could not create a restore point: {0}" -f $_.Exception.Message) -ForegroundColor Yellow
                $go = Read-Host '  Continue anyway? (y/N)'
                if ($go -notmatch '^[Yy]') { Write-Host '  Cancelled.'; return }
            }
        }
    }

    $script:BlockedCount = 0
    Write-Host ''
    if ($mode -eq '1' -or $target.Type -eq 'Store') {
        [void](Invoke-AppUninstall $target $folder)
    } else {
        Write-Host '  Force mode: skipping the uninstaller.' -ForegroundColor Yellow
    }
    if ($script:BlockedCount -gt 0) {
        Write-Host ("  Blocked {0} pop-up window(s) / app launch(es) from the uninstaller." -f $script:BlockedCount) -ForegroundColor Green
    }

    Write-Host ''
    Write-Host '  Scanning for leftovers...' -ForegroundColor Cyan
    $items = @(Find-Leftovers $target $all $folder)
    if ($items.Count -eq 0) {
        Write-Host '  No leftovers found. All clean!' -ForegroundColor Green
        return
    }
    Write-Host ''
    Write-Host '  Found these leftovers:' -ForegroundColor Cyan
    foreach ($i in $items) {
        $shown = $i.Target
        if ($i.Kind -eq 'RegKey') { $shown = $shown -replace '^Microsoft\.PowerShell\.Core\\Registry::', '' }
        if ($i.Kind -in 'Task', 'RunValue', 'Service') { $shown = '' }
        Write-Host ("   - {0}" -f $i.Desc)
        if ($shown) { Write-Host ("       {0}" -f $shown) -ForegroundColor DarkGray }
    }
    Write-Host ''
    $ok = Read-Host '  Delete all of these? (y/N)'
    if ($ok -notmatch '^[Yy]') { Write-Host '  Leftovers kept.'; return }
    Remove-Leftovers $items
}

# ---------------------------------------------------------------------------
# Auto-clean (keeps RAM low automatically)
# ---------------------------------------------------------------------------
$script:AutoTaskName = 'RAM Cleaner Auto'
$script:AutoLog = Join-Path $env:LOCALAPPDATA 'RamCleaner\auto-clean.log'

function Invoke-TrimAll {
    [void][RamTools]::EnablePrivilege('SeDebugPrivilege')
    $n = 0
    foreach ($p in Get-Process) {
        if ($p.Id -le 4) { continue }
        if ([RamTools]::TrimProcess($p.Id)) { $n++ }
    }
    return $n
}

function Write-AutoLog([string]$line) {
    try {
        $dir = Split-Path $script:AutoLog -Parent
        if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
        if ((Test-Path $script:AutoLog) -and (Get-Item $script:AutoLog).Length -gt 1MB) {
            Get-Content $script:AutoLog -Tail 500 | Set-Content ($script:AutoLog + '.tmp')
            Move-Item ($script:AutoLog + '.tmp') $script:AutoLog -Force
        }
        Add-Content -Path $script:AutoLog -Value $line
    } catch { }
}

function Start-AutoClean([int]$threshold, [int]$interval, [bool]$background) {
    if (-not $background) {
        Write-Host ''
        Write-Host ("  Auto-clean running: cleans whenever RAM use goes above {0}%, checks every {1} seconds." -f $threshold, $interval) -ForegroundColor Cyan
        Write-Host '  Leave this window open (you can minimise it). Press Ctrl+C to stop.' -ForegroundColor DarkGray
        Write-Host ''
    } else {
        Write-AutoLog ("{0:yyyy-MM-dd HH:mm:ss}  Auto-clean started (threshold {1}%, every {2}s)" -f (Get-Date), $threshold, $interval)
    }
    while ($true) {
        try {
            $m = Get-MemoryInfo
            if ($m.Percent -ge $threshold) {
                $before = $m.Available
                $n = Invoke-TrimAll
                Start-Sleep -Seconds 1
                $after = Get-MemoryInfo
                $line = "{0:yyyy-MM-dd HH:mm:ss}  {1}% used -> trimmed {2} programs, freed {3}, now {4}% used" -f (Get-Date),
                    $m.Percent, $n, (Format-Size ([math]::Max(0, $after.Available - $before))), $after.Percent
                if ($background) { Write-AutoLog $line } else { Write-Host ('  ' + $line) -ForegroundColor Green }
            } elseif (-not $background) {
                Write-Host ("  {0:HH:mm:ss}  {1}% used - OK" -f (Get-Date), $m.Percent) -ForegroundColor DarkGray
            }
        } catch { }
        Start-Sleep -Seconds $interval
    }
}

function Read-Number([string]$prompt, [int]$default, [int]$min, [int]$max) {
    $v = Read-Host ("  {0} (default {1})" -f $prompt, $default)
    $n = 0
    if ([int]::TryParse($v, [ref]$n) -and $n -ge $min -and $n -le $max) { return $n }
    return $default
}

function Invoke-AutoMenu {
    $task = $null
    try { $task = Get-ScheduledTask -TaskName $script:AutoTaskName -ErrorAction Stop } catch { }
    Write-Host ''
    Write-Host '  AUTO-CLEAN' -ForegroundColor Cyan
    if ($task) { Write-Host ("  Background auto-clean at startup: ON ({0})" -f $task.State) -ForegroundColor Green }
    else       { Write-Host '  Background auto-clean at startup: OFF' -ForegroundColor Yellow }
    Write-Host ''
    Write-Host '  1) Run auto-clean now in this window'
    Write-Host '  2) Turn ON - run hidden in the background every time Windows starts [Admin]'
    Write-Host '  3) Turn OFF background auto-clean'
    Write-Host '  4) View the auto-clean log'
    $c = Read-Host '  Choose (blank = back)'
    switch ($c) {
        '1' {
            $t = Read-Number 'Clean when RAM use goes above what %?' 85 50 98
            $i = Read-Number 'Check every how many seconds?' 60 15 3600
            Start-AutoClean $t $i $false
        }
        '2' {
            if (-not (Test-IsAdmin)) { Write-Host '  This needs Administrator rights. Run RamCleaner.bat and click Yes.' -ForegroundColor Yellow; return }
            $t = Read-Number 'Clean when RAM use goes above what %?' 85 50 98
            $i = Read-Number 'Check every how many seconds?' 60 15 3600
            $scriptFile = $PSCommandPath
            Write-Host ''
            Write-Host ("  The background task will run this file: {0}" -f $scriptFile) -ForegroundColor Yellow
            Write-Host '  Keep the folder there - if you move or delete it (or switch git branch), auto-clean stops working.' -ForegroundColor Yellow
            try {
                $user = "$env:USERDOMAIN\$env:USERNAME"
                $action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument (
                    '-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "{0}" -Auto -Threshold {1} -Interval {2}' -f $scriptFile, $t, $i)
                $trigger   = New-ScheduledTaskTrigger -AtLogOn -User $user
                $principal = New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Highest
                $settings  = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
                                -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew
                Register-ScheduledTask -TaskName $script:AutoTaskName -Action $action -Trigger $trigger `
                    -Principal $principal -Settings $settings -Force -ErrorAction Stop | Out-Null
                Start-ScheduledTask -TaskName $script:AutoTaskName
                Write-Host ("  [OK]   Auto-clean is ON. It is running now and will start with Windows (above {0}%, every {1}s)." -f $t, $i) -ForegroundColor Green
            } catch {
                Write-Host ("  [FAIL] {0}" -f $_.Exception.Message) -ForegroundColor Red
            }
        }
        '3' {
            if (-not $task) { Write-Host '  It is already off.'; return }
            try {
                Stop-ScheduledTask -TaskName $script:AutoTaskName -ErrorAction SilentlyContinue
                Unregister-ScheduledTask -TaskName $script:AutoTaskName -Confirm:$false -ErrorAction Stop
                Write-Host '  [OK]   Background auto-clean turned off.' -ForegroundColor Green
            } catch {
                Write-Host ("  [FAIL] {0} (try running as Administrator)" -f $_.Exception.Message) -ForegroundColor Red
            }
        }
        '4' {
            if (Test-Path $script:AutoLog) { Get-Content $script:AutoLog -Tail 30 | ForEach-Object { Write-Host ('  ' + $_) } }
            else { Write-Host '  No log yet.' }
        }
    }
}

# ---------------------------------------------------------------------------
# Leak finder: shows which programs keep growing while you're not using them
# ---------------------------------------------------------------------------
function Get-PoolInfo {
    try {
        $m = Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory -ErrorAction Stop
        return [pscustomobject]@{ NonPaged = [double]$m.PoolNonpagedBytes; Paged = [double]$m.PoolPagedBytes }
    } catch { return $null }
}

function Get-PrivateSnapshot {
    $h = @{}
    foreach ($p in Get-Process) {
        if ($p.Id -le 4) { continue }
        try { $h[$p.Id] = [pscustomobject]@{ Name = $p.ProcessName; Bytes = [double]$p.PrivateMemorySize64 } } catch { }
    }
    return $h
}

function Invoke-LeakFinder {
    $mins = Read-Number 'How many minutes should I watch? Leave the PC idle meanwhile.' 3 1 60
    $startMem = Get-MemoryInfo
    $startPool = Get-PoolInfo
    $start = Get-PrivateSnapshot
    $end = (Get-Date).AddMinutes($mins)
    while ((Get-Date) -lt $end) {
        $left = [int]($end - (Get-Date)).TotalSeconds
        Write-Progress -Activity 'Watching memory use' -Status ("{0}s left - RAM {1}% used" -f $left, (Get-MemoryInfo).Percent) `
            -PercentComplete ([math]::Min(100, 100 - ($left / ($mins * 60) * 100)))
        Start-Sleep -Seconds 5
    }
    Write-Progress -Activity 'Watching memory use' -Completed
    $now = Get-PrivateSnapshot
    $endMem = Get-MemoryInfo
    $endPool = Get-PoolInfo

    $growth = @{}
    foreach ($id in $now.Keys) {
        $n = $now[$id].Name
        if (-not $growth.ContainsKey($n)) { $growth[$n] = [pscustomobject]@{ Name = $n; Start = 0.0; End = 0.0; New = 0 } }
        $g = $growth[$n]
        $g.End += $now[$id].Bytes
        if ($start.ContainsKey($id)) { $g.Start += $start[$id].Bytes } else { $g.New++ }
    }
    foreach ($id in $start.Keys) {   # processes that exited
        $n = $start[$id].Name
        if (-not $now.ContainsKey($id) -and $growth.ContainsKey($n)) { $growth[$n].Start += $start[$id].Bytes }
    }
    $top = @($growth.Values | ForEach-Object {
        [pscustomobject]@{ Name = $_.Name; Start = $_.Start; End = $_.End; Grow = $_.End - $_.Start; New = $_.New }
    } | Where-Object { $_.Grow -gt 5MB } | Sort-Object Grow -Descending | Select-Object -First 12)

    Write-Host ''
    Write-Host ("  RAM use went from {0}% to {1}% in {2} minute(s)." -f $startMem.Percent, $endMem.Percent, $mins) -ForegroundColor Cyan
    Write-Host ''
    if ($top.Count -eq 0) {
        Write-Host '  No program grew by more than 5 MB. Nothing is leaking - the RAM going back up is just' -ForegroundColor Green
        Write-Host '  Windows reloading the memory that was trimmed, which is normal.' -ForegroundColor Green
    } else {
        Write-Host '  PROGRAMS THAT GREW (private memory they reserved)' -ForegroundColor Cyan
        Write-Host ('  {0,-30} {1,11} {2,11} {3,11} {4,11}' -f 'Program', 'Before', 'After', 'Growth', 'Per min')
        Write-Host ('  ' + ('-' * 78)) -ForegroundColor DarkGray
        foreach ($r in $top) {
            $color = if ($r.Grow -ge 200MB) { 'Red' } elseif ($r.Grow -ge 50MB) { 'Yellow' } else { 'Gray' }
            $note = ''
            if ($r.New -gt 0) { $note = " (+{0} new)" -f $r.New }
            Write-Host ('  {0,-30} {1,11} {2,11} {3,11} {4,11}{5}' -f (Limit-Text $r.Name 30), (Format-Size $r.Start), (Format-Size $r.End),
                ('+' + (Format-Size $r.Grow)), (Format-Size ($r.Grow / $mins)), $note) -ForegroundColor $color
        }
        Write-Host ''
        Write-Host '  Programs in red/yellow that keep growing while idle are likely leaking memory.' -ForegroundColor DarkGray
        Write-Host '  Fix: update them, restart them now and then, or uninstall them (option U).' -ForegroundColor DarkGray
    }
    if ($startPool -and $endPool) {
        Write-Host ''
        Write-Host ("  Driver memory (non-paged pool): {0} -> {1}" -f (Format-Size $startPool.NonPaged), (Format-Size $endPool.NonPaged))
        if ($endPool.NonPaged -gt 1GB -or ($endPool.NonPaged - $startPool.NonPaged) -gt 50MB) {
            Write-Host '  This is high or growing - a driver is probably leaking memory (often network, audio,' -ForegroundColor Red
            Write-Host '  RGB/lighting or antivirus drivers). Update your network and chipset drivers first.' -ForegroundColor Red
        }
    }
}

function Pause-Menu {
    Write-Host ''
    [void](Read-Host '  Press Enter to return to the menu')
}

# ---------------------------------------------------------------------------
# Non-interactive mode
# ---------------------------------------------------------------------------
if ($Auto)  { Start-AutoClean $Threshold $Interval $true; exit }
if ($Deep)  { Invoke-QuickClean; Invoke-DeepClean; exit }
if ($Quick) { Invoke-QuickClean; exit }

# ---------------------------------------------------------------------------
# Interactive menu
# ---------------------------------------------------------------------------
$Host.UI.RawUI.WindowTitle = 'RAM & CPU Cleaner'
while ($true) {
    Clear-Host
    Write-Host ''
    Write-Host '  ===============================================' -ForegroundColor Cyan
    Write-Host '            RAM & CPU CLEANER for Windows'          -ForegroundColor Cyan
    Write-Host '  ===============================================' -ForegroundColor Cyan
    if (Test-IsAdmin) {
        Write-Host '  Running as Administrator - all features available' -ForegroundColor Green
    } else {
        Write-Host '  Not running as Administrator - Deep Clean disabled' -ForegroundColor Yellow
    }
    [void](Show-MemoryStatus)
    Show-CpuStatus
    Write-Host ''
    Write-Host '  --- RAM ---' -ForegroundColor Cyan
    Write-Host '  1) Show programs using the most RAM'
    Write-Host '  2) Quick Clean  (trim memory of all running programs)'
    Write-Host '  3) Deep Clean   (Quick Clean + clear standby cache) [Admin]'
    Write-Host '  4) Close a program to free its memory'
    Write-Host '  --- CPU ---' -ForegroundColor Cyan
    Write-Host '  5) Show programs using the most CPU'
    Write-Host '  6) Lower the priority of a CPU-heavy program'
    Write-Host '  7) Close a CPU-heavy program'
    Write-Host '  --- Other ---' -ForegroundColor Cyan
    Write-Host '  8) Clean temporary files'
    Write-Host '  9) Manage startup apps (stop apps loading at boot)'
    Write-Host '  U) Uninstall apps (silent, blocks pop-ups, removes leftovers)'
    Write-Host '  A) Auto-clean (keep RAM low automatically)'
    Write-Host '  L) Find what keeps filling RAM (leak finder)'
    Write-Host '  R) Refresh'
    Write-Host '  0) Exit'
    Write-Host ''
    $sel = Read-Host '  Choose an option'
    switch ($sel) {
        '1' { [void](Show-TopProcesses 20); Pause-Menu }
        '2' { Invoke-QuickClean; Pause-Menu }
        '3' { Invoke-QuickClean; Invoke-DeepClean; Pause-Menu }
        '4' { Invoke-CloseProgram; Pause-Menu }
        '5' { [void](Show-TopCpuProcesses 20); Pause-Menu }
        '6' { Invoke-LowerPriority; Pause-Menu }
        '7' { Invoke-CloseCpuProgram; Pause-Menu }
        '8' { Invoke-TempClean; Pause-Menu }
        '9' { Start-Process 'ms-settings:startupapps'; Pause-Menu }
        'U' { Invoke-Uninstaller; Pause-Menu }
        'A' { Invoke-AutoMenu; Pause-Menu }
        'L' { Invoke-LeakFinder; Pause-Menu }
        '0' { exit }
        default { }
    }
}
