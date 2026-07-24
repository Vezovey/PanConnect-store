@echo off
:: Kill all node processes AND reset terminal mouse-tracking
:: Does NOT use node for reset (avoids re-enabling mouse-tracking)

:: Kill node processes
taskkill /F /IM node.exe 2>nul

:: Get ESC character via prompt $E
for /f %%a in ('echo prompt $E ^| cmd') do set "ESC=%%a"

:: Disable all mouse-tracking modes
<nul set /p ="%ESC%[?1000l%ESC%[?1002l%ESC%[?1003l%ESC%[?1006l%ESC%[?1015l"
