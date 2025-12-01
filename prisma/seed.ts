import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@pettoys.com' },
        update: {},
        create: {
            email: 'admin@pettoys.com',
            passwordHash: adminPassword,
            name: 'Admin User',
            role: 'ADMIN',
            emailVerified: new Date(),
        },
    });
    console.log('✅ Created admin user:', admin.email);

    // Create categories
    const categories = [
        {
            name: 'Dogs',
            slug: 'dogs',
            description: 'Toys and accessories for dogs of all sizes',
            imageUrl: 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?q=80&w=800&auto=format&fit=crop',
        },
        {
            name: 'Cats',
            slug: 'cats',
            description: 'Fun and engaging toys for cats',
            imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=800&auto=format&fit=crop',
        },
        {
            name: 'Birds',
            slug: 'birds',
            description: 'Interactive toys for pet birds',
            imageUrl: 'https://images.unsplash.com/photo-1552728089-57bdde30ebd1?q=80&w=800&auto=format&fit=crop',
        },
        {
            name: 'Small Animals',
            slug: 'small-animals',
            description: 'Toys for hamsters, rabbits, guinea pigs, and more',
            imageUrl: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?q=80&w=800&auto=format&fit=crop',
        },
        {
            name: 'Exotic Pets',
            slug: 'exotic',
            description: 'Specialized toys for exotic pets',
            imageUrl: 'https://images.unsplash.com/photo-1504450874802-0ba2bcd9b5ae?q=80&w=800&auto=format&fit=crop',
        },
    ];

    const createdCategories = [];
    for (const category of categories) {
        const created = await prisma.category.upsert({
            where: { slug: category.slug },
            update: { imageUrl: category.imageUrl },
            create: category,
        });
        createdCategories.push(created);
        console.log('✅ Created category:', created.name);
    }

    // Create sample products for Dogs category
    const dogProducts = [
        {
            name: 'Tennis Ball Set (3 Pack)',
            slug: 'tennis-ball-set-3-pack',
            description: 'Durable tennis balls perfect for fetch and play. Non-toxic rubber material.',
            price: 350,
            cost: 200,
            sku: 'DOG-TB-001',
            stock: 50,
            images: ['https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=800&auto=format&fit=crop'],
            rating: 4.5,
            reviewsCount: 12,
        },
        {
            name: 'Rope Tug Toy',
            slug: 'rope-tug-toy',
            description: 'Heavy-duty rope toy for interactive play and dental health.',
            price: 450,
            cost: 250,
            sku: 'DOG-RT-001',
            stock: 35,
            images: ['https://images.unsplash.com/photo-1591946614720-90a587da4a36?q=80&w=800&auto=format&fit=crop'],
            rating: 4.8,
            reviewsCount: 24,
        },
        {
            name: 'Squeaky Plush Toy',
            slug: 'squeaky-plush-toy',
            description: 'Soft plush toy with squeaker inside. Great for small to medium dogs.',
            price: 550,
            cost: 300,
            sku: 'DOG-SP-001',
            stock: 40,
            images: ['https://images.unsplash.com/photo-1576201836106-db1758fd1c97?q=80&w=800&auto=format&fit=crop'],
            rating: 4.3,
            reviewsCount: 8,
        },
        {
            name: 'Interactive Puzzle Feeder',
            slug: 'interactive-puzzle-feeder',
            description: 'Mental stimulation puzzle that dispenses treats. Adjustable difficulty.',
            price: 1200,
            cost: 700,
            sku: 'DOG-PF-001',
            stock: 20,
            images: ['https://images.unsplash.com/photo-1585837575652-267c041d77d4?q=80&w=800&auto=format&fit=crop'],
            rating: 4.9,
            reviewsCount: 31,
        },
        {
            name: 'Frisbee Flying Disc',
            slug: 'frisbee-flying-disc',
            description: 'Soft rubber frisbee safe for dogs teeth. Perfect for outdoor play.',
            price: 400,
            cost: 220,
            sku: 'DOG-FB-001',
            stock: 45,
            images: ['https://images.unsplash.com/photo-1615818499660-3035c97f8046?q=80&w=800&auto=format&fit=crop'],
            rating: 4.6,
            reviewsCount: 15,
        },
    ];

    const dogCategory = createdCategories.find((c) => c.slug === 'dogs');
    if (dogCategory) {
        for (const product of dogProducts) {
            await prisma.product.upsert({
                where: { slug: product.slug },
                update: { images: product.images },
                create: {
                    ...product,
                    categoryId: dogCategory.id,
                },
            });
            console.log('✅ Created product:', product.name);
        }
    }

    // Create sample products for Cats category
    const catProducts = [
        {
            name: 'Feather Wand Toy',
            slug: 'feather-wand-toy',
            description: 'Interactive feather wand to engage your cats hunting instincts.',
            price: 300,
            cost: 150,
            sku: 'CAT-FW-001',
            stock: 60,
            images: ['https://images.unsplash.com/photo-1623387641168-d9803ddd3f35?q=80&w=800&auto=format&fit=crop'],
            rating: 4.7,
            reviewsCount: 19,
        },
        {
            name: 'Catnip Mouse (2 Pack)',
            slug: 'catnip-mouse-2-pack',
            description: 'Soft mice filled with premium catnip. Irresistible to cats.',
            price: 250,
            cost: 120,
            sku: 'CAT-CM-001',
            stock: 70,
            images: ['https://images.unsplash.com/photo-1513245543132-31f507417b26?q=80&w=800&auto=format&fit=crop'],
            rating: 4.4,
            reviewsCount: 27,
        },
        {
            name: 'Laser Pointer',
            slug: 'laser-pointer',
            description: 'Battery-powered laser pointer for endless chase fun.',
            price: 350,
            cost: 180,
            sku: 'CAT-LP-001',
            stock: 40,
            images: ['https://images.unsplash.com/photo-1511044568932-338cba0fb803?q=80&w=800&auto=format&fit=crop'],
            rating: 4.5,
            reviewsCount: 14,
        },
        {
            name: 'Cat Tunnel',
            slug: 'cat-tunnel',
            description: 'Collapsible tunnel with crinkle material. Great for hiding and playing.',
            price: 800,
            cost: 450,
            sku: 'CAT-CT-001',
            stock: 25,
            images: ['https://images.unsplash.com/photo-1545249390-6bdfa2a27c62?q=80&w=800&auto=format&fit=crop'],
            rating: 4.8,
            reviewsCount: 22,
        },
        {
            name: 'Interactive Ball Tower',
            slug: 'interactive-ball-tower',
            description: 'Three-tier tower with spinning balls. Keeps cats entertained for hours.',
            price: 950,
            cost: 550,
            sku: 'CAT-BT-001',
            stock: 30,
            images: ['https://images.unsplash.com/photo-1548802673-380ab8ebc7b7?q=80&w=800&auto=format&fit=crop'],
            rating: 4.9,
            reviewsCount: 35,
        },
    ];

    const catCategory = createdCategories.find((c) => c.slug === 'cats');
    if (catCategory) {
        for (const product of catProducts) {
            await prisma.product.upsert({
                where: { slug: product.slug },
                update: { images: product.images },
                create: {
                    ...product,
                    categoryId: catCategory.id,
                },
            });
            console.log('✅ Created product:', product.name);
        }
    }

    // Create sample products for Birds category
    const birdProducts = [
        {
            name: 'Wooden Perch Swing',
            slug: 'wooden-perch-swing',
            description: 'Natural wood swing for birds to rest and play. Safe and durable.',
            price: 450,
            cost: 200,
            sku: 'BIRD-WS-001',
            stock: 30,
            images: ['https://images.unsplash.com/photo-1552728089-57bdde30ebd1?q=80&w=800&auto=format&fit=crop'],
            rating: 4.6,
            reviewsCount: 15,
        },
        {
            name: 'Colorful Hanging Bell',
            slug: 'colorful-hanging-bell',
            description: 'Brightly colored bell toy to stimulate your birds senses.',
            price: 250,
            cost: 100,
            sku: 'BIRD-HB-001',
            stock: 50,
            images: ['https://images.unsplash.com/photo-1452570053594-1b985d6ea890?q=80&w=800&auto=format&fit=crop'],
            rating: 4.3,
            reviewsCount: 10,
        },
        {
            name: 'Bird Ladder',
            slug: 'bird-ladder',
            description: 'Flexible wooden ladder for climbing and exercise.',
            price: 350,
            cost: 150,
            sku: 'BIRD-BL-001',
            stock: 40,
            images: ['https://images.unsplash.com/photo-1444464666168-49d633b86797?q=80&w=800&auto=format&fit=crop'],
            rating: 4.7,
            reviewsCount: 18,
        },
    ];

    const birdCategory = createdCategories.find((c) => c.slug === 'birds');
    if (birdCategory) {
        for (const product of birdProducts) {
            await prisma.product.upsert({
                where: { slug: product.slug },
                update: { images: product.images },
                create: {
                    ...product,
                    categoryId: birdCategory.id,
                },
            });
            console.log('✅ Created product:', product.name);
        }
    }

    // Create sample products for Small Animals category
    const smallAnimalProducts = [
        {
            name: 'Hamster Wheel',
            slug: 'hamster-wheel',
            description: 'Silent spinner wheel for hamsters and mice. Promotes exercise.',
            price: 600,
            cost: 300,
            sku: 'SMALL-HW-001',
            stock: 25,
            images: ['https://images.unsplash.com/photo-1425082661705-1834bfd09dca?q=80&w=800&auto=format&fit=crop'],
            rating: 4.8,
            reviewsCount: 20,
        },
        {
            name: 'Chew Sticks (Apple Wood)',
            slug: 'chew-sticks-apple-wood',
            description: 'Natural apple wood sticks for dental health of rabbits and guinea pigs.',
            price: 200,
            cost: 80,
            sku: 'SMALL-CS-001',
            stock: 100,
            images: ['https://images.unsplash.com/photo-1585664811087-47f65be1bac6?q=80&w=800&auto=format&fit=crop'],
            rating: 4.5,
            reviewsCount: 30,
        },
        {
            name: 'Cozy Hideout',
            slug: 'cozy-hideout',
            description: 'Soft and warm hideout for small pets to sleep and feel safe.',
            price: 500,
            cost: 250,
            sku: 'SMALL-CH-001',
            stock: 35,
            images: ['https://images.unsplash.com/photo-1548767797-d8c844163c4b?q=80&w=800&auto=format&fit=crop'],
            rating: 4.9,
            reviewsCount: 12,
        },
    ];

    const smallAnimalCategory = createdCategories.find((c) => c.slug === 'small-animals');
    if (smallAnimalCategory) {
        for (const product of smallAnimalProducts) {
            await prisma.product.upsert({
                where: { slug: product.slug },
                update: { images: product.images },
                create: {
                    ...product,
                    categoryId: smallAnimalCategory.id,
                },
            });
            console.log('✅ Created product:', product.name);
        }
    }

    // Create sample products for Exotic Pets category
    const exoticProducts = [
        {
            name: 'Reptile Basking Rock',
            slug: 'reptile-basking-rock',
            description: 'Natural-looking rock for reptiles to bask and regulate temperature.',
            price: 850,
            cost: 400,
            sku: 'EXO-BR-001',
            stock: 20,
            images: ['https://images.unsplash.com/photo-1504450874802-0ba2bcd9b5ae?q=80&w=800&auto=format&fit=crop'],
            rating: 4.7,
            reviewsCount: 8,
        },
        {
            name: 'Aquarium Castle Decor',
            slug: 'aquarium-castle-decor',
            description: 'Detailed castle decoration for fish tanks. Safe for all aquatic life.',
            price: 1200,
            cost: 600,
            sku: 'EXO-AC-001',
            stock: 15,
            images: ['https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?q=80&w=800&auto=format&fit=crop'],
            rating: 4.4,
            reviewsCount: 10,
        },
    ];

    const exoticCategory = createdCategories.find((c) => c.slug === 'exotic');
    if (exoticCategory) {
        for (const product of exoticProducts) {
            await prisma.product.upsert({
                where: { slug: product.slug },
                update: { images: product.images },
                create: {
                    ...product,
                    categoryId: exoticCategory.id,
                },
            });
            console.log('✅ Created product:', product.name);
        }
    }

    // Create sample coupons
    const coupons = [
        {
            code: 'WELCOME10',
            description: '10% off for new customers',
            discountType: 'percentage',
            discountValue: 10,
            minPurchase: 500,
            maxDiscount: 200,
            validFrom: new Date(),
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
        {
            code: 'FREESHIP',
            description: 'Free shipping on orders above 2000 BDT',
            discountType: 'fixed',
            discountValue: 120,
            minPurchase: 2000,
            validFrom: new Date(),
            validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        },
    ];

    for (const coupon of coupons) {
        await prisma.coupon.upsert({
            where: { code: coupon.code },
            update: {},
            create: coupon,
        });
        console.log('✅ Created coupon:', coupon.code);
    }

    console.log('🎉 Database seed completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
