/*
  Warnings:

  - You are about to alter the column `amount` on the `Item` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `currentBalance` on the `Item` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `amount` on the `ItemBalance` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.

*/
-- AlterTable
ALTER TABLE "Item" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "currentBalance" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "ItemBalance" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30);
