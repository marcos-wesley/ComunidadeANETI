# ANETI - Plataforma de Membros

Uma plataforma completa de gerenciamento de membros para a **Associação Nacional dos Especialistas em TI (ANETI)**, oferecendo recursos de rede social profissional, sistema de pagamentos e gestão administrativa.

## 🚀 Funcionalidades Principais

- **Sistema de Autenticação** completo com login por email ou username
- **Perfis Profissionais** detalhados (estilo LinkedIn)
- **Sistema de Conexões** e networking entre membros
- **Fórum Comunitário** com posts e discussões
- **Sistema de Mensagens** privadas em tempo real
- **Planos de Membership** com integração de pagamentos
- **Painel Administrativo** completo
- **Sistema de Verificação** de contas com badges
- **Upload de Documentos** com integração cloud
- **Notificações** em tempo real

## 📁 Estrutura do Projeto

```
aneti-platform/
├── frontend/                # Aplicação React
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── lib/           # Utilitários e configurações
│   │   └── assets/        # Recursos estáticos
│   └── public/            # Arquivos públicos
├── backend/               # API Express.js
│   ├── routes.ts         # Rotas da API
│   ├── storage.ts        # Camada de dados
│   ├── auth.ts           # Sistema de autenticação
│   └── index.ts          # Servidor principal
├── shared/               # Código compartilhado
│   └── schema.ts         # Esquemas do banco de dados
└── docs/                # Documentação
    ├── API.md           # Documentação da API
    ├── DATABASE.md      # Esquema do banco
    └── DEPLOYMENT.md    # Guia de deploy
```

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** com TypeScript
- **Tailwind CSS** + **shadcn/ui** para design
- **TanStack Query** para gerenciamento de estado
- **Wouter** para roteamento
- **React Hook Form** para formulários

### Backend
- **Node.js** + **Express.js**
- **TypeScript** com ES Modules
- **Passport.js** para autenticação
- **Drizzle ORM** com PostgreSQL
- **Google Cloud Storage** para arquivos

### Banco de Dados
- **PostgreSQL** (Neon Serverless)
- **Drizzle ORM** para migrations
- **Sistema de sessões** persistente

## ⚡ Instalação e Execução

### Pré-requisitos
- Node.js 18+
- Banco PostgreSQL configurado
- Conta Google Cloud Storage (opcional)

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
```bash
# Criar arquivo .env
DATABASE_URL="postgresql://..."
ONESIGNAL_API_KEY="your-onesignal-key"
ONESIGNAL_APP_ID="your-onesignal-app-id"
```

### 3. Executar migrações do banco
```bash
npm run db:push
```

### 4. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5000`

## 📊 Status do Projeto

✅ **Sistema de Autenticação** - Login/registro funcionando  
✅ **Migração Completa** - 1.864 usuários migrados com sucesso  
✅ **Sistema de Pagamentos** - 2.308 pedidos históricos importados  
✅ **Perfis Profissionais** - Perfis completos estilo LinkedIn  
✅ **Sistema de Verificação** - Badges de verificação implementados  
✅ **Painel Administrativo** - Interface completa para admins  
✅ **Fórum e Mensagens** - Sistema de posts e chat funcionando  
✅ **Planos de Membership** - 4 níveis configurados  

## 👥 Usuários de Teste

- **Admin**: `aneti.master` / `123456`
- **Usuário Verificado**: `marcos.wesley` / (senha migrada do WordPress)

## 📈 Dados Históricos Migrados

- **1.864 usuários** com perfis completos
- **2.308 pedidos** (R$ 27.153,20 em transações)
- **4 planos de membership** ativos
- **Sistema de senhas** compatível com WordPress

## 🔧 Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run db:push      # Aplicar mudanças no schema
npm run db:studio    # Interface visual do banco
```

## 📚 Documentação

- [API Documentation](./docs/API.md) - Endpoints e exemplos
- [Database Schema](./docs/DATABASE.md) - Estrutura das tabelas
- [Deployment Guide](./docs/DEPLOYMENT.md) - Como fazer deploy

## 🤝 Contribuição

Este projeto foi desenvolvido especificamente para a ANETI. Para mudanças ou melhorias, entre em contato com a equipe técnica.

## 📄 Licença

Propriedade da **Associação Nacional dos Especialistas em TI (ANETI)**  
Todos os direitos reservados.