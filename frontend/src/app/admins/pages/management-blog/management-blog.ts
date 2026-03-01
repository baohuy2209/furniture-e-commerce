import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, combineLatest, map } from 'rxjs';

type Mode = 'list' | 'detail' | 'edit';
type SortDir = 'asc' | 'desc';
type SortKey = 'title' | 'status' | 'category' | 'author' | 'published_at' | 'updated_at' | 'views';

type BlogStatus = 'draft' | 'published' | 'archived';

interface BlogEntity {
  blog_id: string;
  title: string;
  slug: string;
  status: BlogStatus;

  cover_url: string;
  excerpt: string;
  content_html: string;

  category: string;
  tags: string[];

  author_name: string;
  reading_minutes: number;

  views: number;
  featured: boolean;

  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface BlogRowVM {
  blog_id: string;
  title: string;
  slug: string;

  status: BlogStatus;
  statusLabel: string;
  statusClass: string;

  category: string;
  author_name: string;

  tagsText: string;

  views: number;
  viewsText: string;

  publishedAtText: string;
  updatedAtText: string;

  cover_url: string;
  excerpt: string;
}

interface BlogDetailVM {
  blog: BlogEntity;
  statusLabel: string;
  statusClass: string;

  publishedAtText: string;
  updatedAtText: string;

  tagsText: string;
  readingText: string;
  viewsText: string;
}

interface VM {
  mode: Mode;
  selectedId: string | null;
  detail: BlogDetailVM | null;
  editModel: Partial<BlogEntity> | null;

  // list
  rows: BlogRowVM[];
  total: number;
  showingFrom: number;
  showingTo: number;

  // meta
  page: number;
  pageSize: number;
  totalPages: number;
  sortBy: SortKey;
  sortDir: SortDir;

  // filter options
  categories: string[];
  authors: string[];

  // KPI cards
  kpiTotal: number;
  kpiPublished: number;
  kpiDraft: number;
  kpiViews: number;
  kpiViewsText: string;

