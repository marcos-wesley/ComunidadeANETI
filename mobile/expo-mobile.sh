#!/bin/bash

# Script para iniciar o Expo de forma estável
cd "$(dirname "$0")"

# Limpar processos do Expo se existirem
pkill -f "expo start" 2>/dev/null || true
sleep 2

# Limpar cache
rm -rf .expo 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true

# Iniciar Expo com configurações otimizadas
export EXPO_USE_DEV_SERVER=true
export EXPO_NO_UPDATE_CHECK=true
export CI=1

echo "🚀 Iniciando servidor Expo..."
npx expo start --tunnel --clear --non-interactive