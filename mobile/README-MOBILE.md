# ANETI Mobile App - Setup Guide

## Servidores Necessários

### 1. Servidor Web (Backend)
- **Porta**: 5000
- **Comando**: `npm run dev` (via workflow "Start application")
- **Status**: Deve estar sempre rodando para APIs funcionarem

### 2. Servidor Expo (Mobile)
- **Porta**: 8081
- **Comando**: `cd mobile && npx expo start --tunnel`
- **QR Code**: Gerado automaticamente para teste em dispositivos

## Evitando Conflitos de Porta - SOLUÇÃO DEFINITIVA

### Para Evitar Problemas:
1. **SEMPRE** reiniciar o workflow principal primeiro (servidor web porta 5000)
2. **AGUARDAR** o servidor web estar 100% ativo 
3. **SÓ ENTÃO** iniciar Expo: `cd mobile && npx expo start --tunnel --port 8081`

### Se der erro "EADDRINUSE":
```bash
# Parar TODOS os processos
pkill -f "tsx server" && pkill -f "expo" && pkill -f "node"

# Reiniciar workflow no Replit (botão restart)

# Aguardar servidor web ficar ativo

# Iniciar Expo
cd mobile && npx expo start --tunnel --port 8081
```

### Ordem OBRIGATÓRIA:
1. **Primeiro**: Workflow "Start application" (servidor web porta 5000)
2. **Aguardar**: Logs mostrarem "serving on port 5000"
3. **Segundo**: Expo server (porta 8081)

## Testando o App

### Credenciais de Teste:
- **Usuário**: `marcos.wesley`
- **Senha**: `123456`

### URLs:
- **API Backend**: `https://workspace-maarcoswesleey.replit.app`
- **Expo Tunnel**: Varia a cada reinicialização (formato: exp://xxxxx-anonymous-8081.exp.direct)

### Funcionalidades do App:
- ✅ Login/Logout
- ✅ Feed com posts
- ✅ Grupos da comunidade
- ✅ Fóruns de discussão
- ✅ Perfil do usuário
- ✅ Navegação por 5 abas

## Estrutura do Projeto Mobile

```
mobile/
├── src/
│   ├── components/     # Componentes reutilizáveis
│   ├── screens/        # Telas principais (5 abas)
│   ├── services/       # ApiService.ts (integração com backend)
│   ├── context/        # AuthContext.tsx (autenticação)
│   └── config.ts       # Configurações (URLs, cores ANETI)
├── App.js             # App principal com navegação
└── package.json       # Dependências do React Native
```

## Cores ANETI
- **Primária**: #012d6a (azul escuro)
- **Secundária**: #25a244 (verde)