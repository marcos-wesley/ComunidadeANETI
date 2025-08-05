const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const { drizzle } = require('drizzle-orm/neon-serverless');
const { Pool } = require('@neondatabase/serverless');

// Setup database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// Import tables from schema
const { orders, users, membershipPlans } = require('./shared/schema.ts');

async function loadCSVData(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      delimiter: ',',
      quote: '"',
      escape: '"'
    });

    parser.on('readable', function() {
      let record;
      while (record = parser.read()) {
        results.push(record);
      }
    });

    parser.on('error', function(err) {
      reject(err);
    });

    parser.on('end', function() {
      resolve(results);
    });

    // Read and parse the CSV data (it's in JSON format)
    const csvContent = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(csvContent);
    
    // Convert JSON array to CSV-like format for parser
    if (jsonData.length > 0) {
      const headers = Object.keys(jsonData[0]);
      let csvFormat = headers.join(',') + '\n';
      
      jsonData.forEach(row => {
        const values = headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });
        csvFormat += values.join(',') + '\n';
      });
      
      parser.write(csvFormat);
    }
    
    parser.end();
  });
}

function mapOrderStatus(status, total, paymentType) {
  // If no payment required (total is 0), it's free
  if (total === '0' || total === 0) {
    return 'free';
  }
  
  // If payment is completed (has payment info and status is success)
  if (status === 'success' || paymentType) {
    return 'completed';
  }
  
  // If cancelled
  if (status === 'cancelled') {
    return 'cancelled';
  }
  
  // Default to pending for paid orders without clear status
  return 'pending';
}

function getPaymentType(cardType, paymentType, total) {
  if (total === '0' || total === 0) {
    return 'free';
  }
  
  if (cardType) {
    return 'card';
  }
  
  if (paymentType && paymentType !== '') {
    return paymentType;
  }
  
  return 'unknown';
}

async function migrateOrders() {
  try {
    console.log('🚀 Iniciando migração completa de pedidos...');
    
    // Load orders data
    const ordersData = await loadCSVData('./attached_assets/aneti_pmpro_membership_orders_1754416415728.csv');
    console.log(`📊 Carregados ${ordersData.length} pedidos da tabela principal`);
    
    // Load order metadata
    const orderMetaData = await loadCSVData('./attached_assets/aneti_pmpro_membership_ordermeta_1754416415727.csv');
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
    const existingUsers = await db.select().from(users);
    const userMapping = {};
    existingUsers.forEach(user => {
      if (user.legacyId) {
        userMapping[user.legacyId] = user;
      }
    });
    
    // Get existing membership plans
    const existingPlans = await db.select().from(membershipPlans);
    const planMapping = {};
    existingPlans.forEach(plan => {
      if (plan.legacyId) {
        planMapping[plan.legacyId] = plan;
      }
    });
    
    console.log(`👥 Encontrados ${Object.keys(userMapping).length} usuários para mapeamento`);
    console.log(`📋 Encontrados ${Object.keys(planMapping).length} planos para mapeamento`);
    
    // Clear existing orders first
    console.log('🗑️ Limpando pedidos existentes...');
    await db.delete(orders);
    
    let importedCount = 0;
    let skippedCount = 0;
    
    console.log('📦 Processando pedidos...');
    
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
        
        // Parse checkout level info if available
        let checkoutLevel = null;
        if (metadata.checkout_level) {
          try {
            // The checkout_level is stored as a PHP serialized string, we'll try to extract basic info
            const levelStr = metadata.checkout_level;
            if (levelStr.includes('name')) {
              const nameMatch = levelStr.match(/s:\d+:"([^"]*)".*?s:4:"name";s:\d+:"([^"]*)"/);
              if (nameMatch && nameMatch[2]) {
                checkoutLevel = { name: nameMatch[2] };
              }
            }
          } catch (e) {
            console.log(`⚠️ Erro ao parsear checkout_level para pedido ${orderData.code}`);
          }
        }
        
        // Create order record
        const order = {
          id: crypto.randomUUID(),
          orderCode: orderData.code || `ORDER_${orderData.id}`,
          userId: userMapping[userId].id,
          userName: userMapping[userId].username,
          userFullName: userMapping[userId].fullName,
          planId: plan ? plan.id : null,
          planName: plan ? plan.name : (checkoutLevel ? checkoutLevel.name : `Plan ${membershipId}`),
          total: Math.round(parseFloat(orderData.total || 0) * 100), // Convert to cents
          status: mapOrderStatus(orderData.status, orderData.total, orderData.payment_type),
          paymentType: getPaymentType(orderData.cardtype, orderData.payment_type, orderData.total),
          cardType: orderData.cardtype || null,
          accountNumber: orderData.accountnumber || null,
          billingName: orderData.billing_name || null,
          billingStreet: orderData.billing_street || null,
          billingCity: orderData.billing_city || null,
          billingState: orderData.billing_state || null,
          billingZip: orderData.billing_zip || null,
          billingCountry: orderData.billing_country || null,
          billingPhone: orderData.billing_phone || null,
          gateway: orderData.gateway || 'stripe',
          notes: orderData.notes || null,
          createdAt: orderData.timestamp ? new Date(orderData.timestamp) : new Date(),
          updatedAt: new Date()
        };
        
        await db.insert(orders).values(order);
        importedCount++;
        
        if (importedCount % 100 === 0) {
          console.log(`✅ Processados ${importedCount} pedidos...`);
        }
        
      } catch (error) {
        console.error(`❌ Erro ao processar pedido ${orderData.code}:`, error);
        skippedCount++;
      }
    }
    
    console.log('\n🎉 Migração de pedidos concluída!');
    console.log(`✅ ${importedCount} pedidos importados`);
    console.log(`⚠️ ${skippedCount} pedidos pulados`);
    console.log(`📊 Total de ${importedCount + skippedCount} pedidos processados`);
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    throw error;
  }
}

// Run migration
if (require.main === module) {
  migrateOrders()
    .then(() => {
      console.log('✨ Script de migração finalizado!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Falha na migração:', error);
      process.exit(1);
    });
}

module.exports = { migrateOrders };