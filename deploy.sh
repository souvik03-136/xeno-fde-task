#!/bin/bash

# Xeno FDE Production Deployment Script

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

# Build and deploy
echo "Deploying Xeno FDE to production..."

# Build and start containers
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build

# Run database migrations
echo "Running database migrations..."
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

echo "Deployment complete!"