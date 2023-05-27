import { NestFactory } from '@nestjs/core';
import { OrdersModule } from './orders.module';
import { CustomStrategy } from '@nestjs/microservices';
import { ActiveMQPubSubServer } from '@app/activemq/activemq';

async function bootstrap() {
  const app = await NestFactory.create(OrdersModule);
  const activeMQServer = new ActiveMQPubSubServer();
  app.connectMicroservice<CustomStrategy>({strategy : activeMQServer})
  await app.startAllMicroservices()
  await app.listen(3000);
}
bootstrap();
