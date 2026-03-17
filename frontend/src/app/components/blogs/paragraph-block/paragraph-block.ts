import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-paragraph-block',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './paragraph-block.html',
  styleUrl: './paragraph-block.css',
})
export class ParagraphBlock {
  @Input() data: string = '';
  @Input() order?: number;
}
