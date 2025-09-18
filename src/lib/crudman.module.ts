import { Module } from '@nestjs/common';
import { CrudmanService } from './crudman.service';

@Module({
  providers: [CrudmanService],
  exports: [CrudmanService],
})
export class CrudmanModule {}
