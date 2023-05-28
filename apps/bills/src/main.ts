import { ActiveMQServer } from '@app/activemq';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { CustomStrategy } from '@nestjs/microservices';
import { BillsModule } from './bills.module';

async function bootstrap() {
	const app = await NestFactory.create(BillsModule);
	const configService = app.get<ConfigService>(ConfigService);
	const activeMQServer = new ActiveMQServer(configService, true);
	app.connectMicroservice<CustomStrategy>({ strategy: activeMQServer });
	await app.startAllMicroservices();
}
bootstrap();
