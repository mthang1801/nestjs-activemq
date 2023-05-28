import { ActiveMQBody, QUEUE_PATTERN, TOPIC_PATTERN } from '@app/activemq';
import { Controller, Get } from '@nestjs/common';
import { EventPattern, MessagePattern } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { BillsService } from './bills.service';

@Controller()
export class BillsController {
	constructor(private readonly billsService: BillsService) {}

	@Get()
	getHello(): string {
		return this.billsService.getHello();
	}

	@EventPattern(QUEUE_PATTERN.ORDER_CREATED)
	handleMessage(@ActiveMQBody() payload): Observable<any> {
		console.log(18, payload);
		return payload.map((a) => a * 2);
		// console.log(24, body);
		// throw new RpcException(new BadGatewayException('error'));
		// throw new RpcException(new NotFoundException('Product was not found!'));
		// console.log(22, body);
		// return this.ordersService.handleMessage(payload);
	}

	@MessagePattern(TOPIC_PATTERN.DEVELOPER)
	handleTopicDeveloper(@ActiveMQBody() payload) {
		console.log(payload);
	}
}
