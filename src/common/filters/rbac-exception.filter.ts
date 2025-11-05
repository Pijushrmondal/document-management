import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { Permissions } from '../utils/permissions.util';
import { UserRole } from '../enum/user-role.enum';

@Catch(HttpException)
export class RbacExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Check if this is a read-only role error
    const user = request.user;
    const isReadOnlyError =
      status === HttpStatus.FORBIDDEN &&
      user &&
      Permissions.isReadOnly(user.role as UserRole);

    // Format error response
    let errorResponse: any;

    if (typeof exceptionResponse === 'string') {
      errorResponse = {
        error: 'Forbidden',
        message: exceptionResponse,
      };
    } else if (typeof exceptionResponse === 'object') {
      errorResponse = {
        error: (exceptionResponse as any).error || 'Error',
        message:
          (exceptionResponse as any).message ||
          exception.message ||
          'An error occurred',
      };
    } else {
      errorResponse = {
        error: 'Error',
        message: exception.message || 'An error occurred',
      };
    }

    // Add readOnly flag for read-only role errors
    if (isReadOnlyError) {
      errorResponse.readOnly = true;
    }

    response.status(status).json(errorResponse);
  }
}
