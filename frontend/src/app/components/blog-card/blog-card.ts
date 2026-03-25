import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IListBlog } from '../../../interface';
import { formatDate } from '../../utils/utils';
@Component({
  selector: 'app-blog-card',
  imports: [FormsModule, CommonModule],
  templateUrl: './blog-card.html',
  styleUrl: './blog-card.css',
})
export class BlogCard {
  @Input() blogInfo!: IListBlog;
  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {}
  formatPublishedAt() {
    return formatDate(this.blogInfo.publishedAt);
  }
  onClick() {
    this.router.navigate([`/blogs/${this.blogInfo._id}`]);
  }
}
