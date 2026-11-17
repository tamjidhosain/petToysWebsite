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

    Usage:
      Double-click RamCleaner.bat (recommended), or run in PowerShell:
        powershell -ExecutionPolicy Bypass -File .\RamCleaner.ps1
        powershell -ExecutionPolicy Bypass -File .\RamCleaner.ps1 -Quick
        powershell -ExecutionPolicy Bypass -File .\RamCleaner.ps1 -Deep
#>

[CmdletBinding()]
param(
    [switch]$Quick,   # run Quick Clean and exit
    [switch]$Deep     # run Deep Clean and exit (requires Admin)
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

function Invoke-CloseProgram {
    $list = @(Show-TopProcesses 20)
    Write-Host ''
    $choice = Read-Host '  Enter the # of the program to close (blank to cancel)'
    if ([string]::IsNullOrWhiteSpace($choice)) { return }
    $n = 0
    if (-not [int]::TryParse($choice, [ref]$n) -or $n -lt 1 -or $n -gt $list.Count) {
        Write-Host '  Invalid choice.' -ForegroundColor Yellow; return
    }
    $target = $list[$n - 1]
    $critical = 'csrss','wininit','winlogon','services','lsass','smss','svchost','System','Registry',
                'dwm','explorer','MsMpEng','fontdrvhost','Memory Compression','powershell','pwsh','conhost'
    if ($critical -contains $target.Name) {
        Write-Host ("  '{0}' is a Windows system process and should not be closed." -f $target.Name) -ForegroundColor Red
        return
    }
    Write-Host ("  This will close ALL {0} '{1}' window(s)/process(es). Unsaved work will be lost." -f $target.Instances, $target.Name) -ForegroundColor Yellow
    $confirm = Read-Host '  Type Y to confirm'
    if ($confirm -notmatch '^[Yy]') { Write-Host '  Cancelled.'; return }
    $before = (Get-MemoryInfo).Available
    foreach ($id in $target.Ids) {
        try { Stop-Process -Id $id -Force -ErrorAction Stop } catch { }
    }
    Start-Sleep -Seconds 1
    Write-Host ("  Closed '{0}'." -f $target.Name) -ForegroundColor Green
    Report-Freed $before (Get-MemoryInfo).Available
}

function Pause-Menu {
    Write-Host ''
    [void](Read-Host '  Press Enter to return to the menu')
}

# ---------------------------------------------------------------------------
# Non-interactive mode
# ---------------------------------------------------------------------------
if ($Deep)  { Invoke-QuickClean; Invoke-DeepClean; exit }
if ($Quick) { Invoke-QuickClean; exit }

# ---------------------------------------------------------------------------
# Interactive menu
# ---------------------------------------------------------------------------
$Host.UI.RawUI.WindowTitle = 'RAM Cleaner'
while ($true) {
    Clear-Host
    Write-Host ''
    Write-Host '  ===============================================' -ForegroundColor Cyan
    Write-Host '                 RAM CLEANER for Windows'           -ForegroundColor Cyan
    Write-Host '  ===============================================' -ForegroundColor Cyan
    if (Test-IsAdmin) {
        Write-Host '  Running as Administrator - all features available' -ForegroundColor Green
    } else {
        Write-Host '  Not running as Administrator - Deep Clean disabled' -ForegroundColor Yellow
    }
    [void](Show-MemoryStatus)
    Write-Host ''
    Write-Host '  1) Show programs using the most RAM'
    Write-Host '  2) Quick Clean  (trim memory of all running programs)'
    Write-Host '  3) Deep Clean   (Quick Clean + clear standby cache) [Admin]'
    Write-Host '  4) Close a program to free its memory'
    Write-Host '  5) Manage startup apps (stop apps loading at boot)'
    Write-Host '  0) Exit'
    Write-Host ''
    $sel = Read-Host '  Choose an option'
    switch ($sel) {
        '1' { [void](Show-TopProcesses 20); Pause-Menu }
        '2' { Invoke-QuickClean; Pause-Menu }
        '3' { Invoke-QuickClean; Invoke-DeepClean; Pause-Menu }
        '4' { Invoke-CloseProgram; Pause-Menu }
        '5' { Start-Process 'ms-settings:startupapps'; Pause-Menu }
        '0' { exit }
        default { }
    }
}
