import { z } from 'zod'

export const productSchema = z.object({
    name: z.string().min(1, "Name is required"),
    price: z.number().min(0, "Price must be positive"),
    stock: z.number().int().default(0),
    sku: z.string().optional(),
    categoryId: z.string().min(1, "Category is required"),
    image: z.string().optional(),
    description: z.string().optional(),
    brandId: z.string().optional().nullable(),
    unitId: z.string().optional().nullable(),
    taxId: z.string().optional().nullable(),
    taxType: z.string().default("EXCLUSIVE"),
    purchasePriceExcTax: z.number().min(0).default(0),
    purchasePriceIncTax: z.number().min(0).default(0),
    margin: z.number().min(0).default(25),
    alertQuantity: z.number().int().default(5),
    manageStock: z.boolean().default(true),
    brochureUrl: z.string().optional(),
    supplierId: z.string().optional().nullable(),
    purchaseCost: z.number().min(0, "Purchase Cost must be positive").optional().nullable()
})

export const categorySchema = z.object({
    name: z.string().min(1, "Category name is required"),
    description: z.string().optional(),
    icon: z.string().optional()
})

export const supplierSchema = z.object({
    name: z.string().min(1, "Supplier name is required"),
    contactPerson: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional()
})
