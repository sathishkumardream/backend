/*
  Warnings:

  - Made the column `description` on table `Product` required. This step will fail if there are existing NULL values in that column.
  - Made the column `image` on table `Product` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Product" ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "image" SET NOT NULL;
