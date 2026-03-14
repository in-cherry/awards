import 'dotenv/config';
import { Client } from 'pg';

async function main() {
  const slug = process.argv[2] ?? 'tr-gustavin';
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const tenantResult = await client.query(
    'select id, slug, name, "createdAt" from tenants where slug like $1 order by "createdAt" desc',
    [`${slug}%`]
  );

  if (tenantResult.rows.length === 0) {
    console.log('tenant-not-found');
    await client.end();
    return;
  }

  for (const tenant of tenantResult.rows) {
    const counts = {
      clients: (await client.query('select count(*)::int as n from clients where "tenantId"=$1', [tenant.id])).rows[0].n,
      raffles: (await client.query('select count(*)::int as n from raffles where "tenantId"=$1', [tenant.id])).rows[0].n,
      payments: (await client.query('select count(*)::int as n from payments where "tenantId"=$1', [tenant.id])).rows[0].n,
      tickets: (
        await client.query(
          'select count(*)::int as n from tickets t join raffles r on r.id=t."raffleId" where r."tenantId"=$1',
          [tenant.id]
        )
      ).rows[0].n,
    };

    console.log(JSON.stringify({ tenant, counts }, null, 2));
  }

  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
