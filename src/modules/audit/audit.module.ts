import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuditRepository } from './audit.repository';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import {
  AuditLog,
  AuditLogSchema,
} from 'src/database/schemas/audit-log.schema';

@Global() // Make AuditService available globally
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  controllers: [AuditController],
  providers: [AuditService, AuditRepository, AuditInterceptor],
  exports: [AuditService, AuditInterceptor],
})
export class AuditModule {}
