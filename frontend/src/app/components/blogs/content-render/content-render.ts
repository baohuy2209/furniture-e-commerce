import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ParagraphBlock } from '../paragraph-block/paragraph-block';
import { CodeBlock } from '../code-block/code-block';
import { EmbedBlock } from '../embed-block/embed-block';
import { HeadingBlock } from '../heading-block/heading-block';
import { ImageBlock } from '../image-block/image-block';
import { ListBlock } from '../list-block/list-block';
import { QuoteBlock } from '../quote-block/quote-block';
import {
  CodeData,
  ContentBlock,
  EmbedData,
  ImageData,
} from '../../../../interface/contentTypeBlock';

@Component({
  selector: 'app-content-render',
  imports: [
    CommonModule,
    ParagraphBlock,
    CodeBlock,
    EmbedBlock,
    HeadingBlock,
    ImageBlock,
    ListBlock,
    QuoteBlock,
  ],
  standalone: true,
  templateUrl: './content-render.html',
  styleUrl: './content-render.css',
})
export class ContentRender {
  @Input() blocks: ContentBlock[] = [];

  get sortedBlocks(): ContentBlock[] {
    return [...this.blocks].sort((a, b) => a.order - b.order);
  }

  asString(data: ContentBlock['data']): string {
    return typeof data === 'string' ? data : '';
  }

  asStringArray(data: ContentBlock['data']): string[] {
    return Array.isArray(data) ? (data as string[]) : [];
  }

  asImageData(data: ContentBlock['data']): ImageData {
    return data && typeof data === 'object' && !Array.isArray(data)
      ? (data as ImageData)
      : { url: '', alt: '' };
  }

  asEmbedData(data: ContentBlock['data']): EmbedData {
    if (typeof data === 'string') return { url: data };
    return data && typeof data === 'object' && !Array.isArray(data)
      ? (data as EmbedData)
      : { url: '' };
  }

  trackByOrder(_index: number, block: ContentBlock): number {
    return block.order;
  }

  asCodeData(data: ContentBlock['data']): CodeData {
    if (typeof data === 'string') return { code: data };
    return data && typeof data === 'object' && !Array.isArray(data)
      ? (data as CodeData)
      : { code: '' };
  }
}
