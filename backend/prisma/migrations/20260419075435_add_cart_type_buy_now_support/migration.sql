/*
  Warnings:

  - A unique constraint covering the columns `[userId,cartType]` on the table `cart` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `cart` ADD COLUMN `cartType` ENUM('REGULAR', 'BUY_NOW') NOT NULL DEFAULT 'REGULAR';

-- CreateIndex
CREATE UNIQUE INDEX `cart_userId_cartType_key` ON `cart`(`userId`, `cartType`);
