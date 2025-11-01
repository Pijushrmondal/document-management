import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_GUARD } from '@nestjs/core';
import { configuration, getDatabaseConfig } from './config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { TagsModule } from './modules/tags/tags.module';
import { DocumentsModule } from './modules/documents/documents.module';

@Module({
  imports: [
    // Configuration - Load environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
      cache: true,
      expandVariables: true,
    }),

    // Database - MongoDB with Mongoose
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),

    // Feature modules
    AuthModule,
    UsersModule,
    TagsModule,
    DocumentsModule,
  ],
  providers: [
    // Global guards - Applied to all routes by default
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
