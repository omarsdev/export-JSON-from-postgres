const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// PostgreSQL client setup
const client = new Client({
  user: 'your_username',
  host: 'localhost',
  database: 'your_database',
  password: 'your_password',
  port: 5432, // default PostgreSQL port
});

async function exportTablesToJson() {
  try {
    await client.connect();

    // Get all table names from the public schema
    const res = await client.query(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE';`
    );

    const tables = res.rows.map(row => row.table_name);

    // Create a 'dump' folder if it doesn't exist
    const dumpDir = path.join(__dirname, 'dump');
    if (!fs.existsSync(dumpDir)) {
      fs.mkdirSync(dumpDir);
    }

    // Loop over each table and export data to JSON
    for (const table of tables) {
      console.log(`Exporting table: ${table}`);

      // Fetch all rows from the current table and convert to JSON
      const tableDataRes = await client.query(`SELECT json_agg(row_to_json(t)) FROM ${table} t`);
      const jsonData = tableDataRes.rows[0].json_agg;

      if (jsonData) {
        // Create a file path for the JSON file inside the 'dump' folder
        const filePath = path.join(dumpDir, `${table}.json`);

        // Write data to a JSON file
        fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf8');
        console.log(`Table ${table} has been exported to ${filePath}`);
      } else {
        console.log(`Table ${table} is empty.`);
      }
    }

    console.log('All tables have been exported.');
  } catch (err) {
    console.error('Error exporting tables:', err);
  } finally {
    await client.end();
  }
}

exportTablesToJson();