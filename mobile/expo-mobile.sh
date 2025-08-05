#!/bin/bash

echo "🧹 Limpando processos existentes..."
pkill -f "expo" 2>/dev/null || true
sleep 2

echo "📱 Iniciando servidor Expo..."
cd mobile

# Limpar cache do Expo se necessário
npx expo install --fix 2>/dev/null || true

# Iniciar Expo com tunnel
echo "🚀 Iniciando Expo com tunnel..."
npx expo start --tunnel --clear

echo "✅ Expo iniciado!"