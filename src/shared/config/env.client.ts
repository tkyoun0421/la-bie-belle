import { parseClientEnv } from "@/shared/model/env";

const isProduction = Boolean(process.env.NEXT_PUBLIC_VERCEL_ENV);

export const env = parseClientEnv(process.env, { isProduction });
