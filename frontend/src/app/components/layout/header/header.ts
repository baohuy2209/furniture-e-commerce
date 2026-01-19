import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [CommonModule, FormsModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements AfterViewInit {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  cartCount = 0;
  isSearchOpen = false;
  searchQuery = '';
  constructor(private router: Router) {}
  ngAfterViewInit() {}
  getCurrentUrl() {
    const getCurrents = this.router.url.split('/');
    return getCurrents[1] == '' ? 'home' : getCurrents[1];
  }
  toggleSearch(): void {
    this.isSearchOpen = !this.isSearchOpen;

    if (this.isSearchOpen) {
      setTimeout(() => {
        this.searchInput?.nativeElement.focus();
      }, 400);
    } else {
      this.searchQuery = '';
    }
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      console.log('Searching for:', this.searchQuery);
      // this.router.navigate(['/search'], {
      //   queryParams: { q: this.searchQuery },
      // });

      this.isSearchOpen = false;
    }
  }
}
