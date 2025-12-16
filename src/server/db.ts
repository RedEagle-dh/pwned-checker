import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { env } from "~/env";
import { PrismaClient } from "../../generated/prisma";

const createPrismaClient = () => {
	const connectionString = process.env.DATABASE_URL;
	if (!connectionString) {
		throw new Error("DATABASE_URL environment variable is not set");
	}

	const pool = new Pool({
		connectionString,
		// Pool size - adjust based on expected concurrent load
		max: Number(process.env.DATABASE_POOL_SIZE) || 20,
		// Minimum connections to keep open
		min: Number(process.env.DATABASE_POOL_MIN) || 2,
		// Connection timeout in ms
		connectionTimeoutMillis: 10000,
		// Idle timeout - close connections after 30 seconds of inactivity
		idleTimeoutMillis: 30000,
		// Allow connections to exit on idle when below min
		allowExitOnIdle: true,
	});

	globalForPrisma.pool = pool;

	const adapter = new PrismaPg(pool);

	return new PrismaClient({
		adapter,
		log:
			env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
	});
};

const globalForPrisma = globalThis as unknown as {
	prisma: ReturnType<typeof createPrismaClient> | undefined;
	pool: Pool | undefined;
};

const getDb = () => {
	if (!globalForPrisma.prisma) {
		globalForPrisma.prisma = createPrismaClient();
	}
	return globalForPrisma.prisma;
};

export const db = new Proxy({} as PrismaClient, {
	get(_, prop) {
		const client = getDb();
		const value = client[prop as keyof PrismaClient];
		return typeof value === "function" ? value.bind(client) : value;
	},
});
