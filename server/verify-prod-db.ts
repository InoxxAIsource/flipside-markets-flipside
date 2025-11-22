import { neon } from '@neondatabase/serverless';

const prodHost = process.env.PGHOST || '';
const prodUser = process.env.PGUSER || '';
const prodPass = process.env.PGPASSWORD || '';
const prodDbName = process.env.PGDATABASE || '';
const prodUrl = `postgres://${prodUser}:${prodPass}@${prodHost}/${prodDbName}`;
const prodDb = neon(prodUrl);

async function verify() {
  console.log('🔍 Checking production database...');
  console.log(`Host: ${prodHost}\n`);
  
  const result = await prodDb`
    SELECT COUNT(*) as total,
           SUM(CASE WHEN category ILIKE '%crypto%' THEN 1 ELSE 0 END) as crypto,
           SUM(CASE WHEN category = 'Politics' THEN 1 ELSE 0 END) as politics,
           SUM(CASE WHEN category = 'Sports' THEN 1 ELSE 0 END) as sports,
           SUM(CASE WHEN category = 'Entertainment' THEN 1 ELSE 0 END) as entertainment
    FROM markets
  `;
  
  console.log('📊 Production Database Stats:');
  console.log(`   Total Markets: ${result[0].total}`);
  console.log(`   Crypto: ${result[0].crypto}`);
  console.log(`   Politics: ${result[0].politics}`);
  console.log(`   Sports: ${result[0].sports}`);
  console.log(`   Entertainment: ${result[0].entertainment}`);
  
  const recent = await prodDb`
    SELECT question, category, created_at 
    FROM markets 
    ORDER BY created_at DESC 
    LIMIT 5
  `;
  
  console.log('\n📝 5 Most Recent Markets:');
  recent.forEach((m: any, i: number) => {
    console.log(`   ${i + 1}. [${m.category}] ${m.question.substring(0, 60)}...`);
  });
}

verify().catch(console.error);
