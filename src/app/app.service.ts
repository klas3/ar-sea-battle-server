import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { emptyShipPosition, gameFieldSize, gameRowSize, shipsSizes } from 'src/other/constants';
import { generateCode, isPositionCorrect } from '../other/tools';
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

  public validateShipsPositions(arrangedPositions: number[]): boolean {
    if (arrangedPositions.length !== gameFieldSize) {
      return false;
    }
    const positions = arrangedPositions.map((position, index) => ({
      isVisited: false,
      value: position,
      index,
    }));
    const shipsCounts = new Map<number, boolean>();
    for (let i = 0; i < gameFieldSize; i += 1) {
      if (positions[i].isVisited) {
        continue;
      }
      if (positions[i].value === emptyShipPosition) {
        positions[i].isVisited = true;
        continue;
      }
      const shipSize = shipsSizes[positions[i].value];
      const shipIndex = positions[i].value;
      const shipOrientation: 'horizontal' | 'vertical' | 'none' =
        shipSize === 1 || (i + 1 < gameFieldSize && positions[i + 1].value === shipIndex)
          ? 'horizontal'
          : i + gameRowSize < gameFieldSize && positions[i + gameRowSize].value === shipIndex
          ? 'vertical'
          : 'none';
      if (shipOrientation === 'none') {
        return false;
      }
      for (let j = 0; j < shipSize; j += 1) {
        const nextPosition = i + j;
        if (
          shipOrientation === 'horizontal' &&
          nextPosition >= gameFieldSize &&
          positions[nextPosition].value !== shipIndex
        ) {
          return false;
        }
        const nextRowPosition = i + j * gameRowSize;
        if (
          shipOrientation === 'vertical' &&
          nextRowPosition >= gameFieldSize &&
          positions[nextRowPosition].value !== shipIndex
        ) {
          return false;
        }
      }
      const shipPositions = [];
      for (let j = 0; j < shipSize; j += 1) {
        shipPositions.push(
          shipOrientation === 'horizontal' ? positions[i + j] : positions[i + j * gameRowSize],
        );
      }
      shipPositions.forEach((position) => {
        position.isVisited = true;
      });
      const allowedPositions = shipPositions.map((position) => position.index);
      const positiosAvailabilities = allowedPositions.map((position) =>
        isPositionCorrect(arrangedPositions, allowedPositions, position),
      );
      const isArrangedProperly = positiosAvailabilities.every((availability) => availability);
      if (!isArrangedProperly) {
        return false;
      }
      shipsCounts.set(shipIndex, true);
    }
    for (let shipSize = 0; shipSize < shipsSizes.length; shipSize += 1) {
      if (!shipsCounts.get(shipSize)) {
        return false;
      }
    }
    return true;
  }
}
