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
  categories: IProductCategory[];
}
export interface Iproduct {
  product_id: string;
  product_name: string;
  brand_name: string;
  description: string;
  discount_percent: number;
  is_assembly: boolean;
  warranty: number;
  tags: string[];
  product_component: {
    [key: string]: any;
  };
  import_function: string;
  image_url: string[];
}
export interface Iproduct_variants {
  product_id: string;
  product_varant_id: string;
  price: number;
  weight: number;
  num_inventory: number;
  num_selled: number;
  designed_by: string;
  rating: number;
  expected_delivery: string;
  is_default: boolean;
  component_variants: {
    [key: string]: any;
  };
  measurement: {
    [key: string]: any;
  };
}
export interface Iproduct_image {
  product_varant_id: string;
  url: string;
  is_main: boolean;
  position: number;
}
export interface Idetail_product {
  product: Iproduct;
  product_variants: Iproduct_variants[];
  list_product_variants_image: Record<string, Iproduct_image[]>;
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
