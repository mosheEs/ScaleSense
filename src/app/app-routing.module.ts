import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import {appEnterGuard} from './app-enter-guard.service';

const routes: Routes = [

  /** Website */
  {
    path: '',
    loadChildren: () => import('./website/website.module').then(m => m.WebsitePageModule)
  },

  /** Customer main page. The customer app is under the customer routing */
  {
    path: 'customer',
    loadChildren: () => import('./customer/customer.module').then( m => m.CustomerPageModule),
    canActivateChild: [appEnterGuard],
    data: {side: 'c'}
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
