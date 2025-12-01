# Pet Toys E-Commerce Platform

A modern, production-ready e-commerce platform for pet toys built with Next.js 14+, TypeScript, MongoDB, and Tailwind CSS.

## 🚀 Tech Stack

- **Frontend**: Next.js 14+ (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB with Prisma ORM
- **Authentication**: NextAuth.js v5
- **Payment**: SSL Commerce (Bangladesh)
- **AI**: Claude API for recommendations
- **Email**: SendGrid/Brevo
- **Storage**: AWS S3

## 📦 Features

- 🛍️ Product catalog with advanced search and filtering
- 🛒 Shopping cart and checkout flow
- 💳 SSL Commerce payment integration
- 👤 User authentication and profile management
- ⭐ Product reviews and ratings
- 🤖 AI-powered product recommendations
- 📧 Transactional email notifications
- 📊 Admin dashboard with analytics
- 📱 Fully responsive design
- 🔒 Production-grade security

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB database (Atlas or local)
- SSL Commerce account (for payments)
- Claude API key (for AI features)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your environment variables in `.env.local`

4. Set up the database:
   ```bash
   npx prisma db push
   npm run prisma:seed
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## 📝 Available Scripts
├── components/       # React components
├── lib/             # Utilities and helpers
├── types/           # TypeScript type definitions
├── middleware/      # Authentication and logging
├── services/        # Business logic and external APIs
├── hooks/           # Custom React hooks
└── styles/          # Global styles
```

## 🔐 Environment Variables

See `.env.example` for all required environment variables.

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.
