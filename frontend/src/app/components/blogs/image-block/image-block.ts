import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
export interface ImageBlockData {
  url: string;
  alt: string;
  caption?: string;
}
@Component({
  selector: 'app-image-block',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './image-block.html',
  styleUrl: './image-block.css',
})
export class ImageBlock {
  @Input() data: ImageBlockData = { url: '', alt: '' };
  @Input() order?: number;

  isLoaded = false;
  hasError = false;

  onImageLoad(): void {
    this.isLoaded = true;
  }

  onImageError(): void {
    this.hasError = true;
    this.isLoaded = true;
  }
}
