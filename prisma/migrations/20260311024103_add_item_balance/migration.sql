-- DropIndex
DROP INDEX "Item_groupId_startMonth_endMonth_idx";

-- CreateTable
CREATE TABLE "ItemBalance" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ItemBalance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ItemBalance_itemId_month_key" ON "ItemBalance"("itemId", "month");

-- AddForeignKey
ALTER TABLE "ItemBalance" ADD CONSTRAINT "ItemBalance_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
