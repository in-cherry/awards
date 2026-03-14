-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "faviconUrl" TEXT,
ADD COLUMN     "homeView" TEXT NOT NULL DEFAULT 'RAFFLE';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatarUrl" TEXT;
