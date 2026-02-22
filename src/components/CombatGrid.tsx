'use client';

import React, { useRef, useState } from 'react';
import Konva from 'konva';
import { Stage, Layer, Rect, Circle, Text, Group, Line } from 'react-konva';
import { Plus, Minus, RotateCcw } from 'lucide-react';

interface Token {
  id: string;
  name: string;
  x: number;
  y: number;
  size: number;
  color: string;
}

interface CombatGridProps {
  tokens: Token[];
  onTokenMove: (id: string, x: number, y: number) => void;
  readOnly?: boolean;
}

export function CombatGrid({
  tokens,
  onTokenMove,
  readOnly = false,
}: CombatGridProps) {
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const stageRef = useRef<Konva.Stage>(null);

  const GRID_SIZE = 10;
  const CELL_SIZE = 50;
  const GRID_WIDTH = GRID_SIZE * CELL_SIZE;
  const GRID_HEIGHT = GRID_SIZE * CELL_SIZE;

  // Handle token drag
  const handleTokenDragEnd = (tokenId: string, e: { target: { x: () => number; y: () => number } }) => {
    if (readOnly) return;

    const newX = Math.round(e.target.x() / CELL_SIZE) * CELL_SIZE;
    const newY = Math.round(e.target.y() / CELL_SIZE) * CELL_SIZE;

    // Clamp to grid
    const clampedX = Math.max(0, Math.min(newX, GRID_WIDTH - CELL_SIZE));
    const clampedY = Math.max(0, Math.min(newY, GRID_HEIGHT - CELL_SIZE));

    onTokenMove(tokenId, clampedX, clampedY);
  };

  // Handle wheel zoom
  const handleWheel = (e: { evt: WheelEvent }) => {
    e.evt.preventDefault();
    if (!stageRef.current) return;

    const scaleBy = 1.1;
    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    const boundedScale = Math.max(0.5, Math.min(3, newScale));

    setZoom(boundedScale);
    stage.scale({ x: boundedScale, y: boundedScale });
  };

  return (
    <div className="w-full bg-rpg-darker rounded-lg p-4 border border-rpg-accent">
      {/* Controls */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
          className="p-2 bg-rpg-dark hover:bg-rpg-accent text-rpg-light rounded flex items-center gap-2"
        >
          <Minus size={16} /> Zoom Out
        </button>
        <span className="text-rpg-light px-3 py-2 bg-rpg-dark rounded">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
          className="p-2 bg-rpg-dark hover:bg-rpg-accent text-rpg-light rounded flex items-center gap-2"
        >
          <Plus size={16} /> Zoom In
        </button>
        <button
          onClick={() => {
            setZoom(1);
            if (stageRef.current) {
              stageRef.current.scale({ x: 1, y: 1 });
              stageRef.current.position({ x: 0, y: 0 });
            }
          }}
          className="p-2 bg-rpg-dark hover:bg-rpg-accent text-rpg-light rounded flex items-center gap-2 ml-auto"
        >
          <RotateCcw size={16} /> Reset
        </button>
      </div>

      {/* Canvas */}
      <div className="bg-rpg-darker rounded overflow-hidden border border-rpg-gold">
        <Stage
          ref={stageRef}
          width={GRID_WIDTH}
          height={GRID_HEIGHT}
          onWheel={handleWheel}
          scaleX={zoom}
          scaleY={zoom}
          className="cursor-grab active:cursor-grabbing"
        >
          <Layer>
            {/* Grid background */}
            <Rect
              width={GRID_WIDTH}
              height={GRID_HEIGHT}
              fill="#0a0a0a"
            />

            {/* Grid lines */}
            {Array.from({ length: GRID_SIZE + 1 }).map((_, i) => (
              <React.Fragment key={`grid-${i}`}>
                {/* Vertical */}
                <Line
                  x={i * CELL_SIZE}
                  y={0}
                  points={[0, 0, 0, GRID_HEIGHT]}
                  stroke="#333"
                  strokeWidth={1}
                />
                {/* Horizontal */}
                <Line
                  x={0}
                  y={i * CELL_SIZE}
                  points={[0, 0, GRID_WIDTH, 0]}
                  stroke="#333"
                  strokeWidth={1}
                />
              </React.Fragment>
            ))}

            {/* Tokens */}
            {tokens.map((token) => (
              <Group
                key={token.id}
                x={token.x}
                y={token.y}
                draggable={!readOnly}
                onDragEnd={(e) => handleTokenDragEnd(token.id, e)}
                onClick={() => !readOnly && setSelectedTokenId(token.id)}
              >
                <Circle
                  radius={CELL_SIZE / 2 - 4}
                  fill={token.color}
                  stroke={
                    selectedTokenId === token.id ? '#FFD700' : '#666'
                  }
                  strokeWidth={selectedTokenId === token.id ? 3 : 1}
                  opacity={0.8}
                />
                <Text
                  text={token.name.substring(0, 2).toUpperCase()}
                  x={-(CELL_SIZE / 4)}
                  y={-(CELL_SIZE / 6)}
                  width={CELL_SIZE / 2}
                  align="center"
                  fill="#fff"
                  fontSize={12}
                  fontStyle="bold"
                />
              </Group>
            ))}
          </Layer>
        </Stage>
      </div>

      {/* Selected Token Info */}
      {selectedTokenId && (
        <div className="mt-4 p-3 bg-rpg-dark border border-rpg-accent rounded">
          <p className="text-rpg-light">
            {tokens.find((t) => t.id === selectedTokenId)?.name}
          </p>
          {!readOnly && (
            <p className="text-sm text-rpg-accent">Click drag to move</p>
          )}
        </div>
      )}
    </div>
  );
}

