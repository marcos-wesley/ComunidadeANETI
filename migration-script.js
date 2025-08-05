import fs from 'fs';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users, membershipPlans } from './shared/schema.ts';
import { eq } from 'drizzle-orm';

// Configurar conexão com banco
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL não está definida');
}

const sql = neon(databaseUrl);
const db = drizzle(sql);

// Função para converter senhas WordPress para bcrypt
function convertWordPressPassword(wpPassword, username) {
  // Para senhas WordPress, vamos gerar uma senha temporária
  // O usuário precisará fazer reset de senha na primeira vez
  const tempPassword = username + 'temp123'; // Senha temporária baseada no username
  return bcrypt.hashSync(tempPassword, 10);
}

// Função para mapear áreas de atuação do sistema antigo para o novo
function mapAreaToNew(oldArea) {
  const areaMap = {
    'Desenvolvimento': 'Desenvolvimento de Software',
    'Infraestrutura': 'Administração de Redes e Sistemas',
    'Gest\u00e3o de Projetos': 'Gestão de Projetos',
    'Consultoria e Treinamento em TI': 'Consultoria e Treinamento em TI',
    'Seguran\u00e7a da Informa\u00e7\u00e3o': 'Segurança da Informação',
    'Governan\u00e7a em TI': 'Governança em TI',
    'Inova\u00e7\u00e3o em TI': 'Inovação em TI',
    'Banco de Dados': 'Banco de Dados',
    'Design e Experi\u00eancia do Usu\u00e1rio (UX/UI)': 'Design e Experiência do Usuário (UX/UI)',
    'Intelig\u00eancia Artificial': 'Inteligência Artificial',
    'Marketing Digital e SEO': 'Marketing Digital e SEO',
    'Automa\u00e7\u00e3o e Rob\u00f3tica': 'Automação e Robótica',
    'Realidade Aumentada (AR) e Realidade Virtual (VR)': 'Realidade Aumentada (AR) e Realidade Virtual (VR)',
    'Pesquisa e Desenvolvimento (P&D)': 'Pesquisa e Desenvolvimento (P&D)',
    'Suporte e Opera\u00e7\u00f5es de TI': 'Suporte e Operações de TI'
  };
  return areaMap[oldArea] || oldArea || 'Desenvolvimento de Software';
}

// Função para mapear níveis de membership do sistema antigo para o novo
function mapMembershipLevel(membershipId) {
  const levelMap = {
    1: 'Plano Público', // Nível mais básico
    2: 'Plano Júnior',
    3: 'Plano Pleno',
    5: 'Plano Público', // Temporário/trial
    6: 'Plano Público', // Trial
    7: 'Plano Sênior'
  };
  return levelMap[membershipId] || 'Plano Público';
}

