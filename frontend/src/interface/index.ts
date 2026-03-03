export interface IHeroItem {
  image: string;
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
