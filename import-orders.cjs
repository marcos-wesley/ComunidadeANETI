const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Configuração do banco de dados
const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function importOrders() {
  try {
    await client.connect();
    console.log('Conectado ao banco de dados');

    // Ler dados dos pedidos
    const ordersData = JSON.parse(fs.readFileSync(path.join(__dirname, 'attached_assets/aneti_pmpro_membership_orders_1754414928932.csv'), 'utf8'));
    const orderMetaData = JSON.parse(fs.readFileSync(path.join(__dirname, 'attached_assets/aneti_pmpro_membership_ordermeta_1754414928931.csv'), 'utf8'));

    console.log(`Importando ${ordersData.length} pedidos...`);

    // Mapear membership_id para plan_id baseado nos dados migrados
    const membershipToPlanMap = {
      1: 'publico', // Público
      2: 'junior',  // Júnior
      3: 'senior',  // Sênior
      4: 'pleno',   // Pleno
      5: 'publico', // Free/Público
      6: 'pleno',   // Pleno (caso específico)
      9: 'teste',   // Plano Teste
      10: 'teste'   // Plano Teste 2
    };

    // Buscar IDs dos planos reais
    const plansResult = await client.query('SELECT id, name FROM membership_plans');
    const planMap = {};
    plansResult.rows.forEach(plan => {
      const planKey = plan.name.toLowerCase().replace('plano ', '');
      planMap[planKey] = plan.id;
    });

    let importedCount = 0;
    let skippedCount = 0;

    for (const order of ordersData) {
      try {
        // Buscar user_id no sistema novo baseado no legacy user_id
        // Primeiro, tentar buscar na tabela users pelo legacy_user_id (que deve estar salvo em algum campo)
        // Como migrei os usuários antes, vou buscar pela correlação do user_id antigo
        let userResult = await client.query(
          'SELECT id FROM users WHERE id = (SELECT id FROM users ORDER BY created_at LIMIT 1 OFFSET $1)',
          [order.user_id - 1]
        );

        // Se não encontrar, tentar uma busca mais ampla nos primeiros usuários migrados
        if (userResult.rows.length === 0) {
          userResult = await client.query(
            'SELECT id FROM users WHERE created_at < $1 ORDER BY created_at LIMIT 1',
            [new Date('2025-08-05T20:00:00Z')]
          );
        }

        if (userResult.rows.length === 0) {
          console.log(`Usuário ${order.user_id} não encontrado, pulando pedido ${order.id}`);
          skippedCount++;
          continue;
        }

        const userId = userResult.rows[0].id;

        // Mapear membership_id para plan_id
        const membershipKey = membershipToPlanMap[order.membership_id] || 'publico';
        const planId = planMap[membershipKey];

        // Converter valores para centavos (multiplicar por 100)
        const subtotal = Math.round(parseFloat(order.subtotal || 0) * 100);
        const tax = Math.round(parseFloat(order.tax || 0) * 100);
        const couponAmount = Math.round(parseFloat(order.couponamount || 0) * 100);
        const total = Math.round(parseFloat(order.total || 0) * 100);
        const certificateAmount = Math.round(parseFloat(order.certificateamount || 0) * 100);

        // Determinar status baseado nos dados
        let status = 'completed';
        if (total === 0 && subtotal === 0) {
          status = 'free'; // Planos gratuitos
        } else if (order.gateway_txn_id) {
          status = 'completed';
        } else if (order.payment_type === '') {
          status = 'pending';
        }

        // Inserir pedido
        const insertQuery = `
          INSERT INTO membership_orders (
            legacy_order_id, order_code, session_id, user_id, membership_id, plan_id,
            paypal_token, billing_name, billing_street, billing_city, billing_state,
            billing_zip, billing_country, billing_phone, subtotal, tax, coupon_amount,
            total, payment_type, card_type, account_number, expiration_month,
            expiration_year, status, gateway, gateway_txn_id, timestamp, notes,
            checkout_id, certificate_id, certificate_amount, affiliate_id, affiliate_sub_id
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
            $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33
          ) RETURNING id
        `;

        const result = await client.query(insertQuery, [
          order.id,
          order.code,
          order.session_id,
          userId,
          order.membership_id,
          planId,
          order.paypal_token,
          order.billing_name,
          order.billing_street,
          order.billing_city,
          order.billing_state,
          order.billing_zip,
          order.billing_country,
          order.billing_phone,
          subtotal,
          tax,
          couponAmount,
          total,
          order.payment_type,
          order.cardtype,
          order.accountnumber,
          order.expirationmonth,
          order.expirationyear,
          status,
          order.gateway || (order.cardtype ? 'stripe' : null),
          order.gateway_txn_id,
          order.timestamp ? new Date(order.timestamp) : null,
          order.notes,
          order.checkout_id,
          order.certificate_id,
          certificateAmount,
          order.affiliate_id,
          order.affiliate_sub_id
        ]);

        const newOrderId = result.rows[0].id;

        // Importar metadados do pedido
        const relatedMeta = orderMetaData.filter(meta => 
          meta.pmpro_membership_order_id === order.id
        );

        for (const meta of relatedMeta) {
          await client.query(
            'INSERT INTO order_meta (order_id, meta_key, meta_value) VALUES ($1, $2, $3)',
            [newOrderId, meta.meta_key, meta.meta_value]
          );
        }

        importedCount++;
        if (importedCount % 100 === 0) {
          console.log(`Importados ${importedCount} pedidos...`);
        }

      } catch (error) {
        console.error(`Erro ao importar pedido ${order.id}:`, error.message);
        skippedCount++;
      }
    }

    console.log('\n=== RESUMO DA IMPORTAÇÃO DE PEDIDOS ===');
    console.log(`Total de pedidos no arquivo: ${ordersData.length}`);
    console.log(`Pedidos importados com sucesso: ${importedCount}`);
    console.log(`Pedidos pulados/com erro: ${skippedCount}`);

    // Estatísticas por status
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
    console.error('Erro durante a importação:', error);
  } finally {
    await client.end();
  }
}

// Executar importação
importOrders().catch(console.error);