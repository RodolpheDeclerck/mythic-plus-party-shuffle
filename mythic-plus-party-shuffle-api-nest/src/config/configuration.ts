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

  // Rate limiting (auth): per-IP fixed window via Redis
  rateLimit: {
    login: {
      limit: parseInt(process.env.AUTH_LOGIN_RL_LIMIT || '10', 10),
      windowSec: parseInt(process.env.AUTH_LOGIN_RL_WINDOW_SEC || '900', 10),
    },
    register: {
      limit: parseInt(process.env.AUTH_REGISTER_RL_LIMIT || '5', 10),
      windowSec: parseInt(
        process.env.AUTH_REGISTER_RL_WINDOW_SEC || '3600',
        10,
      ),
    },
  },

  // OIDC / Auth0 configuration (provider-agnostic)
  auth: {
    issuerBaseUrl: process.env.AUTH_ISSUER_BASE_URL,
    audience: process.env.AUTH_AUDIENCE,
  },

  // Auth0 Token Vault — federated Battle.net access token exchange
  tokenVault: {
    clientId: process.env.TOKEN_VAULT_CLIENT_ID,
    clientSecret: process.env.TOKEN_VAULT_CLIENT_SECRET,
    connection: process.env.TOKEN_VAULT_CONNECTION || 'battlenet',
  },

  // Blizzard Profile API (Retail, US region for now)
  blizzard: {
    region: process.env.BLIZZARD_REGION || 'us',
    apiHost: process.env.BLIZZARD_API_HOST || 'https://us.api.blizzard.com',
    namespace: process.env.BLIZZARD_NAMESPACE || 'profile-us',
    locale: process.env.BLIZZARD_LOCALE || 'en_US',
  },

  // Configuration CORS
  cors: {
    origin: process.env.CORS_ORIGIN,
  },

  // Configuration du domaine (pour les cookies)
  domain: process.env.DOMAIN,
});
