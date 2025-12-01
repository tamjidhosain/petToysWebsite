import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
    const url = process.env.DATABASE_URL;
    console.log('DB: Connecting to', url ? url.replace(/:[^:@]*@/, ':****@') : 'undefined');
    return new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
};

declare global {
    var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
