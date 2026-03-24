import * as admin from 'firebase-admin';

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let individualPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

// Definitive Private Key Sanitizer
function sanitizePrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined;
  
  // 1. Remove surrounding quotes and trim
  let sanitized = key.trim().replace(/^["']|["']$/g, '');

  // 2. Identify headers and extract core material
  const header = '-----BEGIN PRIVATE KEY-----';
  const footer = '-----END PRIVATE KEY-----';
  
  if (sanitized.includes(header) && sanitized.includes(footer)) {
    const startIdx = sanitized.indexOf(header) + header.length;
    const endIdx = sanitized.indexOf(footer);
    const coreKey = sanitized.substring(startIdx, endIdx);
    
    // 3. Purge EVERYTHING that isn't a base64 character
    const sanitizedCore = coreKey
      .replace(/\\n/g, '')     // literal \n
      .replace(/\\\\n/g, '')   // double escaped \n
      .replace(/\s+/g, '')     // any actual whitespace
      .trim();

    // 4. Standard PEM reconstruction with 64-char wrapping
    const wrappedCore = sanitizedCore.match(/.{1,64}/g)?.join('\n') || sanitizedCore;
    return `${header}\n${wrappedCore}\n${footer}\n`;
  }
  
  // If no headers, try simple \n conversion as fallback
  return sanitized.replace(/\\n/g, '\n').replace(/\\\\n/g, '\n');
}

// Initializing Admin SDK
if (!admin.apps.length) {
  try {
    console.log('Firebase Admin: Starting initialization sequence...');
    const serviceAccountJson = process.env.FIREBASE_ADMIN_AUTH_JSON;
    
    if (serviceAccountJson) {
      console.log('Firebase Admin: Attempting JSON object initialization...');
      const parsed = JSON.parse(serviceAccountJson);
      const serviceAccount = typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
      
      // DEEP SANITIZATION: Even if it's from JSON, the key might be malformed in .env
      if (serviceAccount.private_key) {
        serviceAccount.private_key = sanitizePrivateKey(serviceAccount.private_key);
      }
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('✅ Firebase Admin Initialized via JSON Object');
    } else if (projectId && clientEmail && individualPrivateKey) {
      console.log('Firebase Admin: Falling back to individual variables...');
      const privateKey = sanitizePrivateKey(individualPrivateKey);
      
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log('✅ Firebase Admin Initialized via Individual Variables');
    } else {
      console.warn('❌ Firebase Admin: No configuration found!');
    }
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error);
  }
}

export const adminAuth = admin.apps.length ? admin.auth() : null as any;
export const adminDb = admin.apps.length ? admin.firestore() : null as any;
