import { neon } from '@neondatabase/serverless';

const devDb = neon(process.env.DATABASE_URL!);
const prodHost = process.env.PGHOST || '';
const prodUser = process.env.PGUSER || '';
const prodPass = process.env.PGPASSWORD || '';
const prodDbName = process.env.PGDATABASE || '';
const prodUrl = `postgres://${prodUser}:${prodPass}@${prodHost}/${prodDbName}`;
const prodDb = neon(prodUrl);

async function migrate() {
  console.log('📦 Fetching all markets from development database...');
  const markets = await devDb`SELECT * FROM markets ORDER BY created_at`;
  console.log(`✓ Found ${markets.length} markets\n`);
  
  console.log('🚀 Migrating to production database...');
  console.log(`Production: ${prodHost}/${prodDbName}\n`);
  
  let success = 0;
  let errors: string[] = [];
  
  for (const m of markets) {
    try {
      await prodDb`
        INSERT INTO markets (
          id, question, description, category, expires_at, resolved_at, outcome,
          yes_price, no_price, volume, liquidity, creator_address, condition_id,
          yes_token_id, no_token_id, pyth_price_feed_id, baseline_price, resolved,
          created_at, creation_tx_hash, question_id, question_timestamp, oracle,
          outcome_slot_count, image_url, tweet_url, ai_analysis, target_price,
          market_type, pool_address
        ) VALUES (
          ${m.id}, ${m.question}, ${m.description}, ${m.category}, ${m.expires_at},
          ${m.resolved_at}, ${m.outcome}, ${m.yes_price}, ${m.no_price}, ${m.volume},
          ${m.liquidity}, ${m.creator_address}, ${m.condition_id}, ${m.yes_token_id},
          ${m.no_token_id}, ${m.pyth_price_feed_id}, ${m.baseline_price}, ${m.resolved},
          ${m.created_at}, ${m.creation_tx_hash}, ${m.question_id}, ${m.question_timestamp},
          ${m.oracle}, ${m.outcome_slot_count}, ${m.image_url}, ${m.tweet_url},
          ${m.ai_analysis}, ${m.target_price}, ${m.market_type}, ${m.pool_address}
        )
        ON CONFLICT (id) DO UPDATE SET
          question = EXCLUDED.question,
          category = EXCLUDED.category,
          yes_price = EXCLUDED.yes_price,
          no_price = EXCLUDED.no_price,
          expires_at = EXCLUDED.expires_at,
          image_url = EXCLUDED.image_url,
          market_type = EXCLUDED.market_type
      `;
      success++;
      if (success % 10 === 0 || success === 1) {
        console.log(`  Progress: ${success}/${markets.length} markets migrated`);
      }
    } catch (e: any) {
      errors.push(`${m.id}: ${e.message}`);
    }
  }
  
  console.log(`\n✅ Migration complete!`);
  console.log(`   Success: ${success}/${markets.length}`);
  if (errors.length > 0) {
    console.log(`   Errors: ${errors.length}`);
    errors.slice(0, 5).forEach(e => console.log(`     - ${e}`));
  }
  
  const result = await prodDb`SELECT COUNT(*) as count FROM markets`;
  console.log(`\n📊 Production database now has ${result[0].count} markets total`);
}

migrate().catch(e => {
  console.error('❌ Migration failed:', e.message);
  process.exit(1);
});
