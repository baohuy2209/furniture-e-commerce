import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UlphosteryService } from '../../services/ulphostery-service';
import { IUpholstery } from '../../../interface';
export interface ColorVariant {
  name: string;
  hex: string;
}

export interface FabricFact {
  label: string;
  value: string;
}

export interface Fabric {
  id: number;
  name: string;
  familyName?: string;
  type: 'fabric' | 'leather' | 'velvet';
  image: string;
  description: string;
  facts: FabricFact[];
  characteristics?: string;
  maintenance?: string;
  colorVariants?: ColorVariant[];
  selected?: boolean;
}
@Component({
  selector: 'app-upholstery',
  imports: [CommonModule, FormsModule],
  templateUrl: './upholstery.html',
  styleUrl: './upholstery.css',
})
export class Upholstery implements OnInit {
  activeFilter: string = 'all';
  selectedUpholstery: Fabric | null = null;
  listUpholstery: IUpholstery[] = [];
  error: string = '';
  filterOptions = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Vải', value: 'fabric' },
    { label: 'Da', value: 'leather' },
    { label: 'Nhung', value: 'velvet' },
  ];

  fabrics: Fabric[] = [
    {
      id: 1,
      name: 'Beige Arezzo Fabric 3331',
      familyName: 'Arezzo',
      type: 'fabric',
      image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&q=80',
      description:
        'Arezzo là dòng vải cao cấp mang phong cách linen độc quyền, được dệt bởi xưởng thủ công nổi tiếng người Ý Mario Sirtori. Vải có kết cấu độc đáo tạo cảm giác ấm áp, sang trọng và gần gũi cho mọi không gian.',
      facts: [
        { label: 'Nhóm giá', value: '7' },
        { label: 'Thành phần', value: '65% PL - 35% LI STANDARD 100' },
        { label: 'Martindale', value: '55.000' },
        { label: 'Độ bền màu ánh sáng', value: '6' },
        { label: 'Trọng lượng', value: '628 g/m2' },
      ],
      characteristics:
        'Nếp nhăn nhẹ là điều tự nhiên khi vải còn mới. Tất cả các chất liệu đều thể hiện đặc tính này, mang lại vẻ đẹp và sự độc đáo riêng cho từng sản phẩm.',
      maintenance:
        'Hút bụi thường xuyên để bảo vệ bề mặt vải. Để ngăn axit từ mồ hôi làm ảnh hưởng chất liệu, khuyến nghị làm sạch toàn bộ bề mặt.',
      colorVariants: [
        { name: 'Beige Arezzo Fabric 3331', hex: '#c9b99a' },
        { name: 'Ochre Arezzo Fabric 3333', hex: '#b8843a' },
        { name: 'Light Brown Arezzo Fabric 3332', hex: '#9b7355' },
        { name: 'Green Arezzo Fabric 3334', hex: '#4a5240' },
      ],
    },
    {
      id: 2,
      name: 'Ochre Arezzo Fabric 3333',
      familyName: 'Arezzo',
      type: 'fabric',
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80',
      description:
        'Phiên bản màu Ochre của dòng Arezzo, mang sắc vàng đất ấm áp, gợi lên vẻ đẹp Địa Trung Hải tự nhiên và tinh tế.',
      facts: [
        { label: 'Nhóm giá', value: '7' },
        { label: 'Thành phần', value: '65% PL - 35% LI STANDARD 100' },
        { label: 'Martindale', value: '55.000' },
        { label: 'Độ bền màu', value: '6' },
        { label: 'Trọng lượng', value: '628 g/m2' },
      ],
      characteristics:
        'Kết cấu vải thô nhẹ tạo nên sự đặc trưng của dòng Arezzo. Màu sắc tự nhiên giúp che khuất vết bẩn nhỏ hiệu quả.',
      maintenance: 'Lau sạch vết bẩn ngay bằng khăn ẩm. Tránh dùng hóa chất tẩy mạnh.',
      colorVariants: [
        { name: 'Beige Arezzo Fabric 3331', hex: '#c9b99a' },
        { name: 'Ochre Arezzo Fabric 3333', hex: '#b8843a' },
        { name: 'Light Brown Arezzo Fabric 3332', hex: '#9b7355' },
        { name: 'Green Arezzo Fabric 3334', hex: '#4a5240' },
      ],
    },
    {
      id: 3,
      name: 'Light Brown Arezzo Fabric 3332',
      familyName: 'Arezzo',
      type: 'fabric',
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80',
      description:
        'Tông nâu nhạt dịu dàng của Arezzo tạo nên sự kết hợp hoàn hảo với các tông màu trung tính trong nội thất hiện đại.',
      facts: [
        { label: 'Nhóm giá', value: '7' },
        { label: 'Thành phần', value: '65% PL - 35% LI' },
        { label: 'Martindale', value: '55.000' },
        { label: 'Trọng lượng', value: '628 g/m2' },
      ],
      maintenance: 'Hút bụi định kỳ. Giặt khô chuyên nghiệp khi cần thiết.',
    },
    {
      id: 4,
      name: 'Green Arezzo Fabric 3334',
      familyName: 'Arezzo',
      type: 'fabric',
      image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&q=80',
      description:
        'Tông xanh rêu trầm của Arezzo mang đến sự cân bằng giữa thiên nhiên và nội thất tinh tế, phù hợp cho không gian Bắc Âu.',
      facts: [
        { label: 'Nhóm giá', value: '7' },
        { label: 'Thành phần', value: '65% PL - 35% LI' },
        { label: 'Martindale', value: '55.000' },
        { label: 'Trọng lượng', value: '628 g/m2' },
      ],
    },
    {
      id: 5,
      name: 'Camel Lucca Fabric 3324',
      familyName: 'Lucca',
      type: 'fabric',
      image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&q=80',
      description:
        'Lucca là dòng vải dệt mịn cao cấp với màu camel ấm áp, mang phong cách luxury hiện đại và bền màu xuất sắc.',
      facts: [
        { label: 'Nhóm giá', value: '5' },
        { label: 'Thành phần', value: '100% PL' },
        { label: 'Martindale', value: '80.000' },
        { label: 'Độ bền màu', value: '5' },
        { label: 'Trọng lượng', value: '420 g/m2' },
      ],
      characteristics:
        'Bề mặt mịn mượt, ít bám bụi. Phù hợp với gia đình có trẻ nhỏ hoặc thú cưng.',
      maintenance: 'Dễ vệ sinh với khăn ẩm. Có thể giặt phần bọc tháo rời ở 30°C.',
    },
    {
      id: 6,
      name: 'Stone Grey Napoli Fabric 2255',
      familyName: 'Napoli',
      type: 'fabric',
      image: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=600&q=80',
      description:
        'Napoli Stone Grey là sự kết hợp giữa sắc xám đá lạnh tĩnh lặng và chất vải cao cấp, mang lại vẻ đẹp tối giản đương đại.',
      facts: [
        { label: 'Nhóm giá', value: '6' },
        { label: 'Thành phần', value: '80% PL - 20% CO' },
        { label: 'Martindale', value: '60.000' },
        { label: 'Trọng lượng', value: '510 g/m2' },
      ],
      maintenance: 'Lau nhẹ với khăn khô. Không sử dụng chất tẩy có clo.',
    },
  ];
  constructor(
    private upholsteryService: UlphosteryService,
    private cdr: ChangeDetectorRef,
  ) {}
  get filteredFabrics(): Fabric[] {
    if (this.activeFilter === 'all') return this.fabrics;
    return this.fabrics.filter((f) => f.type === this.activeFilter);
  }

  ngOnInit(): void {
    this.upholsteryService.getAllUpholstery().subscribe({
      next: (res) => {
        this.listUpholstery = res.data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status === 404 || err.status === 400 || err.status === 401) {
          this.error = err.error?.message || 'Không tìm thây sản phẩm nào';
        } else {
          this.error = 'Có lỗi ở phía server';
        }
        this.cdr.detectChanges();
      },
    });
  }

  setFilter(value: string): void {
    this.activeFilter = value;
    this.selectedFabric = null;
  }

  openPanel(fabric: Fabric): void {
    this.selectedFabric = fabric;
  }

  closePanel(): void {
    this.selectedFabric = null;
  }
}
