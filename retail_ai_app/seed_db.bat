@echo off
echo ========================================
echo  RetailAI - Database Seed / Reset
echo ========================================
cd /d "%~dp0backend"
echo Seeding database with 2 years of demo data...
python seed_data.py
echo Done.
pause
