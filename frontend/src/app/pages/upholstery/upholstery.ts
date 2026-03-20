import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UlphosteryService } from '../../services/ulphostery-service';
import { IUpholstery } from '../../../interface';
@Component({
  selector: 'app-upholstery',
  imports: [CommonModule, FormsModule],
  templateUrl: './upholstery.html',
  styleUrl: './upholstery.css',
})
export class Upholstery implements OnInit {
  activeFilter: string = 'all';
  selectedUpholstery: IUpholstery | null = null;
  listUpholstery: IUpholstery[] = [];
  error: string = '';
  filterOptions = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Vải', value: 'Fabric' },
    { label: 'Da', value: 'Leather' },
  ];
  constructor(
    private upholsteryService: UlphosteryService,
    private cdr: ChangeDetectorRef,
  ) {}
  filteredUpholstery(): IUpholstery[] {
    if (this.activeFilter === 'all') return this.listUpholstery;
    return this.listUpholstery.filter((f) => f.material === this.activeFilter);
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
    this.selectedUpholstery = null;
  }

  openPanel(upholstery: IUpholstery): void {
    this.selectedUpholstery = upholstery;
  }

  closePanel(): void {
    this.selectedUpholstery = null;
  }
}
