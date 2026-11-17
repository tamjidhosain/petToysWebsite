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

The header also shows live RAM and CPU usage bars; press **R** to refresh them.

## Command-line / scheduled use

```powershell
powershell -ExecutionPolicy Bypass -File .\RamCleaner.ps1 -Quick   # quick clean, then exit
powershell -ExecutionPolicy Bypass -File .\RamCleaner.ps1 -Deep    # deep clean (run as admin), then exit
```

You can add the `-Deep` command to Task Scheduler with "Run with highest privileges" to run it automatically.

## Honest note on what to expect

- Windows already manages memory well. "Standby" memory is cache that Windows hands back instantly when a program needs it, so a high "in use" number is not necessarily a problem.
- Cleaning gives an immediate jump in free RAM, but trimmed programs will pull data back in as you use them, which can feel briefly slower.
- The biggest real gains come from **closing heavy programs** (option 4), **cutting startup apps** (option 5), and closing unused browser tabs. If you're always near 100% usage, more RAM is the real fix.
