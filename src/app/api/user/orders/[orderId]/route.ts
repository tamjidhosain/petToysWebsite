import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(
    request: Request,
    { params }: { params: { orderId: string } }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { orderId } = params;

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                name: true,
                                slug: true,
                                images: true,
                            },
                        },
                        variant: {
                            select: {
                                size: true,
                                color: true,
                            },
                        },
                    },
                },
                shippingAddress: true,
            },
        });

        if (!order || order.userId !== session.user.id) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: order });
    } catch (error) {
        console.error('Get order details error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch order details' },
            { status: 500 }
        );
    }
}
