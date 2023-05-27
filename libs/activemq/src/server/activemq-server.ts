import { BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CustomTransportStrategy, Server, Transport } from '@nestjs/microservices';
import * as stompit from 'stompit';
import { ActiveMQBase } from '../base/activemq-base';
import { ActiveMQClient } from '../clients/activemq-client';
import { QUEUE_PATTERN } from '../patterns/queue.pattern';
import { ConfigOptions } from '../types/config-options';

export class ActiveMQServer extends Server implements CustomTransportStrategy {
	channel: stompit.Channel | null = null;
	manager: stompit.ConnectFailover = null;
	activeMQBase: ActiveMQBase | null = null;
	queuePatternArr: Array<string> = Object.values(QUEUE_PATTERN);
	heartBeatInvertal = null;
	configOptions: ConfigOptions;
	private Nack = false; // Allow Negative Acknownledge

	constructor(readonly configService: ConfigService, Nack = false) {
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
		this.Nack = Nack;
	}
	transportId?: symbol | Transport;

	/**
	 * This method is triggered when you run "app.listen()".
	 */
	listen(callback: () => void) {
		this.start(callback);
	}

	async start(callback: () => void): Promise<void> {
		if (this.channel) {
			callback();
			return;
		}

		const createRes: any = await this.createClient();

		console.log(createRes);

		this.channel = createRes.channel;

		this.activeMQBase = new ActiveMQBase(this.channel, this.Nack);

		const events = this.messageHandlers.keys();
		let event = events.next();

		while (event.value) {
			const eventValue = event.value.toUpperCase();

			Logger.verbose(this.queuePatternArr, 'ActiveMQ Server');
			Logger.verbose(eventValue, 'ActiveMQ Server');

			const destinationPattern = this.queuePatternArr.includes(eventValue)
				? `/queue/${eventValue}`
				: `/topic/${eventValue}`;

			this.activeMQBase.subscribe(destinationPattern, this.getHandlerByPattern(event.value));
			event = events.next();
		}

		clearInterval(this.heartBeatInvertal);
		this.heartBeatInvertal = setInterval(() => {
			this.heartBeat();
		}, 30000);
		callback();
	}

	createClient(): Promise<any> {
		// eslint-disable-next-line no-async-promise-executor
		return new Promise(async (resolve, reject) => {
			try {
				await this.createManager();

				if (this.channel) {
					return resolve(this.channel);
				}

				const channel = new stompit.Channel(this.manager);
				resolve({ channel });
			} catch (err) {
				reject(err);
			}
		});
	}

	async createManager(): Promise<stompit.ConnectFailover> {
		try {
			if (!this.manager) this.manager = ActiveMQBase.getManager();
			if (this.manager) return this.manager;

			const connectOptions = (await this.getConfig()) as any;

			this.manager = new stompit.ConnectFailover([connectOptions]);

			ActiveMQBase.setManager(this.manager);
			Logger.log('New Manager', 'ActiveMQ Server');
			return this.manager;
		} catch (err) {
			Logger.error(err && err.message, '', 'Create Manager');
			throw new BadRequestException(err.message, err.status);
		}
	}

	getConfig(): Promise<ConfigOptions> {
		return new Promise((resolve, reject) => {
			try {
				resolve(this.configOptions);
			} catch (error) {
				reject(error);
			}
		});
	}

	/**
	 * This method is triggered on application shutdown.
	 */
	close() {
		try {
			if (this.channel) {
				this.channel.close(null);
				this.channel = null;
				Logger.warn('Close', 'Server ActiveMQ');
			}
		} catch (err) {
			Logger.error(err && err.message, 'Close', 'Server ActiveMQ');
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
			Logger.log('Ping', 'ActiveMQ Server');
		} catch (err) {
			Logger.error(err && err.message, 'Heart Beat', 'Server ActiveMQ');
		}
	}

	enqueue(destination: string, body: any) {
		const queue = new ActiveMQClient(this.configService);
		queue.publish({ pattern: destination, data: body });
	}
}
