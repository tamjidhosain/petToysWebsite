import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { PRODUCTS_PER_PAGE } from '@/lib/constants';

// export const dynamic = 'force-dynamic'; // Removed for performance optimization

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        console.log('API: Fetching products with params:', Object.fromEntries(searchParams));

        // Pagination
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || PRODUCTS_PER_PAGE.toString());
        const skip = (page - 1) * limit;

        // Filters
        const category = searchParams.get('category');
        const search = searchParams.get('search');
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        const minRating = searchParams.get('minRating');
        const inStock = searchParams.get('inStock') === 'true';

        // Sorting
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const order = searchParams.get('order') || 'desc';

        // Build filter object
        const where: any = {
            isActive: true,
            // deletedAt: null, // Temporarily removed to debug if this is hiding products
        };

        // Category filter
        if (category) {
            const categoryDoc = await prisma.category.findUnique({
                where: { slug: category },
            });
            if (categoryDoc) {
                where.categoryId = categoryDoc.id;
            } else {
                console.log('API: Category not found:', category);
                // If category specified but not found, return empty
                return NextResponse.json({
                    success: true,
                    data: [],
                    pagination: {
                        page,
                        limit,
                        total: 0,
                        totalPages: 0,
                        hasMore: false,
                    },
                });
            }
        }

        // Search filter
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Price range filter
        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price.gte = parseFloat(minPrice);
            if (maxPrice) where.price.lte = parseFloat(maxPrice);
        }

        // Rating filter
        if (minRating) {
            where.rating = { gte: parseFloat(minRating) };
        }

        // Stock filter
        if (inStock) {
            where.stock = { gt: 0 };
        }

        console.log('API: Query where clause:', JSON.stringify(where, null, 2));

        // Build sort object
        const orderBy: any = {};
        if (sortBy === 'price') {
            orderBy.price = order;
        } else if (sortBy === 'rating') {
            orderBy.rating = order;
        } else if (sortBy === 'name') {
            orderBy.name = order;
        } else if (sortBy === 'popularity') {
            orderBy.reviewsCount = order;
        } else {
            orderBy.createdAt = order;
        }

        // Fetch products and total count
        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                orderBy,
                skip,
                take: limit,
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
                },
            }),
            prisma.product.count({ where }),
        ]);

        console.log(`API: Found ${products.length} products, Total: ${total}`);

        const totalPages = Math.ceil(total / limit);

        return NextResponse.json({
            success: true,
            data: products,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasMore: page < totalPages,
            },
        });
    } catch (error) {
        console.error('Get products error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch products' },
            { status: 500 }
        );
    }
}
