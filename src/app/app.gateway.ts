import {
  WebSocketGateway,
  OnGatewayConnection,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { AppService } from './app.service';

@WebSocketGateway()
export class AppGateway implements OnGatewayConnection {
  constructor(private readonly appService: AppService) {}

  @WebSocketServer()
  private readonly server!: Server;

  private readonly clients: Map<string, Socket> = new Map<string, Socket>();

  public handleConnection(client: Socket) {
    client.emit('connection');
  }

  @SubscribeMessage('addClient')
  public addClient(client: Socket, clientInfo: { gameId: string; userId: string }) {
    const { gameId, userId } = clientInfo;
    client.join(gameId);
    this.clients.set(userId, client);
  }

  public connectToGame(gameId: string, userId: string) {
    const client = this.clients.get(userId);
    if (!client) {
      return;
    }
    client.join(gameId);
  }

  public disconnectFromGame(gameId: string, userId: string) {
    const client = this.clients.get(userId);
    if (!client) {
      return;
    }
    client.leave(gameId);
  }

  public startArrangement(gameId: string) {
    this.server.to(gameId).emit('startArrangement');
  }

  public startGame(gameId: string) {
    this.server.to(gameId).emit('startGame');
  }

  @SubscribeMessage('arrangeShips')
  public async arrangeShips(
    _: Socket,
    clientInfo: { gameId: string; userId: string; ships: number[] },
  ): Promise<void> {
    const { gameId, ships, userId } = clientInfo;
    const game = await this.appService.findGame(gameId);
    // TODO validate arranged ships
    if (!game || game.isStarted) {
      return;
    }
    await this.appService.setArrangedShips(gameId, userId, ships);
    const areShipsArranged = this.appService.areShipsArranged(gameId);
    if (areShipsArranged) {
      await this.appService.startGame(gameId);
      this.startGame(gameId);
    }
  }
}
