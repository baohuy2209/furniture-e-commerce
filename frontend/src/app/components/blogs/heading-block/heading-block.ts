import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-heading-block',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './heading-block.html',
  styleUrl: './heading-block.css',
})
export class HeadingBlock {
  @Input() data: string = '';
  @Input() order?: number;

  get isNumberedHeading(): boolean {
    return /^\d+\./.test(this.data.trim());
  }
}
