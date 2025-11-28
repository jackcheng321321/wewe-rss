import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TrpcService } from '@server/trpc/trpc.service';

@Injectable()
export class LoginQrService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(private readonly trpcService: TrpcService) {}

  @Cron(process.env.LOGIN_QR_CRON_EXPRESSION || '0 9 * * *', {
    name: 'generateLoginQr',
    timeZone: 'Asia/Shanghai',
  })
  async handleGenerateLoginQrCron() {
    this.logger.debug('Called handleGenerateLoginQrCron');
    try {
      await this.trpcService.createLoginUrl();
    } catch (err) {
      this.logger.error('handleGenerateLoginQrCron error', err);
    }
  }
}
