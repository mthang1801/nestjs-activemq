import { NestFactory } from '@nestjs/core';
import { BillsModule } from './bills.module';

async function bootstrap() {
  const app = await NestFactory.create(BillsModule);
  await app.listen(3000);
}
bootstrap();
