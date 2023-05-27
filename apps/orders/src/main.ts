import { ActiveMQServer } from '@app/activemq/server/activemq-server';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { CustomStrategy } from '@nestjs/microservices';
import { OrdersModule } from './orders.module';

async function bootstrap() {
	const app = await NestFactory.create(OrdersModule);
	const configService = app.get<ConfigService>(ConfigService);
	const activeMQServer = new ActiveMQServer(configService, true);
	app.connectMicroservice<CustomStrategy>({ strategy: activeMQServer });
	await app.startAllMicroservices();
	await app.listen(3000);
}
bootstrap();
