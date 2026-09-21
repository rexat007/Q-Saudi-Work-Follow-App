import { adminDb } from '../firebase/admin';
import dotenv from 'dotenv';
dotenv.config();

async function findProject() {
  console.log('--- FIND BETA2-E2E-01 ---');
  try {
    const snap = await adminDb.collection('projects').get();
    console.log(`Total projects in live database: ${snap.size}`);
    let found = false;
    snap.docs.forEach((doc: any) => {
      const data = doc.data();
      if (data.nameAr?.includes('BETA2-E2E-01') || data.nameEn?.includes('BETA2-E2E-01') || doc.id.includes('BETA2-E2E-01')) {
        found = true;
        console.log('FOUND PROJECT:');
        console.log(`  projectId: ${doc.id}`);
        console.log(`  projectCode: ${data.projectCode}`);
        console.log(`  status: ${data.status}`);
        console.log(`  createdAt: ${data.createdAt?.toDate?.() || data.createdAt}`);
        console.log(`  canonical path: projects/${doc.id}`);
      }
    });
    if (!found) {
      console.log('RESULT: TEST_PROJECT_NOT_PERSISTED');
    } else {
      console.log('RESULT: TEST_PROJECT_PERSISTED_CANONICALLY');
    }
  } catch (error: any) {
    console.error('Error:', error);
    console.log('RESULT: LIVE_DATA_READ_UNAVAILABLE');
  }
}

findProject();
