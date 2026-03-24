import { z } from 'zod'

export const productSchema = z.object({
    name: z.string().min(1, "Name is required"),
    price: z.number().min(0, "Price must be positive"),
    stock: z.number().int().default(0),
    sku: z.string().optional(),
    categoryId: z.string().min(1, "Category is required"),
    image: z.string().optional(),
    description: z.string().optional(),
    brand: z.string().optional(),
    barcodeType: z.string().default('CODE128'),
    unit: z.string().default('Piece'),
    alertQuantity: z.number().int().default(5),
    manageStock: z.boolean().default(true),
    brochureUrl: z.string().optional()
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
