"use client";

import { useState, useEffect } from "react";
import { Button } from "./button";
import { X } from "lucide-react";
import { Input } from "./input";

type Props = {
  imageSrc: string;
  currentWidth?: number;
  currentHeight?: number;
  onResize: (width: number, height: number) => void;
  onCancel: () => void;
};

function ImageResizeModal({
  imageSrc,
  currentWidth,
  currentHeight,
  onResize,
  onCancel,
}: Props) {
  const [width, setWidth] = useState(currentWidth || 400);
  const [height, setHeight] = useState(currentHeight || 300);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);

  useEffect(() => {
    if (currentWidth && currentHeight) {
      setAspectRatio(currentWidth / currentHeight);
    } else {
      // Load image to get natural dimensions
      const img = new Image();
      img.onload = () => {
        const ratio = img.naturalWidth / img.naturalHeight;
        setAspectRatio(ratio);
        if (!currentWidth && !currentHeight) {
          setWidth(img.naturalWidth);
          setHeight(img.naturalHeight);
        }
      };
      img.src = imageSrc;
    }
  }, [imageSrc, currentWidth, currentHeight]);

  const handleWidthChange = (value: string) => {
    const newWidth = parseInt(value) || 0;
    setWidth(newWidth);
    if (lockAspectRatio && aspectRatio) {
      setHeight(Math.round(newWidth / aspectRatio));
    }
  };

  const handleHeightChange = (value: string) => {
    const newHeight = parseInt(value) || 0;
    setHeight(newHeight);
    if (lockAspectRatio && aspectRatio) {
      setWidth(Math.round(newHeight * aspectRatio));
    }
  };

  const handleApply = () => {
    if (width > 0 && height > 0) {
      onResize(width, height);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-2xl bg-card rounded-lg border shadow-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Resize Image</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Preview */}
        <div className="p-4 border-b bg-muted/30 flex items-center justify-center min-h-[200px]">
          <img
            src={imageSrc}
            alt="Preview"
            style={{
              width: `${Math.min(width, 400)}px`,
              height: `${Math.min(height, 300)}px`,
              objectFit: "contain",
            }}
            className="rounded-md"
          />
        </div>

        {/* Controls */}
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Width (px)</label>
              <Input
                type="number"
                value={width}
                onChange={(e) => handleWidthChange(e.target.value)}
                min={1}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Height (px)</label>
              <Input
                type="number"
                value={height}
                onChange={(e) => handleHeightChange(e.target.value)}
                min={1}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="lockAspectRatio"
              checked={lockAspectRatio}
              onChange={(e) => setLockAspectRatio(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="lockAspectRatio" className="text-sm">
              Lock aspect ratio
            </label>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleApply}>Apply</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImageResizeModal;

