import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users, membershipPlans } from './shared/schema.ts';
import { sql, eq, desc, count } from 'drizzle-orm';

// Configurar conexão com banco
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL não está definida');
}

const dbSql = neon(databaseUrl);
const db = drizzle(dbSql);

async function generateMigrationStats() {
  try {
    console.log('📊 RELATÓRIO FINAL DA MIGRAÇÃO - ANETI');
    console.log('=' + '='.repeat(50));
    
    // Estatísticas gerais
    const generalStats = await db.select({
      totalUsers: count(),
      activeUsers: sql`COUNT(CASE WHEN ${users.isActive} = true THEN 1 END)`,
      adminUsers: sql`COUNT(CASE WHEN ${users.role} = 'admin' THEN 1 END)`,
      usersWithPhone: sql`COUNT(CASE WHEN ${users.phone} IS NOT NULL AND ${users.phone} != '' THEN 1 END)`,
      usersWithBio: sql`COUNT(CASE WHEN ${users.bio} IS NOT NULL AND ${users.bio} != '' THEN 1 END)`,
      usersWithWebsite: sql`COUNT(CASE WHEN ${users.website} IS NOT NULL AND ${users.website} != '' THEN 1 END)`,
    }).from(users);

    console.log('\n📈 ESTATÍSTICAS GERAIS:');
    console.log(`   👥 Total de usuários migrados: ${generalStats[0].totalUsers}`);
    console.log(`   ✅ Usuários ativos: ${generalStats[0].activeUsers}`);
    console.log(`   👑 Administradores: ${generalStats[0].adminUsers}`);
    console.log(`   📱 Usuários com telefone: ${generalStats[0].usersWithPhone}`);
    console.log(`   📝 Usuários com biografia: ${generalStats[0].usersWithBio}`);
    console.log(`   🌐 Usuários com website: ${generalStats[0].usersWithWebsite}`);

    // Distribuição por área de atuação
    const areaStats = await db.select({
      area: users.area,
      count: count()
    }).from(users).groupBy(users.area).orderBy(desc(count()));

    console.log('\n💼 DISTRIBUIÇÃO POR ÁREA DE ATUAÇÃO:');
    areaStats.slice(0, 8).forEach((area, index) => {
      console.log(`   ${index + 1}. ${area.area}: ${area.count} usuários`);
    });

    // Distribuição por estado
    const stateStats = await db.select({
      state: users.state,
      count: count()
    }).from(users).groupBy(users.state).orderBy(desc(count()));

    console.log('\n🗺️  DISTRIBUIÇÃO POR ESTADO (TOP 10):');
    stateStats.slice(0, 10).forEach((state, index) => {
      console.log(`   ${index + 1}. ${state.state}: ${state.count} usuários`);
    });

    // Distribuição por plano
    const planStats = await db.select({
      planName: users.planName,
      count: count()
    }).from(users).groupBy(users.planName).orderBy(desc(count()));

    console.log('\n💰 DISTRIBUIÇÃO POR PLANO DE MEMBERSHIP:');
    planStats.forEach((plan, index) => {
      console.log(`   ${index + 1}. ${plan.planName}: ${plan.count} usuários`);
    });

    // Verificar planos criados
    const createdPlans = await db.select().from(membershipPlans);
    console.log('\n🏷️  PLANOS DE MEMBERSHIP CRIADOS:');
    createdPlans.forEach(plan => {
      const price = plan.price === 0 ? 'Gratuito' : `R$ ${(plan.price / 100).toFixed(2)}`;
      console.log(`   • ${plan.name}: ${price} - ${plan.description.substring(0, 50)}...`);
    });

    // Usuários com mais dados preenchidos
    const completeProfiles = await db.select({
      username: users.username,
      fullName: users.fullName,
      city: users.city,
      area: users.area,
      planName: users.planName
    }).from(users).where(sql`${users.bio} IS NOT NULL AND ${users.phone} IS NOT NULL`).limit(5);

    console.log('\n👤 EXEMPLOS DE PERFIS COMPLETOS:');
    completeProfiles.forEach(user => {
      console.log(`   • ${user.fullName} (@${user.username}) - ${user.area} - ${user.city}`);
    });

    // Data de criação dos usuários (distribuição por ano)
    const yearStats = await db.select({
      year: sql`EXTRACT(YEAR FROM ${users.createdAt})`,
      count: count()
    }).from(users).groupBy(sql`EXTRACT(YEAR FROM ${users.createdAt})`).orderBy(sql`EXTRACT(YEAR FROM ${users.createdAt})`);

    console.log('\n📅 DISTRIBUIÇÃO POR ANO DE CADASTRO:');
    yearStats.forEach(year => {
      console.log(`   • ${year.year}: ${year.count} usuários`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('🔐 Lembrete: Todos os usuários precisam fazer reset de senha no primeiro login');
    console.log('📋 Consulte MIGRAÇÃO-SENHAS.md para instruções de login');
    console.log('🎯 Admin principal: marcos.wesley');
    console.log('=' + '='.repeat(50));

  } catch (error) {
    console.error('❌ Erro ao gerar estatísticas:', error);
    throw error;
  }
}

// Executar
if (import.meta.url === `file://${process.argv[1]}`) {
  generateMigrationStats()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Falha:', error);
      process.exit(1);
    });
}

export { generateMigrationStats };