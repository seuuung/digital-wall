@echo off
echo [Digital Wall] Starting deployment sequence...

echo [Digital Wall] Installing Client Dependencies...
cd client
call npm install
if %errorlevel% neq 0 exit /b %errorlevel%

echo [Digital Wall] Building Client...
call npm run build
if %errorlevel% neq 0 exit /b %errorlevel%
cd ..

echo [Digital Wall] Installing Server Dependencies...
cd server
call npm install
if %errorlevel% neq 0 exit /b %errorlevel%

echo [Digital Wall] Starting Server...
echo [Digital Wall] Please open http://localhost:3000 in your browser.
call npm start
