import { ChangeDetectorRef, Component } from '@angular/core';
import { BlogService } from '../../services/blog-service';
import { IBlog, IBlogTag, IListBlog } from '../../../interface';
import { ActivatedRoute, Router } from '@angular/router';
import { ContentRender } from '../../components/blogs/content-render/content-render';
import { BlogTagsService } from '../../services/blog-tags-service';
import { BlogTagsComponents } from '../../components/blogs/blog-tags-components/blog-tags-components';
import { RelatedBlogs } from '../../components/blogs/related-blogs/related-blogs';

@Component({
  selector: 'app-blogs-details',
  imports: [ContentRender, BlogTagsComponents, RelatedBlogs],
  templateUrl: './blogs-details.html',
  styleUrl: './blogs-details.css',
})
export class BlogsDetails {
  // Article URL for sharing
  articleUrl: string = '';
  articleTitle: string = '';
  blog_detail: IBlog | null = null;
  blog_id: string | null = null;
  listBlogTags: IBlogTag[] = [];
  listRelatedBlogs: IListBlog[] = [];
  error: string = '';
  constructor(
    private blogService: BlogService,
    private blogTagsService: BlogTagsService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router,
  ) {}
  onStartClick(): void {
    // Add your navigation logic here
    console.log('Bắt đầu button clicked');
  }

  onLearnMoreClick(): void {
    // Add your navigation logic here
    console.log('Tìm hiểu button clicked');
  }
  onBackClick(): void {
    this.router.navigate(['/blogs']);
  }

  ngOnInit(): void {
    // Get current page URL and title
    this.blog_id = this.route.snapshot.paramMap.get('id');
    this.articleUrl = window.location.href;
    this.articleTitle = document.title || 'Bài viết về thiết kế nội thất';
    this.blogService.getDetailBlog(this.blog_id!).subscribe({
      next: (res) => {
        this.blog_detail = res.data;
        res.data.tags.forEach((tagId: string) => {
          this.blogTagsService.getDetailBlogTags(tagId).subscribe({
            next: (res) => {
              this.listBlogTags.push(res.data);
            },
            error: (err) => {
              if (err.status === 404 || err.status === 400 || err.status === 401) {
                this.error = err.error?.message || 'Không tìm thây thông tin sự kiện nào';
              } else {
                this.error = 'Có lỗi ở phía server';
              }
              this.cdr.detectChanges();
            },
          });
        });
        this.blogService.getAllRelatedBlogs(res.data.categories).subscribe({
          next: (res) => {
            this.listRelatedBlogs = res.data;
            console.log(this.listRelatedBlogs);
          },
          error: (err) => {
            if (err.status === 404 || err.status === 400 || err.status === 401) {
              this.error = err.error?.message || 'Không tìm thây thông tin sự kiện nào';
            } else {
              this.error = 'Có lỗi ở phía server';
            }
            this.cdr.detectChanges();
          },
        });
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status === 404 || err.status === 400 || err.status === 401) {
          this.error = err.error?.message || 'Không tìm thây thông tin sự kiện nào';
        } else {
          this.error = 'Có lỗi ở phía server';
        }
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Share article on Facebook
   */
  shareOnFacebook(): void {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.articleUrl)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  }

  /**
   * Share article on Pinterest
   */
  shareOnPinterest(): void {
    const pinterestUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(this.articleUrl)}&description=${encodeURIComponent(this.articleTitle)}`;
    window.open(pinterestUrl, '_blank', 'width=600,height=400');
  }

  /**
   * Copy article link to clipboard
   */
  copyLink(): void {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(this.articleUrl)
        .then(() => {
          alert('Đã sao chép link!');
        })
        .catch((err) => {
          console.error('Failed to copy: ', err);
          this.fallbackCopyLink();
        });
    } else {
      this.fallbackCopyLink();
    }
  }

  /**
   * Fallback method for copying link (older browsers)
   */
  private fallbackCopyLink(): void {
    const textArea = document.createElement('textarea');
    textArea.value = this.articleUrl;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      alert('Đã sao chép link!');
    } catch (err) {
      console.error('Failed to copy: ', err);
      alert('Không thể sao chép link. Vui lòng copy thủ công.');
    }

    document.body.removeChild(textArea);
  }

  /**
   * Handle register button click
   */
  onRegisterClick(): void {
    // Navigate to registration page or open registration modal
    console.log('Register button clicked');
    // Example: this.router.navigate(['/register']);
    // Or open a modal: this.modalService.open(RegistrationModalComponent);
  }
  formatDateTime(dateStr: string | Date) {
    const date = new Date(dateStr);

    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  formatNumber(num: number): string {
    return new Intl.NumberFormat('vi-VN').format(num);
  }
}
