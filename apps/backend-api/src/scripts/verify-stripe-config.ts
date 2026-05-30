import Stripe from 'stripe';
import { env } from '../config/env.js';

async function verifyStripeConfig() {
  console.log('--- STRIPE CONFIG VERIFICATION ---');
  
  const secrets = {
    STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY ? 'Set' : 'MISSING',
    STRIPE_WEBHOOK_SECRET: env.STRIPE_WEBHOOK_SECRET ? 'Set' : 'MISSING',
  };

  const prices = {
    STRIPE_STARTER_PRICE_ID: env.STRIPE_STARTER_PRICE_ID ? 'Set' : 'MISSING',
    STRIPE_GROWTH_PRICE_ID: env.STRIPE_GROWTH_PRICE_ID ? 'Set' : 'MISSING',
    STRIPE_PRO_PRICE_ID: env.STRIPE_PRO_PRICE_ID ? 'Set' : 'MISSING',
  };

  console.table(secrets);
  console.table(prices);

  if (!env.STRIPE_SECRET_KEY) {
    console.error('CRITICAL: STRIPE_SECRET_KEY is missing. Aborting API checks.');
    process.exit(1);
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16' as any,
  });

  try {
    console.log('\nValidating Stripe Secret Key...');
    await stripe.customers.list({ limit: 1 });
    console.log('✅ STRIPE_SECRET_KEY is valid.');
  } catch (err: any) {
    console.error(`❌ STRIPE_SECRET_KEY invalid: ${err.message}`);
    process.exit(1);
  }

  const priceIds = [
    { name: 'STARTER', id: env.STRIPE_STARTER_PRICE_ID },
    { name: 'GROWTH', id: env.STRIPE_GROWTH_PRICE_ID },
    { name: 'PRO', id: env.STRIPE_PRO_PRICE_ID },
  ];

  for (const price of priceIds) {
    if (!price.id) {
      console.warn(`⚠️  ${price.name} price ID is missing.`);
      continue;
    }
    try {
      await stripe.prices.retrieve(price.id);
      console.log(`✅ ${price.name} price ID (${price.id}) is valid.`);
    } catch (err: any) {
      console.error(`❌ ${price.name} price ID (${price.id}) invalid: ${err.message}`);
    }
  }

  if (env.STRIPE_WEBHOOK_SECRET) {
     try {
       const webhooks = await stripe.webhookEndpoints.list();
       if (webhooks.data.length > 0) {
         console.log(`✅ Found ${webhooks.data.length} registered webhook(s).`);
       } else {
         console.warn('⚠️  No webhook endpoints found on Stripe account.');
       }
     } catch (err: any) {
       console.error(`❌ Webhook check failed: ${err.message}`);
     }
  }

  console.log('\n--- VERIFICATION COMPLETE ---');
}

verifyStripeConfig().catch(err => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});
