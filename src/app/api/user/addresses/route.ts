import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';

const addressSchema = z.object({
    fullName: z.string().min(1, 'Full name is required'),
    phone: z.string().min(11, 'Phone number is required'),
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    district: z.string().min(1, 'District is required'),
    division: z.string().min(1, 'Division is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    isDefault: z.boolean().optional(),
});

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const addresses = await prisma.address.findMany({
            where: { userId: session.user.id },
            orderBy: { isDefault: 'desc' },
        });

        return NextResponse.json({ success: true, data: addresses });
    } catch (error) {
        console.error('Get addresses error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch addresses' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = addressSchema.parse(body);

        // If setting as default, unset other default addresses
        if (validatedData.isDefault) {
            await prisma.address.updateMany({
                where: { userId: session.user.id, isDefault: true },
                data: { isDefault: false },
            });
        }

        // Check if this is the first address, make it default automatically
        const count = await prisma.address.count({
            where: { userId: session.user.id },
        });
        const isDefault = count === 0 ? true : validatedData.isDefault;

        const address = await prisma.address.create({
            data: {
                userId: session.user.id,
                ...validatedData,
                isDefault: isDefault || false,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Address added successfully',
            data: address,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error('Add address error:', error);
        return NextResponse.json(
            { error: 'Failed to add address' },
            { status: 500 }
        );
    }
}
