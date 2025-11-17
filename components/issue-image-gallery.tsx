"use client";

import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface IssueImageGalleryProps {
  images: string[];
  title: string;
}

export function IssueImageGallery({ images, title }: IssueImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  const handlePrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < images.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  return (
    <>
      <div className="space-y-3">
        <h3 className="font-semibold">Issue Photos ({images.length})</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className="relative aspect-square rounded-lg overflow-hidden border hover:border-primary transition-colors group"
            >
              <img
                src={image || "/placeholder.svg"}
                alt={`${title} - Photo ${index + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </button>
          ))}
        </div>
      </div>

      <Dialog open={selectedIndex !== null} onOpenChange={() => setSelectedIndex(null)}>
        <DialogContent className="max-w-4xl p-0">
          <div className="relative">
            <img
              src={selectedIndex !== null ? images[selectedIndex] : ''}
              alt={`${title} - Photo ${(selectedIndex || 0) + 1}`}
              className="w-full h-auto"
            />
            
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-background/80 hover:bg-background"
              onClick={() => setSelectedIndex(null)}
            >
              <X className="h-4 w-4" />
            </Button>

            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background disabled:opacity-50"
                  onClick={handlePrevious}
                  disabled={selectedIndex === 0}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background disabled:opacity-50"
                  onClick={handleNext}
                  disabled={selectedIndex === images.length - 1}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 px-3 py-1 rounded-full text-sm">
                  {(selectedIndex || 0) + 1} / {images.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
