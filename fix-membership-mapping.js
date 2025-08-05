import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users } from './shared/schema.ts';
import { eq } from 'drizzle-orm';
import fs from 'fs';

// Configurar conexão com banco
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL não está definida');
}

const sql = neon(databaseUrl);
const db = drizzle(sql);

async function fixMembershipMapping() {
  try {
    console.log('Corrigindo mapeamento de níveis de membership...');

    // Ler dados de memberships
    const membershipsData = fs.readFileSync('attached_assets/aneti_pmpro_memberships_users_1754413800087.csv', 'utf8');
    const memberships = JSON.parse(membershipsData);

    // Ler dados de usuários originais
    const usersData = fs.readFileSync('attached_assets/aneti_users_1754413800087.csv', 'utf8');
    const originalUsers = JSON.parse(usersData);

    // Mapeamento correto dos membership_id para nomes
    const membershipMapping = {
      1: 'Plano Júnior',      // Júnior
      2: 'Plano Pleno',       // Pleno  
      3: 'Plano Sênior',      // Sênior
      6: 'Plano Público',     // Público
      7: 'Plano Diretivo',    // Diretivo
      8: 'Plano Honra'        // Honra
    };

    // Criar mapa de user_id para o membership mais recente ativo
    const userMemberships = {};
    
    memberships.forEach(membership => {
      const userId = membership.user_id;
      const membershipId = membership.membership_id;
      const status = membership.status;
      const endDate = membership.enddate;
      
      // Considerar apenas memberships ativos ou que não expiraram
      if (status === 'active' || status === 'admin_changed' || endDate === '0000-00-00 00:00:00' || endDate === '') {
        if (!userMemberships[userId] || new Date(membership.startdate) > new Date(userMemberships[userId].startdate)) {
          userMemberships[userId] = membership;
        }
      }
    });

    console.log(`Processando ${Object.keys(userMemberships).length} usuários com memberships ativos...`);

    // Atualizar usuários com o plano correto
    let updatedCount = 0;
    
    for (const [userId, membership] of Object.entries(userMemberships)) {
      const membershipId = membership.membership_id;
      const planName = membershipMapping[membershipId] || 'Plano Público';
      
      // Encontrar usuário pelo ID original
      const originalUser = originalUsers.find(u => u.ID == userId);
      if (originalUser) {
        const username = originalUser.user_login;
        
        try {
          await db.update(users)
            .set({ planName: planName })
            .where(eq(users.username, username));
          
          updatedCount++;
          if (updatedCount % 100 === 0) {
            console.log(`Atualizados ${updatedCount} usuários...`);
          }
        } catch (error) {
          console.log(`Erro ao atualizar usuário ${username}: ${error.message}`);
        }
      }
    }

    console.log(`\n✅ Mapeamento corrigido! ${updatedCount} usuários atualizados.`);

    // Verificar distribuição final
    const distribution = await db.select({
      planName: users.planName,
      count: sql`COUNT(*)`
    }).from(users).groupBy(users.planName);

    console.log('\n📊 Nova distribuição de planos:');
    distribution.forEach(plan => {
      console.log(`   • ${plan.planName}: ${plan.count} usuários`);
    });

    // Verificar se há usuários com planos Diretivo ou Honra
    const specialPlans = await db.select({
      username: users.username,
      fullName: users.fullName,
      planName: users.planName
    }).from(users).where(sql`${users.planName} IN ('Plano Diretivo', 'Plano Honra')`);

    if (specialPlans.length > 0) {
      console.log('\n👑 Usuários com planos especiais:');
      specialPlans.forEach(user => {
        console.log(`   • ${user.fullName} (@${user.username}) - ${user.planName}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro ao corrigir mapeamento:', error);
    throw error;
  }
}

// Executar
if (import.meta.url === `file://${process.argv[1]}`) {
  fixMembershipMapping()
    .then(() => {
      console.log('✅ Correção concluída!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Falha:', error);
      process.exit(1);
    });
}

export { fixMembershipMapping };