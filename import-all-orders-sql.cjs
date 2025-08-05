const fs = require('fs');
const { Pool } = require('@neondatabase/serverless');

// Setup database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function importAllOrders() {
  try {
    console.log('🚀 Iniciando importação de todos os pedidos...');
    
    // Load orders data from JSON files
    const ordersData = JSON.parse(fs.readFileSync('./attached_assets/aneti_pmpro_membership_orders_1754416415728.csv', 'utf8'));
    const orderMetaData = JSON.parse(fs.readFileSync('./attached_assets/aneti_pmpro_membership_ordermeta_1754416415727.csv', 'utf8'));
    
    console.log(`📊 Carregados ${ordersData.length} pedidos da tabela principal`);
    console.log(`📊 Carregados ${orderMetaData.length} registros de metadata`);
    
    // Create metadata lookup
    const metaLookup = {};
    orderMetaData.forEach(meta => {
      if (!metaLookup[meta.pmpro_membership_order_id]) {
        metaLookup[meta.pmpro_membership_order_id] = {};
      }
      metaLookup[meta.pmpro_membership_order_id][meta.meta_key] = meta.meta_value;
    });
    
    // Get existing users for mapping
    const usersResult = await pool.query('SELECT id, "legacyId", username, "fullName" FROM users WHERE "legacyId" IS NOT NULL');
    const userMapping = {};
    usersResult.rows.forEach(user => {
      if (user.legacyId) {
        userMapping[user.legacyId] = user;
      }
    });
    
    // Get existing membership plans
    const plansResult = await pool.query('SELECT id, "legacyId", name FROM "membershipPlans" WHERE "legacyId" IS NOT NULL');
    const planMapping = {};
    plansResult.rows.forEach(plan => {
      if (plan.legacyId) {
        planMapping[plan.legacyId] = plan;
      }
    });
    
    console.log(`👥 Encontrados ${Object.keys(userMapping).length} usuários para mapeamento`);
    console.log(`📋 Encontrados ${Object.keys(planMapping).length} planos para mapeamento`);
    
    // Clear existing orders first
    console.log('🗑️ Limpando pedidos existentes...');
    await pool.query('DELETE FROM orders');
    
    let importedCount = 0;
    let skippedCount = 0;
    
    console.log('📦 Processando pedidos...');
    
    // Prepare insert statement
    const insertQuery = `
      INSERT INTO orders (
        id, "orderCode", "userId", "userName", "userFullName", 
        "planId", "planName", total, status, "paymentType", 
        "cardType", "accountNumber", "billingName", "billingStreet", 
        "billingCity", "billingState", "billingZip", "billingCountry", 
        "billingPhone", gateway, notes, "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
    `;
    
    for (const orderData of ordersData) {
      try {
        const userId = orderData.user_id;
        const membershipId = orderData.membership_id;
        
        // Skip if no user mapping
        if (!userMapping[userId]) {
          console.log(`⚠️ Usuário ${userId} não encontrado, pulando pedido ${orderData.code}`);
          skippedCount++;
          continue;
        }
        
        // Get plan info
        const plan = planMapping[membershipId];
        
        // Get order metadata
        const metadata = metaLookup[orderData.id] || {};
        
        // Map order status
        function mapOrderStatus(status, total, paymentType) {
          if (total === '0' || total === 0) return 'free';
          if (status === 'success' || paymentType) return 'completed';
          if (status === 'cancelled') return 'cancelled';
          return 'pending';
        }
        
        // Get payment type
        function getPaymentType(cardType, paymentType, total) {
          if (total === '0' || total === 0) return 'free';
          if (cardType) return 'card';
          if (paymentType && paymentType !== '') return paymentType;
          return 'unknown';
        }
        
        // Generate UUID-like ID
        function generateUUID() {
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        }
        
        // Create order values
        const values = [
          generateUUID(), // id
          orderData.code || `ORDER_${orderData.id}`, // orderCode
          userMapping[userId].id, // userId
          userMapping[userId].username, // userName
          userMapping[userId].fullName, // userFullName
          plan ? plan.id : null, // planId
          plan ? plan.name : `Plan ${membershipId}`, // planName
          Math.round(parseFloat(orderData.total || 0) * 100), // total (in cents)
          mapOrderStatus(orderData.status, orderData.total, orderData.payment_type), // status
          getPaymentType(orderData.cardtype, orderData.payment_type, orderData.total), // paymentType
          orderData.cardtype || null, // cardType
          orderData.accountnumber || null, // accountNumber
          orderData.billing_name || null, // billingName
          orderData.billing_street || null, // billingStreet
          orderData.billing_city || null, // billingCity
          orderData.billing_state || null, // billingState
          orderData.billing_zip || null, // billingZip
          orderData.billing_country || null, // billingCountry
          orderData.billing_phone || null, // billingPhone
          orderData.gateway || 'stripe', // gateway
          orderData.notes || null, // notes
          orderData.timestamp ? new Date(orderData.timestamp) : new Date(), // createdAt
          new Date() // updatedAt
        ];
        
        await pool.query(insertQuery, values);
        importedCount++;
        
        if (importedCount % 100 === 0) {
          console.log(`✅ Processados ${importedCount} pedidos...`);
        }
        
      } catch (error) {
        console.error(`❌ Erro ao processar pedido ${orderData.code}:`, error.message);
        skippedCount++;
      }
    }
    
    console.log('\n🎉 Migração de pedidos concluída!');
    console.log(`✅ ${importedCount} pedidos importados`);
    console.log(`⚠️ ${skippedCount} pedidos pulados`);
    console.log(`📊 Total de ${importedCount + skippedCount} pedidos processados`);
    
    // Verify the import
    const countResult = await pool.query('SELECT COUNT(*) as count FROM orders');
    console.log(`✨ Total de pedidos na base de dados: ${countResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration
importAllOrders()
  .then(() => {
    console.log('✨ Script de migração finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Falha na migração:', error);
    process.exit(1);
  });