import { ActiveMQClient } from '@app/activemq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
	imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: './.env' }), ScheduleModule.forRoot()],
	controllers: [OrdersController],
	providers: [OrdersService, ActiveMQClient]
})
export class OrdersModule {}
