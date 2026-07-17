import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ──────────────────────────────────────────────
// 👇 CHANGE THESE VALUES before running!
// ──────────────────────────────────────────────
const ADMIN_FULLNAME  = 'Sushant Awalekar';
const ADMIN_EMAIL     = 'sushantawalekar286@gmail.com';
const ADMIN_PASSWORD  = 'Sushant@1305';       // Change this to a strong password!
const ADMIN_USERNAME  = 'sushant_admin';
// ──────────────────────────────────────────────

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('❌ MONGO_URI not found in .env');
  process.exit(1);
}

const userSchema = new mongoose.Schema({
  fullname: String, name: String, username: { type: String, unique: true, sparse: true },
  email: { type: String, required: true, unique: true }, password: { type: String, required: true },
  role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
  status: { type: String, enum: ['PENDING', 'ACTIVE', 'BLOCKED'], default: 'PENDING' },
  isVerified: { type: Boolean, default: false },
  onlineStatus: { type: String, default: 'offline' },
  lastSeen: { type: Date, default: Date.now }, joinedDate: { type: Date, default: Date.now }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function insertAdmin() {
  console.log('🔌 Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected!\n');

  // Check if admin already exists
  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    console.log(`⚠️  User with email "${ADMIN_EMAIL}" already exists.`);
    console.log('   Role:', existing.role);
    console.log('   Status:', existing.status);

    // Just upgrade to ADMIN + ACTIVE if not already
    if (existing.role !== 'ADMIN' || existing.status !== 'ACTIVE') {
      existing.role = 'ADMIN';
      existing.status = 'ACTIVE';
      existing.isVerified = true;
      await existing.save();
      console.log('✅ Upgraded existing user to ADMIN + ACTIVE!');
    } else {
      console.log('✅ Already an ADMIN. Nothing changed.');
    }

    await mongoose.disconnect();
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const admin = new User({
    fullname: ADMIN_FULLNAME,
    name:     ADMIN_FULLNAME,
    username: ADMIN_USERNAME,
    email:    ADMIN_EMAIL,
    password: hashedPassword,
    role:     'ADMIN',
    status:   'ACTIVE',
    isVerified: true,
  });

  await admin.save();

  console.log('🎉 Admin user created successfully!');
  console.log('─────────────────────────────────');
  console.log('  Name    :', ADMIN_FULLNAME);
  console.log('  Email   :', ADMIN_EMAIL);
  console.log('  Password:', ADMIN_PASSWORD);
  console.log('  Role    : ADMIN');
  console.log('  Status  : ACTIVE');
  console.log('─────────────────────────────────');
  console.log('⚠️  Save the password above! It is hashed in the database.');

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB.');
}

insertAdmin().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
