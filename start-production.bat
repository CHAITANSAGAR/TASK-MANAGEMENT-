@echo off
echo ========================================================
echo   Daily Task Manager - Full Stack Production Launcher
echo ========================================================
echo.
echo Starting Spring Boot standalone application with embedded React UI...
echo Access Application at: http://localhost:8080
echo Access H2 Console at:  http://localhost:8080/h2-console
echo.
java -jar backend\target\daily-task-manager-1.0.0.jar
pause
