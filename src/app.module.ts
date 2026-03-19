// app.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ObjectsModule } from './objects/objects.module';

@Module({
  imports: [
    // Utilise la variable d'environnement MONGO_URI injectée par Railway
    // Si elle n'existe pas, utilise le nom du service 'mongodb' (réseau interne)
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://mongodb:27017/heyama'),
    ObjectsModule,
  ],
})
export class AppModule {}