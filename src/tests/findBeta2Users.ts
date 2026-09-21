import { adminDb } from '../firebase/admin';
import dotenv from 'dotenv';
dotenv.config();

async function findUsers() {
  console.log('--- FIND USERS IN LIVE DB ---');
  try {
    const snap = await adminDb.collection('users').get();
    console.log(`Total users in live database: ${snap.size}`);
    snap.docs.forEach((doc: any) => {
      const data = doc.data();
      console.log(`User ID: ${doc.id}`);
      console.log(`  email: ${data.email}`);
      console.log(`  role: ${data.role}`);
      console.log(`  status: ${data.status}`);
      console.log(`  fullName: ${data.fullName}`);
    });
  } catch (error: any) {
    console.error('Error querying users collection:', error);
  }
}

findUsers();
