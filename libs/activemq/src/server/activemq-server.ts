import { BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CustomTransportStrategy, Server, Transport } from '@nestjs/microservices';
import * as stompit from 'stompit';
import { ActiveMQBase } from '../base/activemq-base';
import { ActiveMQClient } from '../clients/activemq-client';
import {
  CONNECT_EVENT,
  CONNECT_FAILED_ACTIVEMQ_MESSAGE,
  CONNECT_FAILED_EVENT,
  DISCONNECTED_ACTIVEMQ_MESSAGE,
  DISCONNECT_EVENT,
  ERROR_ACTIVEMQ_MESSAGE,
  ERROR_EVENT
} from '../constants/constants';
import { QUEUE_PATTERN } from '../patterns/queue.pattern';
import { ConfigOptions } from '../types/config-options';

export class ActiveMQServer extends Server implements CustomTransportStrategy {
	protected readonly logger = new Logger(ActiveMQBase.name);
	server: stompit.Client | null = null;
	channel: stompit.Channel | null = null;
	manager: stompit.ConnectFailover = null;
	activeMQBase: ActiveMQBase | null = null;
	queuePatternArr: Array<string> = Object.values(QUEUE_PATTERN);
	heartBeatInvertal = null;
	configOptions: ConfigOptions;
	private noAck = false; // Allow Negative Acknownledge

	constructor(readonly configService: ConfigService, noAck = false) {
		super();
		this.configOptions = {
			host: configService.get<string>('ACTIVEMQ_HOST'),
			port: Number(configService.get<number>('ACTIVEMQ_PORT')),
			connectHeaders: {
				host: configService.get<string>('ACTIVEMQ_CONNECT_HEADER_HOST'),
				login: configService.get<string>('ACTIVEMQ_CONNECT_HEADER_LOGIN'),
				passcode: configService.get<string>('ACTIVEMQ_CONNECT_HEADER_PASSCODE'),
				'heart-beat': configService.get<string>('ACTIVEMQ_CONNECT_HEADER_HEARTBEAT')
			}
		};
		this.noAck = noAck;
	}
	transportId?: symbol | Transport;

	/**
	 * This method is triggered when you run "app.listen()".
	 */
	listen(callback: () => void) {
		this.start(callback);
	}

	public async start(cb: () => void) {
		this.server = this.createClient();
		this.server.on(CONNECT_EVENT, async () => {
			if (this.channel) return cb();
			this.channel = await this.createChannel();
			this.activeMQBase = new ActiveMQBase(this.channel, this.noAck);
			this.subscribeEvents();
			this.healthCheck();
			cb();
		});
		this.handleActiveMQEvents();
	}

	createClient(): stompit.Client {
		return stompit.connect(this.configOptions);
	}

	subscribeEvents() {
		const events = this.messageHandlers.keys();
		let event = events.next();
		while (event.value) {
			const eventValue = event.value.toUpperCase();
			const destinationPattern = this.queuePatternArr.includes(eventValue)
				? `/queue/${eventValue}`
				: `/topic/${eventValue}`;

			this.activeMQBase.subscribe(destinationPattern, this.getHandlerByPattern(event.value));
			event = events.next();
		}
	}

	healthCheck() {
		clearInterval(this.heartBeatInvertal);
		this.heartBeatInvertal = setInterval(() => {
			this.heartBeat();
		}, 30000);
	}

	handleActiveMQEvents() {
		this.server.on(CONNECT_FAILED_EVENT, (err) => {
			this.logger.error(CONNECT_FAILED_ACTIVEMQ_MESSAGE);
			this.logger.error(err);
		});
		this.server.on(DISCONNECT_EVENT, (err) => {
			this.logger.error(DISCONNECTED_ACTIVEMQ_MESSAGE);
			this.logger.error(err);
			this.close();
		});
		this.server.on(ERROR_EVENT, (err) => {
			this.logger.error(ERROR_ACTIVEMQ_MESSAGE);
			this.logger.error(err);
		});
	}

	private async createChannel(): Promise<stompit.Channel> {
		// eslint-disable-next-line no-async-promise-executor
		return new Promise(async (resolve, reject) => {
			try {
				await this.createManager();

				if (this.channel) {
					return resolve(this.channel);
				}

				const channel = new stompit.Channel(this.manager);
				resolve(channel);
			} catch (err) {
				reject(err);
			}
		});
	}

	async createManager(): Promise<stompit.ConnectFailover> {
		try {
			if (!this.manager) this.manager = ActiveMQBase.getManager();
			if (this.manager) return this.manager;

			this.manager = new stompit.ConnectFailover([this.configOptions]);
			ActiveMQBase.setManager(this.manager);
			return this.manager;
		} catch (err) {
			this.logger.error(err && err.message, '', 'Create Manager');
			throw new BadRequestException(err.message, err.status);
		}
	}

	/**
	 * This method is triggered on application shutdown.
	 */
	close() {
		try {
			if (this.channel) {
				this.channel.close(null);
				this.channel = null;
				this.logger.warn('Close');
			}
		} catch (err) {
			this.logger.error(err && err.message);
		}
	}

	handleControl(data) {
		if (!data || !Object.keys(data).length) return;

		if (data.cmd === 'ENABLE_DEBUG') {
			ActiveMQBase.enableDebugHandler();
		}

		if (data.cmd === 'DISABLE_DEBUG') {
			ActiveMQBase.disableDebugHandler();
		}

		if (data.cmd === 'DEBUG_STATUS') {
			ActiveMQBase.getDebugStatus();
		}
	}

	heartBeat() {
		try {
			//   this.publish(
			//     {
			//       pattern: MOBILE_TOPIC_DESTINATION.CONSUMER_SERVICE_CONTROL,
			//       data: { HEART_BEAT_START_TIME: Date.now() }
			//     },
			//     () => {
			//       // Heartbeat Callback
			//     }
			//   );
			// this.logger.log('Ping');
		} catch (err) {
			this.logger.error(err && err.message, 'Heart Beat', 'Server ActiveMQ');
		}
	}

	enqueue(destination: string, body: any) {
		const queue = new ActiveMQClient(this.configService);
		queue.publish({ pattern: destination, data: body });
	}
}
