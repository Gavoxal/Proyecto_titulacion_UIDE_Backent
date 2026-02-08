/*
  Warnings:

  - You are about to alter the column `token` on the `mcp_auth` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(64)`.

*/
-- AlterTable
ALTER TABLE `mcp_auth` MODIFY `token` VARCHAR(64) NULL;

-- CreateIndex
CREATE INDEX `mcp_auth_email_idx` ON `mcp_auth`(`email`);

-- CreateIndex
CREATE INDEX `mcp_auth_token_idx` ON `mcp_auth`(`token`);
