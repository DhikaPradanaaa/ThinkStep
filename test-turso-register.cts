require('dotenv').config({ path: '.env.local' });
const bcrypt = require('bcryptjs');

async function testRegister() {
  const { prisma } = require('./lib/db');
  try {
    console.log("TURSO_DATABASE_URL:", !!process.env.TURSO_DATABASE_URL);
    console.log("Connecting to DB...");
    const email = `test${Date.now()}@example.com`;
    const passwordHash = await bcrypt.hash('password123', 12);
    
    console.log("Starting transaction...");
    const user = await prisma.$transaction(async (tx: any) => {
      console.log("Creating user...");
      const newUser = await tx.user.create({
        data: {
          name: "Test User",
          email: email,
          passwordHash,
          role: "STUDENT",
          gradeLevel: "Kelas 7",
          avatarColor: "#3B82F6",
        },
      });
      
      console.log("Creating stats...");
      await tx.userStats.create({
        data: { userId: newUser.id },
      });
      
      return newUser;
    });
    
    console.log("Success!", user.id);
  } catch (error) {
    console.error("REGISTER ERROR:", error);
  }
}

testRegister();
