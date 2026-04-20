-- DropForeignKey
ALTER TABLE `address` DROP FOREIGN KEY `address_userId_fkey`;

-- DropIndex
DROP INDEX `address_userId_key` ON `address`;

-- AddForeignKey
ALTER TABLE `address` ADD CONSTRAINT `address_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
