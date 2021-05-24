import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Game {
  @Prop()
  isStarted!: boolean;

  @Prop()
  code!: string;

  @Prop()
  creatorId!: string;

  @Prop()
  invitedId!: string;

  @Prop()
  movingUserId!: string;

  @Prop()
  creatorShips!: number[];

  @Prop()
  invitedShips!: number[];

  @Prop()
  creatorFieldShots!: number[];

  @Prop()
  invitedFieldShots!: number[];
}

export const GameSchema = SchemaFactory.createForClass(Game);

export type GameDocument = Game & Document;
