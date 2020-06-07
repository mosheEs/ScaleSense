import {Component, OnInit} from '@angular/core';
import {BusinessSide} from '../models/Business';
import {NavigationService} from '../services/navigation.service';
import {AuthSoftwareService} from '../services/auth-software.service';
import {UsersService} from '../services/users.service';
import {UserDoc, UserPermission, UserRole} from '../models/UserDoc';
import {AlertController, ModalController} from '@ionic/angular';
import {NotificationsSettingsModalComponent} from './notifications-settings-modal/notifications-settings-modal.component';

@Component({
  selector: 'app-settings-menu',
  templateUrl: './settings-page.component.html',
  styleUrls: ['./settings-page.component.scss'],
})
export class SettingsPage implements OnInit {

  side: BusinessSide;

  generalOpen: boolean;

  UserPermission = UserPermission;

  constructor(
    private authService: AuthSoftwareService,
    public navService: NavigationService,
    public usersService: UsersService,
    private modalCtrl: ModalController,
  ) {
    this.side = this.authService.currentUser.side;
  }

  get amIAdmin() {
    return this.usersService.myDoc.role == UserRole.ADMIN;
  }

  ngOnInit() {
  }


  async setNotifications() {
    const m = await this.modalCtrl.create({
      component: NotificationsSettingsModalComponent,
      backdropDismiss: false,
    });
    m.present();
  }

}
