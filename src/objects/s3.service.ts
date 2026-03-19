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
  private readonly bucketName = process.env.MINIO_BUCKET || 'heyama-objects';

  constructor() {
    // Railway utilise le nom du service (minio) pour la communication interne
    const endpoint = process.env.MINIO_ENDPOINT || 'http://minio:9000';
    const accessKeyId = process.env.MINIO_ROOT_USER || 'minioadmin';
    const secretAccessKey = process.env.MINIO_ROOT_PASSWORD || 'minioadmin';

    this.s3 = new AWS.S3({
      endpoint: endpoint,
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      s3ForcePathStyle: true, // Requis pour MinIO
      signatureVersion: 'v4',
    });

    this.logger.log(`S3 Service initialized with endpoint: ${endpoint}`);
  }

  async onModuleInit(): Promise<void> {
    // On attend un court instant pour laisser à MinIO le temps de démarrer
    // Cela évite que l'API crash si MinIO met 2 secondes de plus à s'élancer
    setTimeout(async () => {
      await this.ensureBucketExists();
    }, 5000);
  }

  private async ensureBucketExists(): Promise<void> {
    try {
      await this.s3.headBucket({ Bucket: this.bucketName }).promise();
      this.logger.log(`Bucket "${this.bucketName}" already exists`);
    } catch (error: any) {
      if (error.code === 'NotFound' || error.code === 'BadRequest') {
        try {
          await this.s3
            .createBucket({
              Bucket: this.bucketName,
            })
            .promise();
          this.logger.log(`Bucket "${this.bucketName}" created successfully`);
        } catch (createError: any) {
          this.logger.error('Error creating bucket:', createError.message);
        }
      } else {
        this.logger.error('Error checking bucket:', error.message);
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
      
      // En production, l'URL doit pointer vers l'adresse publique de MinIO
      // En local, on garde localhost
      const publicHost = process.env.MINIO_PUBLIC_URL || 'http://localhost:9000';
      const url = `${publicHost}/${this.bucketName}/${key}`;

      this.logger.log(`File uploaded successfully: ${url}`);
      return { url, key };
    } catch (error: any) {
      this.logger.error('Error uploading file:', error.message);
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
      this.logger.error('Error deleting file:', error.message);
      throw new Error(`Failed to delete file from S3: ${error.message}`);
    }
  }
}