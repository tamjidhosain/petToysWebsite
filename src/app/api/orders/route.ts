import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';
import { SHIPPING_COST_DHAKA, SHIPPING_COST_OUTSIDE_DHAKA, TAX_RATE } from '@/lib/constants';

const createOrderSchema = z.object({
    addressId: z.string(),
    paymentMethod: z.enum(['COD', 'SSLCOMMERZ']),
    notes: z.string().optional(),
});

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { addressId, paymentMethod, notes } = createOrderSchema.parse(body);

        // 1. Get Cart Items
        const cartItems = await prisma.cartItem.findMany({
            where: { userId: session.user.id },
            include: {
                product: true,
                variant: true,
            },
        });

        if (cartItems.length === 0) {
            return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
        }

        // 2. Validate Stock & Calculate Totals
        let subtotal = 0;
        const orderItemsData = [];

        for (const item of cartItems) {
            const product = item.product;
            const variant = item.variant;

            // Check stock
            const availableStock = variant ? variant.stock : product.stock;
            if (item.quantity > availableStock) {
                return NextResponse.json(
                    { error: `Product ${product.name} is out of stock` },
                    { status: 400 }
                );
            }

            const unitPrice = variant
                ? product.price + variant.priceModifier
                : product.price;

            subtotal += unitPrice * item.quantity;

            orderItemsData.push({
                productId: product.id,
                variantId: variant?.id,
                quantity: item.quantity,
                unitPrice: unitPrice,
            });
        }

        // 3. Get Shipping Address for Cost Calculation
        const address = await prisma.address.findUnique({
            where: { id: addressId },
        });

        if (!address) {
            return NextResponse.json({ error: 'Address not found' }, { status: 404 });
        }

        // Determine shipping cost based on location (simple logic for now)
        const isDhaka = address.city.toLowerCase().includes('dhaka') ||
            address.division.toLowerCase().includes('dhaka');
        const shippingCost = isDhaka ? SHIPPING_COST_DHAKA : SHIPPING_COST_OUTSIDE_DHAKA;

        const tax = subtotal * TAX_RATE;
        const totalAmount = subtotal + tax + shippingCost;

        // 4. Create Order Transaction
        const order = await prisma.$transaction(async (tx) => {
            // Create Order
            const newOrder = await tx.order.create({
                data: {
                    userId: session.user.id,
                    totalAmount,
                    tax,
                    shippingCost,
                    status: 'PENDING',
                    paymentStatus: 'PENDING',
                    paymentMethod,
                    shippingAddressId: addressId,
                    notes,
                    items: {
                        create: orderItemsData,
                    },
                },
            });

            // Update Stock
            for (const item of cartItems) {
                if (item.variantId) {
                    await tx.productVariant.update({
                        where: { id: item.variantId },
                        data: { stock: { decrement: item.quantity } },
                    });
                }
                // Always decrement product stock (or just master stock if no variants? 
                // Logic depends on if variants share master stock. 
                // Assuming variants track their own stock, but let's decrement master for non-variant items)
                if (!item.variantId) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { decrement: item.quantity } },
                    });
                }
            }

            // Clear Cart
            await tx.cartItem.deleteMany({
                where: { userId: session.user.id },
            });

            return newOrder;
        });

        return NextResponse.json({
            success: true,
            message: 'Order created successfully',
            data: order,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error('Create order error:', error);
        return NextResponse.json(
            { error: 'Failed to create order' },
            { status: 500 }
        );
    }
}
