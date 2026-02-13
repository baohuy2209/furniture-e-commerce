import { Component } from '@angular/core';
import { CardProduct } from "../../components/card-product/card-product";

@Component({
  selector: 'app-products',
  imports: [CardProduct],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products {

}
