import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';

@WebSocketGateway({
    namespace: '/chat',
    cors: {
        origin: '*',
        credentials: true
    },
})
@Injectable()
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    sendNotification(userId: string, data: any) {
        this.server.to(`user_${userId}`).emit('notification', data);
    }

    @SubscribeMessage('join')
    handleJoinRoom(client: Socket, userId: string) {
        console.log(`Notifications: User joining room user_${userId} (client: ${client.id})`);
        client.join(`user_${userId}`);
        return { event: 'joined', data: userId };
    }
}
