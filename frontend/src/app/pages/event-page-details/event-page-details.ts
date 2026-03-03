import { Component, afterNextRender } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Meta } from '@angular/platform-browser';
import { EventRegistrationModal } from '../../components/events/event-registration-modal/event-registration-modal';
@Component({
  selector: 'app-event-page-details',
  standalone: true,
  imports: [CommonModule, RouterModule, EventRegistrationModal],
  templateUrl: './event-page-details.html',
  styleUrl: './event-page-details.css',
})
export class EventPageDetails {
  isModalOpen = false;

  event = {
    event_id: 999,
    event_name: 'Interior Art Expo 2025',
    description: 'Triển lãm nghệ thuật nội thất & thiết kế đương đại',
    date: { day: 15, month: 3, year: 2025 },
    time: '09:00 - 18:00',
    location: 'SECC - Quận 7, TP.HCM',
    thumbnail_image: '/images/event/event_images1.jpg',
    event_status: 'UPCOMING',
    event_type: 'EXHIBITION',
    price: 0,
    max_participants: 200,
    stats: {
      attendees: 47,
      brands: 100,
      workshops: 5,
    },
    highlights: [
      'Hơn 100 thương hiệu nội thất cao cấp tham gia',
      'Triển lãm các bộ sưu tập nội thất độc quyền',
      'Workshop về thiết kế không gian sống hiện đại',
      'Gặp gỡ và tư vấn với các kiến trúc sư, nhà thiết kế nổi tiếng',
      'Ưu đãi đặc biệt lên đến 50% cho khách tham dự',
      'Không gian trải nghiệm thực tế với công nghệ AR/VR',
    ],
    timeline: [
      {
        time: '09:00 - 10:00',
        title: 'Khai mạc & Chào Mừng',
        description: 'Lễ khai mạc chính thức với sự tham gia của các đối tác và khách mời VIP',
      },
      {
        time: '10:00 - 12:00',
        title: 'Tham quan triển lãm',
        description: 'Khám phá hơn 100 gian hàng với các sản phẩm nội thất cao cấp',
      },
      {
        time: '12:00 - 13:30',
        title: 'Nghỉ trưa & Networking',
        description: 'Buffet trưa và cơ hội kết nối với các chuyên gia trong ngành',
      },
      {
        time: '13:30 - 15:30',
        title: 'Workshop thiết kế',
        description: 'Hướng dẫn thực hành về xu hướng thiết kế nội thất 2025',
      },
      {
        time: '15:30 - 17:00',
        title: 'Tọa đàm & Q&A',
        description: 'Gặp gỡ và đặt câu hỏi với các kiến trúc sư, nhà thiết kế nổi tiếng',
      },
      {
        time: '17:00 - 18:00',
        title: 'Bế mạc & Trao giải',
        description: 'Công bố kết quả cuộc thi thiết kế và trao giải thưởng',
      },
    ],
  };

  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private meta: Meta,
  ) {
    // In a real app, we would fetch event by ID from route.params
    // const id = this.route.snapshot.paramMap.get('id');
    // this.fetchEvent(id);
    this.meta.updateTag({ name: 'description', content: this.event.description });
  }

  goBack() {
    this.location.back();
  }

  openRegisterModal() {
    this.isModalOpen = true;
  }

  closeRegisterModal() {
    this.isModalOpen = false;
  }
}
