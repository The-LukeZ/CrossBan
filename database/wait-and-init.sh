#!/bin/bash

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to start..."

until pg_isready -h localhost -p 5432 -U "$POSTGRES_USER" > /dev/null 2>&1; do
  echo "PostgreSQL is not ready yet..."
  sleep 2
done

echo "PostgreSQL is ready! Running custom initialization..."

# Your custom commands here
# Example: Create additional databases, users, or run specific scripts
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "CREATE DATABASE $POSTGRES_USER"

echo "Custom initialization finished!"