import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';
import { ActiveMQServer } from '../server/activemq-server';

@Catch(RpcException)
export class RpcExceptionFilter implements ExceptionFilter {
	protected queue: ActiveMQServer | null = null;
	constructor(readonly configService: ConfigService) {
		this.queue = new ActiveMQServer(configService, true);
	}
	catch(exception: RpcException, host: ArgumentsHost): Observable<any> {
		const context = host.switchToRpc();
		const data = context.getData();

		return throwError(() => exception.getError());
	}

	enqueue(data) {
		if (data?.message?.headers?.destination && data?.body) {
			this.queue.enqueue(data.message.headers.destination, data.body);
		}
	}
}
