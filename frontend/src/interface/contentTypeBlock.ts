export type ContentBlockType =
  | 'paragraph'
  | 'heading'
  | 'quote'
  | 'list'
  | 'image'
  | 'code'
  | 'embed';

export interface ImageData {
  url: string;
  alt: string;
  caption?: string;
}

export interface EmbedData {
  url: string;
  title?: string;
  provider?: string;
}

export interface CodeData {
  code: string;
  language?: string;
}

export interface ContentBlock {
  type: ContentBlockType;
  data: string | string[] | ImageData | EmbedData | CodeData;
  order: number;
}
