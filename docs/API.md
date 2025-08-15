# API Documentation - ANETI Platform

Esta é a documentação completa da API REST da plataforma ANETI.

## Base URL
```
http://localhost:5000/api
```

## Autenticação

A API usa sessões baseadas em cookies. Após o login, o cookie de sessão é automaticamente incluído nas requisições.

### Login
```http
POST /api/login
Content-Type: application/json

{
  "username": "usuario@email.com",  // Aceita email OU username
  "password": "senha123"
}
```

**Resposta de Sucesso (200):**
```json
{
  "id": "user-uuid",
  "username": "usuario",
  "email": "usuario@email.com",
  "fullName": "Nome Completo",
  "role": "member",
  "isVerified": false,
  "planName": "Plano Público"
}
```

### Logout
```http
POST /api/logout
```

### Registro
```http
POST /api/register
Content-Type: application/json

{
  "username": "novouser",
  "email": "novo@email.com",
  "password": "senha123",
  "fullName": "Nome Completo",
  "city": "São Paulo",
  "state": "SP",
  "area": "Desenvolvimento de Software"
}
```

## Usuários

### Obter usuário atual
```http
GET /api/user
```

### Obter perfil por ID
```http
GET /api/profile/{userId}
```

### Atualizar perfil
```http
PUT /api/profile
Content-Type: application/json

{
  "fullName": "Novo Nome",
  "bio": "Biografia atualizada",
  "position": "Cargo",
  "company": "Empresa",
  "linkedin": "linkedin.com/in/usuario",
  "github": "github.com/usuario",
  "website": "https://exemplo.com",
  "phone": "(11) 99999-9999"
}
```

## Membros

### Listar membros
```http
GET /api/members?page=1&limit=20&sortBy=recent&state=SP&plan=Pleno&search=termo
```

**Parâmetros:**
- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 20)  
- `sortBy` (opcional): `recent`, `newest`, `alphabetical`
- `state` (opcional): Filtro por estado
- `plan` (opcional): Filtro por plano de membership
- `gender` (opcional): Filtro por gênero
- `area` (opcional): Filtro por área de atuação
- `search` (opcional): Busca por nome, área ou posição

**Resposta:**
```json
{
  "members": [
    {
      "id": "user-uuid",
      "username": "usuario",
      "fullName": "Nome Completo",
      "area": "Desenvolvimento de Software",
      "position": "Desenvolvedor Senior",
      "city": "São Paulo",
      "state": "SP",
      "planName": "Plano Pleno",
      "isVerified": true,
      "profilePicture": "url-da-foto",
      "connectionStatus": "none|pending|connected|can_accept",
      "isFollowing": false,
      "connectionsCount": 25,
      "followersCount": 15
    }
  ],
  "total": 1864,
  "page": 1,
  "limit": 20,
  "totalPages": 94
}
```

## Conexões

### Enviar solicitação de conexão
```http
POST /api/connections
Content-Type: application/json

{
  "receiverId": "user-uuid"
}
```

### Listar conexões pendentes
```http
GET /api/connections/pending
```

### Aceitar/Rejeitar conexão
```http
PUT /api/connections/{connectionId}
Content-Type: application/json

{
  "status": "accepted" // ou "rejected"
}
```

### Status de conexão com usuário
```http
GET /api/connections/status/{userId}
```

### Contagem de conexões
```http
GET /api/connections/count/{userId}
```

## Seguidores

### Seguir usuário
```http
POST /api/follow
Content-Type: application/json

{
  "followingId": "user-uuid"
}
```

### Parar de seguir
```http
DELETE /api/follow/{userId}
```

## Posts (Fórum)

### Listar posts
```http
GET /api/posts?page=1&limit=10
```

### Criar post
```http
POST /api/posts
Content-Type: application/json

{
  "content": "Conteúdo do post",
  "imageUrl": "https://exemplo.com/imagem.jpg" // opcional
}
```

### Curtir/Descurtir post
```http
POST /api/posts/{postId}/like
```

### Comentar post
```http
POST /api/posts/{postId}/comments
Content-Type: application/json

{
  "content": "Conteúdo do comentário"
}
```

## Mensagens

