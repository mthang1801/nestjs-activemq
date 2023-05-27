import { QUEUE_DESTINATION } from '@app/activemq';
import { ActiveMQClient } from '@app/activemq/clients/activemq-client';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Timeout } from '@nestjs/schedule';
import { Order } from './entity/order.entity';

@Injectable()
export class OrdersService {
	private readonly logger = new Logger(OrdersService.name);
	private queue: ActiveMQClient | null = null;

	constructor(private readonly configService: ConfigService) {
		this.queue = new ActiveMQClient(configService);
	}

	@Timeout(Date.now().toString(), 500)
	getHello(): string {
		this.logger.log('Publish message');
		const order: Order = {
			orderDate: new Date(),
			customerId: 1,
			customerName: 'Alan',
			customerPhone: '0123456789',
			id: 5
		};
		// this.queue.publish({ pattern: QUEUE_DESTINATION.FRONTEND_DESTINATION, data: order });
		// 	.subscribe(() => console.log('pke'));

		this.queue.publish({
			pattern: QUEUE_DESTINATION.BACKEND_DESTINATION,
			data: {
				event: `message ${Date.now()}`,
				data: 'hello backend',
				type: 'queue'
			}
		});

		// this.queue.publish({
		// 	pattern: TOPIC_DESTINATION.DEVELOPER,
		// 	data: {
		// 		event: `message ${Date.now()}`,
		// 		data: 'hello',
		// 		type: 'topic'
		// 	}
		// });

		return 'Hello World!';
	}

	handleMessage(payload: any) {
		console.log(payload);
	}

	handleTopicAMessage(payload) {
		console.log(payload);
		// this.queue.ack(payload.message);
	}
}
