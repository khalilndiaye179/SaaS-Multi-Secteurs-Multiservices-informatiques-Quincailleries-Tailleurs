import { Module } from '@nestjs/common';
import { AboutService } from './about.service';
import { AboutController } from './about.controller';

@Module({
  providers: [AboutService],
  controllers: [AboutController],
  exports: [AboutService],
})
export class AboutModule {}
