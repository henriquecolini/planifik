#!/bin/sh

echo "Waiting for database..."

until pg_isready -h db -p 5432 -U "$POSTGRES_USER"; do
  sleep 1
done

echo "Database is ready!"

npx --no-install prisma migrate deploy

echo "Starting app..."

node server.js
