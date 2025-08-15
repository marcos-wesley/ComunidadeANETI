# Deployment Guide - ANETI Platform

Guia completo para deploy da plataforma ANETI em produção.

## 🎯 Opções de Deploy

### 1. Replit Deployments (Recomendado)
Solução mais simples e integrada ao ambiente de desenvolvimento.

### 2. Vercel + Neon Database
Para máxima performance e escalabilidade.

### 3. Railway + PostgreSQL
Solução completa com banco gerenciado.

### 4. Docker + VPS
Para controle total da infraestrutura.

---

## 🚀 Deploy no Replit Deployments

### Pré-requisitos
- Projeto funcional no Replit
- Variáveis de ambiente configuradas
- Banco de dados PostgreSQL ativo

### 1. Configurar Variáveis de Ambiente
```bash
# Essenciais
DATABASE_URL="postgresql://user:password@host:port/database"
NODE_ENV="production"

# Opcionais
ONESIGNAL_API_KEY="your-onesignal-key"
ONESIGNAL_APP_ID="your-app-id"
SENDGRID_API_KEY="your-sendgrid-key"
```

### 2. Preparar Build
```bash
npm run build
```

### 3. Deploy
1. Acesse o painel de **Deployments** no Replit
2. Clique em **Create deployment**
3. Configure o domínio (ex: `aneti-platform.replit.app`)
4. Defina as variáveis de ambiente
5. Clique em **Deploy**

### 4. Verificar Deploy
- Acesse a URL do deployment
- Teste login e funcionalidades principais
- Verifique logs em tempo real

---

## 🌐 Deploy no Vercel

### 1. Preparar Projeto
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login
```

### 2. Configurar `vercel.json`
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "client/dist/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/client/dist/$1"
    }
  ],
  "env": {
    "DATABASE_URL": "@database_url",
    "NODE_ENV": "production"
  }
}
```

### 3. Build e Deploy
```bash
# Build do frontend
npm run build

# Deploy
vercel --prod
```

### 4. Configurar Domínio Customizado
```bash
vercel domains add aneti.org.br
```

---

## 🚄 Deploy no Railway

### 1. Conectar Repositório
1. Acesse [railway.app](https://railway.app)
2. Conecte seu repositório GitHub
3. Selecione o projeto ANETI

### 2. Configurar Banco PostgreSQL
```bash
# Railway CLI
railway add postgresql
```

### 3. Variáveis de Ambiente
```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
NODE_ENV=production
PORT=${{PORT}}
```

### 4. Deploy Automático
- Push para main branch ativa deploy automático
- Logs disponíveis em tempo real no dashboard

---

## 🐳 Deploy com Docker

### 1. Criar `Dockerfile`
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Instalar dependências
COPY package*.json ./
RUN npm ci --only=production

# Copiar código
COPY . .

# Build do frontend
RUN npm run build

# Expor porta
EXPOSE 5000

# Comando inicial
CMD ["npm", "start"]
```

### 2. Criar `docker-compose.yml`
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/aneti
      - NODE_ENV=production
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=aneti
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### 3. Deploy
```bash
# Build e start
docker-compose up -d

# Verificar logs
docker-compose logs -f app
```

---

## 🗄️ Configuração do Banco de Dados

### Neon Database (Recomendado)
```bash
# 1. Criar projeto no Neon.tech
# 2. Copiar connection string
# 3. Configurar variável DATABASE_URL
```

### PostgreSQL Local
```bash
# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib

# Criar banco
sudo -u postgres createdb aneti_production

# Criar usuário
sudo -u postgres createuser --interactive aneti_user
```

### Executar Migrations
```bash
# Aplicar schema
npm run db:push

# Verificar tabelas
npm run db:studio
```

---

## 🔒 Configurações de Segurança

### 1. HTTPS
```javascript
// server/index.ts
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});
```

### 2. Headers de Segurança
```javascript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));
```

### 3. Rate Limiting
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: 'Muitas tentativas, tente novamente em 15 minutos'
});

app.use('/api/', limiter);
```

---

## 📊 Monitoramento

### 1. Logs de Aplicação
```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'aneti-api' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### 2. Health Check
```javascript
app.get('/health', async (req, res) => {
  try {
    // Verificar conexão com banco
    await db.select().from(users).limit(1);
    
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
});
```

### 3. Métricas
```bash
# Instalar PM2 para monitoramento
npm install -g pm2

# Start com PM2
pm2 start server/index.ts --name aneti-api

# Monitorar
pm2 monit
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build
      run: npm run build
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

---

## 🚨 Rollback e Backup

### 1. Backup do Banco
```bash
# Backup automático diário
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Comprimir backup
gzip backup_$(date +%Y%m%d).sql
```

### 2. Rollback
```bash
# Vercel
vercel rollback

# Railway
railway rollback

# Docker
docker-compose down
docker-compose pull
docker-compose up -d
```

---

## 📋 Checklist de Deploy

### Antes do Deploy
- [ ] Testes passando localmente
- [ ] Build sem erros
- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados com schema atualizado
- [ ] SSL/HTTPS configurado
- [ ] Domínio configurado

### Após Deploy
- [ ] Health check respondendo
- [ ] Login funcionando
- [ ] Funcionalidades principais testadas
- [ ] Logs sem erros críticos
- [ ] Performance aceitável
- [ ] Backup do banco configurado

---

## 🆘 Troubleshooting

### Problemas Comuns

**Build falha:**
```bash
# Limpar cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Banco não conecta:**
```bash
# Verificar connection string
echo $DATABASE_URL

# Testar conexão
psql $DATABASE_URL -c "SELECT 1"
```

**502/503 Errors:**
```bash
# Verificar logs
vercel logs aneti-platform
railway logs
```

### Contatos de Suporte
- **Replit**: support@replit.com
- **Vercel**: support@vercel.com  
- **Railway**: support@railway.app
- **Neon**: support@neon.tech

---

A plataforma ANETI está pronta para produção com qualquer uma dessas opções de deploy!