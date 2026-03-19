import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ObjectsController } from './objects.controller';
import { ObjectsService } from './objects.service';
import { S3Service } from './s3.service';
import { ObjectsGateway } from './objects.gateway';
import { HeyamaObject, HeyamaObjectSchema } from './schemas/object.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HeyamaObject.name, schema: HeyamaObjectSchema },
    ]),
  ],
  controllers: [ObjectsController],
  providers: [ObjectsService, S3Service, ObjectsGateway],
})
export class ObjectsModule {}
