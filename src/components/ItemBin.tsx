import { useDroppable } from "@dnd-kit/react";
import React from "react";
import { CollisionPriority } from "@dnd-kit/abstract";

export const ItemBin = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const { ref } = useDroppable({
    id: id,
    type: "folder",
    accept: "item",
    collisionPriority: CollisionPriority.Low,
  });
  return (
    <div className="flex flex-col gap-2 min-h-10" ref={ref}>
      {children}
    </div>
  );
};
