import { Component } from '@angular/core';

@Component({
  selector: 'app-blogs-details',
  imports: [],
  templateUrl: './blogs-details.html',
  styleUrl: './blogs-details.css',
})
export class BlogsDetails {
  // Article URL for sharing
  articleUrl: string = '';
  articleTitle: string = '';
  onStartClick(): void {
    // Add your navigation logic here
    console.log('Bắt đầu button clicked');
  }

  onLearnMoreClick(): void {
    // Add your navigation logic here
    console.log('Tìm hiểu button clicked');
  }

  ngOnInit(): void {
    // Get current page URL and title
    this.articleUrl = window.location.href;
    this.articleTitle = document.title || 'Bài viết về thiết kế nội thất';
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
}
