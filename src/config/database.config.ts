import { ConfigService } from '@nestjs/config';
import { MongooseModuleOptions } from '@nestjs/mongoose';

export const getDatabaseConfig = (
  configService: ConfigService,
): MongooseModuleOptions => {
  const isTest = configService.get<string>('app.nodeEnv') === 'test';
  const uri = isTest
    ? configService.get<string>('database.testUri')
    : configService.get<string>('database.uri');

  return {
    uri,
    retryAttempts: 3,
    retryDelay: 1000,
    connectionFactory: (connection) => {
      connection.on('connected', () => {
        console.log('✅ MongoDB connected successfully');
        console.log(`📦 Database: ${uri}`);
      });

      connection.on('error', (error) => {
        console.error('❌ MongoDB connection error:', error);
      });

      connection.on('disconnected', () => {
        console.log('⚠️  MongoDB disconnected');
      });

      return connection;
    },
  };
};
