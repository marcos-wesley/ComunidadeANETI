import fs from 'fs';
import crypto from 'crypto';

// Import database connection and storage
import { db } from './server/db.js';
import { DatabaseStorage } from './server/storage.js';

async function importOrdersNow() {
  try {
    console.log('🚀 Starting automatic orders import...');
    
    const storage = new DatabaseStorage();
    
    // Load orders data from JSON files (they have .csv extension but contain JSON)
    const ordersJSON = fs.readFileSync('./attached_assets/aneti_pmpro_membership_orders_1754416415728.csv', 'utf8');
    const ordersData = JSON.parse(ordersJSON);
    
    const orderMetaJSON = fs.readFileSync('./attached_assets/aneti_pmpro_membership_ordermeta_1754416415727.csv', 'utf8');
    const orderMetaData = JSON.parse(orderMetaJSON);
    
    console.log(`📊 Loaded ${ordersData.length} orders from main table`);
    console.log(`📊 Loaded ${orderMetaData.length} metadata records`);
    
    // Create metadata lookup
    const metaLookup = {};
    orderMetaData.forEach(meta => {
      if (!metaLookup[meta.pmpro_membership_order_id]) {
        metaLookup[meta.pmpro_membership_order_id] = {};
      }
      metaLookup[meta.pmpro_membership_order_id][meta.meta_key] = meta.meta_value;
    });
    
    // Get existing users for mapping
    const existingUsers = await storage.getAllUsers();
    const userMapping = {};
    existingUsers.forEach(user => {
      if (user.legacyId) {
        userMapping[user.legacyId] = user;
      }
    });
    
    // Get existing membership plans
    const existingPlans = await storage.getAllMembershipPlans();
    const planMapping = {};
    existingPlans.forEach(plan => {
      if (plan.legacyId) {
        planMapping[plan.legacyId] = plan;
      }
    });
    
    console.log(`👥 Found ${Object.keys(userMapping).length} users for mapping`);
    console.log(`📋 Found ${Object.keys(planMapping).length} plans for mapping`);
    
    // Clear existing orders first
    console.log('🗑️ Clearing existing orders...');
    await storage.clearAllOrders();
    
    let importedCount = 0;
    let skippedCount = 0;
    
    console.log('📦 Processing orders...');
    
    function mapOrderStatus(status, total, paymentType) {
      if (total === '0' || total === 0) return 'free';
      if (status === 'success' || paymentType) return 'completed';
      if (status === 'cancelled') return 'cancelled';
      return 'pending';
    }
    
    function getPaymentType(cardType, paymentType, total) {
      if (total === '0' || total === 0) return 'free';
      if (cardType) return 'card';
      if (paymentType && paymentType !== '') return paymentType;
      return 'unknown';
    }
    
    for (const orderData of ordersData) {
      try {
        const userId = orderData.user_id;
        const membershipId = orderData.membership_id;
        
        // Skip if no user mapping
        if (!userMapping[userId]) {
          skippedCount++;
          continue;
        }
        
        // Get plan info
        const plan = planMapping[membershipId];
        
        // Create order record
        const order = {
          id: crypto.randomUUID(),
          legacyOrderId: parseInt(orderData.id) || null,
          orderCode: orderData.code || `ORDER_${orderData.id}`,
          sessionId: orderData.session_id || null,
          userId: userMapping[userId].id,
          membershipId: parseInt(membershipId) || null,
          planId: plan ? plan.id : null,
          paypalToken: orderData.paypal_token || null,
          billingName: orderData.billing_name || null,
          billingStreet: orderData.billing_street || null,
          billingCity: orderData.billing_city || null,
          billingState: orderData.billing_state || null,
          billingZip: orderData.billing_zip || null,
          billingCountry: orderData.billing_country || null,
          billingPhone: orderData.billing_phone || null,
          subtotal: Math.round(parseFloat(orderData.subtotal || 0) * 100), // Convert to cents
          tax: Math.round(parseFloat(orderData.tax || 0) * 100),
          couponAmount: Math.round(parseFloat(orderData.couponamount || 0) * 100),
          total: Math.round(parseFloat(orderData.total || 0) * 100), // Convert to cents
          paymentType: getPaymentType(orderData.cardtype, orderData.payment_type, orderData.total),
          cardType: orderData.cardtype || null,
          accountNumber: orderData.accountnumber || null,
          expirationMonth: orderData.expirationmonth || null,
          expirationYear: orderData.expirationyear || null,
          status: mapOrderStatus(orderData.status, orderData.total, orderData.payment_type),
          gateway: orderData.gateway || 'stripe',
          gatewayTxnId: orderData.payment_transaction_id || null,
          timestamp: orderData.timestamp ? new Date(orderData.timestamp) : new Date(),
          notes: orderData.notes || null,
          checkoutId: orderData.checkout_id || null,
          certificateId: orderData.certificate_id || null,
          certificateAmount: orderData.certificateamount ? Math.round(parseFloat(orderData.certificateamount) * 100) : null,
          affiliateId: orderData.affiliate_id || null,
          affiliateSubId: orderData.affiliate_subid || null,
          createdAt: orderData.timestamp ? new Date(orderData.timestamp) : new Date(),
          updatedAt: new Date()
        };
        
        await storage.createOrder(order);
        importedCount++;
        
        if (importedCount % 100 === 0) {
          console.log(`✅ Processed ${importedCount} orders...`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing order ${orderData.code}:`, error.message);
        skippedCount++;
      }
    }
    
    console.log('\n🎉 Orders import completed automatically!');
    console.log(`✅ ${importedCount} orders imported successfully`);
    console.log(`⚠️ ${skippedCount} orders skipped due to missing user mappings`);
    
    return {
      imported: importedCount,
      skipped: skippedCount,
      total: ordersData.length
    };
    
  } catch (error) {
    console.error('❌ Import error:', error);
    throw error;
  }
}

// Execute the import
importOrdersNow()
  .then((result) => {
    console.log(`\n📈 Import Summary:`);
    console.log(`📋 Total orders in file: ${result.total}`);
    console.log(`✅ Successfully imported: ${result.imported}`);
    console.log(`⚠️ Skipped: ${result.skipped}`);
    console.log(`🎯 Success rate: ${((result.imported / result.total) * 100).toFixed(1)}%`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to import orders:', error);
    process.exit(1);
  });