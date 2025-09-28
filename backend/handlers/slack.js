const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const { message, channel = '#diagnostics', username = 'DiagnosticPro Bot' } = req.body;
    
    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!slackWebhookUrl) {
      console.log('Slack webhook not configured, skipping notification');
      return res.status(200).json({ 
        success: true, 
        message: 'Slack notification skipped (not configured)' 
      });
    }

    // Send to Slack
    await axios.post(slackWebhookUrl, {
      channel,
      username,
      text: message,
      icon_emoji: ':robot_face:'
    });

    console.log('Slack notification sent successfully');
    res.status(200).json({ 
      success: true, 
      message: 'Slack notification sent' 
    });

  } catch (error) {
    console.error('Error sending Slack notification:', error);
    // Don't fail the request if Slack fails
    res.status(200).json({ 
      success: false, 
      message: 'Slack notification failed but request processed',
      error: error.message 
    });
  }
};