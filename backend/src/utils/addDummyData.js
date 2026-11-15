import { connectDB, closeDB } from '../config/db.js';
import { generateDummyOperations } from './generateDummyOperations.js';

export const addDummyData = async () => {
  try {
    console.log('--- Connecting to database to append dummy data ---');
    await connectDB();
    const result = await generateDummyOperations();
    console.log('✅ Successfully added dummy data:', result);
    await closeDB();
  } catch (error) {
    console.error('❌ Failed to add dummy data:', error);
    process.exit(1);
  }
};

if (process.argv[1]?.endsWith('addDummyData.js')) {
  addDummyData();
}
