import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, ReadPacket, WritePacket } from '@nestjs/microservices';
import * as stompit from 'stompit';
import { ActiveMQBase } from '../base/activemq-base';
import {
  CONNECT_FAILED_ACTIVEMQ_MESSAGE,
  CONNECT_FAILED_EVENT,
  DISCONNECTED_ACTIVEMQ_MESSAGE,
  DISCONNECT_EVENT,
  ERROR_ACTIVEMQ_MESSAGE,
  ERROR_EVENT
} from '../constants/constants';
import { TimerService } from '../timer';
import { ConfigOptions } from '../types/config-options';

@Injectable()
export class ActiveMQClient extends ClientProxy {
	protected readonly logger = new Logger(ActiveMQClient.name);
	protected client: any = null;
	channel: stompit.Channel | null = null;
	protected manager: stompit.ConnectFailover | null = null;
	public activeMQBase: ActiveMQBase = null;
	protected connection: Promise<any>;
	maxReconnect = 5;
	countReconnect = 0;
	isError = false;
	timeoutQueue = null;
	heartBeatInvertal = null;
	configOptions: ConfigOptions;

	constructor(readonly configService: ConfigService) {
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
	}

	public async start(): Promise<any> {
		if (!this.isError && this.client) return;
		try {
			const response: any = await Promise.race([
				this.createClient(),
				new Promise((resolve) => setTimeout(resolve, 5000, false))
			]);
			if (!response) {
				return this.logger.warn('Connect Timeout');
			}
			this.healthCheck();
			this.handleActiveMQEvents();
			return this.client;
		} catch (error) {
			this.logger.error(error && error.message);
		}
	}

	healthCheck() {
		clearInterval(this.heartBeatInvertal);
		this.heartBeatInvertal = setInterval(() => {
			this.heartBeat();
		}, 30000);
	}

	public async connect(): Promise<any> {
		try {
			const timer = TimerService.start();
			const client: any = await this.start();
			const duration = TimerService.duration(timer, `Client ActiveMQ`);

			if (duration < 10000) return client;
			this.close();

			return await this.start();
		} catch (err) {
			Logger.error(err.message, 'Client ActiveMQ Connect');
			throw new BadRequestException(err.message, err.status);
		}
	}

	async createClient(): Promise<{ client: stompit.Channel; channel: stompit.Channel }> {
		// eslint-disable-next-line no-async-promise-executor
		return new Promise(async (resolve, reject) => {
			try {
				await this.createManager();
				const channel = ActiveMQBase.getSyncChannel();
				this.client = channel;
				resolve({ client: channel, channel });
			} catch (err) {
				Logger.error(err.message, 'Client ActiveMQ createClient');
				reject(err);
			}
		});
	}

	async createManager() {
		try {
			if (!this.manager) this.manager = ActiveMQBase.getManager();
			if (this.manager) return this.manager;

			const connectOptions = (await this.getConfig()) as any;
			this.manager = new stompit.ConnectFailover([connectOptions]);
			ActiveMQBase.setManager(this.manager);
			Logger.log('New Manager', 'Client ActiveMQ');
			return this.manager;
		} catch (err) {
			Logger.error(err && err.message, '', 'Client Create Manager');
			throw new BadRequestException(err.message, err.status);
		}
	}

	async close() {
		try {
			if (this.client) {
				this.client && this.client.disconnect && this.client.disconnect();
				this.client && this.client.close && this.client.close();
				this.client = null;
				Logger.log('CLOSE', 'Client ActiveMQ');
			}
		} catch (err) {
			Logger.error(err && err.message, 'CLOSE', 'Client ActiveMQ');
		}
	}

	async dispatchEvent(packet: ReadPacket<any>): Promise<any> {
		return Logger.log(packet, 'Client ActiveMQ Dispatch');
	}

	publish(packet: ReadPacket<any>, callback?: (packet: WritePacket<any>) => void): () => void {
		try {
			const sendHeaders = {
				destination: packet.pattern,
				'content-type': 'text/plain'
			};

			if (this.client && this.client.send && !this.client._destroyed) {
				this.client.send(sendHeaders, JSON.stringify(packet.data), () => {
					if (callback) {
						callback({ response: packet });
					}
					this.countReconnect = 0;
				});
			} else {
				(async () => {
					this.countReconnect++;
					if (this.countReconnect > 1) return;
					await this.createClient();

					this.client.send(sendHeaders, JSON.stringify(packet.data), () => {
						if (callback) {
							callback({ response: packet });
						}
						this.countReconnect = 0;
					});
				})();
			}

			return () => this.logger.log('teardown');
		} catch (err) {
			this.logger.error(err && err.message);
		}
	}

	getConfig() {
		return new Promise((resolve, reject) => {
			try {
				resolve(this.configOptions);
			} catch (error) {
				reject(error);
			}
		});
	}

	handleActiveMQEvents() {
		this.client.on(CONNECT_FAILED_EVENT, (err) => {
			this.logger.error(CONNECT_FAILED_ACTIVEMQ_MESSAGE);
			this.logger.error(err);
		});
		this.client.on(DISCONNECT_EVENT, (err) => {
			this.logger.error(DISCONNECTED_ACTIVEMQ_MESSAGE);
			this.logger.error(err);
			this.close();
		});
		this.client.on(ERROR_EVENT, (err) => {
			this.logger.error(ERROR_ACTIVEMQ_MESSAGE);
			this.logger.error(err);
		});
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
			Logger.log('ActiveMQ Server Connected');
		} catch (err) {
			//   TimerService.sendToTelegram(`ActiveMQ Send Heart Beat ${err.message}`);
			Logger.error(err && err.message, 'Heart Beat', 'Server ActiveMQ');
		}
	}

	ack(message: stompit.Client.Message) {
		return ActiveMQBase.getSyncChannel().ack(message);
	}
}
