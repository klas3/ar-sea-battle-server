import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { generateCode } from '../other/tools';
import { Game, GameDocument } from '../schemas/game.schema';

@Injectable()
export class AppService {
  private readonly fieldLength: number = 100;

  constructor(@InjectModel(Game.name) private gameModel: Model<GameDocument>) {}

  public async createGame(creatorId: string): Promise<GameDocument> {
    const emptyShots = Array(this.fieldLength).fill(0);
    const game = {
      creatorId,
      movingUserId: creatorId,
      code: generateCode(),
      isGameStarted: false,
      creatorShots: emptyShots,
      invitedShots: emptyShots,
    };
    const createdGame = new this.gameModel(game);
    return createdGame.save();
  }

  public async deleteGameByCreatorId(creatorId: string): Promise<void> {
    await this.gameModel.findOneAndDelete({ creatorId });
  }

  public async deleteGameById(id: string): Promise<void> {
    await this.gameModel.findByIdAndDelete(id);
  }

  public async findGameByParticipant(userId: string): Promise<GameDocument | null> {
    return this.gameModel.findOne({ $or: [{ creatorId: userId }, { invitedId: userId }] });
  }

  public async findGame(id: string): Promise<GameDocument | null> {
    return this.gameModel.findById(id);
  }

  public async findGameByCode(code: string): Promise<GameDocument | null> {
    return this.gameModel.findOne({ code });
  }

  public async joinGame(code: string, invitedId: string): Promise<void> {
    await this.gameModel.findOneAndUpdate({ code }, { invitedId });
  }

  public async setArrangedShips(gameId: string, userId: string, ships: number[]): Promise<void> {
    const game = await this.findGame(gameId);
    if (!game) {
      return;
    }
    if (game.creatorId === userId) {
      await game.updateOne({ creatorShips: ships });
    } else if (game.invitedId === userId) {
      await game.updateOne({ invitedShips: ships });
    }
  }

  public async areShipsArranged(gameId: string): Promise<boolean> {
    const game = await this.findGame(gameId);
    if (!game) {
      return false;
    }
    return !!game.creatorShips.length && !!game.invitedShips.length;
  }

  public async startGame(gameId: string): Promise<void> {
    await this.gameModel.findByIdAndUpdate(gameId, { isStarted: true });
  }
}
