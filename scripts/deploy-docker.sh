#!/bin/bash

# Interrompe o script se qualquer comando falhar
set -e

# Captura os parâmetros enviados pelo GitHub Actions
DOCKER_USER="$1"
DOCKER_PASS="$2"

# Se o GitHub Actions não enviou a IMAGE_TAG, usa 'latest' como segurança
if [ -z "$IMAGE_TAG" ]; then
  IMAGE_TAG="latest"
fi

CONTAINER_NAME="invoice-frontend-app"
IMAGE_NAME="$DOCKER_USER/invoice-frontend:$IMAGE_TAG"
PORTA_VM=80 # Porta da VM que vai disparar para o navegador (mude se necessário)

#CONTAINER_NAME="invoice-frontend-app"
#IMAGE_NAME="$DOCKER_USER/invoice-frontend:latest"

echo "=> Efetuando login no Docker Hub..."
echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin

echo "=> Baixando a imagem mais recente..."
docker pull $IMAGE_NAME

echo "=> Parando e removendo o container antigo (se existir)..."
docker rm -f $CONTAINER_NAME || true

echo "=> Iniciando o novo container do Front-End..."
# Roda na porta 80 da VM direcionando para a porta 80 do container (padrão do Nginx)
docker run -d \
  --name $CONTAINER_NAME \
  --restart always \
  -p $PORTA_VM:80 \
  $IMAGE_NAME

echo "=> Deploy do Front-End concluído com sucesso!"
