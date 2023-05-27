import { Test, TestingModule } from '@nestjs/testing';
import { BillsController } from './bills.controller';
import { BillsService } from './bills.service';

describe('BillsController', () => {
  let billsController: BillsController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [BillsController],
      providers: [BillsService],
    }).compile();

    billsController = app.get<BillsController>(BillsController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(billsController.getHello()).toBe('Hello World!');
    });
  });
});
