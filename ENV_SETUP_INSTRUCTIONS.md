# MongoDB Atlas Setup - Environment Configuration

## Your MongoDB Connection String

```
mongodb+srv://Outlaw:Out1@w131177@pettoysdb.txh9lgj.mongodb.net/pet_toys_db?retryWrites=true&w=majority
```

## Create `.env.local` File

Since `.env.local` is blocked by gitignore, you need to create it manually:

1. **Create file**: `e:\Personal Project\petToysWebsite\.env.local`

2. **Copy this content**:

```env
DATABASE_URL=mongodb+srv://Outlaw:Out1@w131177@pettoysdb.txh9lgj.mongodb.net/pet_toys_db?retryWrites=true&w=majority
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-change-this-to-random-string
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
CLAUDE_API_KEY=
SSLCOMMERZ_STORE_ID=
SSLCOMMERZ_STORE_PASSWORD=
SSLCOMMERZ_IS_LIVE=false
EMAIL_FROM=noreply@pettoys.com
SENDGRID_API_KEY=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-south-1
AWS_S3_BUCKET=pet-toys-images
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Pet Toys Bangladesh
SHIPPING_COST_DHAKA=60
SHIPPING_COST_OUTSIDE_DHAKA=120
TAX_RATE=0.15
```

3. **Save the file**

## After Creating `.env.local`

Run these commands:

```bash
# Push database schema to MongoDB
npx prisma db push

# Seed database with sample data
npm run prisma:seed
```

This will:
- Create all collections in MongoDB
- Add admin user, categories, products, and coupons
