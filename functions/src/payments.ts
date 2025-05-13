import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";

// Ensure Firebase Admin is initialized (it should be in index.ts)
// if (admin.apps.length === 0) {
//   admin.initializeApp();
// }

// Initialize Stripe with your secret key
// It's crucial to set these as environment variables in Firebase Functions config
// firebase functions:config:set stripe.secret_key="sk_test_YOUR_STRIPE_SECRET_KEY"
// firebase functions:config:set stripe.webhook_secret="whsec_YOUR_STRIPE_WEBHOOK_SECRET"
// For production, use your live keys.
const stripeSecretKey = functions.config().stripe?.secret_key;
const stripeWebhookSecret = functions.config().stripe?.webhook_secret;

if (!stripeSecretKey) {
  console.error("Stripe secret key not found in Firebase Functions config. Payments will not work.");
  // For local development, you might load from a .env file if not using Firebase emulators with config
}
const stripe = new Stripe(stripeSecretKey || "sk_test_DUMMYKEY", {
  apiVersion: "2024-06-20", // Use the latest API version
});


/**
 * Creates a Stripe Checkout Session for a user to subscribe.
 */
export const createStripeCheckoutSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }
  const userId = context.auth.uid;
  const userEmail = context.auth.token.email;

  // In a real app, you'd fetch your price ID from Stripe or a config
  const priceId = "price_YOUR_MONTHLY_SUBSCRIPTION_PRICE_ID"; // Replace with your actual Price ID from Stripe Dashboard

  if (priceId === "price_YOUR_MONTHLY_SUBSCRIPTION_PRICE_ID") {
     functions.logger.warn("Using placeholder Stripe Price ID. Please replace with your actual Price ID.");
     // For testing, you might want to proceed, but log a clear warning.
     // In production, you might throw an error or use a test price ID.
  }

  try {
    // Check if user already has a Stripe Customer ID in Firestore
    const userDoc = await admin.firestore().collection("users").doc(userId).get();
    let customerId = userDoc.data()?.stripeCustomerId;

    if (!customerId) {
      // Create a new Stripe Customer
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { firebaseUID: userId },
      });
      customerId = customer.id;
      // Save Stripe Customer ID to Firestore user profile
      await admin.firestore().collection("users").doc(userId).update({
        stripeCustomerId: customerId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // Define success and cancel URLs (these should point to your frontend)
      success_url: `${functions.config().app?.url || "http://localhost:3000"}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${functions.config().app?.url || "http://localhost:3000"}/subscription-cancel`,
      // Enable free trial if configured on your Stripe Price
      subscription_data: {
        trial_period_days: 30, // Or get from Stripe Price object
        metadata: { firebaseUID: userId }, // Pass Firebase UID to subscription
      },
      metadata: { firebaseUID: userId }, // Pass Firebase UID to checkout session
    });

    return { sessionId: session.id };
  } catch (error) {
    functions.logger.error("Error creating Stripe Checkout session:", error);
    throw new functions.https.HttpsError("internal", "Failed to create checkout session.", error);
  }
});


/**
 * Handles Stripe Webhooks to update subscription status in Firestore.
 * This function needs to be publicly accessible for Stripe to call it.
 */
export const stripeWebhookHandler = functions.https.onRequest(async (request, response) => {
  if (!stripeWebhookSecret) {
    functions.logger.error("Stripe webhook secret is not configured.");
    response.status(500).send("Webhook secret not configured.");
    return;
  }

  let event: Stripe.Event;
  try {
    const signature = request.headers["stripe-signature"] as string;
    event = stripe.webhooks.constructEvent(request.rawBody, signature, stripeWebhookSecret);
  } catch (err: any) {
    functions.logger.error("⚠️  Webhook signature verification failed.", err.message);
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  functions.logger.info("Received Stripe webhook event:", event.type, event.id);

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription" && session.subscription && session.metadata?.firebaseUID) {
        const subscriptionId = session.subscription as string;
        const firebaseUID = session.metadata.firebaseUID;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await updateUserSubscriptionStatus(firebaseUID, subscription.status, subscription.id);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": // Handles cancellations, including at period end
    case "customer.subscription.trial_will_end": {
      const subscription = event.data.object as Stripe.Subscription;
      const firebaseUID = subscription.metadata?.firebaseUID;
      if (firebaseUID) {
        await updateUserSubscriptionStatus(firebaseUID, subscription.status, subscription.id);
      } else {
        functions.logger.warn(`Subscription ${subscription.id} has no firebaseUID in metadata.`);
      }
      break;
    }
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.subscription && invoice.customer) {
         const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
         const firebaseUID = subscription.metadata?.firebaseUID;
         if (firebaseUID) {
           await updateUserSubscriptionStatus(firebaseUID, subscription.status, subscription.id);
         }
      }
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
       if (invoice.subscription && invoice.customer) {
         const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
         const firebaseUID = subscription.metadata?.firebaseUID;
         if (firebaseUID) {
           await updateUserSubscriptionStatus(firebaseUID, subscription.status, subscription.id); // Status might be 'past_due'
         }
       }
      break;
    }
    // ... handle other event types
    default:
      functions.logger.info(`Unhandled event type ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  response.status(200).json({ received: true });
});

// Helper function to update user's subscription status in Firestore
async function updateUserSubscriptionStatus(userId: string, status: Stripe.Subscription.Status, stripeSubscriptionId: string) {
  const userRef = admin.firestore().collection("users").doc(userId);
  try {
    await userRef.update({
      subscriptionStatus: status, // e.g., 'active', 'trialing', 'past_due', 'canceled'
      stripeSubscriptionId: stripeSubscriptionId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    functions.logger.info(`Updated subscription status for user ${userId} to ${status}.`);
  } catch (error) {
    functions.logger.error(`Failed to update subscription status for user ${userId}:`, error);
  }
}

// TODO:
// - Function to create a Stripe Customer Portal session for users to manage their subscription.
// - More robust error handling and logging.
// - Securely handle product and price IDs (e.g., from environment variables or Firestore config).
