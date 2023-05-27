import { Logger } from '@nestjs/common';
import { Channel } from 'stompit';

export class ActiveMQBase {
    private channel: Channel | null = null;
    static syncChannel: Channel | null = null;
    static client: any = {};
    static manager = null;
    static enableDebug: boolean;

    constructor(channel) {
        this.channel = channel;
        ActiveMQBase.syncChannel = channel;
    }

    subscribe(destination : string, callback: any) {
        try {
            Logger.log(destination, 'Server ActiveMQ Subscribe');
            this.channel.subscribe(
                {
                    destination,
                    ack : "client-individual"
                },
                (err, message) => {
                   
                    if (err) {
                        Logger.error(err.message, '', 'Server ActiveMQ Subscribe');
                        return;
                    }
                    try {
                      
                        message.readString(
                            'utf-8',
                            this.synchronisedHandler(async (error, body) => {

                                if (error) {
                                    Logger.error(error.message, 'Server ActiveMQ Read String');
                                    return;
                                }
                                Logger.log({body}, "[25] Server ActiveMQ Subscribe")

                                const jsonData = JSON.parse(body);                                

                                callback(jsonData);
                                // this.channel.ack(message);
                            }),
                        );
                    } catch (readErr) {
                        Logger.error(readErr.message, 'Server ActiveMQ Read String');
                    }
                },
            );
        } catch (err) {
          
            Logger.error(err.message, '', 'ActiveMQ Subscribe Error');
        }
    }

    synchronisedHandler(callback) {
        try {
            let processing = false;
            let nextMessage = null;

            const next = function () {
                if (nextMessage === null) {
                    processing = false;
                    return;
                }

                const currentMessage = nextMessage;

                nextMessage = null;

                callback.apply(null, ...currentMessage);
            };

            return function (error, message) {
                if (processing) {
                    nextMessage = [error, message, next];
                    return;
                }

                processing = true;

                callback(error, message, next);
            };

        } catch (err) {
            Logger.error(err.message, 'ActiveMQ SyncronisedHander Error');
        }
    }

    static enableDebugHandler() {
        ActiveMQBase.enableDebug = true;
        Logger.log(ActiveMQBase.enableDebug, 'Enable Debug ActiveMQ');
    }

    static disableDebugHandler() {
        ActiveMQBase.enableDebug = false;
        Logger.log(ActiveMQBase.enableDebug, 'Disable Debug ActiveMQ');
    }

    static getDebugStatus() {
        Logger.log(ActiveMQBase.enableDebug, 'Logger Debug ActiveMQ');
    }

    static setManager(manager) {
        this.manager = manager;
    }

    static getManager() {
        return this.manager;
    }

    static setSyncChannel(channel) {
        this.syncChannel = channel;
    }

    static getSyncChannel() {
        return this.syncChannel;
    }
}
