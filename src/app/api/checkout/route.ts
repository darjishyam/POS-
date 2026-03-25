import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { adminAuth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const cartItems = body.cartItems || body.items;
        const { totalAmount, discountAmount, paymentMethod, customerInfo, upiId, agentId, customerId, status } = body;

        if (!cartItems || !Array.isArray(cartItems)) {
            return NextResponse.json({ error: 'Cart items missing or invalid' }, { status: 400 });
        }

        // Get user from session cookie
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session');
        let userId = "GUEST";
        let userEmail = "guest@marketplace.pos";
        let userName = "Online Guest";
        let userPhone = null; // Initialize userPhone

        if (sessionCookie) {
            try {
                const decodedToken = await adminAuth.verifySessionCookie(sessionCookie.value, true);
                userId = decodedToken.uid;
                userEmail = decodedToken.email || "unknown@pos.io";
                userName = decodedToken.name || decodedToken.email?.split('@')[0] || "Auth User";
                // Firebase tokens don't directly provide phone, so we might need to get it from customerInfo or leave null
            } catch (authError) {
                console.error("Firebase auth verification failed", authError);
            }
        }

        // If customerInfo is provided in the request body, use it to override/supplement
        if (customerInfo) {
            if (customerInfo.email) userEmail = customerInfo.email;
            if (customerInfo.name) userName = customerInfo.name;
            if (customerInfo.phone) userPhone = customerInfo.phone;
        }

        // Start a transaction to ensure atomicity
        const order = await prisma.$transaction(async (tx: any) => {
            let finalCustomerId = customerId;

            if (!finalCustomerId) {
                // Find or create a specific Customer record for this marketplace user
                let customer = await tx.customer.findUnique({
                    where: { email: userEmail }
                })

                if (!customer) {
                    customer = await tx.customer.create({
                        data: {
                            name: userName,
                            email: userEmail,
                            phone: userPhone
                        }
                    })
                } else if ((customer.name === 'System User' && userName !== 'System User') || (!customer.phone && userPhone)) {
                    // Update profile if we found better data
                    customer = await tx.customer.update({
                        where: { id: customer.id },
                        data: { 
                            name: userName !== 'System User' ? userName : customer.name,
                            phone: userPhone || customer.phone
                        }
                    })
                }
                finalCustomerId = customer.id;
            }

            // 0. Verify if userId exists in the Staff/User table to avoid P2003
            let verifiedUserId = null;
            if (userId !== "GUEST") {
                const userExists = await tx.user.findUnique({ where: { id: userId } });
                if (userExists) verifiedUserId = userId;
            }

            // 1. Create the Order
            const newOrder = await tx.order.create({
                data: {
                    totalAmount,
                    discountAmount: discountAmount || 0,
                    paymentMethod: paymentMethod || 'CASH',
                    upiId: upiId || null,
                    agentId: agentId || null,
                    status: status || 'COMPLETED',
                    userId: verifiedUserId,
                    customerId: finalCustomerId,
                    items: {
                        create: cartItems.map((item: any) => ({
                            productId: item.id,
                            quantity: item.quantity,
                            price: item.price
                        }))
                    }
                }
            })

            // 2. Decrement Stock ONLY if not a DRAFT or QUOTATION
            if (status !== 'DRAFT' && status !== 'QUOTATION') {
                const defaultLocation = await tx.location.findFirst({
                    where: { type: 'STORE' }
                })

                if (defaultLocation) {
                    for (const item of cartItems) {
                        await tx.locationStock.upsert({
                            where: {
                                productId_locationId: {
                                    productId: item.id,
                                    locationId: defaultLocation.id
                                }
                            },
                            update: {
                                quantity: { decrement: item.quantity }
                            },
                            create: {
                                productId: item.id,
                                locationId: defaultLocation.id,
                                quantity: -item.quantity
                            }
                        })
                    }
                }
            }

            // 3. Return the fully populated order
            return await tx.order.findUnique({
                where: { id: newOrder.id },
                include: {
                    items: {
                        include: {
                            product: true
                        }
                    },
                    customer: true
                }
            })
        })

        return NextResponse.json(order)
    } catch (error) {
        console.error('Checkout Error:', error)
        return NextResponse.json({ error: 'Checkout synchronization failure' }, { status: 500 })
    }
}
