/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// api/src/objects/s3.service.ts
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3Service implements OnModuleInit {
  private readonly logger = new Logger(S3Service.name);
  private s3: AWS.S3;
  private readonly bucketName = 'heyama-objects';

  constructor() {
    this.s3 = new AWS.S3({
      endpoint: 'http://localhost:9000',
      accessKeyId: 'minioadmin',
      secretAccessKey: 'minioadmin',
      s3ForcePathStyle: true,
      signatureVersion: 'v4',
    });
  }

  async onModuleInit(): Promise<void> {
    await this.ensureBucketExists();
  }

  private async ensureBucketExists(): Promise<void> {
    try {
      await this.s3.headBucket({ Bucket: this.bucketName }).promise();
      this.logger.log(`Bucket ${this.bucketName} already exists`);
    } catch (error: any) {
      if (error.code === 'NotFound') {
        try {
          await this.s3
            .createBucket({
              Bucket: this.bucketName,
            })
            .promise();
          this.logger.log(`Bucket ${this.bucketName} created successfully`);
        } catch (createError: any) {
          this.logger.error('Error creating bucket:', createError);
        }
      } else {
        this.logger.error('Error checking bucket:', error);
      }
    }
  }

  async uploadFile(
    file: Express.Multer.File,
  ): Promise<{ url: string; key: string }> {
    const key = `objects/${uuidv4()}-${file.originalname}`;

    this.logger.log(`Uploading file: ${key}, size: ${file.size} bytes`);

    const params: AWS.S3.PutObjectRequest = {
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    try {
      await this.s3.upload(params).promise();
      const url = `http://localhost:9000/${this.bucketName}/${key}`;

      this.logger.log(`File uploaded successfully: ${url}`);
      return { url, key };
    } catch (error: any) {
      this.logger.error('Error uploading file:', error);
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const params: AWS.S3.DeleteObjectRequest = {
        Bucket: this.bucketName,
        Key: key,
      };

      await this.s3.deleteObject(params).promise();
      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error: any) {
      this.logger.error('Error deleting file:', error);
      throw new Error(`Failed to delete file from S3: ${error.message}`);
    }
  }
}
