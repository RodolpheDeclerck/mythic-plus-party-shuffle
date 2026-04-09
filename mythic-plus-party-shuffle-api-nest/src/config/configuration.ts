export default () => ({
    // Configuration du serveur
    port: parseInt(process.env.PORT, 10) || 8080,
    nodeEnv: process.env.NODE_ENV || 'development',
    
    // Configuration de la base de données PostgreSQL
    database: {
      type: 'postgres' as const,
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
    },
    
    // Configuration Redis
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    },

    // Rate limiting (auth): fixed windows via Redis. Login also rate-limited per email.
    rateLimit: {
      login: {
        limit: parseInt(process.env.AUTH_LOGIN_RL_LIMIT || '10', 10),
        windowSec: parseInt(process.env.AUTH_LOGIN_RL_WINDOW_SEC || '900', 10),
        perEmail: {
          limit: parseInt(process.env.AUTH_LOGIN_EMAIL_RL_LIMIT || '5', 10),
          windowSec: parseInt(process.env.AUTH_LOGIN_EMAIL_RL_WINDOW_SEC || '900', 10),
        },
      },
      register: {
        limit: parseInt(process.env.AUTH_REGISTER_RL_LIMIT || '5', 10),
        windowSec: parseInt(process.env.AUTH_REGISTER_RL_WINDOW_SEC || '3600', 10),
      },
    },

    // Password policy
    passwordPolicy: {
      hibpCheck: process.env.AUTH_HIBP_CHECK === 'true',
      hibpTimeoutMs: parseInt(process.env.AUTH_HIBP_TIMEOUT_MS || '2000', 10),
    },
    
    // Configuration JWT
    jwt: {
      secret: process.env.JWT_SECRET || 'yourSecretKey',
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    },
    
    // Configuration CORS
    cors: {
      origin: process.env.CORS_ORIGIN,
    },
    
    // Configuration du domaine (pour les cookies)
    domain: process.env.DOMAIN,
  });