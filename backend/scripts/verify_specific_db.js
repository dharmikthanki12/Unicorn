const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}

const mongoose = require('mongoose');

const TARGET_URI = 'mongodb+srv://zarwebcoders:zarwebcoders@cluster0.lqgakzj.mongodb.net/unicorn?retryWrites=true&w=majority';

async function verifySpecificDatabase() {
  console.log('================================================================');
  console.log('🔍 VERIFYING TARGET MONGODB DATABASE CONNECTION');
  console.log('Target URI: mongodb+srv://zarwebcoders:****@cluster0.lqgakzj.mongodb.net/unicorn');
  console.log('================================================================\n');

  try {
    const startTime = Date.now();
    const conn = await mongoose.connect(TARGET_URI, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000
    });
    const latency = Date.now() - startTime;

    console.log('✅ CONNECTION STATUS: CONNECTED (ACTIVE)');
    console.log(`• Database Name: "${conn.connection.name}"`);
    console.log(`• Primary Host: ${conn.connection.host}`);
    console.log(`• Connection Port: ${conn.connection.port}`);
    console.log(`• Connection Ready State: ${conn.connection.readyState} (1 = CONNECTED)`);
    console.log(`• Network Latency: ${latency} ms\n`);

    // Verify Collections & Document Counts in this database
    const db = conn.connection.db;
    const collections = await db.listCollections().toArray();
    console.log(`📁 Collections in "${conn.connection.name}" (${collections.length} total):`);

    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`  - ${col.name.padEnd(20)} : ${count} documents`);
    }

    // Ping the cluster
    const adminDb = db.admin();
    const pingResult = await adminDb.ping();
    console.log('\n📡 Cluster Ping Test:', JSON.stringify(pingResult));

    await mongoose.disconnect();
    console.log('\n================================================================');
    console.log('🎉 CONFIRMED: This database is ACTIVE and FULLY CONNECTED to this project!');
    console.log('================================================================');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ CONNECTION FAILED:', error.message);
    process.exit(1);
  }
}

verifySpecificDatabase();

