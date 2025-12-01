import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const orders = await prisma.order.findMany({
            where: { userId: session.user.id },
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
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ success: true, data: orders });
    } catch (error) {
        console.error('Get orders error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch orders' },
            { status: 500 }
        );
    }
}
