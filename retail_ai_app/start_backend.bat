@echo off
echo ========================================
echo  RetailAI - Backend Server
echo ========================================
cd /d "%~dp0backend"
echo Starting Flask API on http://localhost:5000 ...
echo Press Ctrl+C to stop.
python app.py
