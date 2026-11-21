@echo off
chcp 65001 >nul
title BioCraft Central — Python Control Hub & Cloud Tunnel
color 0B

echo ================================================================
echo   🚀 جاري تشغيل خادم التحكم السحابي BioCraft Python Hub...
echo ================================================================
echo.

cd /d "%~dp0"

start "BioCraft Backend Server" /min python backend_server.py
start "BioCraft Cloudflare Tunnel" /min python tunnel_daemon.py

timeout /t 3 >nul

echo [+] خادم بايثون يعمل الآن على http://127.0.0.1:8000
echo [+] نفق HTTPS السحابي يعمل الآن عبر Cloudflare
echo [+] جاري فتح لوحة الأدمن في المتصفح...
start https://1234567890vi.github.io/linkbio-admin-panel/

echo.
echo ================================================================
echo   لوحة الأدمن متصلة الآن بالخادم ومتحكمة في المنصة مباشرة!
echo ================================================================
pause
