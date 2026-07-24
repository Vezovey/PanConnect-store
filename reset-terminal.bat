@echo off
:: Resets terminal mouse-tracking WITHOUT node
:: Uses cmd built-in echo to send escape sequences
:: This avoids the problem of node re-enabling mouse-tracking

:: Get ESC character via prompt $E
for /f %%a in ('echo prompt $E ^| cmd') do set "ESC=%%a"

:: Disable all mouse-tracking modes
<nul set /p ="%ESC%[?1000l%ESC%[?1002l%ESC%[?1003l%ESC%[?1006l%ESC%[?1015l"
