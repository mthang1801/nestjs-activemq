import { DynamicModule, Module } from '@nestjs/common';

@Module({})
export class ActiveMQClientModule {
	static register(options): DynamicModule {
		return {
			module: ActiveMQClientModule,
			imports: [],
			exports: []
		};
	}
}
