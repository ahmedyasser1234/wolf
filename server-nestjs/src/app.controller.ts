import { Controller, Get, Req } from '@nestjs/common';
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
}

