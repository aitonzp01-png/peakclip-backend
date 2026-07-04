@echo off
echo Iniciando ViralClip AI...
echo.
echo 1. Iniciando servidor backend (Python)...
start "ViralClip Backend" cmd /k "cd /d C:\Users\Admin\Desktop\peakclip-workspace\viralclip-ai && python server.py"

echo.
echo 2. Esperando 4 segundos para que el servidor inicie...
timeout /t 4 /nobreak > nul

echo.
echo 3. Abriendo aplicacion en el navegador...
start "" "http://localhost:5000"

echo.
echo Listo! La app esta en http://localhost:5000
echo NO CIERRES la ventana del servidor mientras uses la app.
pause
