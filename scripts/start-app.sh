#!/bin/bash

echo "=== ?? STEP 1: CLEANING PREVIOUS CONTAINERS ==="
# Remove o container do front-end se ele já estiver rodando, limpando erros antigos
docker rm -f invoice-frontend-container 2>/dev/null

echo "=== ?? STEP 2: DISPARANDO GO-LIVE DO FRONTEND ==="

# Inicializa o container do Nginx servindo o seu front-end estático
docker run -d \
  --name invoice-frontend-container \
  --restart always \
  -p 80:80 \
  wclcorp/invoice-frontend:latest

echo "=========================================================="
echo "?? ECOSSISTEMA INICIADO COM ACESSO AO FRONTEND DISPONÍVEL!"
echo "=========================================================="
