#!/bin/bash
# Forca o script a parar imediatamente se qualquer comando falhar
set -e

echo "=== 🚀 STEP 1: BUILDING PRODUCTION DOCKER IMAGE ==="
# O terminal do GitHub Actions vai injetar o seu usuario nas variaveis abaixo
docker build -t $DOCKER_USERNAME/invoice-frontend:latest .

echo "=== 🐳 STEP 2: PUSHING DOCKER IMAGE TO THE REGISTRY ==="
docker push $DOCKER_USERNAME/invoice-frontend:latest

echo "=== ✅ IMAGE REPOSITORY UPDATED WITH SUCCESS ==="

