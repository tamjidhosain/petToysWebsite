# Database Setup Guide

## MongoDB Database

This project uses **MongoDB** as the database. You have two options:

1. **MongoDB Atlas** (Cloud - Recommended): Free tier, no installation needed
2. **Local MongoDB**: Install MongoDB on your computer

See **`MONGODB_SETUP.md`** for detailed setup instructions.

### 1. Create Database

Open PostgreSQL command line (psql) or use pgAdmin and create a new database:

```sql
CREATE DATABASE pet_toys_db;
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory (copy from `.env.example`):

```bash
cp .env.example .env.local
```

Update the `DATABASE_URL` in `.env.local`:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/pet_toys_db?schema=public"
```

Replace `YOUR_PASSWORD` with your PostgreSQL password.

### 3. Generate Prisma Client

```bash
npm run prisma:generate
```

### 4. Run Database Migrations

This will create all the tables in your database:

```bash
npm run prisma:migrate
```

When prompted for a migration name, you can use: `init`

### 5. Seed the Database

This will populate your database with sample data:

```bash
npm run prisma:seed
```

This creates:
- ✅ Admin user (email: admin@pettoys.com, password: admin123)
- ✅ 5 categories (Dogs, Cats, Birds, Small Animals, Exotic)
- ✅ 10 sample products (5 for dogs, 5 for cats)
- ✅ 2 promotional coupons

### 6. Open Prisma Studio (Optional)

To view and edit your database visually:

```bash
npm run prisma:studio
```

This will open a browser at http://localhost:5555

## Database Schema Overview

### Core Models

- **User**: Customer and admin accounts
- **Category**: Product categories with hierarchical support
- **Product**: Product catalog with variants
- **ProductVariant**: Size/color variations
- **Order**: Customer orders with status tracking
- **OrderItem**: Individual items in an order
- **Payment**: Payment transactions (SSL Commerce)
- **Review**: Product reviews and ratings
- **CartItem**: Shopping cart items
- **Wishlist**: Saved products
- **Address**: Shipping addresses
- **Coupon**: Discount coupons

## Useful Commands

```bash
# Generate Prisma Client after schema changes
npm run prisma:generate

# Create a new migration
npm run prisma:migrate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Open Prisma Studio
npm run prisma:studio

# Format Prisma schema
npx prisma format
```

## Troubleshooting

### Connection Error

If you get a connection error:
1. Make sure PostgreSQL is running
2. Check your DATABASE_URL in .env.local
3. Verify your PostgreSQL password
4. Ensure the database exists

### Migration Error

If migrations fail:
1. Try resetting: `npx prisma migrate reset`
2. Delete the `prisma/migrations` folder
3. Run `npm run prisma:migrate` again

## Next Steps

After setting up the database:
1. Run the development server: `npm run dev`
2. Access the app at http://localhost:3000
3. Login as admin: admin@pettoys.com / admin123
