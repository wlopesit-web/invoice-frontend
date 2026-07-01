#!/bin/bash
set -e

echo "=== 🖧 CONNECTING TO ORACLE CLOUD DISTRIBUTED CLUSTER REALM ==="
# Este script simula o túnel SSH remoto que vai comandar a Máquina Chefe
echo "Executing: kubectl rollout restart deployment/invoice-consumer-deployment -n production"

# Linha que tentará se conectar via SSH (Vai falhar de propósito por falta das máquinas)
ssh -o StrictHostKeyChecking=no ubuntu@$ORACLE_CLOUD_IP "kubectl rollout restart deployment/invoice-consumer-deployment -n production"
