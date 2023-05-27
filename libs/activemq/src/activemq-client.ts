import { Logger } from '@nestjs/common';
import { ClientProxy, ReadPacket, WritePacket } from '@nestjs/microservices';
import * as stompit from 'stompit';
import { ActiveMQBase } from './activemq-base';
import { TimerService } from './timer';

export class ActiveMQPubSubClient extends ClientProxy {
  client = null;
  channel = null;
  manager = null;
  environment: any = {};
  activeMQBase: any = {};
  maxReconnect = 5;
  countReconnect = 0;
  isError = false;
  timeoutQueue = null;
  heartBeatInvertal = null;

  constructor(environment?) {
    super();
    this.environment = environment || {};
  }

  async connect(): Promise<any> {
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
    }
  }

  start() {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      try {
        if (!this.isError && this.client) {
          Logger.log('Start ActiveMQ Client', 'Client ActiveMQ');
          return resolve(this.client);
        }

        Logger.log('Start Func', 'Client ActiveMQ');

        const createRes: any = await Promise.race([
          this.createClient(),
          new Promise((resolve) => setTimeout(resolve, 5000, false)),
        ]);

        if (!createRes) {
          Logger.warn('Connect Timeout', 'Client ActiveMQ');
          return;
        }

        Logger.log('Create Client', 'Client ActiveMQ');

        this.client.start_at = Date.now();

        clearInterval(this.heartBeatInvertal);
        this.heartBeatInvertal = setInterval(() => {
          if (this.countReconnect > 0) return;
          this.heartBeat();
        }, 30000);

        resolve(this.client);
      } catch (err) {
        Logger.error(err.message, 'Client ActiveMQ Connect');
      }
    });
  }

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

      const connectOptions = await this.getConfig() as any;
      this.manager = new stompit.ConnectFailover([connectOptions]);
      ActiveMQBase.setManager(this.manager);
      Logger.log('New Manager', 'Client ActiveMQ');
      return this.manager;
    } catch (err) {
      Logger.error(err && err.message, '', 'Client Create Manager');
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

  publish(
    packet: ReadPacket<any>,
    callback: (packet: WritePacket<any>) => void,
  ): () => void {
    try {
      const sendHeaders = {
        destination: packet.pattern,
        'content-type': 'text/plain',
      };
        console.log("sendHeaders::", sendHeaders)
      if (this.client && this.client.send && !this.client._destroyed) {                    
        this.client.send(sendHeaders, JSON.stringify(packet.data), () => {    
          callback({ response: packet });
          this.countReconnect = 0;
        });
      } else {
        (async () => {
          this.countReconnect++;
          if (this.countReconnect > 1) return;
          TimerService.sendToTelegram(`ActiveMQ Send createClient`);
          await this.createClient();

          this.client.send(sendHeaders, JSON.stringify(packet.data), () => {
            callback({ response: packet });
            this.countReconnect = 0;
          });
        })();
      }

      // callback({ response: packet });
      // clearTimeout(this.timeoutQueue);
      // this.timeoutQueue = setTimeout(() => {
      // Logger.log('TIMEOUT CLOSE', 'Client ActiveMQ');
      // this.close();
      // }, 5 * 60 * 1000);

      return () => Logger.log('teardown', 'Client ActiveMQ');
    } catch (err) {
      Logger.error(err, '', 'ActiveMQ Send Error');
    }
  }

  getConfig() {
    return new Promise((resolve, reject) => {
      try {
        resolve({
          host: 'localhost',
          port: 61613,
          connectHeaders: {
            host: '/',
            login: 'admin',
            passcode: 'admin',
            'heart-beat': '5000,5000',
          },
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  handleControl(data) {
    // if (!data || !Object.keys(data).length) return;
    // if (data.cmd === 'ENABLE_DEBUG') {
    //   ActiveMQBase.enableDebugHandler();
    // }
    // if (data.cmd === 'DISABLE_DEBUG') {
    //   ActiveMQBase.disableDebugHandler();
    // }
    // if (data.cmd === 'DEBUG_STATUS') {
    //   ActiveMQBase.getDebugStatus();
    // }
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
}
