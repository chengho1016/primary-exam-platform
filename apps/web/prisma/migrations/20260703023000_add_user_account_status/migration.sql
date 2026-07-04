CREATE TYPE "UserAccountStatus" AS ENUM ('ACTIVE', 'DISABLED', 'BLOCKED');

ALTER TABLE "User"
  ADD COLUMN "accountStatus" "UserAccountStatus" NOT NULL DEFAULT 'ACTIVE';

CREATE INDEX "User_accountStatus_idx" ON "User"("accountStatus");
