import { CorsOptions } from 'cors';

const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5000',
];

export const getAllowedOrigins = (): (string | RegExp)[] => {
  const origins: (string | RegExp)[] = [...defaultAllowedOrigins];

  const clientUrlEnv = process.env.CLIENT_URL;
  if (clientUrlEnv) {
    // Support multiple comma-separated URLs if configured
    const envOrigins = clientUrlEnv
      .split(',')
      .map((u) => u.trim().replace(/\/+$/, ''))
      .filter(Boolean);
    origins.push(...envOrigins);
  }

  // Allow any Vercel deployment preview (e.g., https://my-app-git-main.vercel.app)
  origins.push(/^https:\/\/.*\.vercel\.app$/);

  return origins;
};

export const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return true; // Allow non-browser requests (Postman, curl, server-to-server)
  const cleanOrigin = origin.replace(/\/+$/, '');
  const allowed = getAllowedOrigins();

  return allowed.some((item) => {
    if (typeof item === 'string') {
      return item === cleanOrigin;
    }
    if (item instanceof RegExp) {
      return item.test(cleanOrigin);
    }
    return false;
  });
};

export const expressCorsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked Express request from origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

