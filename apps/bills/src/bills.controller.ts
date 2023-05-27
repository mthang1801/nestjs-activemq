import { Controller, Get } from '@nestjs/common';
import { BillsService } from './bills.service';

@Controller()
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Get()
  getHello(): string {
    return this.billsService.getHello();
  }
}
