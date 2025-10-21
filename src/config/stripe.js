// Stripe configuration
// Replace with your actual Stripe keys
export const STRIPE_PUBLISHABLE_KEY = 'pk_test_your_publishable_key_here';
export const STRIPE_SECRET_KEY = 'sk_test_your_secret_key_here';

// Stripe price IDs for your products
export const STRIPE_PRICE_IDS = {
  PREMIUM_MONTHLY: 'price_monthly_id',
  PREMIUM_YEARLY: 'price_yearly_id',
};

export default {
  STRIPE_PUBLISHABLE_KEY,
  STRIPE_SECRET_KEY,
  STRIPE_PRICE_IDS,
};
