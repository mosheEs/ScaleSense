import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { orderPageRoutingModule } from './order-routing.module';

import { OrderPage } from './order-page.component';
import {ComponentsModule} from '../components/components.module';
import {ProductToCartComponent} from '../components/product-to-cart/product-to-cart.component';
import {ProductSummeryComponent} from '../components/product-summery/product-summery.component';
import {ProductsTotalPriceComponent} from '../components/products-total-price/products-total-price.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    orderPageRoutingModule,
    ComponentsModule,
  ],
  declarations: [
    OrderPage,
    ProductToCartComponent,
    ProductSummeryComponent,
    ProductsTotalPriceComponent,
  ]
})
export class OrderPageModule {}
