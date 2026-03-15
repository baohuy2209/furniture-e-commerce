import { CommonModule } from '@angular/common';
import { Component, Input, SimpleChanges } from '@angular/core';
export interface GalleryImage {
  src: string;
  alt?: string;
}

type RowType = 'half' | 'featured' | 'thirds' | 'full';

interface GalleryRow {
  type: RowType;
  items: string[];
}

/**
 * Pattern lặp theo nhóm 5 ảnh:
 *   [0,1]     → row "half"     (2 ảnh ngang bằng)
 *   [2,3]     → row "featured" (nhỏ trái + lớn phải)
 *   [4,5,6]   → row "thirds"   (3 ảnh bằng nhau)
 *   [7]       → row "full"     (1 ảnh full width)
 *   ... lặp lại
 *
 * Nếu số ảnh còn lại ít hơn slot thì lấy bao nhiêu hiển thị bấy nhiêu
 */
const PATTERN: Array<{ type: RowType; count: number }> = [
  { type: 'half', count: 2 },
  { type: 'featured', count: 2 },
  { type: 'thirds', count: 3 },
  { type: 'full', count: 1 },
];
@Component({
  selector: 'app-image-gallery',
  imports: [CommonModule],
  templateUrl: './image-gallery.html',
  styleUrl: './image-gallery.css',
})
export class ImageGallery {
  /** Truyền mảng ảnh vào từ component cha */
  @Input() images: string[] = [];

  layoutRows: GalleryRow[] = [];
  lightboxItem: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['images']) {
      this.buildLayout();
    }
  }

  private buildLayout(): void {
    this.layoutRows = [];
    let cursor = 0;
    const total = this.images.length;
    let patternIndex = 0;

    while (cursor < total) {
      const step = PATTERN[patternIndex % PATTERN.length];
      const slice = this.images.slice(cursor, cursor + step.count);

      if (slice.length === 0) break;

      // Nếu chỉ còn 1 ảnh mà pattern yêu cầu nhiều hơn → hiển thị full
      if (slice.length === 1 && step.count > 1) {
        this.layoutRows.push({ type: 'full', items: slice });
      } else if (slice.length === 2 && step.type === 'thirds') {
        // còn 2 ảnh nhưng slot là thirds → dùng half
        this.layoutRows.push({ type: 'half', items: slice });
      } else {
        this.layoutRows.push({ type: step.type, items: slice });
      }

      cursor += slice.length;
      patternIndex++;
    }
  }

  openLightbox(item: string): void {
    this.lightboxItem = item;
    document.body.style.overflow = 'hidden';
  }

  closeLightbox(): void {
    this.lightboxItem = null;
    document.body.style.overflow = '';
  }
}
