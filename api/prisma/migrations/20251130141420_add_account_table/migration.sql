/*
  Warnings:

  - You are about to drop the column `credits` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `locale` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `AITransaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Country` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `File` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Institution` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Project` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProjectVersion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Template` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AITransaction" DROP CONSTRAINT "AITransaction_userId_fkey";

-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_userId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_userId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectVersion" DROP CONSTRAINT "ProjectVersion_projectId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "credits",
DROP COLUMN "locale",
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'en';

-- DropTable
DROP TABLE "AITransaction";

-- DropTable
DROP TABLE "Country";

-- DropTable
DROP TABLE "File";

-- DropTable
DROP TABLE "Institution";

-- DropTable
DROP TABLE "Payment";

-- DropTable
DROP TABLE "Project";

-- DropTable
DROP TABLE "ProjectVersion";

-- DropTable
DROP TABLE "Template";
