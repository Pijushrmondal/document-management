import { UserRole } from './../src/common/enum/user-role.enum';
import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/backend-assignment';

const seedUsers = [
  { email: 'admin@example.com', role: UserRole.ADMIN },
  { email: 'support@example.com', role: UserRole.SUPPORT },
  { email: 'moderator@example.com', role: UserRole.MODERATOR },
  { email: 'user1@example.com', role: UserRole.USER },
  { email: 'user2@example.com', role: UserRole.USER },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // Clear existing data
    await db.collection('users').deleteMany({});
    console.log('🗑️  Cleared existing users');

    // Insert seed users
    const result = await db.collection('users').insertMany(
      seedUsers.map((user) => ({
        ...user,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    );

    console.log(`✅ Seeded ${result.insertedCount} users`);
    console.log('\nSeeded Users:');
    seedUsers.forEach((user) => {
      console.log(`  - ${user.email} (${user.role})`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Seed completed successfully');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
