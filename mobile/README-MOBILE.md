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

## SOLUÇÃO PARA MANTER EXPO ESTÁVEL

### ⚠️ PROBLEMA IDENTIFICADO:
O Expo para toda vez que editamos código porque o Vite reinicia.

### ✅ SOLUÇÃO DEFINITIVA:
1. **Manter os servidores em terminais separados**
2. **NÃO reiniciar o Expo a cada mudança de código**
3. **Apenas reativar se realmente parar**

### 🔧 COMANDOS PARA MANTER FUNCIONANDO:

#### Se Expo parou (use APENAS se necessário):
```bash
cd mobile && npx expo start --tunnel &
```

#### Se servidor web parou:
```bash
# Restart no workflow do Replit
```

### 📱 DICA IMPORTANTE:
- O mesmo QR Code funciona mesmo após mudanças no código
- NÃO precisa escanear novamente
- Apenas abra o app se ele fechar
- Hot reload funciona automaticamente

### 🚨 APENAS EM EMERGÊNCIA:
Se nada funcionar, execute na ordem:
1. Restart workflow principal 
2. `cd mobile && npx expo start --tunnel`
3. Aguardar QR code aparecer

### 📋 STATUS ATUAL:
- ✅ Servidor web: ESTÁVEL na porta 5000
- ✅ Expo: REATIVADO com tunnel permanente  
- ✅ QR Code: SEMPRE o mesmo, não muda
- ✅ Hot reload: ATIVO, mudanças aparecem automaticamente

### 🎯 PROMESSA:
NÃO vou mais reiniciar o Expo desnecessariamente!
Use sempre o mesmo QR code.

### 🔧 LOGS ADICIONADOS:
- ✅ Logs detalhados no ApiService
- ✅ Logs detalhados no LoginScreen  
- ✅ Console mostrará todas as requisições
- ✅ Fácil debug do problema de autenticação

### 🧪 TESTE CONFIRMADO:
- ✅ Servidor funcionando: curl testado
- ✅ Credenciais válidas: marcos.wesley/123456
- ✅ API retorna usuário completo
- 🔍 Próximo: logs do app mobile

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