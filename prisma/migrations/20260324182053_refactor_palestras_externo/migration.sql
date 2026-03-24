/*
  Warnings:

  - The values [UEL] on the enum `UserType` will be removed. If these variants are still used in the database, this will fail.
  - Changed the type of `slot` on the `Presentation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserType_new" AS ENUM ('UNIFIL', 'EXTERNO', 'FORMADO', 'ADMIN');
ALTER TABLE "User" ALTER COLUMN "type" TYPE "UserType_new" USING ("type"::text::"UserType_new");
ALTER TYPE "UserType" RENAME TO "UserType_old";
ALTER TYPE "UserType_new" RENAME TO "UserType";
DROP TYPE "UserType_old";
COMMIT;

-- DropIndex
DROP INDEX "Presentation_day_slot_key";

-- AlterTable
ALTER TABLE "Presentation" ALTER COLUMN "slot" TYPE TEXT USING "slot"::TEXT;

-- AlterTable
ALTER TABLE "PresentationSlot" ADD COLUMN     "attendedAt" TIMESTAMP(3);

-- DropEnum
DROP TYPE "SlotTime";
