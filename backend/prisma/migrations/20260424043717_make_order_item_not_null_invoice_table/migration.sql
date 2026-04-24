/*
  Warnings:

  - Made the column `orderItemId` on table `invoices` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `invoices` DROP FOREIGN KEY `invoices_orderItemId_fkey`;

-- AlterTable
ALTER TABLE `invoices` MODIFY `orderItemId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_orderItemId_fkey` FOREIGN KEY (`orderItemId`) REFERENCES `order_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
