import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class ActiveMQInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		console.log('Before...');

		const now = Date.now();
		return next.handle().pipe(map(() => console.log(`After... ${Date.now() - now}ms`)));
	}
}
