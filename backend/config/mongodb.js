const { MongoClient } = require('mongodb');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const USE_LOCAL_STORAGE = !MONGODB_URI;
const LOCAL_STORAGE_PATH = path.join(__dirname, '..', 'data', 'games.json');

let client;
let db;
let localDb = null;

async function ensureLocalStorageDir() {
  const dir = path.dirname(LOCAL_STORAGE_PATH);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(LOCAL_STORAGE_PATH);
    // Verify the file contains valid JSON
    const content = await fs.readFile(LOCAL_STORAGE_PATH, 'utf8');
    try {
      JSON.parse(content);
    } catch (e) {
      // If JSON is invalid, reset the file with empty object
      await fs.writeFile(LOCAL_STORAGE_PATH, '{}');
    }
  } catch {
    // If file doesn't exist, create it with empty object
    await fs.writeFile(LOCAL_STORAGE_PATH, '{}');
  }
}

function createLocalDb() {
  return {
    collection: name => ({
      createIndex: async () => {},
      find: (query = {}) => ({
        toArray: async () => {
          try {
            const content = await fs.readFile(LOCAL_STORAGE_PATH, 'utf8');
            const data = JSON.parse(content);
            let results = Object.values(data);

            if (query.lastActivity && query.lastActivity.$gt) {
              const threshold = query.lastActivity.$gt.getTime();
              results = results.filter(game => new Date(game.lastActivity).getTime() > threshold);
            }

            return results;
          } catch (error) {
            console.error('Error reading local storage:', error);
            return [];
          }
        },
      }),
      updateOne: async (query, update, options = {}) => {
        try {
          const content = await fs.readFile(LOCAL_STORAGE_PATH, 'utf8');
          const data = JSON.parse(content);
          const id = query._id || update.$set._id;
          data[id] = { ...data[id], ...update.$set };
          await fs.writeFile(LOCAL_STORAGE_PATH, JSON.stringify(data, null, 2));
        } catch (error) {
          console.error('Error updating local storage:', error);
          // Re-initialize the file if it's corrupted
          await ensureLocalStorageDir();
          // Retry the update once
          const data = { [query._id || update.$set._id]: update.$set };
          await fs.writeFile(LOCAL_STORAGE_PATH, JSON.stringify(data, null, 2));
        }
      },
      deleteOne: async query => {
        try {
          const content = await fs.readFile(LOCAL_STORAGE_PATH, 'utf8');
          const data = JSON.parse(content);
          delete data[query._id];
          await fs.writeFile(LOCAL_STORAGE_PATH, JSON.stringify(data, null, 2));
        } catch (error) {
          console.error('Error deleting from local storage:', error);
          await ensureLocalStorageDir();
        }
      },
      deleteMany: async query => {
        if (query.lastActivity) {
          try {
            const content = await fs.readFile(LOCAL_STORAGE_PATH, 'utf8');
            const data = JSON.parse(content);
            const threshold = query.lastActivity.$lt.getTime();
            Object.keys(data).forEach(key => {
              if (new Date(data[key].lastActivity).getTime() < threshold) {
                delete data[key];
              }
            });
            await fs.writeFile(LOCAL_STORAGE_PATH, JSON.stringify(data, null, 2));
          } catch (error) {
            console.error('Error performing bulk delete from local storage:', error);
            await ensureLocalStorageDir();
          }
        }
      },
    }),
  };
}

async function connectToMongoDB() {
  if (!client) {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB');

    db = client.db();
    await db.collection('games').createIndex({ createdAt: 1 });
    await db.collection('games').createIndex({ lastActivity: 1 });
  }
  return db;
}

async function initializeStorage() {
  if (USE_LOCAL_STORAGE) {
    await ensureLocalStorageDir();
    console.log('No MongoDB URI found - Using local JSON storage at:', LOCAL_STORAGE_PATH);
    localDb = createLocalDb();
    return localDb;
  }

  try {
    return await connectToMongoDB();
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

async function getDB() {
  if (USE_LOCAL_STORAGE) {
    if (!localDb) {
      localDb = await initializeStorage();
    }
    return localDb;
  }

  if (!db) {
    db = await initializeStorage();
  }
  return db;
}

async function closeConnection() {
  if (USE_LOCAL_STORAGE) {
    localDb = null;
    return;
  }

  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('MongoDB connection closed');
  }
}

module.exports = {
  getDB,
  closeConnection,
};
