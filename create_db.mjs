import pg from 'pg';
const { Client } = pg;

// Try different connection configs
const configs = [
  { host: '127.0.0.1', user: 'postgres', password: 'hadzmie0104', database: 'postgres', port: 5432 },
  { host: '::1', user: 'postgres', password: 'hadzmie0104', database: 'postgres', port: 5432 },
  { host: 'localhost', user: 'postgres', password: 'hadzmie0104', database: 'postgres', port: 5432, ssl: false },
];

for (const config of configs) {
  const client = new Client(config);
  try {
    console.log(`Trying connection: ${JSON.stringify({...config, password: '***'})}`);
    await client.connect();
    console.log('Connected successfully with config:', config.host);
    const result = await client.query("SELECT 1 FROM pg_database WHERE datname = 'online_db'");
    if (result.rowCount > 0) {
      console.log("Database 'online_db' already exists.");
    } else {
      await client.query("CREATE DATABASE online_db");
      console.log("Database 'online_db' created successfully.");
    }
    await client.end();
    break;
  } catch (err) {
    console.error(`Failed with ${config.host}:`, err.message);
    try { await client.end(); } catch(_) {}
  }
}
