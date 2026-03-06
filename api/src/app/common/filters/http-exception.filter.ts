import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const exceptionRecord =
      exception && typeof exception === 'object'
        ? (exception as Record<string, unknown>)
        : null;
    const derivedStatus =
      exceptionRecord && typeof exceptionRecord.status === 'number'
        ? exceptionRecord.status
        : exceptionRecord && typeof exceptionRecord.statusCode === 'number'
          ? exceptionRecord.statusCode
          : HttpStatus.INTERNAL_SERVER_ERROR;

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : derivedStatus;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : status === HttpStatus.PAYLOAD_TOO_LARGE
          ? 'Request payload too large'
          : exceptionRecord?.message ?? 'Internal server error';

    this.logger.error(
      `HTTP ${status} ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
      message,
    });
  }
}


