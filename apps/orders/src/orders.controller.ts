import { QUEUE_PATTERN } from '@app/activemq';
import { BadRequestException, Controller, Get } from '@nestjs/common';
import { Ctx, MessagePattern, Payload,  } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  getHello(): string {
    return this.ordersService.getHello();
  }

  @MessagePattern(QUEUE_PATTERN.FRONTEND_QUEUE)
  handleMessage(@Payload() payload , @Ctx() context ) {
    throw new BadRequestException("error")
    return this.ordersService.handleMessage(payload)
   
    
  }

//   @MessagePattern("CONSUMER_HELLO_WORLD")
//   handleTopicMessage(@Payload() payload, @Ctx() ctx : any ){
//     console.log(16, payload)
//     // console.log(ctx)
//     // console.log(17,payload)
//   }
  

//   @MessagePattern("CONSUMER_QUEUE_HELLO_WORLD")
//   handleAMessage(@Payload() payload, @Ctx() ctx : any ){
//     console.log(29, payload)
//     // console.log(ctx)
//     // console.log(17,payload)
//   }
}
