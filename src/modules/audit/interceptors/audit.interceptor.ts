import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../audit.service';
import { Request, Response } from 'express';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const startTime = Date.now();
    const { method, path, ip, headers } = request;
    const user = (request as any).user;

    return next.handle().pipe(
      tap({
        next: () => {
          // Only log if user is authenticated
          if (user && user.sub) {
            const duration = Date.now() - startTime;

            // Determine action based on method and path
            const action = this.getActionFromRequest(method, path);

            if (action) {
              this.auditService
                .log({
                  userId: user.sub,
                  action,
                  entityType: this.getEntityType(path),
                  metadata: {
                    method,
                    path,
                  },
                  ipAddress: ip,
                  userAgent: headers['user-agent'],
                  method,
                  path,
                  statusCode: response.statusCode,
                  duration,
                })
                .catch((error) => {
                  console.error('Audit logging failed:', error);
                });
            }
          }
        },
        error: (error) => {
          // Log errors as well
          if (user && user.sub) {
            const duration = Date.now() - startTime;
            const action = this.getActionFromRequest(method, path);

            if (action) {
              this.auditService
                .log({
                  userId: user.sub,
                  action,
                  entityType: this.getEntityType(path),
                  metadata: {
                    method,
                    path,
                    error: error.message,
                  },
                  ipAddress: ip,
                  userAgent: headers['user-agent'],
                  method,
                  path,
                  statusCode: error.status || 500,
                  duration,
                })
                .catch((err) => {
                  console.error('Audit logging failed:', err);
                });
            }
          }
        },
      }),
    );
  }

  private getActionFromRequest(method: string, path: string): any {
    // Documents
    if (path.includes('/docs')) {
      if (method === 'POST') return 'document.upload';
      if (method === 'GET' && path.includes('/download'))
        return 'document.download';
      if (method === 'GET') return 'document.view';
      if (method === 'DELETE') return 'document.delete';
    }

    // Tags
    if (path.includes('/tags')) {
      if (method === 'POST') return 'tag.create';
      if (method === 'DELETE') return 'tag.delete';
    }

    // Actions
    if (path.includes('/actions/run')) {
      return 'action.run';
    }

    // Webhooks
    if (path.includes('/webhooks')) {
      return 'webhook.received';
    }

    return null;
  }

  private getEntityType(path: string): any {
    if (path.includes('/docs')) return 'document';
    if (path.includes('/tags')) return 'tag';
    if (path.includes('/actions')) return 'action';
    if (path.includes('/webhooks')) return 'webhook';
    if (path.includes('/tasks')) return 'task';
    return 'unknown';
  }
}
