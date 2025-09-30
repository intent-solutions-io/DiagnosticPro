const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Firestore } = require('@google-cloud/firestore');

const firestore = new Firestore();

module.exports = async (req, res) => {
  try {
    const { submissionId } = req.body;
    console.log('Creating payment session for submission:', submissionId);

    // Get submission data
    const submissionDoc = await firestore.collection('diagnosticSubmissions').doc(submissionId).get();
    if (!submissionDoc.exists) {
      throw new Error(`Submission ${submissionId} not found`);
    }
    const submission = submissionDoc.data();

    // Create order record
    const orderData = {
      submissionId,
      status: 'pending',
      amount: 29.99,
      currency: 'usd',
      createdAt: new Date().toISOString(),
      customerEmail: submission.email || null
    };

    const orderRef = await firestore.collection('orders').add(orderData);
    const orderId = orderRef.id;
    console.log('Created order:', orderId);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'DiagnosticPro AI Analysis',
              description: `Comprehensive diagnostic report for ${submission.make || ''} ${submission.model || ''} ${submission.year || ''}`.trim() || 'Equipment diagnostic analysis',
              images: ['https://diagnosticpro.io/logo.png']
            },
            unit_amount: 2999 // $29.99 in cents
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      client_reference_id: orderId,
      customer_email: submission.email || undefined,
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/diagnostic-form?canceled=true`,
      metadata: {
        submissionId,
        orderId
      }
    });

    // Update order with session ID
    await firestore.collection('orders').doc(orderId).update({
      sessionId: session.id,
      checkoutUrl: session.url
    });

    console.log('Stripe session created:', session.id);

    res.status(200).json({
      sessionId: session.id,
      checkoutUrl: session.url,
      orderId
    });

  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({
      error: 'Failed to create payment session',
      message: error.message
    });
  }
};