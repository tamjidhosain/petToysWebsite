import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';

// Schema for adding to cart
const addToCartSchema = z.object({
    productId: z.string(),
    variantId: z.string().optional(),
    quantity: z.number().min(1),
});

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ success: true, data: [] });
        }

        const cartItems = await prisma.cartItem.findMany({
            where: { userId: session.user.id },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        price: true,
                        images: true,
                        stock: true,
                    },
                },
                variant: {
                    select: {
                        id: true,
                        size: true,
                        color: true,
                        priceModifier: true,
                        stock: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ success: true, data: cartItems });
    } catch (error) {
        console.error('Get cart error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch cart' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json(
                { error: 'Please sign in to add items to cart' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { productId, variantId, quantity } = addToCartSchema.parse(body);

        // Check product existence and stock
        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: { variants: true },
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Check stock
        let availableStock = product.stock;
        if (variantId) {
            const variant = product.variants.find((v) => v.id === variantId);
            if (!variant) {
                return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
            }
            availableStock = variant.stock;
        }

        if (availableStock < quantity) {
            return NextResponse.json(
                { error: `Only ${availableStock} items in stock` },
                { status: 400 }
            );
        }

        // Check if item already exists in cart
        const existingItem = await prisma.cartItem.findFirst({
            where: {
                userId: session.user.id,
                productId,
                variantId: variantId || null,
            },
        });

        if (existingItem) {
            // Update quantity
            const newQuantity = existingItem.quantity + quantity;
            if (newQuantity > availableStock) {
                return NextResponse.json(
                    { error: `Cannot add more. Only ${availableStock} items in stock` },
                    { status: 400 }
                );
            }

            const updatedItem = await prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: newQuantity },
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            price: true,
                            images: true,
                        },
                    },
                    variant: true,
                },
            });

            return NextResponse.json({
                success: true,
                message: 'Cart updated',
                data: updatedItem,
            });
        }

        // Create new cart item
        const newItem = await prisma.cartItem.create({
            data: {
                userId: session.user.id,
                productId,
                variantId,
                quantity,
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        price: true,
                        images: true,
                    },
                },
                variant: true,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Item added to cart',
            data: newItem,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error('Add to cart error:', error);
        return NextResponse.json(
            { error: 'Failed to add item to cart' },
            { status: 500 }
        );
    }
}
