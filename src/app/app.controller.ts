import { BadRequestException, Body, Controller, ForbiddenException, Post } from '@nestjs/common';
import { GameDocument } from '../schemas/game.schema';
import { AppService } from './app.service';
import { AppGateway } from './app.gateway';

@Controller('/')
export class AppController {
  constructor(private readonly appService: AppService, private readonly appGateway: AppGateway) {}

  @Post('createGame')
  public async createGame(@Body('creatorId') creatorId: string): Promise<GameDocument> {
    if (!creatorId) {
      throw new BadRequestException('creatorId was not provided');
    }
    await this.appService.ensureNoGameIsCreated(creatorId);
    const game = await this.appService.createGame(creatorId);
    this.appGateway.connectToGame(game.id, creatorId);
    return game;
  }

  @Post('joinGame')
  public async joinGame(
    @Body('code') code: string,
    @Body('invitedId') invitedId: string,
  ): Promise<void> {
    if (!code || !invitedId) {
      throw new BadRequestException('code or invitedId was not provided');
    }
    const game = await this.appService.findGameByCode(code);
    if (!game) {
      throw new BadRequestException('the provided game code was invalid');
    }
    if (game.invitedId) {
      throw new ForbiddenException('this game is full now');
    }
    await this.appService.joinGame(code, invitedId);
    this.appGateway.connectToGame(game.id, invitedId);
    return;
  }
}
