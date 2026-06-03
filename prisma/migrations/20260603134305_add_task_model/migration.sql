-- AlterTable
ALTER TABLE "LearningSession" ADD COLUMN "aiFeedback" TEXT;
ALTER TABLE "LearningSession" ADD COLUMN "aiScore" REAL;
ALTER TABLE "LearningSession" ADD COLUMN "finalAnswerImageUrl" TEXT;
ALTER TABLE "LearningSession" ADD COLUMN "finalAnswerText" TEXT;
ALTER TABLE "LearningSession" ADD COLUMN "teacherScore" REAL;

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT,
    "deadline" DATETIME,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Task_userId_idx" ON "Task"("userId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");
