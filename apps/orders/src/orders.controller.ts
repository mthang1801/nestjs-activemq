import { Body, Controller, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';
@Controller()
export class OrdersController {
	constructor(private readonly ordersService: OrdersService) {}

	@Post()
	getHello(@Body() data): string {
		console.log(data);
		return this.ordersService.getHello();
	}

	// @MessagePattern(QUEUE_PATTERN.FRONTEND_QUEUE)
	// handleMessage(@Payload() payload, @Ctx() context) {
	// 	throw new BadRequestException('error');
	// }

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
