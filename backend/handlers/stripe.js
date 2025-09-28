const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Firestore } = require('@google-cloud/firestore');
const axios = require('axios');

const firestore = new Firestore();

module.exports = async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET not configured');
    }

    let event;
    try {
      // Construct Stripe event
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        webhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    console.log('Received Stripe webhook:', event.type);

    // Handle the payment success event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('Processing completed checkout session:', session.id);
      console.log('Session customer email:', session.customer_email || session.customer_details?.email);
      console.log('Session client_reference_id:', session.client_reference_id);

      const customerEmail = session.customer_email || session.customer_details?.email;
      if (!customerEmail) {
        throw new Error('No customer email found in session');
      }

      // Find order by client_reference_id (order ID)
      let order;
      if (session.client_reference_id) {
        const orderDoc = await firestore.collection('orders').doc(session.client_reference_id).get();
        if (orderDoc.exists) {
          order = { id: orderDoc.id, ...orderDoc.data() };
        }
      }

      // If no order found by client_reference_id, try to find by session_id
      if (!order) {
        const ordersSnapshot = await firestore.collection('orders')
          .where('sessionId', '==', session.id)
          .limit(1)
          .get();
        
        if (!ordersSnapshot.empty) {
          const orderDoc = ordersSnapshot.docs[0];
          order = { id: orderDoc.id, ...orderDoc.data() };
        }
      }

      if (!order) {
        console.error('No order found for session:', session.id);
        throw new Error(`No order found for session ${session.id}`);
      }

      console.log('Found order:', order.id, 'with submission:', order.submissionId);

      // Update order status
      await firestore.collection('orders').doc(order.id).update({
        status: 'paid',
        paidAt: new Date().toISOString(),
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent,
        customerEmail,
        amountPaid: session.amount_total / 100
      });

      // Get the diagnostic submission
      const submissionDoc = await firestore.collection('diagnosticSubmissions').doc(order.submissionId).get();
      if (!submissionDoc.exists) {
        throw new Error(`Submission ${order.submissionId} not found`);
      }
      const submission = submissionDoc.data();

      // Update submission status
      await firestore.collection('diagnosticSubmissions').doc(order.submissionId).update({
        paymentStatus: 'paid',
        paidAt: new Date().toISOString(),
        orderId: order.id
      });

      // Trigger analysis if not already completed
      if (submission.analysisStatus !== 'completed') {
        console.log('Triggering diagnostic analysis...');
        try {
          const analysisResponse = await axios.post(
            `${process.env.API_URL || 'http://localhost:8080'}/api/analyze-diagnostic`,
            {
              submissionId: order.submissionId,
              diagnosticData: submission
            },
            {
              headers: { 'Content-Type': 'application/json' },
              timeout: 30000
            }
          );
          console.log('Analysis triggered successfully');
        } catch (analysisError) {
          console.error('Failed to trigger analysis:', analysisError.message);
          // Continue processing even if analysis fails - it can be retried
        }
      }

      // Send confirmation email
      try {
        await axios.post(
          `${process.env.API_URL || 'http://localhost:8080'}/api/send-diagnostic-email`,
          {
            submissionId: order.submissionId,
            customerEmail,
            orderId: order.id
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
          }
        );
        console.log('Email sent successfully');
      } catch (emailError) {
        console.error('Failed to send email:', emailError.message);
        // Continue processing - email can be retried
      }
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(400).json({
      error: 'Webhook processing failed',
      message: error.message
    });
  }
};