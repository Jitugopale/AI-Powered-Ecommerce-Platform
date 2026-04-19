-- DropForeignKey
ALTER TABLE `cart` DROP FOREIGN KEY IF EXISTS `cart_userId_fkey`;

-- DropIndex
DROP INDEX IF EXISTS `cart_userId_key` ON `cart`;

-- AddForeignKey
ALTER TABLE `cart` ADD CONSTRAINT `cart_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
