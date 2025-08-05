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

## Evitando Conflitos de Porta

### Se der erro "EADDRINUSE":
1. Parar todos os processos: `pkill -f "tsx server" && pkill -f "expo"`
2. Reiniciar workflow principal no Replit
3. Iniciar Expo: `cd mobile && npx expo start --tunnel`

### Ordem de Inicialização:
1. **Primeiro**: Workflow "Start application" (servidor web)
2. **Segundo**: Servidor Expo (mobile)

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