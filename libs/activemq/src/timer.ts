// import { TeleChats } from '@eco-consumer/constant';
// import { osHostname } from '@eco-consumer/fvtype';
import { Logger } from '@nestjs/common';
import moment from 'moment-timezone';
// import TelegramBot from 'node-telegram-bot-api';

export class TimerService {
	static bot;
	static start(name = '') {
		name && Logger.log(`[${name}]`, 'B');
		return process.hrtime();
	}

	// eslint-disable-next-line consistent-return
	static duration(start, name = 'Benchmark', over = 5000): number {
		try {
			const diff = process.hrtime(start);
			const time = (diff[0] * 1e9 + diff[1]) * 1e-6;
			const durationMS = +time.toFixed(time >= 10 ? 0 : 1);
			name !== 'Client ActiveMQ' && Logger.log(`[${name}] [Duration ${durationMS}]`, 'E');
			if (durationMS >= over) {
				Logger.error(`${name} take ${durationMS}`);
				this.sendToTelegram(`${name} take ${durationMS}`);
			}
			return durationMS;
		} catch (err) {
			Logger.error(err.message, '', 'Timer Duration Err');
		}
	}

	static sendToTelegram(content, chatid = null) {
		try {
			//   this.connectBot();
			//   if (!this.bot || !this.bot.sendMessage) return;
			//   this.bot.sendMessage(chatid, `${osHostname} ${content}`);
		} catch (err) {
			Logger.error(err.message, '', 'Timer sendToTelegram Err');
		}
	}

	static connectBot(): any {
		try {
			const token = process.env.TELEGRAM_BOT_TOKEN || '1751223605:AAFs6QBJzn7oK12ZZammSVP5bIMXllea-dk';
			if (!token) this.bot = null;

			//   this.bot = new TelegramBot(token, {
			//     polling: false
			//   });

			this.bot.on('polling_error', (err) => {
				Logger.error(err.message, '', 'Timer Service polling_error');
			});
			this.bot.on('webhook_error', (err) => {
				Logger.error(err.message, '', 'Timer Service webhook_error');
			});
		} catch (err) {
			Logger.error(err.message, '', 'Timer sendToTelegram Err');
		}
	}

	static today() {
		return moment().tz(process.env.TZ || 'Asia/Ho_Chi_Minh');
	}
}
