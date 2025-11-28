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
    const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>扫码登录</title></head><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif"><div style="text-align:center"><img alt="qr" width="220" height="220" src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
      scanUrl,
    )}"><div style="margin-top:12px;color:#666"><span>微信扫码登录 </span><span id="countdown">(60s)</span></div><div style="margin-top:16px"><button onclick="location.href='/qr'" style="padding:6px 12px;border:1px solid #ccc;border-radius:6px;cursor:pointer">刷新二维码</button></div></div><script>var t=60;var el=document.getElementById('countdown');var timer=setInterval(function(){t--;if(t<=0){clearInterval(timer);el.innerText='(已过期)';}else{el.innerText='('+t+'s)';}},1000);var uuid='${id}';var poll=setInterval(function(){fetch('/qr/status/'+uuid).then(function(r){return r.json()}).then(function(j){if(j.status==='success'){clearInterval(timer);clearInterval(poll);el.innerText='(登录成功)';}else if(j.status==='expired'){el.innerText='(已过期)';}}).catch(function(){})},2000);</script></body></html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }

  @Get('/qr')
  async qrNew(@Response() res: Res) {
    const data = await this.trpcService.createLoginUrl();
    if (!data?.scanUrl || !data?.uuid) {
      res.status(500).send('生成二维码失败');
      return;
    }
    const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>扫码登录</title></head><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif"><div style="text-align:center"><img alt="qr" width="220" height="220" src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
      data.scanUrl,
    )}"><div style="margin-top:12px;color:#666"><span>微信扫码登录 </span><span id="countdown">(60s)</span></div><div style="margin-top:16px"><button onclick="location.href='/qr'" style="padding:6px 12px;border:1px solid #ccc;border-radius:6px;cursor:pointer">刷新二维码</button></div></div><script>var t=60;var el=document.getElementById('countdown');var timer=setInterval(function(){t--;if(t<=0){clearInterval(timer);el.innerText='(已过期)';}else{el.innerText='('+t+'s)';}},1000);var uuid='${data.uuid}';var poll=setInterval(function(){fetch('/qr/status/'+uuid).then(function(r){return r.json()}).then(function(j){if(j.status==='success'){clearInterval(timer);clearInterval(poll);el.innerText='(登录成功)';}else if(j.status==='expired'){el.innerText='(已过期)';}}).catch(function(){})},2000);</script></body></html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }

  @Get('/qr/status/:id')
  async qrStatus(@Param('id') id: string, @Response() res: Res) {
    try {
      const data = await this.trpcService.getLoginResult(id);
      if (data.vid && data.token) {
        await this.trpcService.addAccountDirect(String(data.vid), data.token!, data.username!);
        this.trpcService.refreshAllMpArticlesAndUpdateFeed().catch(() => {});
        res.json({ status: 'success', vid: data.vid, username: data.username });
        return;
      }
      res.json({ status: data.message || 'waiting' });
    } catch (e: any) {
      res.json({ status: 'error', message: e?.message || 'unknown' });
    }
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
