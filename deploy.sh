#!/bin/bash
set -e

echo "========================================="
echo "  TandemFit Docker Deployment Script"
echo "========================================="
echo ""

if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Installing Docker..."
    sudo apt-get update
    sudo apt-get install -y ca-certificates curl gnupg
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    sudo usermod -aG docker $USER
    echo "Docker installed. You may need to log out and back in for group changes."
fi

if ! docker compose version &> /dev/null; then
    echo "Docker Compose plugin not found. Please install it."
    exit 1
fi

if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "Created .env from .env.example"
        echo "IMPORTANT: Edit .env and set your OPENAI_API_KEY and a strong POSTGRES_PASSWORD before continuing."
        echo ""
        echo "Run this command to edit: nano .env"
        echo "Then run this script again."
        exit 0
    else
        echo "No .env or .env.example found. Please create a .env file."
        exit 1
    fi
fi

source .env

if [ "$OPENAI_API_KEY" = "sk-your-openai-api-key-here" ] || [ -z "$OPENAI_API_KEY" ]; then
    echo "Please set your OPENAI_API_KEY in .env before deploying."
    exit 1
fi

if [ "$POSTGRES_PASSWORD" = "change_me_to_a_strong_password" ]; then
    echo "Please set a strong POSTGRES_PASSWORD in .env before deploying."
    exit 1
fi

echo "Building and starting TandemFit..."
docker compose down
docker compose build --no-cache
docker compose up -d

echo ""
echo "Waiting for services to start..."
sleep 10

if docker compose ps | grep -q "running"; then
    echo ""
    echo "========================================="
    echo "  TandemFit is running!"
    echo "  Access it at: http://localhost:${APP_PORT:-5000}"
    echo "========================================="
    echo ""
    echo "Useful commands:"
    echo "  View logs:     docker compose logs -f"
    echo "  Stop app:      docker compose down"
    echo "  Restart app:   docker compose restart"
    echo "  Rebuild:       docker compose up -d --build"
else
    echo "Something went wrong. Check logs with: docker compose logs"
    exit 1
fi
