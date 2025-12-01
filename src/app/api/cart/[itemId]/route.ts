import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';

const updateCartSchema = z.object({
    quantity: z.number().min(1),
});

export async function PUT(
    request: Request,
    { params }: { params: { itemId: string } }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { quantity } = updateCartSchema.parse(body);
        const { itemId } = params;

        // Get cart item to check stock
        const cartItem = await prisma.cartItem.findUnique({
            where: { id: itemId },
            include: {
                product: true,
                variant: true,
            },
        });

        if (!cartItem || cartItem.userId !== session.user.id) {
            return NextResponse.json(
                { error: 'Cart item not found' },
                { status: 404 }
            );
        }

        // Check stock
        const availableStock = cartItem.variant
            ? cartItem.variant.stock
            : cartItem.product.stock;

        if (quantity > availableStock) {
            return NextResponse.json(
                { error: `Only ${availableStock} items in stock` },
                { status: 400 }
            );
        }

        const updatedItem = await prisma.cartItem.update({
            where: { id: itemId },
            data: { quantity },
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

        return NextResponse.json({ success: true, data: updatedItem });
    } catch (error) {
        console.error('Update cart error:', error);
        return NextResponse.json(
            { error: 'Failed to update cart' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { itemId: string } }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { itemId } = params;

        const cartItem = await prisma.cartItem.findUnique({
            where: { id: itemId },
        });

        if (!cartItem || cartItem.userId !== session.user.id) {
            return NextResponse.json(
                { error: 'Cart item not found' },
                { status: 404 }
            );
        }

        await prisma.cartItem.delete({
            where: { id: itemId },
        });

        return NextResponse.json({
            success: true,
            message: 'Item removed from cart',
        });
    } catch (error) {
        console.error('Delete cart item error:', error);
        return NextResponse.json(
            { error: 'Failed to remove item' },
            { status: 500 }
        );
    }
}
