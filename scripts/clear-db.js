const { PrismaClient } = require('@prisma/client');

// Force connection string to localhost for local script execution
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:SuperSecurePassword123@localhost:5432/boksh_apps';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: connectionString,
    },
  },
});

async function clearData() {
  console.log('🗑️  Starting database cleanup...');
  console.log('Connecting to:', connectionString.replace(/:[^:]*@/, ':****@'));

  try {
    // Delete in order to respect foreign key constraints
    // Child tables first, then parents
    
    console.log('Removing notifications...');
    await prisma.notification.deleteMany({});
    await prisma.userPushSubscription.deleteMany({});
    await prisma.userNotificationPreferences.deleteMany({});

    console.log('Removing social interactions (friendships, suggestions)...');
    await prisma.friendship.deleteMany({});
    await prisma.suggestion.deleteMany({});
    await prisma.event.deleteMany({});

    console.log('Removing watch data...');
    await prisma.watchDesire.deleteMany({});
    await prisma.watchedMovie.deleteMany({});

    console.log('Removing releases...');
    await prisma.release.deleteMany({});
    
    console.log('Removing movies...');
    await prisma.movie.deleteMany({});

    console.log('Removing sessions...');
    await prisma.session.deleteMany({});

    console.log('Removing users...');
    await prisma.authUser.deleteMany({});

    console.log('✅ Database cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearData();
