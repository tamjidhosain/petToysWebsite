# RAM & CPU Cleaner for Windows

A small, dependency-free tool (PowerShell + a .bat launcher) to free up RAM and tame CPU usage on Windows 10 and 11.

## How to use

1. Copy the `windows-ram-cleaner` folder to your PC (both `RamCleaner.bat` and `RamCleaner.ps1` must stay in the same folder).
2. Double-click **`RamCleaner.bat`**.
3. Click **Yes** on the Administrator (UAC) prompt. If you click No, everything works except Deep Clean.
4. Pick an option from the menu.

> If Windows SmartScreen warns about the file, click **More info → Run anyway**. If the `.ps1` was downloaded from the internet, you may need to right-click it → **Properties** → tick **Unblock**.

## Menu options

| Option | What it does |
|---|---|
| 1. Show top RAM programs | Lists the programs using the most RAM (grouped, e.g. all Chrome processes together). |
| 2. Quick Clean | Trims the working set of every running program, moving memory they aren't actively using out of RAM. Programs keep running normally. |
| 3. Deep Clean (Admin) | Quick Clean, then flushes the modified page list and purges the **standby list** (the file cache Windows keeps in RAM). |
| 4. Close a program (RAM) | Pick a program from the RAM list to close it completely. System processes are protected. |
| 5. Show top CPU programs | Measures CPU use for 1.5 seconds and lists the busiest programs (red = 25%+, yellow = 10%+). |
| 6. Lower priority | Sets a CPU-heavy program to Below Normal or Idle priority so the rest of your PC stays responsive. Lasts until that program restarts. |
| 7. Close a program (CPU) | Pick a program from the CPU list to close it. |
| 8. Clean temp files | Deletes leftover temporary files (your user Temp folder, plus `C:\Windows\Temp` when run as admin). Files in use are skipped. |
| 9. Startup apps | Opens Windows Settings → Startup apps so you can stop programs from loading at boot. |
| A. Auto-clean | Keeps RAM low automatically: trims memory whenever usage passes a threshold (default 85%). Run it in a window, or turn it on to run hidden in the background every time Windows starts (admin). Log: `%LOCALAPPDATA%\RamCleaner\auto-clean.log`. |
| L. Leak finder | Watches for a few minutes while the PC is idle and shows which programs (or drivers) keep growing - the real cause when RAM fills up on its own. |
| U. Uninstall apps | Search installed apps (desktop + Microsoft Store), then remove one silently and clean up its leftovers. See below. |

The header also shows live RAM and CPU usage bars; press **R** to refresh them.

## Uninstaller (option U)

1. Search by name (or leave blank to list everything) and pick the app.
2. Choose a mode:
   - **Uninstall silently + remove leftovers** - runs the app's own uninstaller in silent mode (MSI `/qn`, Inno Setup `/VERYSILENT`, NSIS `/S`, Squirrel `-s`, or the app's own quiet command). Any browser window or app the uninstaller tries to open (feedback pages, surveys, "are you sure?" apps) is closed automatically.
   - **Force remove** - for broken apps whose uninstaller is missing or refuses to work. Skips the uninstaller entirely.
3. When running as admin, it offers to create a **System Restore point** first.
4. It then scans for leftovers - install folder, data folders in AppData / ProgramData, services, scheduled tasks, startup entries, shortcuts, and registry keys - shows you the full list, and deletes them only after you confirm.

Safety: system folders (Windows, Program Files root, your user folders, etc.) can never be deleted, and a folder that also contains another installed app is kept. Store apps are removed for all users and de-provisioned so they don't come back for new accounts (admin).

Tip: close your browser before uninstalling - while the uninstaller runs, any *new* browser window that opens is closed.

## Command-line / scheduled use

```powershell
powershell -ExecutionPolicy Bypass -File .\RamCleaner.ps1 -Quick   # quick clean, then exit
powershell -ExecutionPolicy Bypass -File .\RamCleaner.ps1 -Deep    # deep clean (run as admin), then exit
powershell -ExecutionPolicy Bypass -File .\RamCleaner.ps1 -Auto -Threshold 85 -Interval 60   # keep cleaning automatically
```

You can add the `-Deep` command to Task Scheduler with "Run with highest privileges" to run it automatically.

## Honest note on what to expect

- Windows already manages memory well. "Standby" memory is cache that Windows hands back instantly when a program needs it, so a high "in use" number is not necessarily a problem.
- Cleaning gives an immediate jump in free RAM, but trimmed programs will pull data back in as you use them, which can feel briefly slower.
- The biggest real gains come from **closing heavy programs** (option 4), **cutting startup apps** (option 5), and closing unused browser tabs. If you're always near 100% usage, more RAM is the real fix.
