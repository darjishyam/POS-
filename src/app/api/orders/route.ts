import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const orders = await prisma.order.findMany({
            include: {
                customer: true,
                items: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
        return NextResponse.json(orders)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }
}

import { adminAuth } from "@/lib/firebase-admin";
import { cookies } from "next/headers";

export async function POST(request: Request) {
    try {
        const sessionCookie = (await cookies()).get("session")?.value;
        let userId = null;

        if (sessionCookie) {
            try {
                const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
                userId = decodedClaims.uid;
            } catch (e) {
                console.error("Session verification failed:", e);
            }
        }

        const body = await request.json()
        const { items, taxAmount, discountAmount, paymentMethod, locationId } = body
        let { customerId } = body

        // If no customerId is provided but a user is logged in, try to link them
        if (!customerId && userId) {
            // Find or create a matching Customer record for this user
            const existingCustomer = await prisma.customer.findFirst({
                where: { email: userId } 
            });

            if (existingCustomer) {
                customerId = existingCustomer.id;
            } else {
                // Create a placeholder customer record for this first-time buyer
                const newCustomer = await prisma.customer.create({
                    data: {
                        name: `User-${userId.slice(-4)}`,
                        email: userId, 
                    }
                });
                customerId = newCustomer.id;
            }
        }

        // Server-side validation and calculation
        const order = await prisma.$transaction(async (tx: any) => {
            // Fetch current prices from DB to prevent frontend tampering
            const productIds = items.map((i: any) => i.id)
            const dbProducts = await tx.product.findMany({
                where: { id: { in: productIds } }
            })

            let subtotal = 0
            const orderItemsData = items.map((item: any) => {
                const dbProduct = dbProducts.find((p: any) => p.id === item.id)
                if (!dbProduct) throw new Error(`Product ${item.id} not found`)
                if (dbProduct.stock < item.quantity) throw new Error(`Insufficient stock for ${dbProduct.name}`)

                const price = dbProduct.price
                subtotal += price * item.quantity

                return {
                    productId: item.id,
                    quantity: item.quantity,
                    price: price,
                }
            })

            const finalTotal = subtotal + (taxAmount || 0) - (discountAmount || 0)

            const newOrder = await tx.order.create({
                data: {
                    totalAmount: finalTotal,
                    taxAmount: taxAmount || 0,
                    discountAmount: discountAmount || 0,
                    paymentMethod: paymentMethod || 'CASH',
                    customerId: customerId,
                    items: {
                        create: orderItemsData
                    }
                }
            })

            // Decrement stock (Global and Location-specific)
            for (const item of items) {
                // 1. Global Stock
                await tx.product.update({
                    where: { id: item.id },
                    data: {
                        stock: {
                            decrement: item.quantity
                        }
                    }
                })

                // 2. Location-specific Stock (if locationId is provided)
                if (locationId) {
                    await tx.locationStock.upsert({
                        where: {
                            productId_locationId: {
                                productId: item.id,
                                locationId: locationId
                            }
                        },
                        update: {
                            quantity: {
                                decrement: item.quantity
                            }
                        },
                        create: {
                            productId: item.id,
                            locationId: locationId,
                            quantity: -item.quantity
                        }
                    })
                }
            }

            return newOrder
        })

        return NextResponse.json(order)
    } catch (error: any) {
        console.error('Order Error:', error)
        return NextResponse.json({ error: error.message || 'Failed to process checkout' }, { status: 500 })
    }
}
