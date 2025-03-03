const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/anagrab';

let client;
let db;

async function connectToMongoDB() {
  try {
    if (!client) {
      client = new MongoClient(MONGODB_URI);
      await client.connect();
      console.log('Connected to MongoDB');

      // Get database from the client
      db = client.db();

      // Create indexes for better performance
      await db.collection('games').createIndex({ createdAt: 1 });
      await db.collection('games').createIndex({ lastActivity: 1 });
    }
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

async function getDB() {
  if (!db) {
    db = await connectToMongoDB();
  }
  return db;
}

async function closeConnection() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('MongoDB connection closed');
  }
}

module.exports = {
  connectToMongoDB,
  getDB,
  closeConnection,
};
