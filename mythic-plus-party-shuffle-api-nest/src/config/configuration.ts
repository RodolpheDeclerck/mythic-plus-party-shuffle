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