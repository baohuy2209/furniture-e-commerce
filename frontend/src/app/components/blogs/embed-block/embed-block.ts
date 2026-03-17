import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
export interface EmbedBlockData {
  url: string;
  title?: string;
  provider?: string; // 'youtube' | 'vimeo' | 'other'
}
@Component({
  selector: 'app-embed-block',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './embed-block.html',
  styleUrl: './embed-block.css',
})
export class EmbedBlock implements OnInit {
  @Input() data: EmbedBlockData | string = '';
  @Input() order?: number;

  safeUrl: SafeResourceUrl | null = null;
  provider: string = 'other';
  embedUrl: string = '';
  displayTitle: string = '';

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    const rawData = typeof this.data === 'string' ? this.data : this.data?.url || '';
    this.displayTitle = typeof this.data === 'object' ? this.data?.title || '' : '';
    this.processUrl(rawData);
  }

  private processUrl(url: string): void {
    if (!url) return;

    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (ytMatch) {
      this.provider = 'youtube';
      this.embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
      this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.embedUrl);
      return;
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      this.provider = 'vimeo';
      this.embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
      this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.embedUrl);
      return;
    }

    // Generic iframe
    this.provider = 'other';
    this.embedUrl = url;
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  get providerLabel(): string {
    switch (this.provider) {
      case 'youtube':
        return 'YouTube';
      case 'vimeo':
        return 'Vimeo';
      default:
        return 'Video';
    }
  }
}
