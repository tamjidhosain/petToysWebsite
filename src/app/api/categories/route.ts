import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const categories = await prisma.category.findMany({
            orderBy: {
                name: 'asc',
            },
            select: {
                id: true,
                name: true,
                slug: true,
            },
        });

        return NextResponse.json({
            success: true,
            data: categories,
        });
    } catch (error) {
        console.error('Failed to fetch categories:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch categories',
            },
            { status: 500 }
        );
    }
}
