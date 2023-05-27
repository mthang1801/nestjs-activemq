
import { Logger } from '@nestjs/common';
import { CustomTransportStrategy, Server } from '@nestjs/microservices';
import * as stompit from 'stompit';
import { ActiveMQBase } from './activemq-base';
import {
    QUEUE_PATTERN
} from './patterns/queue.pattern';

export class ActiveMQPubSubServer
  extends Server
  implements CustomTransportStrategy {
  server = null;
  channel = null;
  manager = null;
  activeMQBase: any = {};
  queuePatternArr: Array<string> = Object.values(QUEUE_PATTERN);
  heartBeatInvertal = null;

  constructor() {
    super();
    
  }

  /**
   * This method is triggered when you run "app.listen()".
   */
  listen(callback: () => void) {
    this.start(callback);
  }

  async start(callback: () => void) {
    if (this.channel && this.channel._client != null && !this.channel._closed) {
      callback();
      return;
    }

    Logger.log('start', 'ActiveMQ Server');
    const createRes: any = await this.createClient();

    this.channel = createRes.channel;

    this.activeMQBase = new ActiveMQBase(this.channel);

    const events = this.messageHandlers.keys();
    let event = events.next();

    while (event.value) {
      const eventValue = event.value.toUpperCase();
     
      Logger.verbose(this.queuePatternArr, "ActiveMQ Server")
      Logger.verbose(eventValue, "ActiveMQ Server")
      
      const destinationPattern =
        this.queuePatternArr.includes(eventValue) 
          ? `/queue/${eventValue}`
          : `/topic/${eventValue}`;
          console.log("eventValue::",eventValue)
         console.log("destinationPattern::", destinationPattern)
      this.activeMQBase.subscribe(
        destinationPattern,
        this.getHandlerByPattern(event.value)
      );
      event = events.next();
    }

    clearInterval(this.heartBeatInvertal);
    this.heartBeatInvertal = setInterval(() => {
      this.heartBeat();
    }, 30000);
    callback();
  }

  createClient() {
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

  async createManager() {
    try {
      if (!this.manager) this.manager = ActiveMQBase.getManager();
      if (this.manager) return this.manager;

      const connectOptions = await this.getConfig() as any;

      this.manager = new stompit.ConnectFailover([connectOptions]);
      ActiveMQBase.setManager(this.manager);
      Logger.log('New Manager', 'ActiveMQ Server');
      return this.manager;
    } catch (err) {
      Logger.error(err && err.message, '', 'Create Manager');
    }
  }

  getConfig()  {
    return new Promise((resolve, reject) => {
      try {
        resolve({
          host: "localhost",
          port: 61613,
          connectHeaders: {
            host: "/",
            login: "admin",
            passcode: "admin",
            'heart-beat': "5000,5000"
          }
        });
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
        this.channel.close();
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
        Logger.log("Ping", "ActiveMQ Server")
    } catch (err) {
      Logger.error(err && err.message, 'Heart Beat', 'Server ActiveMQ');
    }
  }
}
