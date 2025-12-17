import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('endpoint1')
  getThreeDays(): Promise<any> {
    return this.appService.getThreeDays();
  }

  @Get('endpoint2')
  getOptimalCharge(@Query('hours') hours: number): Promise<any> {
    return this.appService.getOptimalCharge(hours);
  }
}
