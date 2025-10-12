// Quick test script to verify Firebase Admin SDK can send to a token
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Try to load .env file if it exists (for local dev)
const envPath = path.join(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  console.log('Loading .env file for local development...');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');

  // Parse environment variables
  for (const line of envLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) continue;
    
    const key = trimmed.substring(0, equalsIndex);
    const value = trimmed.substring(equalsIndex + 1);
    
    // Set in process.env if not already set
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
} else {
  console.log('No .env file found, using system environment variables (production mode)');
}

// Now use process.env like the real app does
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!serviceAccountJson) {
  console.error('FIREBASE_SERVICE_ACCOUNT not found in process.env');
  console.error('Make sure .env file exists and has FIREBASE_SERVICE_ACCOUNT set');
  process.exit(1);
}

console.log('Testing with process.env.FIREBASE_SERVICE_ACCOUNT');
console.log('Length:', serviceAccountJson.length);

let serviceAccount;
try {
  serviceAccount = JSON.parse(serviceAccountJson);
  console.log('✅ Successfully parsed service account JSON');
} catch (error) {
  console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT as JSON:', error.message);
  console.error('First 100 chars:', serviceAccountJson.substring(0, 100));
  process.exit(1);
}

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

// Get token from command line argument
const token = process.argv[2];

if (!token) {
  console.error('Usage: node test-firebase-send.js <FCM_TOKEN>');
  process.exit(1);
}

console.log('Testing Firebase Admin SDK send...');
console.log('Project:', serviceAccount.project_id);
console.log('Token:', token.substring(0, 20) + '...');

// Send test message
admin.messaging().send({
  token: token,
  notification: {
    title: 'Test from Script',
    body: 'This is a direct test from Firebase Admin SDK'
  }
})
.then((response) => {
  console.log('✅ SUCCESS! Message sent:', response);
  process.exit(0);
})
.catch((error) => {
  console.error('❌ FAILED:', error.code, error.message);
  if (error.errorInfo) {
    console.error('Error details:', error.errorInfo);
  }
  process.exit(1);
});