### Listar conversas
```http
GET /api/conversations
```

### Obter mensagens de conversa
```http
GET /api/messages/{conversationId}?page=1
```

### Enviar mensagem
```http
POST /api/messages
Content-Type: application/json

{
  "receiverId": "user-uuid",
  "content": "Conteúdo da mensagem"
}
```

### Marcar mensagens como lidas
```http
PUT /api/messages/{conversationId}/read
```

## Notificações

### Listar notificações
```http
GET /api/notifications?page=1&limit=20
```

### Contagem de não lidas
```http
GET /api/notifications/unread-count
```

### Marcar como lida
```http
PUT /api/notifications/{notificationId}/read
```

## Aplicações de Membership

### Obter aplicação atual
```http
GET /api/user/application
```

### Criar aplicação
```http
POST /api/applications
Content-Type: application/json

{
  "planId": "plan-uuid",
  "paymentMethod": "mercado_pago",
  "documents": ["doc1.pdf", "doc2.pdf"]
}
```

## Admin (Requer role "admin")

### Verificar autenticação admin
```http
GET /api/admin/auth/check
```

### Listar todas as aplicações
```http
GET /api/admin/applications?status=pending&page=1
```

### Aprovar/Rejeitar aplicação
```http
PUT /api/admin/applications/{applicationId}
Content-Type: application/json

{
  "status": "approved", // ou "rejected"
  "notes": "Observações do admin"
}
```

### Atualizar dados do usuário
```http
PUT /api/admin/users/{userId}
Content-Type: application/json

{
  "isVerified": true,
  "role": "admin",
  "isActive": true,
  "planName": "Plano Senior"
}
```

### Estatísticas do dashboard
```http
GET /api/admin/stats
```

**Resposta:**
```json
{
  "totalMembers": 1864,
  "totalApplications": 25,
  "pendingApplications": 5,
  "totalRevenue": 27153.20,
  "monthlyGrowth": 12.5,
  "membersByPlan": {
    "Plano Público": 1200,
    "Plano Júnior": 300,
    "Plano Pleno": 250,
    "Plano Sênior": 114
  }
}
```

### Listar pedidos
```http
GET /api/admin/orders?status=completed&page=1&limit=20
```

## Upload de Arquivos

### Upload de foto de perfil
```http
POST /api/upload/profile-picture
Content-Type: multipart/form-data

file: [arquivo de imagem]
```

### Upload de documento
```http
POST /api/upload/document
Content-Type: multipart/form-data

file: [arquivo PDF/imagem]
```

## Códigos de Status HTTP

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Requisição inválida
- `401` - Não autenticado
- `403` - Não autorizado (sem permissão)
- `404` - Não encontrado
- `409` - Conflito (ex: email já existe)
- `422` - Dados inválidos
- `500` - Erro interno do servidor

## Exemplos de Uso

### Login e busca de membros
```javascript
// Login
const loginResponse = await fetch('/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'usuario@email.com',
    password: 'senha123'
  })
});

const user = await loginResponse.json();

// Buscar membros
const membersResponse = await fetch('/api/members?limit=10&search=desenvolvedor');
const { members, total } = await membersResponse.json();
```

### Criar post e curtir
```javascript
// Criar post
await fetch('/api/posts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: 'Compartilhando conhecimento sobre React!'
  })
});

// Curtir post
await fetch(`/api/posts/${postId}/like`, {
  method: 'POST'
});
```

## Rate Limiting

A API implementa rate limiting para prevenir abuso:
- **Login**: 5 tentativas por IP por minuto
- **Registro**: 3 tentativas por IP por hora
- **Posts**: 10 posts por usuário por hora
- **Mensagens**: 100 mensagens por usuário por hora

## WebSockets (Tempo Real)

Para funcionalidades em tempo real (mensagens, notificações):

```javascript
const socket = io('ws://localhost:5000');

// Receber mensagens
socket.on('newMessage', (message) => {
  console.log('Nova mensagem:', message);
});

// Receber notificações
socket.on('notification', (notification) => {
  console.log('Nova notificação:', notification);
});
```

---

Para dúvidas ou suporte técnico, entre em contato com a equipe de desenvolvimento da ANETI.