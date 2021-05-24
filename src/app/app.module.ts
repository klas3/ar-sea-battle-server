import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import environment from '../other/environment';
import { Game, GameSchema } from '../schemas/game.schema';
import { AppGateway } from './app.gateway';

@Module({
  imports: [
    MongooseModule.forRoot(environment.databaseConnectionString, { useFindAndModify: false }),
    MongooseModule.forFeature([{ name: Game.name, schema: GameSchema }]),
  ],
  controllers: [AppController],
  providers: [AppService, AppGateway],
})
export class AppModule {}
