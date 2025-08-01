"use client"

import { GalleryItemComponent, type GalleryItem } from "./gallery-item"

interface GalleryGridProps {
  items: GalleryItem[]
  onLike: (itemId: string) => void
}

export function GalleryGrid({ items, onLike }: GalleryGridProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No items found in this category.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item) => (
        <GalleryItemComponent key={item.id} item={item} onLike={onLike} />
      ))}
    </div>
  )
}
