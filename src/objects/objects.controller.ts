/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// api/src/objects/objects.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ObjectsService } from './objects.service';
import { ObjectsGateway } from './objects.gateway';
import { memoryStorage } from 'multer';

@Controller('objects')
export class ObjectsController {
  private readonly logger = new Logger(ObjectsController.name);

  constructor(
    private readonly objectsService: ObjectsService,
    private readonly objectsGateway: ObjectsGateway,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
      },
      fileFilter: (req, file, cb) => {
        // Vérifier le type MIME
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          cb(new Error('Only image files are allowed!'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async create(
    @Body('title') title: string,
    @Body('description') description: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    this.logger.log('Received request to create object');
    this.logger.debug(`Title: ${title}`);
    this.logger.debug(`Description: ${description}`);
    this.logger.debug(`File: ${file ? file.originalname : 'No file'}`);

    // Vérifications plus détaillées
    if (!title || title.trim() === '') {
      throw new HttpException('Title is required', HttpStatus.BAD_REQUEST);
    }

    if (!description || description.trim() === '') {
      throw new HttpException(
        'Description is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!file) {
      throw new HttpException('Image file is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const object = await this.objectsService.create({
        title: title.trim(),
        description: description.trim(),
        file,
      });

      this.logger.log(`Object created successfully with ID: ${object._id}`);
      this.objectsGateway.notifyObjectCreated(object);

      return object;
    } catch (error) {
      this.logger.error('Error creating object:', error.stack);
      throw new HttpException(
        'Error creating object: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  async findAll() {
    try {
      this.logger.log('Fetching all objects');
      const objects = await this.objectsService.findAll();
      return objects;
    } catch (error) {
      this.logger.error('Error finding objects:', error.stack);
      throw new HttpException(
        'Error finding objects',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      this.logger.log(`Fetching object with ID: ${id}`);
      return await this.objectsService.findOne(id);
    } catch (error) {
      this.logger.error(`Error finding object ${id}:`, error.stack);
      throw new HttpException('Object not found', HttpStatus.NOT_FOUND);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      this.logger.log(`Deleting object with ID: ${id}`);
      await this.objectsService.remove(id);
      this.objectsGateway.notifyObjectDeleted(id);
      return { message: 'Object deleted successfully' };
    } catch (error) {
      this.logger.error(`Error deleting object ${id}:`, error.stack);
      throw new HttpException(
        'Error deleting object',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
