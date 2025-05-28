/*
  Warnings:

  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable: Add password column with a temporary default value
ALTER TABLE "User" ADD COLUMN "password" TEXT NOT NULL DEFAULT 'temp_password';

-- Update existing users with a default MD5 hashed password
-- MD5 hash of 'password' using NodeJS crypto package = '5f4dcc3b5aa765d61d8327deb882cf99'
UPDATE "User" SET "password" = '5f4dcc3b5aa765d61d8327deb882cf99';

-- Remove the default value so new users must provide a password
ALTER TABLE "User" ALTER COLUMN "password" DROP DEFAULT;
