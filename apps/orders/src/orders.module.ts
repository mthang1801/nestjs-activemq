import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
