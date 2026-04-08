import { saveCase } from './database.js';

const seedData = [
  {
    location: 'delhi',
    latency: 942.5,
    cpu: 498.2,
    adminCount: 1,
    inferenceContext: 'Unauthorized Access',
    humanLabel: 'Showroom Power Phase L3 Instability',
    isAccurate: false,
    confidence: 91.42
  },
  {
    location: 'mumbai',
    latency: 1250.0,
    cpu: 510.5,
    adminCount: 0,
    inferenceContext: 'DDoS / Latency Spike',
    humanLabel: 'Routine Optical Sensor Calibration',
    isAccurate: false,
    confidence: 88.15
  },
  {
    location: 'bangalore',
    latency: 1100.2,
    cpu: 485.0,
    adminCount: 5,
    inferenceContext: 'Brute Force Attack',
    humanLabel: 'Authorized Panasonic Firmware Update (Sector 4)',
    isAccurate: false,
    confidence: 94.70
  },
  {
    location: 'hyderabad',
    latency: 820.5,
    cpu: 502.1,
    adminCount: 2,
    inferenceContext: 'Unauthorized Access',
    humanLabel: 'Authorized Access (Regional Manager Visit)',
    isAccurate: true,
    confidence: 91.42
  }
];

console.log("🌱 Seeding TrustOps Case Memory with Industrial Scenarios...");

seedData.forEach(record => {
  try {
    saveCase(record);
    console.log(`✅ Seeded: ${record.location} -> ${record.humanLabel}`);
  } catch (err) {
    console.error(`❌ Failed to seed ${record.location}:`, err);
  }
});

console.log("✨ Seeding Complete. Case Memory is now alive.");
process.exit(0);
