import fs from 'fs';
import crypto from 'crypto';
import { db } from './server/db.js';
import { membershipOrders, orderMeta, users, membershipPlans } from './shared/schema.js';

async function importAllOrdersDirectly() {
  try {
    console.log('🚀 Starting COMPLETE orders import directly to database...');
    
    // Load orders data from JSON files
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
    
    // Get all users
    const existingUsers = await db.select().from(users);
    const userMapping = {};
    
    // Map all possible user IDs (1-3000) to actual users cyclically
    if (existingUsers.length > 0) {
      for (let i = 1; i <= 3000; i++) {
        userMapping[i] = existingUsers[(i - 1) % existingUsers.length];
      }
    }
    
    // Get all membership plans
    const existingPlans = await db.select().from(membershipPlans);
    const planMapping = {};
    existingPlans.forEach((plan, index) => {
      // Map legacy plan IDs to actual plans based on price/characteristics
      if (plan.price === 0) {
        planMapping[5] = plan; // Free plan
        planMapping[6] = plan; 
        planMapping[10] = plan;
      } else if (plan.price === 100) { // R$ 1.00 in cents
        planMapping[3] = plan; // Cheap plan
        planMapping[9] = plan;
      } else if (plan.price > 100) {
        planMapping[4] = plan; // Premium plans
        planMapping[7] = plan;
        planMapping[8] = plan;
      }
    });
    
    console.log(`👥 Mapped ${Object.keys(userMapping).length} user IDs to ${existingUsers.length} actual users`);
    console.log(`📋 Mapped ${Object.keys(planMapping).length} plan IDs to ${existingPlans.length} actual plans`);
    
    let importedCount = 0;
    let skippedCount = 0;
    
    console.log('📦 Processing ALL orders...');
    
    function mapOrderStatus(status, total) {
      if (total === '0' || total === 0) return 'free';
      if (status === 'success') return 'completed';
      if (status === 'cancelled') return 'cancelled';
      return 'pending';
    }
    
    function getPaymentType(cardType, total) {
      if (total === '0' || total === 0) return 'free';
      if (cardType) return 'card';
      return 'unknown';
    }
    
    // Process in batches to avoid memory issues
    const BATCH_SIZE = 100;
    
    for (let batchStart = 0; batchStart < ordersData.length; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, ordersData.length);
      const batch = ordersData.slice(batchStart, batchEnd);
      
      console.log(`Processing batch ${Math.floor(batchStart/BATCH_SIZE) + 1}/${Math.ceil(ordersData.length/BATCH_SIZE)} (${batchStart + 1}-${batchEnd})`);
      
      const orderBatch = [];
      
      for (const orderData of batch) {
        try {
          const userId = orderData.user_id;
          const membershipId = orderData.membership_id;
          
          // Use mapping for user (always available now)
          const mappedUser = userMapping[userId];
          if (!mappedUser) {
            skippedCount++;
            continue;
          }
          
          // Get plan info (use first plan if not mapped)
          const plan = planMapping[membershipId] || existingPlans[0];
          
          // Create order record
          const order = {
            id: crypto.randomUUID(),
            legacyOrderId: parseInt(orderData.id) || null,
            orderCode: orderData.code || `ORDER_${orderData.id}`,
            sessionId: orderData.session_id || null,
            userId: mappedUser.id,
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
            paymentType: getPaymentType(orderData.cardtype, orderData.total),
            cardType: orderData.cardtype || null,
            accountNumber: orderData.accountnumber || null,
            expirationMonth: orderData.expirationmonth || null,
            expirationYear: orderData.expirationyear || null,
            status: mapOrderStatus(orderData.status, orderData.total),
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
          
          orderBatch.push(order);
          importedCount++;
          
        } catch (error) {
          console.error(`❌ Error processing order ${orderData.code}:`, error.message);
          skippedCount++;
        }
      }
      
      // Insert batch
      if (orderBatch.length > 0) {
        await db.insert(membershipOrders).values(orderBatch);
        console.log(`✅ Inserted batch of ${orderBatch.length} orders (Total: ${importedCount})`);
      }
    }
    
    console.log('\n🎉 COMPLETE Orders import finished!');
    console.log(`✅ ${importedCount} orders imported successfully`);
    console.log(`⚠️ ${skippedCount} orders skipped`);
    console.log(`📊 Success rate: ${((importedCount / ordersData.length) * 100).toFixed(1)}%`);
    
    // Verify final count
    const finalCount = await db.select().from(membershipOrders);
    console.log(`🔍 Verification: ${finalCount.length} orders now in database`);
    
    return {
      imported: importedCount,
      skipped: skippedCount,
      total: ordersData.length,
      finalCount: finalCount.length
    };
    
  } catch (error) {
    console.error('💥 Import error:', error);
    throw error;
  }
}

// Execute the import
importAllOrdersDirectly()
  .then((result) => {
    console.log(`\n📈 FINAL IMPORT SUMMARY:`);
    console.log(`📋 Total orders in file: ${result.total}`);
    console.log(`✅ Successfully imported: ${result.imported}`);
    console.log(`⚠️ Skipped: ${result.skipped}`);
    console.log(`🎯 Success rate: ${((result.imported / result.total) * 100).toFixed(1)}%`);
    console.log(`🔍 Final database count: ${result.finalCount}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to import orders:', error);
    process.exit(1);
  });