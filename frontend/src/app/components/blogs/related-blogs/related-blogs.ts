import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { DragScroll } from '../../../directives/drag-scroll';
import { IListBlog } from '../../../../interface';
import { BlogCard } from '../../blog-card/blog-card';

@Component({
  selector: 'app-related-blogs',
  imports: [CommonModule, DragScroll, BlogCard],
  templateUrl: './related-blogs.html',
  styleUrl: './related-blogs.css',
})
export class RelatedBlogs {
  @Input() posts: IListBlog[] = [];
  @Input() title: string = 'Bài Viết Liên Quan';
  @Input() subtitle: string = 'Khám phá thêm những bài viết hấp dẫn khác';
}
