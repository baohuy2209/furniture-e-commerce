import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-floating-actions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './floating-actions.html',
  styleUrl: './floating-actions.css'
})
export class FloatingActions {
  showBackToTop = false;
  contactExpanded = false;

  @HostListener('window:scroll')
  onScroll() {
    this.showBackToTop = window.scrollY > 300;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleContact() {
    this.contactExpanded = !this.contactExpanded;
  }
}
