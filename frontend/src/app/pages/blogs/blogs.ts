import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BlogCard } from '../../components/blog-card/blog-card';
import { BlogService } from '../../services/blog-service';
import { IListBlog } from '../../../interface';
import { NgxPaginationModule } from 'ngx-pagination';
interface BlogFilter {
  category: string;
  readTime: string;
  sortBy: string;
}
@Component({
  selector: 'app-blogs',
  imports: [FormsModule, CommonModule, BlogCard, NgxPaginationModule],
  templateUrl: './blogs.html',
  styleUrl: './blogs.css',
  standalone: true,
})
export class Blogs implements OnInit {
  @Output() filterChange = new EventEmitter<BlogFilter>();
  listBlogs: IListBlog[] = [];
  success: string = '';
  error: string = '';
  page = 1;
  count = 0;
  pageSize = 12;
  constructor(
    private cdr: ChangeDetectorRef,
    private blogService: BlogService,
  ) {}
  getRequestParams(page: number, pageSize: number): any {
    let params: any = {};
    if (page) {
      params['page'] = page - 1;
    }
    if (pageSize) {
      params['size'] = pageSize;
    }
    return params;
  }
  handlePageChange(event: number): void {
    this.page = event;
    this.getListBlogs();
  }
  searchTitle(): void {
    this.page = 1;
    this.getListBlogs();
  }
  getListBlogs() {
    this.blogService.getAllBlogs(this.getRequestParams).subscribe({
      next: (res) => {
        if (!res.data) {
          this.success = 'Không tìm thấy bài viết nào';
          this.cdr.detectChanges();
        }
        this.listBlogs = res.data;
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
  ngOnInit(): void {
    this.blogService.getAllBlogs(this.getRequestParams).subscribe({
      next: (res) => {
        if (!res.data) {
          this.success = 'Không tìm thấy bài viết nào';
          this.cdr.detectChanges();
        }
        this.listBlogs = res.data;
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
  filter: BlogFilter = {
    category: 'Tất cả',
    readTime: 'Tất cả',
    sortBy: 'Mới nhất',
  };

  onFilterChange(): void {
    this.filterChange.emit({ ...this.filter });
  }
}
