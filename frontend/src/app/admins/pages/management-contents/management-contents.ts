import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

interface BLOG_POSTS {
  post_id: string;
  blog_category_id: string;
  title: string;
  slug: string;
  content: string;
  thumbnail_url: string;
  post_status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
  is_deleted?: boolean;
}

interface BLOG_CATEGORIES {
  category_id: string;
  name: string;
  slug: string;
  description: string;
}

interface BLOG_TAGS {
  tag_id: string;
  name: string;
  slug: string;
}

interface BLOG_POST_TAGS {
  post_id: string;
  tag_id: string;
}

interface BLOG_IMAGES {
  blog_image_id: string;
  post_id: string;
  image_url: string;
  uploaded_at: string;
}

@Component({
  standalone: true,
  selector: 'management-contents',
  imports: [CommonModule, FormsModule],
  templateUrl: './management-contents.html',
  styleUrls: ['./management-contents.css'],
})
export class ManagementContents implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  mode: 'list' | 'create' | 'edit' = 'list';

  posts$ = new BehaviorSubject<BLOG_POSTS[]>([]);
  categories$ = new BehaviorSubject<BLOG_CATEGORIES[]>([]);
  tags$ = new BehaviorSubject<BLOG_TAGS[]>([]);
  postTags$ = new BehaviorSubject<BLOG_POST_TAGS[]>([]);
  images$ = new BehaviorSubject<BLOG_IMAGES[]>([]);

  search = '';
  selectedCategory = '';
  selectedStatus = '';

  currentPost: BLOG_POSTS | null = null;
  selectedTagIds: string[] = [];
  uploadedImages: BLOG_IMAGES[] = [];

  ngOnInit() {
    this.seedMockData();
    this.route.queryParams.subscribe((params) => {
      this.mode = params['mode'] || 'list';
      const id = params['id'];
      if (this.mode === 'edit' && id) {
        this.loadEdit(id);
      }
    });
  }

  seedMockData() {
    const categories: BLOG_CATEGORIES[] = [
      { category_id: 'c1', name: 'Tin tức', slug: 'tin-tuc', description: '' },
      { category_id: 'c2', name: 'Khuyến mãi', slug: 'khuyen-mai', description: '' },
    ];

    const tags: BLOG_TAGS[] = [
      { tag_id: 't1', name: 'Sofa', slug: 'sofa' },
      { tag_id: 't2', name: 'Decor', slug: 'decor' },
    ];

    const posts: BLOG_POSTS[] = [
      {
        post_id: 'p1',
        blog_category_id: 'c1',
        title: 'Xu hướng nội thất 2026',
        slug: 'xu-huong-noi-that-2026',
        content: 'Lorem ipsum...',
        thumbnail_url: 'https://picsum.photos/100',
        post_status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    this.categories$.next(categories);
    this.tags$.next(tags);
    this.posts$.next(posts);
  }

  generateSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '');
  }

  filterPosts() {
    return this.posts$
      .getValue()
      .filter((p) => !p.is_deleted)
      .filter((p) =>
        this.search ? p.title.toLowerCase().includes(this.search.toLowerCase()) : true,
      )
      .filter((p) => (this.selectedCategory ? p.blog_category_id === this.selectedCategory : true))
      .filter((p) => (this.selectedStatus ? p.post_status === this.selectedStatus : true));
  }

  goCreate() {
    this.router.navigate([], { queryParams: { mode: 'create' } });
  }

  goEdit(id: string) {
    this.router.navigate([], { queryParams: { mode: 'edit', id } });
  }

  backToList() {
    this.router.navigate([], { queryParams: { mode: 'list' } });
  }

  loadEdit(id: string) {
    const post = this.posts$.getValue().find((p) => p.post_id === id);
    if (!post) return;
    this.currentPost = { ...post };
    this.selectedTagIds = this.postTags$
      .getValue()
      .filter((pt) => pt.post_id === id)
      .map((pt) => pt.tag_id);
    this.uploadedImages = this.images$.getValue().filter((img) => img.post_id === id);
  }

  toggleTag(tagId: string) {
    if (this.selectedTagIds.includes(tagId)) {
      this.selectedTagIds = this.selectedTagIds.filter((id) => id !== tagId);
    } else {
      this.selectedTagIds.push(tagId);
    }
  }

  addImage(url: string) {
    if (!this.currentPost) return;
    const newImage: BLOG_IMAGES = {
      blog_image_id: crypto.randomUUID(),
      post_id: this.currentPost.post_id,
      image_url: url,
      uploaded_at: new Date().toISOString(),
    };
    this.uploadedImages.push(newImage);
  }

  savePost() {
    if (!this.currentPost) return;

    const now = new Date().toISOString();
    if (this.mode === 'create') {
      this.currentPost.post_id = crypto.randomUUID();
      this.currentPost.created_at = now;
      this.posts$.next([...this.posts$.getValue(), this.currentPost]);
    } else {
      const updated = this.posts$
        .getValue()
        .map((p) => (p.post_id === this.currentPost!.post_id ? this.currentPost! : p));
      this.posts$.next(updated);
    }

    this.postTags$.next(
      this.postTags$
        .getValue()
        .filter((pt) => pt.post_id !== this.currentPost!.post_id)
        .concat(
          this.selectedTagIds.map((tagId) => ({
            post_id: this.currentPost!.post_id,
            tag_id: tagId,
          })),
        ),
    );

    this.images$.next(
      this.images$
        .getValue()
        .filter((img) => img.post_id !== this.currentPost!.post_id)
        .concat(this.uploadedImages),
    );

    this.backToList();
  }

  softDelete(id: string) {
    const updated = this.posts$
      .getValue()
      .map((p) => (p.post_id === id ? { ...p, is_deleted: true } : p));
    this.posts$.next(updated);
  }
}
