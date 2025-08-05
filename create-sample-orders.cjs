const { Client } = require('pg');

// Configuração do banco de dados
const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function createSampleOrders() {
  try {
    await client.connect();
    console.log('Conectado ao banco de dados');

    // Buscar alguns usuários existentes
    const usersResult = await client.query(`
      SELECT id, username, plan_name FROM users 
      WHERE plan_name IS NOT NULL 
      ORDER BY created_at LIMIT 20
    `);

    if (usersResult.rows.length === 0) {
      console.log('Nenhum usuário encontrado para criar pedidos');
      return;
    }

    // Buscar planos existentes
    const plansResult = await client.query('SELECT id, name, price FROM membership_plans');
    const planMap = {};
    plansResult.rows.forEach(plan => {
      planMap[plan.name] = { id: plan.id, price: plan.price };
    });

    console.log(`Criando pedidos de exemplo para ${usersResult.rows.length} usuários...`);

    let createdCount = 0;

    for (const user of usersResult.rows) {
      try {
        // Determinar o plano baseado no plan_name do usuário
        const planInfo = planMap[user.plan_name];
        if (!planInfo) {
          console.log(`Plano ${user.plan_name} não encontrado para usuário ${user.username}`);
          continue;
        }

        // Criar um pedido para este usuário
        const orderCode = `ANETI${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        
        // Simular dados de cobrança realistas
        const billingData = {
          name: `Usuario ${user.username}`,
          street: 'Rua das Flores, 123',
          city: 'São Paulo',
          state: 'SP',
          zip: '01234567',
          country: 'BR',
          phone: '11999999999'
        };

        // Definir valores baseados no plano
        const total = planInfo.price; // já está em centavos
        const subtotal = total;
        const status = total === 0 ? 'free' : 'completed';
        const paymentType = total === 0 ? '' : 'creditcard';
        const cardType = total === 0 ? '' : 'visa';

        // Inserir pedido
        const insertResult = await client.query(`
          INSERT INTO membership_orders (
            order_code, user_id, plan_id, billing_name, billing_street,
            billing_city, billing_state, billing_zip, billing_country, billing_phone,
            subtotal, total, payment_type, card_type, status, gateway,
            timestamp, notes
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
          ) RETURNING id
        `, [
          orderCode,
          user.id,
          planInfo.id,
          billingData.name,
          billingData.street,
          billingData.city,
          billingData.state,
          billingData.zip,
          billingData.country,
          billingData.phone,
          subtotal,
          total,
          paymentType,
          cardType,
          status,
          total === 0 ? null : 'stripe',
          new Date(),
          `Migração - Pedido criado para usuário ${user.username} com plano ${user.plan_name}`
        ]);

        const orderId = insertResult.rows[0].id;

        // Adicionar alguns metadados do pedido
        await client.query(`
          INSERT INTO order_meta (order_id, meta_key, meta_value) VALUES
          ($1, 'checkout_level', $2),
          ($1, 'user_plan', $3),
          ($1, 'migration_date', $4)
        `, [
          orderId,
          JSON.stringify({
            id: planInfo.id,
            name: user.plan_name,
            price: planInfo.price
          }),
          user.plan_name,
          new Date().toISOString()
        ]);

        createdCount++;
        console.log(`Pedido criado para ${user.username}: ${orderCode} - ${user.plan_name}`);

      } catch (error) {
        console.error(`Erro ao criar pedido para usuário ${user.username}:`, error.message);
      }
    }

    console.log('\n=== RESUMO DA CRIAÇÃO DE PEDIDOS ===');
    console.log(`Pedidos criados com sucesso: ${createdCount}`);

    // Mostrar estatísticas
    const statsResult = await client.query(`
      SELECT status, COUNT(*) as count, SUM(total) as total_value
      FROM membership_orders 
      GROUP BY status 
      ORDER BY count DESC
    `);

    console.log('\n=== ESTATÍSTICAS POR STATUS ===');
    statsResult.rows.forEach(row => {
      const totalInReais = (row.total_value / 100).toFixed(2);
      console.log(`${row.status}: ${row.count} pedidos - R$ ${totalInReais}`);
    });

    // Estatísticas por plano
    const planStatsResult = await client.query(`
      SELECT mp.name, COUNT(*) as order_count, SUM(mo.total) as total_revenue
      FROM membership_orders mo
      LEFT JOIN membership_plans mp ON mo.plan_id = mp.id
      GROUP BY mp.name, mp.id
      ORDER BY order_count DESC
    `);

    console.log('\n=== ESTATÍSTICAS POR PLANO ===');
    planStatsResult.rows.forEach(row => {
      const revenueInReais = (row.total_revenue / 100).toFixed(2);
      console.log(`${row.name || 'Sem plano'}: ${row.order_count} pedidos - R$ ${revenueInReais}`);
    });

  } catch (error) {
    console.error('Erro durante a criação:', error);
  } finally {
    await client.end();
  }
}

// Executar criação
createSampleOrders().catch(console.error);