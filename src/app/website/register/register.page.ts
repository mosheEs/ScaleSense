import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {UserDoc} from '../../models/UserDoc';
import {MailService} from '../mail/mail.service';
import {MailForm} from '../mail/MailForm';
import {AuthService, AuthStage} from '../../services/auth.service';
import {BusinessService} from '../../services/business.service';
import {BusinessDoc} from '../../models/Business';
import * as firebase from 'firebase/app';
import 'firebase/functions';
import {AlertsService} from '../../services/alerts.service';
import {FilesService} from '../../services/files.service';
import {NavigationService} from '../../services/navigation.service';
import {take} from 'rxjs/operators';
import {AlertController} from '@ionic/angular';

enum PageStatus {

  CONTACT = 10,
  CONTACT_DONE = 11,

  FIRST_STEP = 21,
  SECOND_STEP = 22,
  PAYMENTS = 23,
  REGISTRATION_DONE = 24,

  FORGOT_PASSWORD = 40,
  RESET_PASSWORD_EMAIL_SENT = 41,
  RESET_PASSWORD = 42,

}

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {

  PageStatus = PageStatus;
  pageStatus: PageStatus;

  // Page ID
  id: string;

  // Details for contact / password recovery (contact mode)
  businessName: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  passwordV: string;

  // User details
  userDoc: UserDoc = {};

  // Business details
  customerDoc: BusinessDoc = {contacts: [{},{}]};

  readonly EmailRegex = AuthService.EMAIL_REGEX;
  readonly PasswordRegex = AuthService.PASSWORD_REGEX;

  logoLoader: boolean;

  constructor(
    private alerts: AlertsService,
    private alertCtrl: AlertController,
    private authService: AuthService,
    private activatedRoute: ActivatedRoute,
    private navService: NavigationService,
    public mailService: MailService,
    private businessService: BusinessService,
    private filesService: FilesService,
  ) {}

  async ngOnInit() {

    // Entering the page in forgot password mode
    if (this.authService.authStage == AuthStage.FORGOT_PASSWORD) {
      this.pageStatus = PageStatus.FORGOT_PASSWORD;
      return;
    }

    // Entering the page with reset password link
    if (this.authService.authStage == AuthStage.RESET_PASSWORD) {
      this.pageStatus = PageStatus.RESET_PASSWORD;
      return;
    }

    // Get the ID from the URL
    this.id = this.activatedRoute.snapshot.params['id'];

    // For no ID, open contact form
    if (this.id === '0')
      this.pageStatus = PageStatus.CONTACT;

    // If entered this page as a verified user of an exist business, go to payments
    else if (this.id == 'payments') {
      this.authService.onCurrentUser.pipe(take(1)).subscribe((user)=>{
        if(user)
          this.pageStatus = PageStatus.PAYMENTS;
      });
    }

    else {
      // If the business ID has only initial document, start registration process
      this.customerDoc.name = await this.businessService.getNewCustomer(this.id);
      if (this.customerDoc.name)
        this.pageStatus = PageStatus.FIRST_STEP;
      else
        this.navService.goToWebHomepage();
    }

  }


  // Which inputs fields to show in each status
  inputToShow(inputName: string) {
    let inputs = [];
    switch (this.pageStatus) {
      case PageStatus.CONTACT: inputs = ['businessName', 'name', 'email', 'phone']; break;
      case PageStatus.FORGOT_PASSWORD: case PageStatus.RESET_PASSWORD_EMAIL_SENT: inputs = ['email']; break;
      case PageStatus.RESET_PASSWORD: inputs = ['password', 'passwordV']; break;
    }
    return inputs.indexOf(inputName) > -1;
  }

  subheaderToShow() {
    if(this.pageStatus == PageStatus.FORGOT_PASSWORD)
      return 'נא למלא כתובת דוא"ל';
    if(this.pageStatus == PageStatus.RESET_PASSWORD)
      return 'נא לעדכן סיסמה חדשה';
  }

  buttonText() {
    switch (this.pageStatus) {
      case PageStatus.CONTACT: case PageStatus.FORGOT_PASSWORD: case PageStatus.RESET_PASSWORD_EMAIL_SENT: return 'שליחה';
      case PageStatus.FIRST_STEP: case PageStatus.SECOND_STEP: return 'המשך';
      case PageStatus.RESET_PASSWORD: return 'איפוס';
    }
  }

  buttonAction() {

    if(!this.checkFields())
      return;

    switch (this.pageStatus) {
      case PageStatus.CONTACT: this.sendDetailsClick(); break;
      case PageStatus.FORGOT_PASSWORD: this.sendResetPasswordEmail(); break;
      case PageStatus.RESET_PASSWORD: this.resetPasswordClicked(); break;
      case PageStatus.FIRST_STEP: this.pageStatus = PageStatus.SECOND_STEP; break;
      case PageStatus.SECOND_STEP: this.doneRegistrationClicked();

    }

  }

  sendDetailsClick() {
    const mailContact: MailForm = {
      businessName: this.businessName,
      name: this.fullName,
      email: this.email,
      phone: this.phone,
      registrationReq: true,
    };
    if(this.mailService.sendRegistrationMail(mailContact))
      this.pageStatus = PageStatus.CONTACT_DONE;
    else
      alert('פנייה נכשלה');
  }

  async doneRegistrationClicked() {
    const l = this.alerts.loaderStart('יצירת חשבון חדש...');
    // Create user account with email and password
    const newUserCred = await this.authService.createUser(this.userDoc.email, this.password);
    if(!newUserCred) {
      this.alerts.loaderStop(l);
      return;
    }
    // Call cloud function to create the account's documents
    const createAccount = firebase.functions().httpsCallable('createAccount');
    try {
      await createAccount({
        adminUserDoc: {
          ...this.userDoc,
          uid: newUserCred.user.uid
        },
        businessDoc: {
          ...this.customerDoc,
          id: this.id,
        }
      });
      // After succeed, send verification email
      this.sendVerificationEmail();
    }
    catch (e) {
      console.error(e);
      // If there was some error while creating the account, delete this new "orphaned" user to prevent 'already-exist' error in the future
      await this.authService.deleteMe();
    }
    this.alerts.loaderStop(l);
  }


  async uploadLogo(file: File) {
    // Upload the file to the storage under the business ID name, and get it's URL
    this.logoLoader = true;
    const url = await this.filesService.uploadFile(file, this.id);
    if(url)
      this.customerDoc.logo = url;
    else
      alert('תקלה בהעלאת הקובץ');
    this.logoLoader = false;
  }


  // Check all required fields are filled and well formatted
  checkFields() : boolean {

    const inputs = document.querySelector('.form').getElementsByTagName('input');
    for (let i = 0; i < inputs.length; i++) {
      if(inputs.item(i).validity.valueMissing) {
        alert('יש להזין את כל שדות החובה');
        return false;
      }
      if(inputs.item(i).validity.patternMismatch && inputs.item(i).type == 'email') {
        alert('כתובת דוא"ל אינה תקינה');
        return false;
      }
      if(inputs.item(i).validity.patternMismatch && inputs.item(i).name == 'companyId') {
        alert('יש להזין מספר ח.פ תקין');
        return false;
      }
      if (inputs.item(i).validity.patternMismatch && inputs.item(i).type == 'password') {
        alert('הסיסמה חייבת להכיל לפחות 6 תוים מסוג מספרים ואותיות באנגלית');
        return false;
      }
      if(this.password && this.password != this.passwordV) {
        alert('הסיסמה ואימות הסיסמא אינם זהים');
        return false;
      }
    }

    if(this.pageStatus == PageStatus.CONTACT && !this.mailService.recaptcha) {
      alert('יש לסמן את תיבת "אני לא רובוט"');
      return false;
    }

    return true;

  }


  async sendVerificationEmail() {
    this.authService.sendEmailVerification();
    const a = await this.alertCtrl.create({
      subHeader: 'קישור לאימות האימייל נשלח לכתובת: ' + this.userDoc.email,
      message: 'אם לא קיבלת מייל, בדוק את תיבת הספאם והאם הכתובת שהזנת תקינה.',
      buttons: [{
        text: 'לא קיבלתי, שלח שוב...',
        handler: () => this.sendVerificationEmail(),
      }],
      backdropDismiss: false,
    });
    a.present();
  }

  async sendResetPasswordEmail() {
    await this.authService.sendPasswordResetEmail(this.email);
    this.pageStatus = PageStatus.RESET_PASSWORD_EMAIL_SENT;
  }

  async resetPasswordClicked() {
    if(this.password == this.passwordV)
      await this.authService.resetPasswordAndSignIn(this.password);
  }

}
