import "server-only";

import { parseServerEnv } from "@/shared/model/env";

const isProduction = Boolean(process.env.VERCEL_ENV);

export const env = parseServerEnv(process.env, { isProduction });
