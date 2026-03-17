import { Directive, ElementRef, HostListener, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appDragScroll]',
  standalone: true,
})
export class DragScroll implements OnDestroy {
  private isDragging = false;
  private startX = 0;
  private scrollLeft = 0;
  private readonly el: HTMLElement;

  constructor(private elementRef: ElementRef<HTMLElement>) {
    this.el = this.elementRef.nativeElement;
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(e: MouseEvent): void {
    this.isDragging = true;
    this.startX = e.pageX - this.el.offsetLeft;
    this.scrollLeft = this.el.scrollLeft;
    this.el.style.cursor = 'grabbing';
    this.el.style.userSelect = 'none';
    e.preventDefault();
  }

  @HostListener('window:mouseup')
  onMouseUp(): void {
    this.isDragging = false;
    this.el.style.cursor = 'grab';
    this.el.style.userSelect = '';
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;
    const x = e.pageX - this.el.offsetLeft;
    const walk = (x - this.startX) * 1.2; // tốc độ kéo
    this.el.scrollLeft = this.scrollLeft - walk;
  }

  ngOnDestroy(): void {
    this.el.style.cursor = '';
    this.el.style.userSelect = '';
  }
}
