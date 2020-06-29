import {Component, OnInit} from '@angular/core';
import {SuppliersService} from '../services/suppliers.service';
import {ReturnService} from '../services/return.service';
import {ModalController} from '@ionic/angular';
import {ReturnGoodModalComponent} from '../return-good-modal/return-good-modal.component';
import {AlertsService} from '../services/alerts.service';
import {ActivatedRoute} from '@angular/router';
import {UsersService} from '../services/users.service';
import {NavigationService} from '../services/navigation.service';
import {UserPermission} from '../models/UserDoc';
import {ReturnObj} from '../models/ReturnObj';

@Component({
  selector: 'app-returns-drafts',
  templateUrl: './returns-drafts.page.html',
  styleUrls: ['./returns-drafts.page.scss'],
})
export class ReturnsDraftsPage implements OnInit {

  supplierQuery: string = '';
  query: string;

  drafts: ReturnObj[] = [];

  driverName: string;

  get suppliers() {
    return (this.suppliersService.mySuppliers || []).filter((s)=>s.name.startsWith(this.supplierQuery));
  }

  constructor(
    public returnsService: ReturnService,
    private suppliersService: SuppliersService,
    private modalService: ModalController,
    private alerts: AlertsService,
    private activatedRoute: ActivatedRoute,
    private userService: UsersService,
    private navService: NavigationService,
  ) { }

  async ngOnInit() {

    // Page's "mini guard"
    if(!this.userService.hasPermission(UserPermission.ORDER_RETURN)) {
      this.navService.goBack();
      alert('אין הרשאה להחזרת סחורה');
    }

    const sid = this.activatedRoute.snapshot.queryParams['sid'];
    if(sid)
      this.drafts = await this.returnsService.queryDrafts(sid)

  }

  async search() {

    // Get the selected supplier
    const supplier = this.suppliersService.mySuppliers.find((s)=>s.name == this.supplierQuery);

    // If there is a valid supplier or no supplier selected, continue querying
    if(supplier || (!this.supplierQuery && this.query))
      this.drafts = await this.returnsService.queryDrafts(supplier ? supplier.id : null, this.query);
    else
      this.drafts = [];

    this.returnsService.clearList();

  }

  getSupplierById(id: string) {
    return this.suppliersService.getSupplierById(id);
  }

  async openDraft(returnObj: ReturnObj) {
    const m = await this.modalService.create({
      component: ReturnGoodModalComponent,
      componentProps: {returnObj: returnObj},
      backdropDismiss: false,
      cssClass: 'wide-modal',
    });
    m.present();
  }

  async deleteDraft(returnDoc: ReturnObj) {
    if(await this.alerts.areYouSure('האם למחוק טיוטת החזרה?')) {
      await this.returnsService.deleteDraft(returnDoc.id);
      this.search();
    }
  }

  onChecked(returnDoc: ReturnObj ,ev) {

    if(ev.detail.checked)
      this.returnsService.addDoc(returnDoc, true);
    else
      this.returnsService.removeFromList(returnDoc.id);

  }

  onCheckAll(ev) {

    setTimeout(()=>{
      if(ev.target.checked)
        this.drafts.forEach((d)=>{
          this.returnsService.addDoc(d);
        });
      else
        this.returnsService.clearList();
    });

  }

  async sendToSupplier() {

    if(await this.alerts.areYouSure('האם לשלוח ' + this.returnsService.returnsDocsList.length + ' מוצרים להחזרה?')) {

      // Stamp driver name on each product to send
      if(this.driverName)
        this.returnsService.returnsDocsList.forEach((draft)=>{
          draft.product.returnDriverName = this.driverName;
        });

      // Send
      const l = this.alerts.loaderStart('שולח...');
      if(await this.returnsService.sendListToSupplier())
        this.alerts.defaultAlert('דיווחי החזרות נשלחו לספק', 'דו"ח נשלח בדוא"ל להנהלת חשבונות');
      this.alerts.loaderStop(l);

      // Refresh the list
      this.search();

    }

  }

}
