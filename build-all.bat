@echo off
echo ========================================================
echo   Daily Task Manager - Full Stack Build Pipeline
echo ========================================================
echo.
echo [1/3] Building React Frontend with Vite...
cd frontend
call npm.cmd run build
if %ERRORLEVEL% NEQ 0 (
    echo Frontend build failed!
    exit /b %ERRORLEVEL%
)
cd ..

echo.
echo [2/3] Syncing frontend assets to backend static resources...
if not exist backend\src\main\resources\static mkdir backend\src\main\resources\static
xcopy /E /Y frontend\dist\* backend\src\main\resources\static\

echo.
echo [3/3] Building Spring Boot Executable JAR with Maven...
cd backend
call mvn clean package
if %ERRORLEVEL% NEQ 0 (
    echo Backend build failed!
    exit /b %ERRORLEVEL%
)
cd ..

echo.
echo ========================================================
echo   BUILD COMPLETE! Ready to deploy:
echo   Run 'start-production.bat' or 'java -jar backend\target\daily-task-manager-1.0.0.jar'
echo ========================================================
pause
