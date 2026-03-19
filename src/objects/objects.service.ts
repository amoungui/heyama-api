import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HeyamaObject } from './schemas/object.schema';
import { S3Service } from './s3.service';

@Injectable()
export class ObjectsService {
  constructor(
    @InjectModel(HeyamaObject.name) private objectModel: Model<HeyamaObject>,
    private s3Service: S3Service,
  ) {}

  async create(data: {
    title: string;
    description: string;
    file: Express.Multer.File;
  }) {
    const { url, key } = await this.s3Service.uploadFile(data.file);
    const object = new this.objectModel({
      title: data.title,
      description: data.description,
      imageUrl: url,
      imageKey: key,
    });
    return object.save();
  }

  async findAll() {
    return this.objectModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string) {
    const object = await this.objectModel.findById(id).exec();
    if (!object) throw new NotFoundException('Object not found');
    return object;
  }

  async remove(id: string) {
    const object = await this.findOne(id);
    if (object.imageKey) await this.s3Service.deleteFile(object.imageKey);
    await this.objectModel.findByIdAndDelete(id).exec();
  }
}
