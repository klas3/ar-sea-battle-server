import {
  WebSocketGateway,
  OnGatewayConnection,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { AppService } from './app.service';

@WebSocketGateway()
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly appService: AppService) {}

  @WebSocketServer()
  private readonly server!: Server;

  private readonly clients: Map<string, Socket> = new Map<string, Socket>();

  public handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (!userId) {
      return;
    }
    this.clients.set(userId, client);
  }

  public async handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (!userId) {
      return;
    }
    this.clients.delete(userId);
    const game = await this.appService.findGameByParticipant(userId);
    if (!game) {
      return;
    }
    client.leave(game.id);
    await this.appService.deleteGameById(game.id);
    this.server.to(game.id).emit('victory');
  }

  public connectToGame(gameId: string, userId: string) {
    const client = this.clients.get(userId);
    if (client) {
      client.join(gameId);
    }
  }

  public disconnectFromGame(gameId: string, userId: string) {
    const client = this.clients.get(userId);
    if (client) {
      client.leave(gameId);
    }
  }

  public startArrangement(gameId: string) {
    this.server.to(gameId).emit('startArrangement');
  }

  public startGame(gameId: string) {
    this.server.to(gameId).emit('startGame');
  }

  // public emitGameEnd(gameId: string, winnerId: string, looserId: string) {}

  @SubscribeMessage('arrangeShips')
  public async arrangeShips(
    client: Socket,
    clientInfo: { gameCode: string; userId: string; ships: number[] },
  ): Promise<void> {
    const { gameCode, ships, userId } = clientInfo;
    const game = await this.appService.findGameByCode(gameCode);
    const arePositionsValid =
      !clientInfo.ships.length || this.appService.validateShipsPositions(clientInfo.ships);
    if (!game || game.isStarted || !arePositionsValid) {
      return;
    }
    await this.appService.setArrangedShips(game.id, userId, ships);
    const areShipsArranged = await this.appService.areShipsArranged(game.id);
    if (areShipsArranged) {
      await this.appService.startGame(game.id);
      this.startGame(game.id);
      return;
    }
    if (!clientInfo.ships.length) {
      client.emit('startArrangement');
      return;
    }
    client.emit('waitingForOpponent');
  }
}
