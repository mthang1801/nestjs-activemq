import { createParamDecorator } from '@nestjs/common';
import type { TActiveMQContext } from '../types/activemq-context.type';
import type { TActiveMQMessage } from '../types/activemq-message.type';
import type { TActiveMQPayload } from '../types/activemq-payload.type';

export const ActiveMQPayload = createParamDecorator((_: unknown, context: TActiveMQContext): TActiveMQPayload => {
	return context.getArgs()[0];
});

export const ActiveMQBody = createParamDecorator((_: unknown, context: TActiveMQContext) => {
	return context.getArgs()[0]?.body;
});

export const ActiveMQMessage = createParamDecorator((_: unknown, context: TActiveMQContext): TActiveMQMessage => {
	return context.getArgs()[0]?.message;
});

export const ActiveMQContext = createParamDecorator((_: unknown, context: TActiveMQContext): TActiveMQContext => {
	return context;
});
