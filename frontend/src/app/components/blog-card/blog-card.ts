import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
@Component({
  selector: 'app-blog-card',
  imports: [FormsModule, CommonModule],
  templateUrl: './blog-card.html',
  styleUrl: './blog-card.css',
})
export class BlogCard {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {}
  onClick() {
    this.router.navigate(['1'], { relativeTo: this.route });
  }
}
