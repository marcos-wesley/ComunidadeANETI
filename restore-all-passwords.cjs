const fs = require('fs');
const { Client } = require('pg');

async function restoreAllPasswords() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Read and parse the users JSON file
    const jsonContent = fs.readFileSync('attached_assets/aneti_users_1754413800087.csv', 'utf8');
    const users = JSON.parse('[' + jsonContent + ']');
    
    console.log(`Found ${users.length} users in file`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    // Process users in batches to avoid overwhelming the database
    const batchSize = 100;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(users.length/batchSize)} (${batch.length} users)`);
      
      for (const user of batch) {
        try {
          // Only update users that exist in our system
          const result = await client.query(
            'UPDATE users SET password = $1 WHERE username = $2 AND password != $1',
            [user.user_pass, user.user_login]
          );
          
          if (result.rowCount > 0) {
            updated++;
            if (updated % 50 === 0) {
              console.log(`Updated ${updated} users so far...`);
            }
          } else {
            skipped++;
          }
        } catch (error) {
          errors++;
          console.error(`Error updating user ${user.user_login}:`, error.message);
        }
      }
    }
    
    console.log('\n=== RESTORATION COMPLETE ===');
    console.log(`Total users in CSV: ${users.length}`);
    console.log(`Passwords updated: ${updated}`);
    console.log(`Users skipped: ${skipped}`);
    console.log(`Errors: ${errors}`);
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await client.end();
  }
}

restoreAllPasswords();