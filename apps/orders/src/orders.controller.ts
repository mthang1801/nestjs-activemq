import { ActiveMQBody, QUEUE_PATTERN } from '@app/activemq';
import { RpcExceptionFilter } from '@app/activemq/filter/activemq-exception.filter';
import { ActiveMQInterceptor } from '@app/activemq/interceptors/activemq.interceptor';
import { BadGatewayException, Body, Controller, Post, UseFilters, UseInterceptors } from '@nestjs/common';
import { MessagePattern, RpcException } from '@nestjs/microservices';
import { Order } from './entity/order.entity';
import { OrdersService } from './orders.service';
@Controller()
export class OrdersController {
	constructor(private readonly ordersService: OrdersService) {}

	@Post()
	@UseInterceptors(ActiveMQInterceptor)
	getHello(@Body() data): string {
		console.log(data);
		return this.ordersService.getHello();
	}

	// @MessagePattern(QUEUE_PATTERN.FRONTEND_QUEUE)
	// handleMessage(@Payload() payload, @Ctx() context) {
	// 	throw new BadRequestException('error');
	// }

	@MessagePattern(QUEUE_PATTERN.BACKEND_QUEUE)
	@UseFilters(RpcExceptionFilter)
	handleMessage(@ActiveMQBody() body: Order) {
		// console.log(24, body);
		// throw new RpcException(new BadGatewayException('error'));
		// throw new RpcException(new NotFoundException('Product was not found!'));
		// console.log(22, body);
		// return this.ordersService.handleMessage(payload);
	}

	//   @MessagePattern("CONSUMER_QUEUE_HELLO_WORLD")
	//   handleAMessage(@Payload() payload, @Ctx() ctx : any ){
	//     console.log(29, payload)
	//     // console.log(ctx)
	//     // console.log(17,payload)
	//   }

	// @MessagePattern(TOPIC_PATTERN.DEVELOPER)
	// handleTopicAMessage(@Payload() payload) {
	// 	console.log(35, payload);
	// 	return this.ordersService.handleTopicAMessage(payload);
	// }
}