  // detail/edit summary cards
  kpiDetailStatusLabel?: string;
  kpiDetailViewsText?: string;
  kpiDetailReadingText?: string;
  kpiDetailPublishedText?: string;
}

@Component({
  selector: 'app-management-blog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './management-blog.html',
  styleUrls: ['./management-blog.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagementBlog implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  @ViewChild('editor') editorRef?: ElementRef<HTMLElement>;

  // ====== store (mock now, API later) ======
  private blogs$ = new BehaviorSubject<BlogEntity[]>(MOCK_BLOGS);

  // ====== route state (source of truth): ?mode=list|detail|edit&id=... ======
  private routeState$ = new BehaviorSubject<{ mode: Mode; id: string | null }>({
    mode: 'list',
    id: null,
  });

  // ====== detail/edit ======
  private detail$ = new BehaviorSubject<BlogDetailVM | null>(null);
  private editModel$ = new BehaviorSubject<Partial<BlogEntity> | null>(null);

  // ====== filters (bind UI) ======
  q = '';
  f_status: '' | BlogStatus = '';
  f_category = '';
  f_author = '';
  f_featured: '' | 'true' | 'false' = '';
  f_from = ''; // yyyy-mm-dd
  f_to = ''; // yyyy-mm-dd

  private q$ = new BehaviorSubject<string>('');
  private status$ = new BehaviorSubject<'' | BlogStatus>('');
  private category$ = new BehaviorSubject<string>('');
  private author$ = new BehaviorSubject<string>('');
  private featured$ = new BehaviorSubject<'' | 'true' | 'false'>('');
  private from$ = new BehaviorSubject<string>('');
  private to$ = new BehaviorSubject<string>('');

  // ====== paging ======
  page = 1;
  pageSize = 10;
  private page$ = new BehaviorSubject<number>(1);
  private pageSize$ = new BehaviorSubject<number>(10);

  // ====== sorting ======
  private sortBy$ = new BehaviorSubject<SortKey>('updated_at');
  private sortDir$ = new BehaviorSubject<SortDir>('desc');

  // ====== cover upload preview (edit) ======
  coverUploadName = '';
  coverUploadError = '';

  // ====== VM pipeline ======
  vm$ = combineLatest([
    this.blogs$,
    this.routeState$,
    this.detail$,
    this.editModel$,

    this.q$,
    this.status$,
    this.category$,
    this.author$,
    this.featured$,
    this.from$,
    this.to$,

    this.page$,
    this.pageSize$,
    this.sortBy$,
    this.sortDir$,
  ]).pipe(
    map(
      ([
        blogs,
        routeState,
        detail,
        editModel,

        q,
        fStatus,
        fCategory,
        fAuthor,
        fFeatured,
        from,
        to,

        page,
        pageSize,
        sortBy,
        sortDir,
      ]) => {
        const mode = routeState.mode;
        const selectedId = routeState.id;

        const categories = uniq(blogs.map((b) => b.category).filter(Boolean)).sort((a, b) =>
          a.localeCompare(b, 'vi'),
        );
        const authors = uniq(blogs.map((b) => b.author_name).filter(Boolean)).sort((a, b) =>
          a.localeCompare(b, 'vi'),
        );

        // KPIs
        const kpiTotal = blogs.length;
        const kpiPublished = blogs.filter((b) => b.status === 'published').length;
        const kpiDraft = blogs.filter((b) => b.status === 'draft').length;
        const kpiViews = blogs.reduce((acc, b) => acc + (Number(b.views) || 0), 0);

        const baseRows: BlogRowVM[] = blogs.map((b) => ({
          blog_id: b.blog_id,
          title: b.title,
          slug: b.slug,
          status: b.status,
          statusLabel: statusLabel(b.status),
          statusClass: statusClass(b.status),
          category: b.category,
          author_name: b.author_name,
          tagsText:
            (b.tags ?? []).slice(0, 3).join(', ') +
            ((b.tags ?? []).length > 3 ? ` (+${(b.tags ?? []).length - 3})` : ''),
          views: b.views,
          viewsText: formatNumber(b.views),
          publishedAtText: b.published_at ? fmtDate(b.published_at) : '—',
          updatedAtText: fmtDate(b.updated_at),
          cover_url: b.cover_url,
          excerpt: b.excerpt,
        }));

        // Filters
        const key = (q || '').trim().toLowerCase();
        let filtered = baseRows
          .filter((r) => (fStatus ? r.status === fStatus : true))
          .filter((r) => (fCategory ? r.category === fCategory : true))
          .filter((r) => (fAuthor ? r.author_name === fAuthor : true))
          .filter((r) => {
            if (!fFeatured) return true;
            const b = blogs.find((x) => x.blog_id === r.blog_id);
            return fFeatured === 'true' ? !!b?.featured : !b?.featured;
          })
          .filter((r) => {
            const b = blogs.find((x) => x.blog_id === r.blog_id);
            const pub = b?.published_at ? new Date(b.published_at) : null;

            if (from) {
              const fromD = new Date(from + 'T00:00:00');
              if (pub && pub < fromD) return false;
              if (!pub && fStatus === 'published') return false;
            }
            if (to) {
              const toD = new Date(to + 'T23:59:59');
              if (pub && pub > toD) return false;
            }
            return true;
          })
          .filter((r) => {
            if (!key) return true;
            const b = blogs.find((x) => x.blog_id === r.blog_id);
            const hay = `${r.title} ${r.slug} ${r.category} ${r.author_name} ${(b?.tags ?? []).join(
              ' ',
            )}`.toLowerCase();
            return hay.includes(key);
          });

        // Sort
        filtered = filtered.sort((a, b) => {
          const dir = sortDir === 'asc' ? 1 : -1;
          const av = getSortValue(a, blogs, sortBy);
          const bv = getSortValue(b, blogs, sortBy);
          if (av < bv) return -1 * dir;
          if (av > bv) return 1 * dir;
          return 0;
        });

        const total = filtered.length;
        const totalPages = Math.max(1, Math.ceil(total / pageSize));
        const safePage = Math.min(Math.max(1, page), totalPages);
        const fromIdx = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
        const toIdx = Math.min(total, safePage * pageSize);
        const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

        // Detail/Edit summary cards
        const d = detail;
        const kpiDetailStatusLabel = d?.statusLabel ?? undefined;
        const kpiDetailViewsText = d?.viewsText ?? undefined;
        const kpiDetailReadingText = d?.readingText ?? undefined;
        const kpiDetailPublishedText = d?.publishedAtText ?? undefined;

        const vm: VM = {
          mode,
          selectedId,
          detail,
          editModel,

          rows,
          total,
          showingFrom: fromIdx,
          showingTo: toIdx,

          page: safePage,
          pageSize,
          totalPages,
          sortBy,
          sortDir,

          categories,
          authors,

          kpiTotal,
          kpiPublished,
          kpiDraft,
          kpiViews,
          kpiViewsText: formatNumber(kpiViews),

          kpiDetailStatusLabel,
          kpiDetailViewsText,
          kpiDetailReadingText,
          kpiDetailPublishedText,
        };

        return vm;
      },
    ),
  );

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((pm) => {
      const modeRaw = (pm.get('mode') as Mode) || 'list';
      const mode: Mode = modeRaw === 'detail' || modeRaw === 'edit' ? modeRaw : 'list';
      const id = pm.get('id');

      this.routeState$.next({ mode, id: id || null });

      if (mode === 'list') {
        this.detail$.next(null);
        this.editModel$.next(null);
        this.coverUploadName = '';
        this.coverUploadError = '';
        return;
      }

      if (!id) {
        this.goList();
        return;
      }

      const blog = this.blogs$.value.find((b) => b.blog_id === id) ?? null;
      if (!blog) {
        this.goList();
        return;
      }

      const detailVM: BlogDetailVM = {
        blog,
        statusLabel: statusLabel(blog.status),
        statusClass: statusClass(blog.status),
        publishedAtText: blog.published_at ? fmtDate(blog.published_at) : '—',
        updatedAtText: fmtDate(blog.updated_at),
        tagsText: (blog.tags ?? []).join(', ') || '—',
        readingText: `${Math.max(1, Number(blog.reading_minutes || 1))} phút`,
        viewsText: formatNumber(blog.views),
      };
      this.detail$.next(detailVM);

      if (mode === 'edit') {
        const cur = this.editModel$.value;
        if (!cur || (cur as any).blog_id !== blog.blog_id) {
          this.editModel$.next(cloneBlog(blog));
          this.coverUploadName = '';
          this.coverUploadError = '';
        }
      } else {
        this.editModel$.next(null);
      }
    });
  }

  // ===== filters
  onChangeQ(v: string) {
    this.q = v ?? '';
    this.q$.next(this.q);
    this.setPage(1);
  }
  onChangeStatus(v: '' | BlogStatus) {
    this.f_status = v;
    this.status$.next(v);
    this.setPage(1);
  }
  onChangeCategory(v: string) {
    this.f_category = v ?? '';
    this.category$.next(this.f_category);
    this.setPage(1);
  }
  onChangeAuthor(v: string) {
    this.f_author = v ?? '';
    this.author$.next(this.f_author);
    this.setPage(1);
  }
  onChangeFeatured(v: '' | 'true' | 'false') {
    this.f_featured = v;
    this.featured$.next(v);
    this.setPage(1);
  }
  onChangeFrom(v: string) {
    this.f_from = v ?? '';
    this.from$.next(this.f_from);
    this.setPage(1);
  }
  onChangeTo(v: string) {
    this.f_to = v ?? '';
    this.to$.next(this.f_to);
    this.setPage(1);
  }
  onChangePageSize(v: number) {
    this.pageSize = Number(v);
    this.pageSize$.next(this.pageSize);
    this.setPage(1);
  }

  resetFilters() {
    this.q = '';
    this.f_status = '';
    this.f_category = '';
    this.f_author = '';
    this.f_featured = '';
    this.f_from = '';
    this.f_to = '';

    this.q$.next('');
    this.status$.next('');
    this.category$.next('');
    this.author$.next('');
    this.featured$.next('');
    this.from$.next('');
    this.to$.next('');

    this.sortBy$.next('updated_at');
    this.sortDir$.next('desc');

    this.pageSize = 10;
    this.pageSize$.next(10);
    this.setPage(1);
  }

  // ===== paging/sort
  setPage(p: number) {
    this.page = p;
    this.page$.next(p);
  }

  toggleSort(key: SortKey) {
    const curKey = this.sortBy$.value;
    const curDir = this.sortDir$.value;
    if (curKey === key) this.sortDir$.next(curDir === 'asc' ? 'desc' : 'asc');
    else {
      this.sortBy$.next(key);
      this.sortDir$.next('asc');
    }
  }

  // ===== route actions
  goList() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { mode: 'list', id: null },
      queryParamsHandling: 'merge',
    });
  }

  openDetail(id: string) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { mode: 'detail', id },
      queryParamsHandling: 'merge',
    });
  }

  enterEdit() {
    const id = this.routeState$.value.id;
    if (!id) return;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { mode: 'edit', id },
      queryParamsHandling: 'merge',
    });
  }

  cancelEdit() {
    const id = this.routeState$.value.id;
    if (!id) return this.goList();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { mode: 'detail', id },
      queryParamsHandling: 'merge',
    });
  }

  createNew() {
    const id = `b_${id16()}`;
    const now = new Date().toISOString();
    const draft: BlogEntity = {
      blog_id: id,
      title: 'Bài viết mới',
      slug: '',
      status: 'draft',
      cover_url:
        'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=60',
      excerpt: '',
      content_html: '<p>Nhập nội dung...</p>',
      category: '',
      tags: [],
      author_name: 'Admin',
      reading_minutes: 5,
      views: 0,
      featured: false,
      published_at: null,
      created_at: now,
      updated_at: now,
    };

    this.blogs$.next([draft, ...this.blogs$.value]);
    this.openDetail(id);
    this.enterEdit();
  }

  // ===== content editor (NO CAST IN TEMPLATE) =====
  applyEditorCmd(cmd: string, value?: string) {
    try {
      document.execCommand(cmd, false, value);
    } catch {}
  }

  promptLink() {
    const url = window.prompt('Nhập URL:', 'https://');
    if (!url) return;
    this.applyEditorCmd('createLink', url);
  }

  /** Called from template: (input)="onEditorInput(editor)" */
  onEditorInput(editorEl: HTMLElement) {
    const em = this.editModel$.value;
    if (!em) return;
    (em as any).content_html = editorEl?.innerHTML ?? '';
  }

  // ===== cover upload (mock) =====
  onCoverFileSelected(em: Partial<BlogEntity>, ev: Event) {
    this.coverUploadError = '';
    const input = ev.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;

    const okType =
      file.type === 'image/png' ||
      file.type === 'image/jpeg' ||
      file.type === 'image/webp' ||
      file.type === 'image/gif';
    if (!okType) {
      this.coverUploadError = 'Chỉ hỗ trợ PNG/JPG/WEBP/GIF.';
      if (input) input.value = '';
      return;
    }

    const maxMB = 4;
    if (file.size > maxMB * 1024 * 1024) {
      this.coverUploadError = `File quá lớn. Tối đa ${maxMB}MB.`;
      if (input) input.value = '';
      return;
    }

    this.coverUploadName = file.name;

    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result || '');
      (em as any).cover_url = url; // dataURL
    };
    reader.readAsDataURL(file);
  }

  clearCoverUpload() {
    this.coverUploadName = '';
    this.coverUploadError = '';
  }

  // ===== tags helpers
  getTagsText(em: Partial<BlogEntity>) {
    const tags = (em as any).tags as string[] | undefined;
    return (tags ?? []).join(', ');
  }

  onTagsInput(em: Partial<BlogEntity>, v: string) {
    const tags = (v || '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    (em as any).tags = tags;
  }

  // ===== save
  saveEdit() {
    const em = this.editModel$.value;
    const id = this.routeState$.value.id;
    if (!em || !id) return;

    const title = String((em as any).title ?? '').trim();
    if (!title) return;

    let slug = String((em as any).slug ?? '').trim();
    if (!slug) slug = slugify(title);

    const now = new Date().toISOString();

    const next: BlogEntity[] = this.blogs$.value.map((b) => {
      if (b.blog_id !== id) return b;

      const status = ((em as any).status ?? b.status) as BlogStatus;

      let published_at = (em as any).published_at ?? b.published_at ?? null;
      if (status === 'published' && !published_at) published_at = now;
      if (status !== 'published') published_at = null;

      return {
        ...b,
        ...em,
        title,
        slug,
        status,
        published_at,
        updated_at: now,
      } as BlogEntity;
    });

    this.blogs$.next(next);
    this.clearCoverUpload();
    this.cancelEdit();
  }

  // ===== export csv
  exportCsv() {
    const rows = this.blogs$.value.map((b) => ({
      blog_id: b.blog_id,
      title: b.title,
      slug: b.slug,
      status: b.status,
      category: b.category,
      author_name: b.author_name,
      featured: b.featured,
      views: b.views,
      published_at: b.published_at ?? '',
      updated_at: b.updated_at,
      created_at: b.created_at,
      tags: (b.tags ?? []).join('|'),
    }));

    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `blogs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  }

  stopEvent(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
  }
}

/** ===== helpers ===== */
function cloneBlog(b: BlogEntity): BlogEntity {
  return JSON.parse(JSON.stringify(b));
}

function statusLabel(s: BlogStatus) {
  if (s === 'published') return 'Published';
  if (s === 'archived') return 'Archived';
  return 'Draft';
}

function statusClass(s: BlogStatus) {
  if (s === 'published') return 'pill-ok';
  if (s === 'archived') return 'pill-muted';
  return 'pill-warn';
}

function uniq(arr: string[]) {
  return Array.from(new Set(arr));
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

function formatNumber(v: any) {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return '0';
  return n.toLocaleString('vi-VN');
}

function getSortValue(r: BlogRowVM, blogs: BlogEntity[], key: SortKey): any {
  const b = blogs.find((x) => x.blog_id === r.blog_id);
  switch (key) {
    case 'title':
      return r.title.toLowerCase();
    case 'status':
      return r.status;
    case 'category':
      return (r.category || '').toLowerCase();
    case 'author':
      return (r.author_name || '').toLowerCase();
    case 'views':
      return r.views || 0;
    case 'published_at':
      return b?.published_at ? +new Date(b.published_at) : 0;
    case 'updated_at':
      return +new Date(b?.updated_at || new Date().toISOString());
  }
}

function slugify(s: string) {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function toCsv(rows: Array<Record<string, any>>) {
  const keys = Object.keys(rows[0] || {});
  const esc = (v: any) => {
    const s = String(v ?? '');
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const head = keys.join(',');
  const lines = rows.map((r) => keys.map((k) => esc(r[k])).join(','));
  return [head, ...lines].join('\n');
}

function id16() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

/** ===== mock data ===== */
const MOCK_BLOGS: BlogEntity[] = [
  {
    blog_id: 'B001',
    title: '5 tips phối màu cho phòng khách hiện đại',
    slug: '5-tips-phoi-mau-phong-khach-hien-dai',
    status: 'published',
    cover_url:
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=60',
    excerpt: 'Gợi ý phối màu dễ áp dụng giúp phòng khách trông rộng, sáng và có điểm nhấn.',
    content_html:
      '<h2>1) Chọn 1 màu chủ đạo</h2><p>Hãy chọn một màu nền...</p><ul><li>Trắng/kem</li><li>Be/xám</li></ul><p><b>Mẹo:</b> dùng 60-30-10.</p>',
    category: 'Phối màu',
    tags: ['phoi-mau', 'phong-khach', 'modern'],
    author_name: 'Admin',
    reading_minutes: 6,
    views: 12540,
    featured: true,
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    blog_id: 'B002',
    title: 'Decor góc làm việc tối giản nhưng vẫn “đã mắt”',
    slug: 'decor-goc-lam-viec-toi-gian',
    status: 'draft',
    cover_url:
      'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1200&q=60',
    excerpt: 'Bố cục tối giản, ánh sáng hợp lý và vài chi tiết nhấn là đủ.',
    content_html: '<p>Nhập nội dung...</p>',
    category: 'Decor',
    tags: ['decor', 'workspace', 'minimal'],
    author_name: 'Admin',
    reading_minutes: 5,
    views: 0,
    featured: false,
    published_at: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    blog_id: 'B003',
    title: 'Xu hướng nội thất 2026: đường cong, vật liệu thô và tông đất',
    slug: 'xu-huong-noi-that-2026',
    status: 'published',
    cover_url:
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=60',
    excerpt: 'Curved furniture, stone/wood textures và palette tông đất lên ngôi.',
    content_html:
      '<p>2026 tiếp tục là năm của <i>organic shapes</i>...</p><h3>Vật liệu</h3><p>Gỗ, đá, linen...</p>',
    category: 'Xu hướng',
    tags: ['trend', '2026', 'organic'],
    author_name: 'Editor',
    reading_minutes: 7,
    views: 8421,
    featured: false,
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 22).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
  },
  {
    blog_id: 'B004',
    title: 'Checklist chọn sofa: kích thước, chất liệu, phối màu',
    slug: 'checklist-chon-sofa',
    status: 'archived',
    cover_url:
      'https://images.unsplash.com/photo-1549187774-b4e9b0445b41?auto=format&fit=crop&w=1200&q=60',
    excerpt: 'Chọn sofa đúng size và chất liệu giúp không gian “đúng vibe” hơn.',
    content_html: '<p>Nội dung cũ (archived)...</p>',
    category: 'Hướng dẫn',
    tags: ['sofa', 'guide'],
    author_name: 'Admin',
    reading_minutes: 5,
    views: 2320,
    featured: false,
    published_at: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40).toISOString(),
  },
];
