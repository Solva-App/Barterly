@echo off
cd /d "%~dp0"
start "" http://localhost:5600
python -m http.server 5600
