import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-quote-block',
  imports: [CommonModule],
  templateUrl: './quote-block.html',
  styleUrl: './quote-block.css',
})
export class QuoteBlock {
  @Input() data: string = '';
  @Input() order?: number;
}
