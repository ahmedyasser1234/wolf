import { Controller, Get, Post, Req } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('debug/headers')
  debugHeaders(@Req() req: any) {
    return {
      headers: req.headers,
      cookies: req.cookies,
      env: process.env.NODE_ENV,
    };
  }

  @Post()
  apiSink(@Req() req: any) {
    console.log(`[APISink] Received POST to root:`, {
      userAgent: req.headers['user-agent'],
      body: req.body,
    });
    return { success: true, message: 'Request received' };
  }
}

