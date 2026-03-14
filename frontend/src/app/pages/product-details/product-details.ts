import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ImageGallery } from '../../components/product-details/image-gallery/image-gallery';
interface ColorOption {
  id: string;
  label: string;
  hex: string;
}

interface FeatureItem {
  title: string;
  text: string;
  icon: string; // SVG string
}

@Component({
  selector: 'app-product-details',
  imports: [CommonModule, ImageGallery],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
})
export class ProductDetails {
  products = Array(6)
    .fill(null)
    .map((_, i) => ({ id: i + 1 }));
  activeIndex = 0;

  images = [
    {
      src: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=700&q=80',
      alt: 'Hamilton ghế – nhìn trước',
    },
    {
      src: 'https://images.unsplash.com/photo-1567538096621-38d2284b23ff?w=700&q=80',
      alt: 'Hamilton ghế – góc nghiêng',
    },
    {
      src: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=700&q=80',
      alt: 'Hamilton ghế – không gian sống',
    },
    {
      src: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=700&q=80',
      alt: 'Hamilton ghế – chi tiết',
    },
  ];

  setActive(index: number): void {
    this.activeIndex = index;
  }

  // ── Leg colors ──────────────────────────────
  legColors: ColorOption[] = [
    { id: 'beige', label: 'Xám', hex: '#cfcac0' },
    { id: 'black', label: 'Đen', hex: '#111111' },
  ];

  selectedLeg = 'beige';

  selectLeg(color: ColorOption): void {
    this.selectedLeg = color.id;
  }

  // ── Chair colors ────────────────────────────
  chairColors: ColorOption[] = [
    { id: 'gray', label: 'Xám', hex: '#a9a59a' },
    { id: 'black', label: 'Đen', hex: '#111111' },
    { id: 'white', label: 'Trắng', hex: '#ffffff' },
  ];

  selectedChair = 'gray';

  get selectedChairLabel(): string {
    return this.chairColors.find((c) => c.id === this.selectedChair)?.label ?? '';
  }

  selectChair(color: ColorOption): void {
    this.selectedChair = color.id;
  }

  // ── Quantity ────────────────────────────────
  qty = 1;

  incQty(): void {
    this.qty++;
  }
  decQty(): void {
    if (this.qty > 1) this.qty--;
  }

  // ── Actions ─────────────────────────────────
  addToCart(): void {
    console.log('Add to cart', { qty: this.qty, leg: this.selectedLeg, chair: this.selectedChair });
  }

  buyNow(): void {
    console.log('Buy now', { qty: this.qty, leg: this.selectedLeg, chair: this.selectedChair });
  }

  // ─── Feature Cards ─────────────────────────────
  features: FeatureItem[] = [
    {
      title: 'Hình dạng hữu cơ',
      text: 'Không lỗi thời và đa năng, chiếc ghế mang vẻ đẹp mềm mại tự nhiên với phần eo thon gọn, hỗ trợ tư thế tuyệt vời.',
      icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10z"/>
                <path d="M8 12s1.5 2 4 2 4-2 4-2"/>
                <line x1="9" y1="9" x2="9.01" y2="9"/>
                <line x1="15" y1="9" x2="15.01" y2="9"/>
              </svg>`,
    },
    {
      title: 'Loại ghế phù hợp với bạn',
      text: 'Có sẵn phiên bản nhựa kiểu dáng tối giản, bền, hoặc bọc hoàn toàn với các chi tiết khâu để tạo sự thoải mái và phong cách.',
      icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <rect x="2" y="7" width="20" height="14" rx="2"/>
                <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
                <line x1="12" y1="12" x2="12" y2="16"/>
                <line x1="10" y1="14" x2="14" y2="14"/>
              </svg>`,
    },
    {
      title: 'Khả năng tùy biến vô tận',
      text: 'Hai loại chân để lựa chọn: chân kim loại ống mỏng hiện đại, hoặc chân gỗ tự nhiên ấm áp — giúp ghế phù hợp với mọi phong cách nội thất.',
      icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/>
                <path d="M15.54 8.46a5 5 0 010 7.07M8.46 8.46a5 5 0 000 7.07"/>
              </svg>`,
    },
  ];
}