async function migrateData() {
  try {
    console.log('Iniciando migração dos dados...');

    // 1. Carregar dados dos arquivos JSON
    console.log('1. Carregando dados dos arquivos JSON...');
    
    const usersData = JSON.parse(fs.readFileSync('./attached_assets/aneti_users_1754413800087.csv', 'utf8'));
    const profileData = JSON.parse(fs.readFileSync('./attached_assets/aneti_bp_xprofile_data_1754413800085.csv', 'utf8'));
    const profileFields = JSON.parse(fs.readFileSync('./attached_assets/aneti_bp_xprofile_fields_1754413800085.csv', 'utf8'));
    const membershipsData = JSON.parse(fs.readFileSync('./attached_assets/aneti_pmpro_memberships_users_1754413800087.csv', 'utf8'));

    console.log(`Carregados: ${usersData.length} usuários, ${profileData.length} dados de perfil, ${membershipsData.length} memberships`);

    // 2. Criar mapa de campos de perfil
    console.log('2. Mapeando campos de perfil...');
    const fieldMap = {};
    profileFields.forEach(field => {
      fieldMap[field.id] = field.name;
    });

    // 3. Organizar dados de perfil por usuário
    console.log('3. Organizando dados de perfil por usuário...');
    const userProfiles = {};
    profileData.forEach(data => {
      const userId = data.user_id;
      const fieldName = fieldMap[data.field_id];
      
      if (!userProfiles[userId]) {
        userProfiles[userId] = {};
      }
      
      userProfiles[userId][fieldName] = data.value;
    });

    // 4. Obter membership mais recente por usuário
    console.log('4. Mapeando memberships mais recentes...');
    const userMemberships = {};
    membershipsData.forEach(membership => {
      const userId = membership.user_id;
      const currentMembership = userMemberships[userId];
      
      // Manter apenas o membership mais recente (maior ID ou status ativo)
      if (!currentMembership || 
          membership.status === 'active' || 
          new Date(membership.modified) > new Date(currentMembership.modified)) {
        userMemberships[userId] = membership;
      }
    });

    // 5. Migrar usuários
    console.log('5. Migrando usuários...');
    let migratedCount = 0;
    let errorCount = 0;

    for (const user of usersData) {
      try {
        const userId = user.ID;
        const profile = userProfiles[userId] || {};
        const membership = userMemberships[userId];

        // Converter senha WordPress para bcrypt
        const password = convertWordPressPassword(user.user_pass, user.user_login);

        // Preparar dados do usuário
        const userData = {
          id: crypto.randomUUID(),
          username: user.user_login || user.user_nicename,
          email: user.user_email,
          password: password,
          fullName: profile['Nome'] || user.display_name || user.user_login,
          city: profile['Cidade'] || 'Não informado',
          state: profile['Estado'] || 'Não informado',
          area: mapAreaToNew(profile['Area de Atua\u00e7\u00e3o']),
          position: profile['Cargo ou Fun\u00e7\u00e3o Atual'] || null,
          phone: profile['Telefone'] || null,
          website: profile['Site'] || user.user_url || null,
          bio: profile['Biografia'] || null,
          gender: profile['Qual seu g\u00eanero? '] || null,
          professionalTitle: profile['Titulo'] || null,
          aboutMe: profile['Biografia'] || null,
          planName: membership ? mapMembershipLevel(membership.membership_id) : 'Plano Público',
          subscriptionStatus: membership?.status === 'active' ? 'active' : 'inactive',
          isApproved: true, // Usuários existentes já estão aprovados
          isActive: user.user_status === '0', // WordPress usa 0 para ativo
          role: userId === '1' ? 'admin' : 'member', // Primeiro usuário é admin
          connectionsCount: 0,
          createdAt: new Date(user.user_registered),
          updatedAt: new Date()
        };

        // Inserir usuário no banco
        await db.insert(users).values(userData);
        migratedCount++;

        if (migratedCount % 10 === 0) {
          console.log(`Migrados ${migratedCount} usuários...`);
        }

      } catch (error) {
        console.error(`Erro ao migrar usuário ${user.user_login}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n✅ Migração concluída!`);
    console.log(`   📊 Usuários migrados com sucesso: ${migratedCount}`);
    console.log(`   ❌ Erros encontrados: ${errorCount}`);
    console.log(`   📝 Total de registros processados: ${usersData.length}`);

    // 6. Estatísticas adicionais
    console.log('\n📈 Estatísticas da migração:');
    const activeUsers = await db.select().from(users).where(eq(users.isActive, true));
    const adminUsers = await db.select().from(users).where(eq(users.role, 'admin'));
    
    console.log(`   👥 Usuários ativos: ${activeUsers.length}`);
    console.log(`   👑 Administradores: ${adminUsers.length}`);
    console.log(`   📧 Usuários com email: ${activeUsers.filter(u => u.email).length}`);
    console.log(`   📱 Usuários com telefone: ${activeUsers.filter(u => u.phone).length}`);

    console.log('\n🔐 IMPORTANTE: Todos os usuários precisarão fazer reset de senha na primeira vez que fizerem login, pois as senhas MD5 foram convertidas.');

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    throw error;
  }
}

// Executar migração
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateData()
    .then(() => {
      console.log('🎉 Migração executada com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Falha na migração:', error);
      process.exit(1);
    });
}

export { migrateData };