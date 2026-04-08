
const { sendLowStockAlert } = require('../src/lib/nodemailer');
require('dotenv').config();

async function testAlert() {
  console.log('--- SMTP TEST: Low Stock Alert ---');
  const testEmail = 'professorshyam123@gmail.com';
  
  const dummyProduct = {
    name: "DIAGNOSTIC TEST PRODUCT",
    sku: "TEST-SKU-999",
    stock: 2,
    alertQuantity: 10
  };

  try {
    console.log(`Attempting to send test alert to ${testEmail}...`);
    await sendLowStockAlert([testEmail], dummyProduct);
    console.log('SUCCESS: Test email dispatched. Check your inbox (and SPAM folder)!');
  } catch (error) {
    console.error('FAILURE: Could not send test email:', error);
  }
}

testAlert();
