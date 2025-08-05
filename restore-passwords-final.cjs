const fs = require('fs');
const { Client } = require('pg');

async function restorePasswordsFinal() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Read the CSV file which is actually a JSON array
    const content = fs.readFileSync('attached_assets/aneti_users_1754413800087.csv', 'utf8');
    
    // Parse directly as JSON (file already has brackets)
    const users = JSON.parse(content);
    
    console.log(`Found ${users.length} users in file`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    // Process users in smaller batches 
    const batchSize = 50;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(users.length/batchSize)} (users ${i+1}-${Math.min(i+batchSize, users.length)})`);
      
      for (const user of batch) {
        try {
          // Update password only if user exists and password is different
          const result = await client.query(
            'UPDATE users SET password = $1 WHERE username = $2 AND password != $1',
            [user.user_pass, user.user_login]
          );
          
          if (result.rowCount > 0) {
            updated++;
            if (updated % 100 === 0) {
              console.log(`  ✓ Updated ${updated} passwords so far...`);
            }
          } else {
            skipped++;
          }
        } catch (error) {
          errors++;
          if (errors <= 5) { // Only show first few errors
            console.error(`  ✗ Error updating ${user.user_login}: ${error.message}`);
          }
        }
      }
    }
    
    console.log('\n=== PASSWORD RESTORATION COMPLETE ===');
    console.log(`Total users in CSV: ${users.length}`);
    console.log(`Passwords updated: ${updated}`);
    console.log(`Users skipped (no change needed): ${skipped}`);
    console.log(`Errors: ${errors}`);
    
    // Test a few key users
    console.log('\n=== TESTING KEY USERS ===');
    const testUsers = ['fernando.silva', 'marcos.wesley', 'euadriano'];
    for (const username of testUsers) {
      const result = await client.query(
        'SELECT username, LEFT(password, 20) as password_preview FROM users WHERE username = $1',
        [username]
      );
      if (result.rows.length > 0) {
        console.log(`${username}: ${result.rows[0].password_preview}...`);
      } else {
        console.log(`${username}: NOT FOUND`);
      }
    }
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await client.end();
  }
}

restorePasswordsFinal();