import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ObjectsModule } from './objects/objects.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/heyama-exam'),
    ObjectsModule,
  ],
})
export class AppModule {}
