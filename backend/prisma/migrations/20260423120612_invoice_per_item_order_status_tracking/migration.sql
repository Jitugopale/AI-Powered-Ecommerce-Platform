/*
  Warnings:

  - A unique constraint covering the columns `[orderItemId]` on the table `invoices` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `invoices` DROP FOREIGN KEY `invoices_orderId_fkey`;

-- DropForeignKey
ALTER TABLE `invoices` DROP FOREIGN KEY `invoices_paymentId_fkey`;

-- DropIndex
DROP INDEX `invoices_orderId_key` ON `invoices`;

-- DropIndex
DROP INDEX `invoices_paymentId_key` ON `invoices`;

-- AlterTable
ALTER TABLE `invoices` ADD COLUMN `cancelledAt` DATETIME(3) NULL,
    ADD COLUMN `orderItemId` INTEGER NULL;

-- AlterTable
ALTER TABLE `order_items` ADD COLUMN `cancelledAt` DATETIME(3) NULL,
    ADD COLUMN `confirmedAt` DATETIME(3) NULL,
    ADD COLUMN `deliveredAt` DATETIME(3) NULL,
    ADD COLUMN `outForDeliveryAt` DATETIME(3) NULL,
    ADD COLUMN `returnRequestedAt` DATETIME(3) NULL,
    ADD COLUMN `returnedAt` DATETIME(3) NULL,
    ADD COLUMN `shippedAt` DATETIME(3) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `invoices_orderItemId_key` ON `invoices`(`orderItemId`);

-- AddForeignKey (safe - drop if exists then re-add)
ALTER TABLE `CartItem` DROP FOREIGN KEY IF EXISTS `CartItem_productId_fkey`;
ALTER TABLE `CartItem` ADD CONSTRAINT `CartItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey (safe - drop if exists then re-add)
ALTER TABLE `orders` DROP FOREIGN KEY IF EXISTS `orders_userId_fkey`;
ALTER TABLE `orders` ADD CONSTRAINT `orders_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_orderItemId_fkey` FOREIGN KEY (`orderItemId`) REFERENCES `order_items`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
