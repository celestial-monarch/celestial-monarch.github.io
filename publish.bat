@echo off
setlocal
cd /d "%~dp0"
title Publish portfolio

echo.
echo  ==============================
echo   Publishing your portfolio
echo  ==============================
echo.

where git >nul 2>nul
if errorlevel 1 (
  echo  Git is not installed on this PC. Install it from https://git-scm.com
  goto :fail
)

rem ---- 1. Check and optimize images on this PC ----
echo  [1/4] Checking and optimizing images...
where node >nul 2>nul
if errorlevel 1 (
  echo        Node.js not found, skipping the local check.
  echo        GitHub will still optimize the images when it builds the site.
  goto :save
)
if not exist node_modules (
  echo        First run: installing tools, this takes a minute...
  call npm install --silent
  if errorlevel 1 goto :fail
)
call npm run --silent content
if errorlevel 1 (
  echo.
  echo  An image could not be processed - see the message above.
  echo  Fix or remove that file and run publish again. Nothing was uploaded.
  goto :fail
)

:save
rem ---- 2. Save the changes ----
echo.
echo  [2/4] Saving your changes...
git add -A
git diff --cached --quiet
if not errorlevel 1 (
  echo        No new changes found.
  goto :upload
)
git diff --cached --name-status
git commit -q -m "Update portfolio"
if errorlevel 1 goto :fail

:upload
rem ---- 3. Bring in anything changed on the GitHub website ----
echo.
echo  [3/4] Getting any changes made on the GitHub website...
git pull --rebase -q
if errorlevel 1 (
  echo.
  echo  Your changes clash with changes made on the GitHub website.
  git rebase --abort >nul 2>nul
  echo  Nothing was uploaded and nothing was lost.
  goto :fail
)

rem ---- 4. Upload ----
echo.
echo  [4/4] Uploading to GitHub...
git push -q
if errorlevel 1 goto :fail

echo.
echo  Done! Your website updates in about 2 minutes:
echo  https://celestial-monarch.github.io
echo.
echo  Progress: https://github.com/celestial-monarch/celestial-monarch.github.io/actions
goto :end

:fail
echo.
echo  Publishing stopped. Read the message above, or ask for help.

:end
echo.
if not defined NO_PAUSE pause
