import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { IListBlog } from '../../../../interface';
import { BlogService } from '../../../services/blog-service';
import { BlogCard } from "../../blog-card/blog-card";
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-blog-section',
  imports: [BlogCard, RouterLink],
  templateUrl: './blog-section.html',
  styleUrl: './blog-section.css',
  standalone: true,
})
export class BlogSection implements OnInit {
  listTrendBlogs: IListBlog[] = [];
  success: string = '';
  error: string = '';
  constructor(
    private cdr: ChangeDetectorRef,
    private blogService: BlogService,
  ) {}
  ngOnInit(): void {
    this.blogService.getTrendingBlogs().subscribe({
      next: (res) => {
        if (!res.data) {
          this.success = 'Không tìm thấy bài viết nào';
          this.cdr.detectChanges();
        }
        this.listTrendBlogs = res.data;
        // console.log(res.data);
        this.success = res.message;
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status === 404 || err.status === 400 || err.status === 401) {
          this.error = err.error?.message || 'Không tìm thây bài viết nào';
        } else {
          this.error = 'Có lỗi ở phía server';
        }
        this.cdr.detectChanges();
      },
    });
  }
}
