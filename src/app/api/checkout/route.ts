import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { adminAuth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { sendLowStockAlert } from '@/lib/nodemailer';
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const cartItems = body.cartItems || body.items;
        const { 
            totalAmount, 
            taxAmount, 
            discountAmount, 
            paymentMethod, 
            customerInfo, 
            upiId, 
            agentId, 
            customerId, 
            status, 
            payments,
            isDelivery,
            shippingName,
            shippingAddress,
            shippingCity,
            shippingPhone,
            shippingCost
        } = body;

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

        // Start a transaction to ensure atomicity with a higher timeout
        const result = await prisma.$transaction(async (tx: any) => {
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

            // 0.5 Check Global Stock Availability First
            if (status !== 'DRAFT' && status !== 'QUOTATION') {
                const productIds = cartItems.map((i: any) => i.id);
                const dbProducts = await tx.product.findMany({
                    where: { id: { in: productIds } }
                });

                for (const item of cartItems) {
                    const dbProduct = dbProducts.find((p: any) => p.id === item.id);
                    if (!dbProduct) throw new Error(`Asset ${item.id} not found.`);
                    if (dbProduct.stock < item.quantity) {
                        throw new Error(`Insufficient stock for ${dbProduct.name}. Only ${dbProduct.stock} left.`);
                    }
                }
            }

            // 1. Create the Order
            const newOrder = await tx.order.create({
                data: {
                    totalAmount,
                    taxAmount: taxAmount || 0,
                    discountAmount: discountAmount || 0,
                    paymentMethod: paymentMethod || 'CASH',
                    upiId: upiId || null,
                    status: status || 'COMPLETED',
                    user: verifiedUserId ? { connect: { id: verifiedUserId } } : undefined,
                    customer: finalCustomerId ? { connect: { id: finalCustomerId } } : undefined,
                    agent: agentId ? { connect: { id: agentId } } : undefined,
                    isDelivery: isDelivery || false,
                    shippingName: shippingName || null,
                    shippingAddress: shippingAddress || null,
                    shippingCity: shippingCity || null,
                    shippingPhone: shippingPhone || null,
                    shippingCost: shippingCost || 0,
                    items: {
                        create: cartItems.map((item: any) => ({
                            productId: item.id,
                            quantity: item.quantity,
                            price: item.price
                        }))
                    },
                    payments: {
                        create: payments && payments.length > 0 
                            ? payments.map((p: any) => ({
                                amount: p.amount,
                                method: p.method
                            }))
                            : [{
                                amount: totalAmount,
                                method: paymentMethod || 'CASH'
                            }]
                    }
                }
            })

            // 2. Decrement Stock ONLY if not a DRAFT or QUOTATION
            if (status !== 'DRAFT' && status !== 'QUOTATION') {
                // Decrement Global Stock
                for (const item of cartItems) {
                    await tx.product.update({
                        where: { id: item.id },
                        data: { stock: { decrement: item.quantity } }
                    });
                }

                // Decrement Default Location Stock
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

            return { orderId: newOrder.id };
        }, {
            timeout: 20000 // 20 seconds timeout for large checkouts
        })

        // 3. Post-Transaction: Fetch the fully populated order (outside the atomic block to prevent timeout)
        const order = await prisma.order.findUnique({
            where: { id: result.orderId },
            include: {
                items: {
                    include: {
                        product: true
                    }
                },
                customer: true,
                payments: true
            }
        })

        // 4. Low Stock Alerts (Role-Based)
        if (order && status !== 'DRAFT' && status !== 'QUOTATION') {
            try {
                // Fetch all admins
                const admins = await prisma.user.findMany({
                    where: { role: 'ADMIN' },
                    select: { email: true }
                });
                const adminEmails = admins.map((a: any) => a.email).filter(Boolean);

                if (adminEmails.length > 0) {
                    for (const item of order.items) {
                        const product = item.product;
                        // Trigger alert if core stock management is on and we hit the threshold
                        if (product.manageStock && product.stock <= product.alertQuantity) {
                            await sendLowStockAlert(adminEmails, {
                                name: product.name,
                                sku: product.sku,
                                stock: product.stock,
                                alertQuantity: product.alertQuantity
                            });
                        }
                    }
                }
            } catch (alertError) {
                console.error('Low Stock Alert failed (non-fatal):', alertError);
            }
        }

        return NextResponse.json(order)
    } catch (error: any) {
        console.error('Checkout Error:', error)
        return NextResponse.json({ error: error?.message || 'Checkout synchronization failure' }, { status: 500 })
    }
}
