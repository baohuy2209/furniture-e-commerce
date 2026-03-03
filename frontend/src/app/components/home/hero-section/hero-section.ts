import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-hero-section',
  imports: [],
  templateUrl: './hero-section.html',
  styleUrl: './hero-section.css',
})
export class HeroSection {
  activeIndex = signal(0);
  private timerId!: any;
  items = [
    { id: 1, image: 'images/hero-section/P1.png' },
    { id: 2, image: 'images/hero-section/P2.png' },
    { id: 3, image: 'images/hero-section/P3.png' },
  ];

  ngOnInit() {
    this.startTimer();
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  private startTimer() {
    this.timerId = setInterval(() => {
      this.activeIndex.update((i) => (i + 1) % this.items.length);
    }, 5000);
  }

  private stopTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }

  setActiveIndex(index: number) {
    this.activeIndex.set(index);
    this.stopTimer();
    this.startTimer();
  }

  scrollToFeatures() {
    const element = document.getElementById('features-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
