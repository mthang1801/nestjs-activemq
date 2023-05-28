import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, ReadPacket, WritePacket } from '@nestjs/microservices';
import * as stompit from 'stompit';
import { ActiveMQBase } from '../base/activemq-base';
import { TimerService } from '../timer';
import { ConfigOptions } from '../types/config-options';

@Injectable()
export class ActiveMQClient extends ClientProxy {
	private readonly logger = new Logger(ActiveMQClient.name);
	private client: any = null;
	channel: stompit.Channel | null = null;
	private manager: stompit.ConnectFailover | null = null;
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
			this.client;
			this.client = this.createClient();
			const createRes: any = await Promise.race([
				this.createClient(),
				new Promise((resolve) => setTimeout(resolve, 5000, false))
			]);
			if (!createRes) {
				return this.logger.warn('Connect Timeout');
			}
			this.client.startAt = Date.now();
			this.healthCheck();
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
			const fvTimer = TimerService.start();
			let startClient: any = await this.start();
			const fvDuration = TimerService.duration(fvTimer, `Client ActiveMQ`);

			if (fvDuration < 10000) return startClient;
			this.close();

			startClient = await this.start();
			return startClient;
		} catch (err) {
			Logger.error(err.message, 'Client ActiveMQ Connect');
			throw new BadRequestException(err.message, err.status);
		}
	}

	// start() {
	// 	// eslint-disable-next-line no-async-promise-executor
	// 	return new Promise(async (resolve, reject) => {
	// 		try {
	// 			if (!this.isError && this.client) {
	// 				Logger.log('Start ActiveMQ Client', 'Client ActiveMQ');
	// 				return resolve(this.client);
	// 			}

	// 			Logger.log('Start Func', 'Client ActiveMQ');

	// 			const createRes: any = await Promise.race([
	// 				this.createClient(),
	// 				new Promise((resolve) => setTimeout(resolve, 5000, false))
	// 			]);

	// 			if (!createRes) {
	// 				Logger.warn('Connect Timeout', 'Client ActiveMQ');
	// 				return;
	// 			}

	// 			Logger.log('Create Client', 'Client ActiveMQ');

	// 			this.client.start_at = Date.now();

	// 			clearInterval(this.heartBeatInvertal);
	// 			this.heartBeatInvertal = setInterval(() => {
	// 				if (this.countReconnect > 0) return;
	// 				this.heartBeat();
	// 			}, 30000);

	// 			resolve(this.client);
	// 		} catch (err) {
	// 			Logger.error(err.message, 'Client ActiveMQ Connect');
	// 		}
	// 	});
	// }

	createClient() {
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
					TimerService.sendToTelegram(`ActiveMQ Send createClient`);
					await this.createClient();

					this.client.send(sendHeaders, JSON.stringify(packet.data), () => {
						if (callback) {
							callback({ response: packet });
						}
						this.countReconnect = 0;
					});
				})();
			}

			return () => Logger.log('teardown', 'Client ActiveMQ');
		} catch (err) {
			Logger.error(err, '', 'ActiveMQ Send Error');
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
