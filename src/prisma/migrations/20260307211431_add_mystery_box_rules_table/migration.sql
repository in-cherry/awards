-- CreateTable
CREATE TABLE "mystery_box_rules" (
    "id" TEXT NOT NULL,
    "raffleId" TEXT NOT NULL,
    "minTickets" INTEGER NOT NULL,
    "boxCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mystery_box_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mystery_box_rules_raffleId_minTickets_key" ON "mystery_box_rules"("raffleId", "minTickets");

-- AddForeignKey
ALTER TABLE "mystery_box_rules" ADD CONSTRAINT "mystery_box_rules_raffleId_fkey" FOREIGN KEY ("raffleId") REFERENCES "raffles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
