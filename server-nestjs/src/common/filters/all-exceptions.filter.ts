import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) { }

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(request),
      message: (exception as any)?.response?.message || (exception as any)?.message || 'Internal server error',
    };

    // LOG THE ERROR FOR THE DEVELOPER
    if (httpStatus === HttpStatus.UNAUTHORIZED || httpStatus === HttpStatus.FORBIDDEN || httpStatus === HttpStatus.NOT_FOUND) {
      console.warn(`⚠️ [AllExceptionsFilter] ${httpStatus} - ${request.method} ${request.url} - ${request.headers['user-agent']}`);
    } else {
      console.error(`🚨 [AllExceptionsFilter] ERROR EXCEPTION DETECTED:`);
      console.error(`   - Path: ${request.method} ${request.url}`);
      console.error(`   - User-Agent: ${request.headers['user-agent']}`);
      console.error(`   - Origin: ${request.headers['origin'] || 'N/A'}`);
      console.error(`   - Status: ${httpStatus}`);
      console.error(`   - Body Sent:`, JSON.stringify(request.body, null, 2));
      console.error(`   - Error Message:`, responseBody.message);

      if (exception instanceof Error) {
        console.error(`   - Stack Trace:`, exception.stack);
      } else {
        console.error(`   - Full Exception Object:`, exception);
      }
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
