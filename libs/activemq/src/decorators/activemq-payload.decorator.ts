import { createParamDecorator } from '@nestjs/common';
import type { TActiveMQContext } from '../types/activemq-context.type';
import type { TActiveMQMessage } from '../types/activemq-message.type';
import type { TActiveMQPayload } from '../types/activemq-payload.type';

export const ActiveMQPayload = createParamDecorator(
	(_: unknown, context: TActiveMQContext): TActiveMQPayload => context.getArgByIndex(0)
);

export const ActiveMQBody = createParamDecorator((key: string, context: TActiveMQContext) =>
	key ? context.getArgByIndex(0)?.body[key] : context.getArgByIndex(0)?.body
);

export const ActiveMQMessage = createParamDecorator(
	(_: unknown, context: TActiveMQContext): TActiveMQMessage => context.getArgByIndex(0)?.message
);

export const ActiveMQContext = createParamDecorator(
	(_: unknown, context: TActiveMQContext): TActiveMQContext => context
);
