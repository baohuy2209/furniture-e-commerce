import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-list-block',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './list-block.html',
  styleUrl: './list-block.css',
})
export class ListBlock {
  @Input() data: string[] = [];
  @Input() order?: number;
}
