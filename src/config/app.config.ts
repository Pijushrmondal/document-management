export interface AppConfig {
  port: number;
  nodeEnv: string;
  corsOrigin: string;
}

export interface DatabaseConfig {
  uri: string;
  testUri: string;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export interface Config {
  app: AppConfig;
  database: DatabaseConfig;
  jwt: JwtConfig;
}

export default (): Config => ({
  app: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || '*',
  },
  database: {
    uri: process.env.MONGODB_URI || '',
    testUri: process.env.MONGODB_TEST_URI || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRATION || '24h',
  },
});
