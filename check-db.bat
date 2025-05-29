@echo off
echo Checking PostgreSQL connection and database...
echo.
echo Testing connection to PostgreSQL:
psql -U postgres -h localhost -c "SELECT version();"
echo.
echo Listing existing databases:
psql -U postgres -h localhost -c "\l"
echo.
echo Creating 'wb' database if it doesn't exist:
createdb -U postgres -h localhost wb 2>nul || echo Database 'wb' already exists or creation failed
echo.
echo Testing connection to 'wb' database:
psql -U postgres -h localhost -d wb -c "SELECT current_database();"
pause