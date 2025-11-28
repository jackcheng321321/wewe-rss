import { Module } from '@nestjs/common';
import { TrpcModule } from '@server/trpc/trpc.module';
import { LoginQrService } from './login-qr.service';

@Module({
  imports: [TrpcModule],
  providers: [LoginQrService],
})
export class LoginQrModule {}
