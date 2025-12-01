import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
    request: Request,
    { params }: { params: { slug: string } }
) {
    try {
        const { slug } = params;

        const product = await prisma.product.findUnique({
            where: { slug },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
                variants: true,
                reviews: {
                    where: { isApproved: true },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                image: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });

        if (!product || !product.isActive || product.deletedAt) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            );
        }

        // Get related products from same category
        const relatedProducts = await prisma.product.findMany({
            where: {
                categoryId: product.categoryId,
                id: { not: product.id },
                isActive: true,
                deletedAt: null,
            },
            take: 4,
            orderBy: { rating: 'desc' },
            select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                images: true,
                rating: true,
                reviewsCount: true,
                stock: true,
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                product,
                relatedProducts,
            },
        });
    } catch (error) {
        console.error('Get product error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch product' },
            { status: 500 }
        );
    }
}
