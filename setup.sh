#!/bin/bash

# Xeno FDE Setup Script
echo "Setting up Xeno FDE project..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create backend .env file if it doesn't exist
if [ ! -f backend/.env ]; then
    echo "Creating backend .env file..."
    cp backend/.env.example backend/.env
    echo "Please update backend/.env with your configuration."
fi

# Create frontend .env.local file if it doesn't exist
if [ ! -f frontend/.env.local ]; then
    echo "Creating frontend .env.local file..."
    echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api" > frontend/.env.local
fi

# Start the development environment
echo "Starting development environment..."
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 10

# Initialize the database
echo "Initializing database..."
cd backend
npm install
npx prisma generate
npx prisma db push
cd ..

echo "Setup complete!"
echo "Backend: http://localhost:3001"
echo "Frontend: http://localhost:3000"