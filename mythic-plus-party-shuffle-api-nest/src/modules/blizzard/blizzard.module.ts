import { Module } from '@nestjs/common';
import { TokenVaultService } from './token-vault.service';
import { BlizzardService } from './blizzard.service';
import { BlizzardController } from './blizzard.controller';

@Module({
  controllers: [BlizzardController],
  providers: [TokenVaultService, BlizzardService],
  exports: [TokenVaultService, BlizzardService],
})
export class BlizzardModule {}
