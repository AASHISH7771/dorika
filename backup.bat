@echo off
REM Double-click this file to back up the shop's data.
REM It writes a dated folder inside .\backups\ - copy that folder to Google Drive.

cd /d "%~dp0"

echo Backing up Dorika...
echo.

node scripts\backup.mjs

if errorlevel 1 (
  echo.
  echo Something went wrong. Is Node.js installed? Check the message above.
) else (
  echo.
  echo Done. Your backup is in the "backups" folder.
  echo Copy the newest folder somewhere safe - Google Drive, OneDrive, or a USB stick.
)

echo.
start "" "backups"
pause
