import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const url = process.env.DATABASE_URL;
    console.log('DB: Connecting to', url ? url.replace(/:[^:@]*@/, ':****@') : 'undefined');

    // 1. Count total
    const count = await prisma.product.count();
    console.log(`Total products (no filter): ${count}`);

    // 2. Count with filter (simulating the App's query)
    const countFiltered = await prisma.product.count({
        where: {
            isActive: true,
            deletedAt: null
        }
    });
    console.log(`Total products (with filter isActive=true, deletedAt=null): ${countFiltered}`);

    // 3. Inspect a raw document to see field names
    // We'll fetch one without filter
    const product = await prisma.product.findFirst();
    if (product) {
        console.log('Sample Product (Prisma View):', JSON.stringify(product, null, 2));

        // Try to get raw data if possible, or infer from what we see. 
        // Since we can't easily do raw query without model, we'll rely on the filter test.
        // But we can try a raw aggregate if needed.
        try {
            // @ts-ignore
            const raw = await prisma.$runCommandRaw({
                find: "products",
                limit: 1
            });
            console.log('Raw MongoDB Document:', JSON.stringify(raw, null, 2));
        } catch (e) {
            console.log('Could not fetch raw data:', e);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
