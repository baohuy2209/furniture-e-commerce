import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
export interface CodeBlockData {
  code: string;
  language?: string;
}
@Component({
  selector: 'app-code-block',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './code-block.html',
  styleUrl: './code-block.css',
})
export class CodeBlock {
  @Input() data: CodeBlockData | string = '';
  @Input() order?: number;

  copied = false;

  get codeString(): string {
    return typeof this.data === 'string' ? this.data : this.data?.code || '';
  }

  get language(): string {
    return typeof this.data === 'object' ? this.data?.language || 'code' : 'code';
  }

  async copyCode(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.codeString);
      this.copied = true;
      setTimeout(() => (this.copied = false), 2000);
    } catch {
      // Clipboard not available
    }
  }
}
