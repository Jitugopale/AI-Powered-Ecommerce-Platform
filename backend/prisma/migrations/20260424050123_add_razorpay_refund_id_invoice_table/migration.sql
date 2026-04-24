/*
  Warnings:

  - A unique constraint covering the columns `[razorpayRefundId]` on the table `invoices` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `invoices` ADD COLUMN `razorpayRefundId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `invoices_razorpayRefundId_key` ON `invoices`(`razorpayRefundId`);
