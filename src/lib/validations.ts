import { z } from "zod";

export const ItemTypeSchema = z.enum(["BILL", "INCOME", "CREDIT_CARD", "CHECKING_ACCOUNT"]);
export const RecurrenceModeSchema = z.enum(["once", "limited", "forever"]);
export const DeleteModeSchema = z.enum(["this", "following", "all"]);
export const PaymentMethodSchema = z.enum(["credit_card", "checking_account", "cash"]);

export const CreateGroupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

export const CreateFolderSchema = z.object({
  groupId: z.string().uuid().or(z.string().cuid()), // Prisma IDs can be CUID or UUID, usually CUID here
  name: z.string().min(1, "Name is required").max(100),
  icon: z.string().min(1, "Icon is required"),
  backgroundColor: z.string().min(1, "Background color is required"),
});

// Since the existing code allows partial updates for folders
export const UpdateFolderSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  icon: z.string().min(1).optional(),
  backgroundColor: z.string().min(1).optional(),
});

export const CreateItemSchema = z.object({
  groupId: z.string().min(1),
  folderId: z.string().nullable().optional(),
  title: z.string().min(1, "Title is required").max(100),
  type: ItemTypeSchema,
  icon: z.string().min(1, "Icon is required"),
  bank: z.string().nullable().optional(),
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(), // YYYY-MM
  startMonth: z.string().regex(/^\d{4}-\d{2}$/, "Invalid start month"),
  endMonth: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .nullable()
    .optional(),
  dueDay: z.number().int().min(1).max(31).nullable().optional(),
  dueNextMonth: z.boolean().optional(),
  dueDate: z.string().datetime().or(z.string().pipe(z.coerce.date())).nullable().optional(),
  amount: z.number().nullable(),
  defaultAmount: z.number().nullable().optional(),
});

export const UpdateItemSchema = z.object({
  folderId: z.string().nullable().optional(),
  title: z.string().min(1).max(100).optional(),
  icon: z.string().min(1).optional(),
  bank: z.string().nullable().optional(),
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
  startMonth: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
  endMonth: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .nullable()
    .optional(),
  dueDay: z.number().int().min(1).max(31).nullable().optional(),
  dueNextMonth: z.boolean().optional(),
  dueDate: z.string().datetime().or(z.string().pipe(z.coerce.date())).nullable().optional(),
  amount: z.number().nullable().optional(),
  defaultAmount: z.number().nullable().optional(),
});

export const PayItemRequestSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  paymentMethod: PaymentMethodSchema.nullable().optional(),
  paymentItemId: z.string().nullable().optional(),
  rollback: z.boolean().optional(),
});

export const DeleteItemRequestSchema = z.object({
  mode: DeleteModeSchema,
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
});

export const ReorderFoldersSchema = z.object({
  folderIds: z.array(z.string()),
});

export const ReorderItemsSchema = z.object({
  itemId: z.string(),
  folderId: z.string().nullable(),
  itemIds: z.array(z.string()),
});

export const AddGroupMemberSchema = z.object({
  email: z.string().email("Invalid email"),
});

export const RemoveGroupMemberSchema = z.object({
  userId: z.string(),
});

export const BulkReorderSchema = z.object({
  folders: z
    .array(
      z.object({
        id: z.string(),
        position: z.number().int(),
      }),
    )
    .optional(),
  items: z
    .array(
      z.object({
        id: z.string(),
        position: z.number().int(),
        folderId: z.string().nullable(),
      }),
    )
    .optional(),
});
