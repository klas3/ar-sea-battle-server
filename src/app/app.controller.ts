import { BadRequestException, Body, Controller, ForbiddenException, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { AppGateway } from './app.gateway';

@Controller('/')
export class AppController {
  constructor(private readonly appService: AppService, private readonly appGateway: AppGateway) {}

  @Post('createGame')
  public async createGame(@Body('creatorId') creatorId: string): Promise<{ code: string }> {
    if (!creatorId) {
      throw new BadRequestException('creatorId was not provided');
    }
    await this.appService.deleteGameByCreatorId(creatorId);
    const game = await this.appService.createGame(creatorId);
    this.appGateway.connectToGame(game.id, creatorId);
    return { code: game.code };
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
      throw new BadRequestException('The provided game code was invalid');
    }
    if (game.creatorId === invitedId) {
      throw new ForbiddenException('You cannot join to your own game');
    }
    if (game.invitedId) {
      throw new ForbiddenException('This game is full now');
    }
    const invitedUserGame = await this.appService.findGameByParticipant(invitedId);
    if (invitedUserGame) {
      await invitedUserGame.deleteOne();
    }
    await this.appService.joinGame(code, invitedId);
    this.appGateway.connectToGame(game.id, invitedId);
    this.appGateway.startArrangement(game.id);
    return;
  }
}
