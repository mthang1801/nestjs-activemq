import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
	imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: './.env' }), ScheduleModule.forRoot()],
	controllers: [OrdersController],
	providers: [OrdersService]
})
export class OrdersModule {}
