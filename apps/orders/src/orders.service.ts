import { QUEUE_DESTINATION, TOPIC_DESTINATION } from '@app/activemq';
import { ActiveMQPubSubClient } from '@app/activemq/activemq-client';
import { Injectable, Logger } from '@nestjs/common';
import { Timeout } from '@nestjs/schedule';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private queue: ActiveMQPubSubClient | null = null;

  constructor() {
    this.queue = new ActiveMQPubSubClient();
  }

  @Timeout(Date.now().toString(), 500)
  getHello(): string {
    this.logger.log('Publish message');    

    // this.queue.send(QUEUE_DESTINATION.FRONTEND_DESTINATION, {
    //   event: `message ${Date.now()}`,
    //   data: 'hello frontend',
    //   type: 'queue',
    // }).subscribe(() => console.log("pke"));

    // this.queue.send(QUEUE_DESTINATION.BACKEND_DESTINATION, {
    //   event: `message ${Date.now()}`,
    //   data: 'hello backend',
    //   type: 'queue',
    // }).subscribe(() => console.log("pke"));

    // this.queue.send(QUEUE_DESTINATION.CONSUMER_HELLO_WORLD, {
    //   event: `message ${Date.now()}`,
    //   data: 'hello',
    //   type: 'queue',
    // });

    return 'Hello World!';
  }

  handleMessage(payload: any){}
}
