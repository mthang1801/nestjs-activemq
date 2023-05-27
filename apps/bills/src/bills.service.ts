import { Injectable } from '@nestjs/common';

@Injectable()
export class BillsService {
  getHello(): string {
    return 'Hello World!';
  }
}
