import { Component, Input } from '@angular/core';
import { IBlogTag } from '../../../../interface';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-blog-tags-components',
  imports: [CommonModule, RouterLink],
  templateUrl: './blog-tags-components.html',
  styleUrl: './blog-tags-components.css',
})
export class BlogTagsComponents {
  @Input() tags!: IBlogTag[];
}
