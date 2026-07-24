<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# CRITICAL: Terminal Rules — NEVER VIOLATE

## Terminal: cmd.exe (NOT PowerShell)

VS Code настроен на **cmd.exe** по умолчанию (`.vscode/settings.json`). Если терминал всё ещё PowerShell — закрыть и полностью перезапустить VS Code.

## Problem: Mouse-Tracking Escape Codes in Terminal

When node/Next.js processes run, they put the terminal into mouse-reporting mode (`ESC[?1000h`). When the process dies, the terminal STAYS in this mode. All subsequent output produces `[<NN;NN;45M` garbage — the terminal interprets mouse movement as text.

**Root cause:** node processes (Next.js, npm, npx) enable mouse-tracking (`ESC[?1000h`) during TTY initialization. When killed with `taskkill /F`, they don't clean up. The terminal stays in mouse-reporting mode.

**CRITICAL:** `reset-terminal.bat` must NOT use `node -e` — node itself enables mouse-tracking on startup, so using node to "fix" mouse-tracking re-enables it. The bat files use cmd's built-in `echo prompt $E` instead.

## Rules

1. **ALL commands MUST use `cmd /c`** — no exceptions
2. **NEVER use PowerShell syntax:** `Get-Process`, `Stop-Process`, `Start-Process`, `Select-String`, `Select-Object`, `Invoke-WebRequest` — these are PowerShell-only
3. **NEVER launch server in MiMo's terminal** — it blocks the shell. Use `cmd /c start` or `.bat` file in a separate window
4. **After `taskkill /F` — ALWAYS call `kill-and-reset.bat`** — force-killing node leaves mouse-tracking enabled
5. **NEVER use `node -e` in reset scripts** — node enables mouse-tracking on startup

## Terminal Reset — MANDATORY after every node/kill command

Mouse-tracking escape codes appear when:
- A node process (next dev, next start, npx, tsc) was run in the terminal
- A node process was killed with `taskkill /F` (force — no cleanup)

**SAFE: Use kill-and-reset.bat (kills node + resets terminal in one shot):**
```cmd
cmd /c "C:\Users\vadim\Desktop\Смартфоны\megapixel-store\kill-and-reset.bat"
```

**If you already ran `taskkill /F` without reset, fix it:**
```cmd
cmd /c "C:\Users\vadim\Desktop\Смартфоны\megapixel-store\reset-terminal.bat"
```

## Quick Launch Commands

### Stop all node processes AND reset terminal (use this instead of plain taskkill):
```cmd
cmd /c "C:\Users\vadim\Desktop\Смартфоны\megapixel-store\kill-and-reset.bat"
```

### Start production server:
```cmd
cmd /c start "Server" "C:\Users\vadim\Desktop\Смартфоны\megapixel-store\start-prod.bat"
```

### Start dev server:
```cmd
cmd /c start "Dev Server" "C:\Users\vadim\Desktop\Смартфоны\megapixel-store\start-dev.bat"
```

### Start tunnel:
```cmd
cmd /c start "Tunnel" "C:\Users\vadim\Desktop\Смартфоны\megapixel-store\start-tunnel.bat"
```

### Check port 3000:
```cmd
cmd /c "netstat -ano | findstr :3000"
```

### Check site accessibility:
```cmd
cmd /c "curl -s -o nul -w %%{http_code} http://localhost:3000"
```

### TypeScript check:
```cmd
cmd /c "cd /d C:\Users\vadim\Desktop\Смартфоны\megapixel-store && npx tsc --noEmit 2>&1"
```
