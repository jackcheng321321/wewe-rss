import { Controller, Get, Response, Render, Param } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';
import { ConfigurationType } from './configuration';
import { Response as Res } from 'express';
import { TrpcService } from './trpc/trpc.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
    private readonly trpcService: TrpcService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/robots.txt')
  forRobot(): string {
    return 'User-agent:  *\nDisallow:  /';
  }

  @Get('favicon.ico')
  getFavicon(@Response() res: Res) {
    const { originUrl } =
      this.configService.get<ConfigurationType['feed']>('feed')!;
    const iconUrl = originUrl
      ? `${originUrl}/favicon.ico`
      : 'https://r2-assets.111965.xyz/wewe-rss.png';
    res.redirect(iconUrl);
  }

  @Get('/qr/:id')
  qrPage(@Param('id') id: string, @Response() res: Res) {
    const scanUrl = this.trpcService.getLoginScanUrl(id);
    if (!scanUrl) {
      res.status(404).send('二维码已过期或不存在');
      return;
    }
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>扫码登录</title></head><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif"><div style="text-align:center"><img alt="qr" width="220" height="220" src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
      scanUrl,
    )}"><div style="margin-top:12px;color:#666">微信扫码登录（60s）</div></div></body></html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }

  @Get('/dash*')
  @Render('index.hbs')
  dashRender() {
    const { originUrl: weweRssServerOriginUrl } =
      this.configService.get<ConfigurationType['feed']>('feed')!;
    const { code } = this.configService.get<ConfigurationType['auth']>('auth')!;

    return {
      weweRssServerOriginUrl,
      enabledAuthCode: !!code,
      iconUrl: weweRssServerOriginUrl
        ? `${weweRssServerOriginUrl}/favicon.ico`
        : 'https://r2-assets.111965.xyz/wewe-rss.png',
    };
  }
}
