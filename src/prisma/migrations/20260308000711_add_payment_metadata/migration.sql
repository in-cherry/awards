/*
  Warnings:

  - You are about to drop the `mystery_box_rules` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "mystery_box_rules" DROP CONSTRAINT "mystery_box_rules_raffleId_fkey";

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "processedAt" TIMESTAMP(3);

-- DropTable
DROP TABLE "mystery_box_rules";
