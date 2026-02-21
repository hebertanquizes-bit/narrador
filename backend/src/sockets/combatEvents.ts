import { Server, Socket } from 'socket.io';
import { CombatGrid, Token } from '../models/CombatGrid';

export function setupCombatEvents(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`✅ Socket connected: ${socket.id}`);

    /**
     * Join combat room
     */
    socket.on('combat:join', async (data: { gridId: string; playerId: string }) => {
      const { gridId, playerId } = data;
      socket.join(`combat:${gridId}`);

      try {
        const grid = await CombatGrid.findById(gridId);
        socket.emit('combat:state', {
          grid,
          playerId,
        });
        console.log(`👤 Player ${playerId} joined combat ${gridId}`);
      } catch (error) {
        console.error('❌ Join error:', error);
        socket.emit('error', 'Failed to join combat');
      }
    });

    /**
     * Token moved
     */
    socket.on(
      'combat:token-move',
      async (data: { gridId: string; tokenId: string; x: number; y: number }) => {
        const { gridId, tokenId, x, y } = data;

        try {
          const grid = await CombatGrid.findByIdAndUpdate(
            gridId,
            {
              $set: {
                'tokens.$[elem].x': x,
                'tokens.$[elem].y': y,
              },
            },
            {
              arrayFilters: [{ 'elem.id': tokenId }],
              new: true,
            }
          );

          io.to(`combat:${gridId}`).emit('combat:token-moved', {
            tokenId,
            x,
            y,
          });

          // Log to battle log
          if (grid) {
            grid.battleLog.push({
              timestamp: new Date(),
              action: 'move',
              actor: grid.tokens.find((t) => t.id === tokenId)?.name || 'Unknown',
            });
            await grid.save();
          }
        } catch (error) {
          console.error('❌ Token move error:', error);
          socket.emit('error', 'Failed to move token');
        }
      }
    );

    /**
     * Token added
     */
    socket.on(
      'combat:token-add',
      async (data: {
        gridId: string;
        name: string;
        x: number;
        y: number;
        color: string;
      }) => {
        const { gridId, name, x, y, color } = data;

        try {
          const newToken: Token = {
            id: `token_${Date.now()}`,
            name,
            x,
            y,
            size: 1,
            color,
            initiativeModifier: 0,
          };

          const grid = await CombatGrid.findByIdAndUpdate(
            gridId,
            {
              $push: { tokens: newToken },
            },
            { new: true }
          );

          io.to(`combat:${gridId}`).emit('combat:token-added', newToken);

          grid?.battleLog.push({
            timestamp: new Date(),
            action: 'join',
            actor: name,
          });
          await grid?.save();
        } catch (error) {
          console.error('❌ Token add error:', error);
          socket.emit('error', 'Failed to add token');
        }
      }
    );

    /**
     * Combat turn changed
     */
    socket.on(
      'combat:next-turn',
      async (data: { gridId: string; currentTokenId: string; message: string }) => {
        const { gridId, currentTokenId, message } = data;

        try {
          const grid = await CombatGrid.findByIdAndUpdate(
            gridId,
            {
              currentTurnTokenId: currentTokenId,
            },
            { new: true }
          );

          io.to(`combat:${gridId}`).emit('combat:turn-changed', {
            currentTokenId,
            round: grid?.roundNumber,
          });

          grid?.battleLog.push({
            timestamp: new Date(),
            action: 'turn',
            actor: `${grid?.tokens.find((t) => t.id === currentTokenId)?.name}'s turn - ${message}`,
          });
          await grid?.save();
        } catch (error) {
          console.error('❌ Turn error:', error);
          socket.emit('error', 'Failed to change turn');
        }
      }
    );

    /**
     * Combat round advanced
     */
    socket.on('combat:next-round', async (data: { gridId: string }) => {
      const { gridId } = data;

      try {
        const grid = await CombatGrid.findByIdAndUpdate(
          gridId,
          {
            $inc: { roundNumber: 1 },
          },
          { new: true }
        );

        io.to(`combat:${gridId}`).emit('combat:round-changed', {
          round: grid?.roundNumber,
        });

        grid?.battleLog.push({
          timestamp: new Date(),
          action: 'round',
          actor: `Round ${grid?.roundNumber} started`,
        });
        await grid?.save();
      } catch (error) {
        console.error('❌ Round error:', error);
        socket.emit('error', 'Failed to advance round');
      }
    });

    /**
     * Leave combat
     */
    socket.on('combat:leave', (data: { gridId: string; playerId: string }) => {
      const { gridId, playerId } = data;
      socket.leave(`combat:${gridId}`);
      io.to(`combat:${gridId}`).emit('combat:player-left', { playerId });
      console.log(`👤 Player ${playerId} left combat ${gridId}`);
    });

    /**
     * Disconnect
     */
    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });
}
