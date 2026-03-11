-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 001 — Initial Schema
-- Personal Finance App
-- ─────────────────────────────────────────────────────────────────────────────

-- NextAuth tables ─────────────────────────────────────────────────────────────

CREATE TABLE "User" (
    "id"            TEXT NOT NULL,
    "name"          TEXT,
    "email"         TEXT,
    "emailVerified" TIMESTAMP(3),
    "image"         TEXT,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "Account" (
    "id"                TEXT NOT NULL,
    "userId"            TEXT NOT NULL,
    "type"              TEXT NOT NULL,
    "provider"          TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token"     TEXT,
    "access_token"      TEXT,
    "expires_at"        INTEGER,
    "token_type"        TEXT,
    "scope"             TEXT,
    "id_token"          TEXT,
    "session_state"     TEXT,
    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key"
    ON "Account"("provider", "providerAccountId");

ALTER TABLE "Account"
    ADD CONSTRAINT "Account_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Session" (
    "id"           TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId"       TEXT NOT NULL,
    "expires"      TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

ALTER TABLE "Session"
    ADD CONSTRAINT "Session_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token"      TEXT NOT NULL,
    "expires"    TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key"
    ON "VerificationToken"("identifier", "token");

-- Application tables ──────────────────────────────────────────────────────────

CREATE TABLE "Group" (
    "id"        TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GroupMember" (
    "id"       TEXT NOT NULL,
    "groupId"  TEXT NOT NULL,
    "userId"   TEXT NOT NULL,
    "role"     TEXT NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GroupMember_groupId_userId_key" ON "GroupMember"("groupId", "userId");

ALTER TABLE "GroupMember"
    ADD CONSTRAINT "GroupMember_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GroupMember"
    ADD CONSTRAINT "GroupMember_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Folder" (
    "id"              TEXT NOT NULL,
    "groupId"         TEXT NOT NULL,
    "name"            TEXT NOT NULL,
    "icon"            TEXT NOT NULL DEFAULT '📁',
    "backgroundColor" TEXT NOT NULL DEFAULT '#112038',
    "position"        INTEGER NOT NULL DEFAULT 0,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Folder_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Folder"
    ADD CONSTRAINT "Folder_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ItemType enum
CREATE TYPE "ItemType" AS ENUM ('BILL', 'INCOME', 'CREDIT_CARD', 'CHECKING_ACCOUNT');

CREATE TABLE "Item" (
    "id"             TEXT NOT NULL,
    "groupId"        TEXT NOT NULL,
    "folderId"       TEXT,
    "userId"         TEXT NOT NULL,
    "title"          TEXT NOT NULL,
    "type"           "ItemType" NOT NULL,
    "amount"         DOUBLE PRECISION NOT NULL,
    "icon"           TEXT NOT NULL DEFAULT '💰',
    "bank"           TEXT,
    "currentBalance" DOUBLE PRECISION,
    "startMonth"     TEXT NOT NULL,
    "endMonth"       TEXT,
    "dueDay"         INTEGER,
    "dueDate"        TIMESTAMP(3),
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Item"
    ADD CONSTRAINT "Item_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Item"
    ADD CONSTRAINT "Item_folderId_fkey"
    FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Item"
    ADD CONSTRAINT "Item_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Index to quickly find all items active in a given month range
CREATE INDEX "Item_groupId_startMonth_endMonth_idx"
    ON "Item"("groupId", "startMonth", "endMonth");

CREATE TABLE "ItemEvent" (
    "id"              TEXT NOT NULL,
    "itemId"          TEXT NOT NULL,
    "userId"          TEXT NOT NULL,
    "month"           TEXT NOT NULL,
    "actionType"      TEXT NOT NULL,
    "paymentMethod"   TEXT,
    "paymentItemId"   TEXT,
    "balanceDeducted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ItemEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ItemEvent_itemId_month_key" ON "ItemEvent"("itemId", "month");

ALTER TABLE "ItemEvent"
    ADD CONSTRAINT "ItemEvent_itemId_fkey"
    FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ItemEvent"
    ADD CONSTRAINT "ItemEvent_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ItemException" (
    "id"     TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "month"  TEXT NOT NULL,
    CONSTRAINT "ItemException_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ItemException_itemId_month_key" ON "ItemException"("itemId", "month");

ALTER TABLE "ItemException"
    ADD CONSTRAINT "ItemException_itemId_fkey"
    FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
