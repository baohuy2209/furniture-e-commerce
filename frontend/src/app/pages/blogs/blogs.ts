import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BlogCard } from "../../components/blog-card/blog-card";
interface BlogFilter {
  category: string;
  readTime: string;
  sortBy: string;
}
@Component({
  selector: 'app-blogs',
  imports: [FormsModule, CommonModule, BlogCard],
  templateUrl: './blogs.html',
  styleUrl: './blogs.css',
})
export class Blogs {
  @Output() filterChange = new EventEmitter<BlogFilter>();

  filter: BlogFilter = {
    category: 'Tất cả',
    readTime: 'Tất cả',
    sortBy: 'Mới nhất',
  };

  onFilterChange(): void {
    this.filterChange.emit({ ...this.filter });
  }
}
