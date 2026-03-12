UPDATE "Item"
SET "defaultAmount" = CASE
    WHEN "type" = 'BILL' THEN -ABS("defaultAmount")
    WHEN "type" = 'INCOME' THEN ABS("defaultAmount")
    WHEN "type" = 'CREDIT_CARD' THEN -ABS("defaultAmount")
    ELSE "defaultAmount"
END
WHERE "defaultAmount" IS NOT NULL;

-- Update ItemBalance amount
UPDATE "ItemBalance"
SET "amount" = CASE
    WHEN i."type" = 'BILL' THEN -ABS("ItemBalance"."amount")
    WHEN i."type" = 'INCOME' THEN ABS("ItemBalance"."amount")
    WHEN i."type" = 'CREDIT_CARD' THEN -ABS("ItemBalance"."amount")
    ELSE "ItemBalance"."amount"
END
FROM "Item" i
WHERE "ItemBalance"."itemId" = i."id";
