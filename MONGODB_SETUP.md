# MongoDB Setup Guide

## Option 1: MongoDB Atlas (Cloud - Recommended for Development)

MongoDB Atlas is a free cloud database service - perfect for development and testing.

### Step 1: Create MongoDB Atlas Account

1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Sign up with your email or Google account
3. Choose the **FREE** tier (M0 Sandbox)

### Step 2: Create a Cluster

1. After signing in, click **"Build a Database"**
2. Choose **FREE** tier (M0)
3. Select a cloud provider and region closest to you (e.g., AWS - Mumbai for Bangladesh)
4. Cluster Name: `pet-toys-cluster` (or any name)
5. Click **"Create"**

### Step 3: Create Database User

1. In the Security section, click **"Database Access"**
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Username: `pettoysadmin` (or any username)
5. Password: Create a strong password (save it!)
6. User Privileges: **"Read and write to any database"**
7. Click **"Add User"**

### Step 4: Whitelist IP Address

1. Go to **"Network Access"** in Security section
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (for development)
   - Or add your current IP address
4. Click **"Confirm"**

### Step 5: Get Connection String

1. Go back to **"Database"** (Deployment section)
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Driver: **Node.js**, Version: **5.5 or later**
5. Copy the connection string:
   ```
   mongodb+srv://pettoysadmin:<password>@pet-toys-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with your actual password
7. Add database name before the `?`:
   ```
   mongodb+srv://pettoysadmin:yourpassword@pet-toys-cluster.xxxxx.mongodb.net/pet_toys_db?retryWrites=true&w=majority
   ```

### Step 6: Configure Your Project

Create `.env.local` file in project root:

```env
DATABASE_URL="mongodb+srv://pettoysadmin:yourpassword@pet-toys-cluster.xxxxx.mongodb.net/pet_toys_db?retryWrites=true&w=majority"
```

**Important**: Replace with your actual connection string!

---

## Option 2: Local MongoDB Installation

If you prefer to run MongoDB locally on your Windows machine:

### Step 1: Download MongoDB

1. Go to: https://www.mongodb.com/try/download/community
2. Select:
   - Version: Latest (7.0.x)
   - Platform: Windows
   - Package: MSI
3. Download the installer

### Step 2: Install MongoDB

1. Run the `.msi` installer
2. Choose **"Complete"** installation
3. Install as a **Windows Service** (recommended)
4. Install **MongoDB Compass** (GUI tool)
5. Click **"Install"**

### Step 3: Verify Installation

Open Command Prompt or PowerShell:

```bash
mongod --version
```

You should see the MongoDB version.

### Step 4: Configure Your Project

Create `.env.local` file:

```env
DATABASE_URL="mongodb://localhost:27017/pet_toys_db"
```

---

## Next Steps (After MongoDB Setup)

### 1. Generate Prisma Client

```bash
npx prisma generate
```

### 2. Push Database Schema

For MongoDB, we use `db push` instead of migrations:

```bash
npx prisma db push
```

This creates all collections in your MongoDB database.

### 3. Seed the Database

```bash
npm run prisma:seed
```

This creates:
- ✅ Admin user (email: admin@pettoys.com, password: admin123)
- ✅ 5 categories (Dogs, Cats, Birds, Small Animals, Exotic)
- ✅ 10 sample products
- ✅ 2 promotional coupons

### 4. View Your Data

**MongoDB Atlas:**
- Use the Atlas web interface
- Or run: `npx prisma studio`

**Local MongoDB:**
- Open MongoDB Compass
- Connect to: `mongodb://localhost:27017`
- Or run: `npx prisma studio`

---

## Troubleshooting

### Connection Error (Atlas)

1. Check your connection string is correct
2. Verify IP address is whitelisted
3. Ensure password doesn't contain special characters (or URL encode them)
4. Check database user has correct permissions

### Connection Error (Local)

1. Ensure MongoDB service is running:
   - Open Services (Win + R, type `services.msc`)
   - Find "MongoDB Server" and ensure it's running
2. Check port 27017 is not blocked

### Prisma Generate Error

```bash
npm install @prisma/client
npx prisma generate
```

---

## MongoDB Atlas Free Tier Limits

- ✅ 512 MB storage (plenty for development)
- ✅ Shared RAM
- ✅ No credit card required
- ✅ Never expires
- ✅ Perfect for development and small projects

---

## Why MongoDB for This Project?

✅ **Flexible Schema**: Perfect for products with varying attributes  
✅ **Easy Setup**: MongoDB Atlas is free and takes 5 minutes  
✅ **No Migrations**: Use `db push` for quick schema changes  
✅ **JSON-Native**: Great for storing product images, attributes  
✅ **Scalable**: Easy to upgrade when you need more resources  
✅ **Great for Bangladesh**: Low latency with Mumbai region  

---

## Quick Commands Reference

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed database
npm run prisma:seed

# Open Prisma Studio (database GUI)
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma db push --force-reset
```

---

## Next Steps

After MongoDB setup is complete:
1. Run `npx prisma generate`
2. Run `npx prisma db push`
3. Run `npm run prisma:seed`
4. Test authentication at http://localhost:3000/auth/signin
5. Ready to build product catalog! 🚀
