# Database Schema - ANETI Platform

Documentação completa do esquema do banco de dados PostgreSQL da plataforma ANETI.

## Visão Geral

O banco de dados utiliza **PostgreSQL** com **Drizzle ORM** para gerenciamento de esquemas e migrations. Todas as tabelas usam UUIDs como chaves primárias e incluem timestamps automáticos.

## Tabelas Principais

### 👤 users
Tabela central dos usuários da plataforma.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL, -- Hash scrypt ou bcrypt (WordPress)
  full_name VARCHAR(255) NOT NULL,
  city VARCHAR(255),
  state VARCHAR(255),
  area TEXT, -- Área de atuação profissional
  position VARCHAR(255), -- Cargo atual
  company VARCHAR(255), -- Empresa atual
  phone VARCHAR(255),
  linkedin VARCHAR(255),
  github VARCHAR(255),
  website VARCHAR(255),
  bio TEXT,
  gender VARCHAR(50),
  profile_picture TEXT, -- URL da foto de perfil
  cover_photo TEXT, -- URL da foto de capa
  about_me TEXT, -- Seção "Sobre mim"
  professional_title VARCHAR(255),
  is_approved BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false, -- Badge de verificação
  role VARCHAR(50) DEFAULT 'member', -- member, admin
  current_plan_id UUID REFERENCES membership_plans(id),
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  subscription_status VARCHAR(50) DEFAULT 'inactive',
  connections_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Índices:**
- `users_username_idx` - Busca por username
- `users_email_idx` - Busca por email  
- `users_area_idx` - Filtro por área
- `users_state_idx` - Filtro por estado

### 💳 membership_plans
Planos de membership disponíveis.

```sql
CREATE TABLE membership_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  billing_cycle VARCHAR(50) DEFAULT 'monthly', -- monthly, yearly
  features TEXT[], -- Array de funcionalidades
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Dados Padrão:**
- **Plano Público** (R$ 0,00) - Acesso básico
- **Plano Júnior** (R$ 15,00) - Para iniciantes  
- **Plano Pleno** (R$ 30,00) - Para profissionais experientes
- **Plano Sênior** (R$ 50,00) - Para especialistas

### 📝 applications
Solicitações de membership dos usuários.

```sql
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  plan_id UUID NOT NULL REFERENCES membership_plans(id),
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  payment_method VARCHAR(50),
  payment_status VARCHAR(50) DEFAULT 'pending',
  transaction_id VARCHAR(255),
  amount DECIMAL(10,2),
  documents TEXT[], -- URLs dos documentos enviados
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 🔗 connections
Sistema de conexões entre usuários.

```sql
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES users(id),
  receiver_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, rejected
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(requester_id, receiver_id)
);
```

### 👥 followers
Sistema de seguidores (similar ao Twitter).

```sql
CREATE TABLE followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES users(id),
  following_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_id, following_id)
);
```

### 📰 posts
Posts do fórum/feed da comunidade.

```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  image_url TEXT, -- URL da imagem (opcional)
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### ❤️ post_likes
Curtidas nos posts.

```sql
CREATE TABLE post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id),
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id)
);
```

### 💬 post_comments
Comentários nos posts.

```sql
CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id),
  author_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 🗨️ conversations
Conversas de mensagens privadas.

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant1_id UUID NOT NULL REFERENCES users(id),
  participant2_id UUID NOT NULL REFERENCES users(id),
  last_message TEXT,
  last_message_at TIMESTAMP,
  unread_count_p1 INTEGER DEFAULT 0,
  unread_count_p2 INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 📨 messages
