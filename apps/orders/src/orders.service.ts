import { QUEUE_DESTINATION, TOPIC_DESTINATION } from '@app/activemq';
import { ActiveMQClient } from '@app/activemq/clients/activemq-client';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Order } from './entity/order.entity';

@Injectable()
export class OrdersService {
	private readonly logger = new Logger(OrdersService.name);

	constructor(readonly configService: ConfigService, private readonly activeMQClient: ActiveMQClient) {}

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

		this.activeMQClient.send(QUEUE_DESTINATION.ORDER_CREATED_DESTINATION, [1, 2, 3, 4, 5]).subscribe((res) => {
			console.log(29, res);
		});

		this.activeMQClient.publish({
			pattern: TOPIC_DESTINATION.DEVELOPER,
			data: {
				event: `message ${Date.now()}`,
				data: 'hello',
				type: 'topic'
			}
		});

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
