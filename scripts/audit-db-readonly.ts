import { config } from 'dotenv';
import { Pool } from 'pg';
import { createDatabaseConnectionConfig } from '../src/lib/database-tls';
config({ path: '.env.local', quiet: true });
config({ path: '.env', quiet: true });
async function main() {
  if (!process.env.DIRECT_URL) {
    console.log('DIRECT_URL missing');
    return;
  }
  const pool = new Pool(createDatabaseConnectionConfig(process.env.DIRECT_URL));
  const client = await pool.connect();
  try {
    await client.query('BEGIN READ ONLY');
    await client.query("SET LOCAL statement_timeout = '5000ms'");
    const result = await client.query(
      "SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled, (SELECT count(*)::int FROM pg_policies p WHERE p.schemaname='public' AND p.tablename=c.relname) AS policy_count FROM pg_class c JOIN pg_namespace n ON c.relnamespace=n.oid WHERE n.nspname='public' AND c.relkind='r' AND c.relname IN ('users','regions','favorite_regions','notifications','redevelopment_zones') ORDER BY c.relname",
    );
    const role = await client.query(
      'SELECT rolbypassrls AS bypass_rls FROM pg_roles WHERE rolname=current_user',
    );
    console.log(
      JSON.stringify({
        tables: result.rows,
        connectionRoleBypassesRls: role.rows[0]?.bypass_rls,
      }),
    );
  } finally {
    await client.query('ROLLBACK');
    client.release();
    await pool.end();
  }
}
main().catch((e: unknown) => {
  const v = e as { code?: string; name?: string };
  console.log(
    JSON.stringify({
      audit: 'failed',
      type: v.name ?? 'Error',
      code: v.code ?? 'UNKNOWN',
    }),
  );
  process.exitCode = 1;
});
