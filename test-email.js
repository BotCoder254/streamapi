const nodemailer = require('nodemailer');
require('dotenv').config();

// Create a test email script to verify the email functionality works
async function testEmail() {
  // Create a transporter using the same configuration as the main app
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  // Define the mail options
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'StreamAPI <noreply@streamapi.com>',
    to: process.env.EMAIL_USER, // Send to yourself for testing
    subject: 'StreamAPI Email Test',
    text: 'This is a test email to verify that the email functionality is working properly.',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1a202c; color: #f8f9fa;">
        <h1 style="color: #10b981;">StreamAPI Email Test</h1>
        <p>This is a test email to verify that the email functionality is working properly.</p>
        <p>If you received this email, it means that your email configuration is working correctly!</p>
        <p>Email settings used:</p>
        <ul>
          <li>Host: ${process.env.EMAIL_HOST || 'smtp.gmail.com'}</li>
          <li>Port: ${process.env.EMAIL_PORT || 587}</li>
          <li>User: ${process.env.EMAIL_USER}</li>
          <li>From: ${process.env.EMAIL_FROM || 'StreamAPI <noreply@streamapi.com>'}</li>
        </ul>
        <p>Timestamp: ${new Date().toISOString()}</p>
      </div>
    `
  };

  try {
    // Send the test email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    console.log('Email sent to:', process.env.EMAIL_USER);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    console.log('Email configuration:');
    console.log('- Host:', process.env.EMAIL_HOST);
    console.log('- Port:', process.env.EMAIL_PORT);
    console.log('- User:', process.env.EMAIL_USER);
    console.log('- From:', process.env.EMAIL_FROM);
    return false;
  }
}

// Run the test
testEmail()
  .then(success => {
    if (success) {
      console.log('Email test completed successfully!');
    } else {
      console.error('Email test failed. Please check your email configuration.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  }); 