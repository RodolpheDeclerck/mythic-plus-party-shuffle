import { Module } from '@nestjs/common';
import { MetadataController, ClassesController } from './metadata.controller';

@Module({
  controllers: [MetadataController, ClassesController],
})
export class MetadataModule {}