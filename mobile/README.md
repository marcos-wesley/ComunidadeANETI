# ANETI Mobile App

Aplicativo móvel da comunidade ANETI (Associação Nacional dos Especialistas em TI) desenvolvido em React Native com Expo.

## 🏗️ Arquitetura

- **Frontend**: React Native + Expo
- **Navegação**: React Navigation (Bottom Tabs + Stack)
- **Estado**: Context API para autenticação
- **API**: Axios para comunicação com backend existente
- **Persistência**: AsyncStorage para dados locais
- **UI**: Custom components com Material Icons

## 🎨 Design System

### Cores
- **Primária**: #012d6a (Azul ANETI)
- **Secundária**: #25a244 (Verde)
- **Auxiliares**: Branco, cinza, cinza claro

### Navegação
- **Bottom Tabs**: 5 abas principais
  - 🏠 Início
  - 📰 Feed  
  - 👥 Grupos
  - 💬 Fóruns
  - 👤 Perfil

## 🔧 Funcionalidades

### ✅ Implementadas
- Login/Logout
- Navegação entre telas
- Interface das 5 telas principais
- Integração com API existente
- Persistência de sessão
- UI responsiva e moderna

### 🚧 Em Desenvolvimento
- Cadastro via mobile
- Notificações push
- Upload de arquivos
- Chat em tempo real
- Modo offline

## 🔌 Backend Integration

O app consome as mesmas APIs do sistema web:
- `/api/login` - Autenticação
- `/api/user` - Dados do usuário
- `/api/posts` - Feed de posts
- `/api/members` - Lista de membros
- `/api/notifications` - Notificações

## 🚀 Execução

```bash
# Instalar dependências
npm install

# Rodar no Expo
npm run dev

# ou
expo start
```

## 📱 Compatibilidade

- ✅ Android 6.0+ 
- ✅ iOS 12.0+
- ✅ Expo Go
- ✅ Build nativo

## 🔐 Autenticação

Sistema híbrido que mantém compatibilidade com o backend baseado em sessões:
- Login salva flag no AsyncStorage
- Requisições mantêm cookies de sessão
- Logout limpa dados locais

## 📋 Notas Técnicas

- Não modifica o backend existente
- Reutiliza API REST atual
- Compartilha banco de dados web
- Mantém consistência visual ANETI