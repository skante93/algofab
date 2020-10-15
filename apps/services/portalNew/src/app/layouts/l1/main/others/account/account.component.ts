import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MainService, CallOptions } from '../../../../../tools/services/main';


const $ = window['$'];

@Component({
    selector: 'main-account',
    templateUrl: './account.component.html',
    styleUrls : ['./account.component.scss']
})
export class AccountComponent implements OnInit {

    
    updateFG: FormGroup = new FormGroup({
        username: new FormControl(''),
        email : new FormControl('', Validators.email),
        firstname: new FormControl(''),
        lastname: new FormControl(''),
        photo: new FormControl(''),
        photoFile : new FormControl(''),
    });

    passwdFG: FormGroup = new FormGroup({
        currentPassword: new FormControl('', Validators.required),
        newPassword : new FormControl('', Validators.required)
    });;

    account: any;
    photo_src: string;

    constructor(private mainService: MainService, private router: Router, private activatedRoute: ActivatedRoute){}
    
    ngOnInit(): void {
        console.log("AccountComponent started!!!");
        if (!this.mainService.isLoggedIn()){
            $.notify('You need to login before displaying your account');
            this.router.navigate(['signin']);
            return;
        }

        this.updateProfileInfo(this.mainService.getUserAccount());
    }

    
    getPhotoSrc():string {
        return this.photo_src? this.photo_src : '/assets/img/algofab.PNG';
    }

    updateProfileInfo(account){
        this.account = account;
        this.updateFG.get('firstname').setValue(account.profile.firstname);
        this.updateFG.get('lastname').setValue(account.profile.lastname);
        this.updateFG.get('email').setValue(account.profile.email);
        if (account.profile.photo){
            //this.updateFG.get('photo').setValue(account.profile.photo);
            var ct = account.profile.photo.content_type;
            var data = account.profile.photo.data;
            data = typeof data === 'string' ? data : Buffer.from(data.data).toString('base64');
            //console.log("data : ", data);
            this.photo_src = `data:${ct};base64,${data}`;
            // console.log('photo_src : ', this.photo_src);
        }
        console.log('this.account : ', this.account);
    }

    onPhotoChange(event){
        if (event.target.files.length > 0) {
            const file = event.target.files[0];
            // this.formGroup.patchValue({
            //     archiveFile: file
            // });
            if (this.updateFG.get('photoFile').value != ''){
                this.updateFG.get('photoFile').setValue('');
            }
            this.updateFG.get('photoFile').setValue(file);      
        }
    }

    onUpdateProfileSubmit() {
        console.log("updateFG [", this.updateFG.valid? 'valid': 'invalid', "] : ", this.updateFG.value);

        let body;
        if (this.updateFG.get('photo').value != ''){
            //
            body = new FormData();
            if (!this.updateFG.get('email').valid){
                $.notify('Field Email is not a valid email');
                return;
            }
            body.append('firstname', this.updateFG.get('firstname').value);
            body.append('lastname', this.updateFG.get('lastname').value);
            body.append('email', this.updateFG.get('email').value);
            body.append('photo', this.updateFG.get('photoFile').value);
        }
        else {
            if (!this.updateFG.get('email').valid){
                $.notify('Field Email is not a valid email');
                return;
            }

            body = {};
            body.firstname = this.updateFG.get('firstname').value;
            body.lastname = this.updateFG.get('lastname').value;
            body.email = this.updateFG.get('email').value;
        }

        this.mainService.updateAPIObject({
            kind: 'user',
            requestedBy: this.mainService.getUserAccount().auth_token,
            objectID: this.mainService.getUserAccount()._id,
            subUrl:'profile',
            body: body,
            isMultipart: true
        }).subscribe(
            (res:any)=>{
                //alert('res.response : '+JSON.stringify(res.response, null, 2));
                this.updateProfileInfo(res.response);
                $.notify('Profile successfully updated!', 'success')
            },
            (err)=>{
                $.notify(err.error.message);
            },
            ()=>{
                console.log("Done updating account!!!");
            }
        );
    }

    onupdatePasswordSubmit() {

        if (!this.passwdFG.get('currentPassword').valid) {
            $.notify('Fields "Current Passord" is required');
            return;
        }
        if (!this.passwdFG.get('newPassword').valid) {
            $.notify('Fields "New Passord" is required');
            return;
        }

        let body = {
            currentPassword: this.passwdFG.get('currentPassword').value,
            newPassword: this.passwdFG.get('newPassword').value
        }

        this.mainService.updateAPIObject({
            kind: 'user',
            requestedBy: this.mainService.getUserAccount().auth_token,
            objectID: this.mainService.getUserAccount()._id,
            subUrl:'password',
            body: body
        }).subscribe(
            (res:any)=>{
                //alert('res.response : '+JSON.stringify(res.response, null, 2));
                this.updateProfileInfo(res.response);
                $.notify('Password successfully updated!', 'success')
            },
            (err)=>{
                $.notify(err.error.message);
            },
            ()=>{
                console.log("Done updating account!!!");
            }
        );
    }

    removeAccount(delayed: boolean){
        this.mainService.removeAPIObject({
            kind: 'user',
            requestedBy: this.mainService.getUserAccount().auth_token,
            objectID: this.mainService.getUserAccount()._id,
            query: {
                delayed: delayed
            }
        }).subscribe(
            (res:any)=>{
                //alert('res.response : '+JSON.stringify(res.response, null, 2));
                this.updateProfileInfo(res.response);
                $.notify('Account successfully removed!', 'success');
                this.router.navigate(['signup']);
            },
            (err)=>{
                $.notify(err.error.message);
            },
            ()=>{
                console.log("Done updating account!!!");
            }
        )
    }
}