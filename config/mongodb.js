const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGODB_URI || "mongodb+srv://Telvin:soulmind254@cluster0.xgdfxpt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

let db = null;

async function connectDB() {
    try {
        // Connect the client to the server
        await client.connect();
        
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Successfully connected to MongoDB!");
        
        // Store the database connection
        db = client.db("streamapi");
        return db;
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
}

function getDB() {
    if (!db) {
        throw new Error("Database not initialized. Call connectDB() first.");
    }
    return db;
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    try {
        await client.close();
        console.log('MongoDB connection closed.');
        process.exit(0);
    } catch (error) {
        console.error('Error closing MongoDB connection:', error);
        process.exit(1);
    }
});

module.exports = { connectDB, getDB }; 