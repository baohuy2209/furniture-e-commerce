import { ContentBlock } from './contentTypeBlock';

export interface IHeroItem {
  image: string;
}

export interface IUser {
  _id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  gender?: string;
  avatar?: string;
  status: string;
  last_login?: Date;
  is_verified?: boolean;
  points: number;
  roles: string[];
  dob: string;
  createdAt: Date;
}
export interface ILogin {
  id: string;
  username: string;
  email: string;
  roles: string[];
  accessToken: string;
}
export interface IProductTag {
  _id: string;
  name: string;
  slug: string;
  description: string;
}
export interface IProductCategory {
  _id: string;
  name: string;
  slug: string;
  type: 'product_type' | 'room_type';
}
export interface IListProducts {
  _id: string;
  product_name: string;
  description: string;
  discount_percent: number;
  tags: string;
  price: number;
  num_selled: number;
  rating: number;
  main_image: string;
  categories: string[];
}
export interface IListEvent {}
export interface Iproduct {
  _id: string;
  product_name: string;
  brand: string;
  description: string;
  discount_percent: number;
  is_assembly: boolean;
  warranty: number;
  tags: string[];
  product_component: {
    [key: string]: any;
  };
  important_functions: string[];
  categories: string[];
  image_url: string[];
  search_text: string;
}
export interface Iproduct_variants {
  _id: string;
  product: string;
  sku: string;
  price: number;
  weight: number;
  num_inventory: number;
  num_selled: number;
  designed_by: string;
  rating: {
    average: number;
    count: number;
  };
  expected_delivery: string;
  is_default: boolean;
  measurement: {
    [key: string]: any;
  };
}
export interface Iproduct_variants_image {
  _id: string;
  product_varant: string;
  url: string;
  is_main: boolean;
  position: number;
}
export interface Idetail_product {
  product: Iproduct;
  product_variants: Iproduct_variants[];
  list_product_variants_image: Record<string, Iproduct_variants_image[]>;
}

export interface IListBlog {
  _id: string;
  title: string;
  thumbnail_url: {
    url: string;
    alt: string;
  };
  description: string;
  activity: {
    total_likes: number;
    total_reads: number;
    total_comments: number;
  };
  categories: string;
  time_reads: number;
  publishedAt: Date;
}
export interface IUpholstery {
  _id: string;
  name: string;
  fabric_name: string;
  color: string;
  material: string;
  image: string;
}
export interface IWarrantyRequest {
  _id: string;
  user_id: string;
  request_date: Date;
  fullname: string;
  email: string;
  phone: string;
  issue_description: string;
  warranty_status: string;
  approved_by: string;
  approved_data: Date;
  resolution_note: string;
  completed_date: Date;
  product_variant_id: string;
}
export interface IWarrantyImage {
  _id: string;
  warranty_request_id: string;
  image_url: string[];
}
export interface IReview {
  _id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comments: string;
  images: string[];
}
export interface IEvent {
  _id: string;
  title: string;
  slug: string;
  description: string;
  images: {
    url_image: string;
    is_main: string;
  }[];
  category: string;
  hightlight_des: string[];
  date_range: {
    startDate: Date;
    endDate: Date;
  };
  location: {
    name: string;
    address: string;
    city: string;
  };
  timeline_event: {
    start_time: string;
    end_time: string;
    title: string;
    description: string;
  }[];
  registration: {
    requireRegister: boolean;
    isFree: boolean;
    maxSlot: number;
    registeredCount: number;
  };
  status: string;
}
export interface IRegisterEvent {
  _id: string;
  event_id: string;
  fullname: string;
  email: string;
  phone: string;
  note: string;
}
export interface ICart {
  _id: string;
  user_id: string;
  cart_status: string;
  total_item: number;
  total_amount: number;
}
export interface ICartItem {
  _id: string;
  cart_id: string;
  product_variant_id: string;
  quantity: number;
  price: number;
  discount_percent: number;
  subtotal: number;
}
export interface IOrder {
  _id: string;
  user_id: string;
  order_number: string;
  status: string;
  total_items: number;
  before_total: number;
  discount_total: number;
  total_shipping_fee: number;
  total_amount: number;
  payment_status: string;
  note: string;
  completed_at: string;
  cancel_reason: string;
}
export interface IOrderItem {
  _id: string;
  order_id: string;
  product_variant_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  discount_percent: number;
  item_subtotal: number;
  status: 'pending' | 'packed' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  reviewed: boolean;
}
export interface ICustomerInquiry {
  _id: string;
  user_id: string;
  subject: string;
  message: string;
  status: string;
  resolving_staff_id: string;
  staff_response: string;
}
export interface IAddress {
  _id: string;
  user: string;
  name: string;
  phone: string;
  province: string;
  ward: string;
  address_detail: string;
  is_default: boolean;
}
export interface IBlogAuthor {
  _id: string;
  user_id: string;
  name: string;
  slug: string;
  email: string;
  avatar_url: string;
  bio: string;
  social_links: {
    facebook: string;
    github: string;
    twitter: string;
    linkedin: string;
    website: string;
  };
  role: string;
  status: string;
}
export interface IBlogCategory {
  _id: string;
  name: string;
  slug: string;
  description: string;
}
export interface IBlogTag {
  _id: string;
  name: string;
  slug: string;
  description: string;
}
export interface IBrand {
  _id: string;
  name: string;
  address: string;
  phone: string;
  contact_email: string;
}
export interface IBlog {
  _id: string;
  title: string;
  slug: string;
  thumbnail_url: {
    url: string;
    alt: string;
  };
  description: string;
  content: ContentBlock[];
  tags: string[];
  author: string;
  activity: {
    total_likes: number;
    total_comments: number;
    total_reads: number;
  };
  comments: string[];
  draft: boolean;
  categories: string;
  time_reads: number;
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string;
  };
  publishedAt: Date;
}
export interface IWarehouse {
  _id?: string;
  name?: string;
  warehouse_area?: string;
  warehouse_status?: string;
}