Mensagens privadas entre usuários.

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  sender_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 🔔 notifications
Sistema de notificações.

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(100) NOT NULL, -- connection_request, message, post_like, etc.
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_user_id UUID REFERENCES users(id), -- Usuário relacionado à notificação
  related_post_id UUID REFERENCES posts(id), -- Post relacionado (se aplicável)
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 📋 orders (Histórico Migrado)
Pedidos históricos migrados do WordPress.

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  legacy_order_id INTEGER, -- ID original do WordPress
  total DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) NOT NULL, -- completed, pending, cancelled
  payment_method VARCHAR(100),
  transaction_id VARCHAR(255),
  billing_name VARCHAR(255),
  billing_email VARCHAR(255),
  billing_address TEXT,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Relacionamentos Principais

### User → Plans (1:N)
Um usuário pode ter histórico de múltiplos planos, mas apenas um ativo.

### User ↔ User (Connections/Followers)
- **Connections**: Relacionamento bidirecional (amigos)
- **Followers**: Relacionamento unidirecional (seguidor/seguindo)

### User → Posts → Comments/Likes
Sistema hierárquico de conteúdo social.

### User ↔ User (Messages)
Sistema de mensagens através de conversas.

## Dados de Migração

### Status da Migração (Agosto 2025)
✅ **1.864 usuários** migrados com perfis completos  
✅ **2.308 pedidos** históricos (R$ 27.153,20)  
✅ **Senhas WordPress** restauradas com compatibilidade bcrypt  
✅ **4 planos de membership** configurados  

### Estatísticas Atuais
- **Usuários Ativos**: 1.864
- **Planos Distribuição**:
  - Público: ~70% (1.200+ usuários)
  - Júnior: ~15% (300+ usuários) 
  - Pleno: ~10% (250+ usuários)
  - Sênior: ~5% (114+ usuários)

## Índices de Performance

```sql
-- Busca de usuários
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_area ON users(area);
CREATE INDEX idx_users_state ON users(state);
CREATE INDEX idx_users_verified ON users(is_verified);

-- Posts timeline
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_author_id ON posts(author_id);

-- Conexões
CREATE INDEX idx_connections_requester ON connections(requester_id);
CREATE INDEX idx_connections_receiver ON connections(receiver_id);
CREATE INDEX idx_connections_status ON connections(status);

-- Mensagens
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Notificações
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
```

## Triggers e Funções

### Atualização Automática de Timestamps
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar a todas as tabelas com updated_at
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Contagem de Conexões
```sql
CREATE OR REPLACE FUNCTION update_connections_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'accepted' THEN
    UPDATE users SET connections_count = connections_count + 1 
    WHERE id IN (NEW.requester_id, NEW.receiver_id);
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'accepted' AND NEW.status = 'accepted' THEN
    UPDATE users SET connections_count = connections_count + 1 
    WHERE id IN (NEW.requester_id, NEW.receiver_id);
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'accepted' THEN
    UPDATE users SET connections_count = connections_count - 1 
    WHERE id IN (OLD.requester_id, OLD.receiver_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER connections_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON connections
  FOR EACH ROW EXECUTE FUNCTION update_connections_count();
```

## Backup e Manutenção

### Comando de Backup
```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Limpeza de Sessões Antigas
```sql
DELETE FROM sessions WHERE expires < NOW() - INTERVAL '7 days';
```

### Análise de Performance
```sql
-- Top queries mais lentas
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;

-- Tabelas com mais acessos
SELECT schemaname, tablename, seq_scan, seq_tup_read, idx_scan, idx_tup_fetch
FROM pg_stat_user_tables 
ORDER BY seq_tup_read + idx_tup_fetch DESC;
```

## Configurações Recomendadas

### Para Desenvolvimento
```sql
-- Logs detalhados
SET log_statement = 'all';
SET log_duration = on;
SET log_min_duration_statement = 0;
```

### Para Produção
```sql
-- Otimizações de performance
SET shared_buffers = '256MB';
SET effective_cache_size = '1GB';
SET work_mem = '32MB';
SET maintenance_work_mem = '64MB';
```

---

Este esquema foi otimizado para suportar a comunidade ANETI com milhares de usuários ativos e integração completa com sistemas de pagamento e verificação.