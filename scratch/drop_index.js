import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus-media';

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('connections');

    // List all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes on connections:', indexes.map(idx => idx.name));

    // Drop pairKey_1 index if it exists
    const hasPairKeyIndex = indexes.some(idx => idx.name === 'pairKey_1');
    if (hasPairKeyIndex) {
      console.log('Dropping index: pairKey_1');
      await collection.dropIndex('pairKey_1');
      console.log('✅ Index pairKey_1 dropped successfully!');
    } else {
      console.log('Index pairKey_1 not found.');
    }

    // List indexes again to verify
    const finalIndexes = await collection.indexes();
    console.log('Final indexes on connections:', finalIndexes.map(idx => idx.name));

  } catch (err) {
    console.error('❌ Error dropping index:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

run();
