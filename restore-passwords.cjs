const fs = require('fs');
const { Client } = require('pg');

async function restoreOriginalPasswords() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Read the original users JSON array
    const csvContent = fs.readFileSync('attached_assets/aneti_users_1754413800087.csv', 'utf8');
    const users = JSON.parse('[' + csvContent + ']');
    
    console.log(`Found ${users.length} users in CSV`);

    let updatedCount = 0;
    
    for (const user of users) {
      try {
        // Update user password with original hash
        const result = await client.query(
          'UPDATE users SET password = $1 WHERE username = $2',
          [user.user_pass, user.user_login]
        );
        
        if (result.rowCount > 0) {
          updatedCount++;
          console.log(`Updated password for user: ${user.user_login}`);
        }
      } catch (error) {
        console.error(`Error updating user ${user.user_login}:`, error.message);
      }
    }
    
    console.log(`Successfully restored passwords for ${updatedCount} users`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

restoreOriginalPasswords();