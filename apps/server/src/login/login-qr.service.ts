import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TrpcService } from '@server/trpc/trpc.service';

const RAW_LOGIN_QR_CRON = process.env.LOGIN_QR_CRON_EXPRESSION || '0 9 * * *';
const LOGIN_QR_CRON = RAW_LOGIN_QR_CRON.trim().replace(/^['"]|['"]$/g, '');

@Injectable()
export class LoginQrService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(private readonly trpcService: TrpcService) {
    this.logger.log(`Login QR cron expression: ${LOGIN_QR_CRON}`);
  }

  @Cron(LOGIN_QR_CRON, {
    name: 'generateLoginQr',
    timeZone: 'Asia/Shanghai',
  })
  async handleGenerateLoginQrCron() {
    this.logger.log('handleGenerateLoginQrCron triggered');
    try {
      await this.trpcService.sendFeishuQrLink();
    } catch (err) {
      this.logger.error('handleGenerateLoginQrCron error', err);
    }
  }
}
