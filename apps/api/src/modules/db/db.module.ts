/* eslint-disable prettier/prettier */
import { Global, Module } from '@nestjs/common';
import { db } from './client';

@Global()
@Module({
  providers: [
    { provide: 'DB', useValue: db }
  ],
  exports: ['DB']
})
export class DbModule {}