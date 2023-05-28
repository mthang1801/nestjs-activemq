import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BillsController } from './bills.controller';
import { BillsService } from './bills.service';

@Module({
	imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: ['./.env'] })],
	controllers: [BillsController],
	providers: [BillsService]
})
export class BillsModule {}
