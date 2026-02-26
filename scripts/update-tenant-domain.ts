import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function updateTenantDomain() {
  try {
    // Update tenant 1 domain to chstone.shop and name to CH Stone
    await client.execute({
      sql: "UPDATE tenants SET domain = ?, name = ? WHERE id = 1",
      args: ['chstone.shop', 'CH Stone'],
    });

    console.log('✅ Updated tenant 1 domain to chstone.shop and name to CH Stone');

    // Verify
    const result = await client.execute("SELECT id, name, domain, contact_email FROM tenants");
    console.log('Current tenants:', result.rows);
  } catch (error) {
    console.error('Error:', error);
  }
}

updateTenantDomain();
