import { Component } from '@angular/core';
import { HeroSection } from '../../components/home/hero-section/hero-section';
import { Faq } from '../../components/home/faq/faq';
import { Features } from '../../components/home/features/features';
import { BestSellerProducts } from '../../components/home/best-seller-products/best-seller-products';
import { Testimonial } from '../../components/home/testimonial/testimonial';
import { NewProduct } from '../../components/home/new-product/new-product';
import { BlogSection } from '../../components/home/blog-section/blog-section';
import { GoldenWeek } from '../../components/home/golden-week/golden-week';
import { DiscountProducts } from '../../components/home/discount-products/discount-products';
import { FlashSale } from '../../components/home/flash-sale/flash-sale';

@Component({
  selector: 'app-home',
  imports: [
    HeroSection,
    Faq,
    Features,
    BestSellerProducts,
    Testimonial,
    BlogSection,
    NewProduct,
    GoldenWeek,
    DiscountProducts,
    FlashSale,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {}
