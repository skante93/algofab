import { Component, OnInit } from "@angular/core";
import { MainService } from '../../../../../tools/services/main';
import { Router } from '@angular/router';

import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';


const $ = window['$'];
const tinymce = window['tinymce'];

@Component({
    selector: '',
    templateUrl: './create.component.html',
    styleUrls: ['./create.component.scss']
})
export class StoreCreateComponent implements OnInit{

    resource_types: Array<any> = [
        { name: "AI Model", value: "ai_model" },
        { name: "Notebook", value: "notebook" },
        { name: "Library", value: "library" },
        { name: "Docker Container", value: "docker" },
        { name: "Dataset", value: "dataset" },
        { name: "Executable", value: "executable" },
        { name: "As A Service", value: "service" },
    ];

    licences: any = [{_id: "ex", name:"just for show"}];

    user_agreements: any = [{_id: "ex", name:"just for show"}];

    formGroup: FormGroup;
    tags: FormArray;

    constructor(private router: Router,  private mainService: MainService, private fb: FormBuilder){}

    
    ngOnInit(): void {
        console.log("StoreCreateComponent started!!!");
        
        if (! this.mainService.isLoggedIn()){
            $.notify("You need to be logged in to create resources.")
            this.router.navigate(['signin'], {queryParams: { redirectTo: '/store/create'}});
            return ;
        }

        this.createFormGroup();

        this.fetchLicencesAndAgreements();

    }

    ngAfterViewInit(){
        tinymce.init({
            selector: '#description',
            setup: (editor)=> {
                editor.on('change', ()=> {
                    this.formGroup.get('description').setValue(editor.save());
                });
            }
        });
    }

    createFormGroup(){
        
        this.formGroup = this.fb.group({
            name: new FormControl('', Validators.required),
            version: new FormControl(''),
            type: new FormControl(''),
            tags: this.fb.array([
                this.fb.group({ name: new FormControl(''), value: new FormControl('') })
            ]),
            introduction: new FormControl(''),
            description: new FormControl(''),
            licence: new FormControl(''),
            agreement: new FormControl('')
        });
    }

    fetchLicencesAndAgreements(){
        this.mainService.getAPIObject({
            kind:'licence',
            requestedBy: this.mainService.getUserAccount().auth_token
        }).subscribe(
            (res:any)=>{
                this.licences = res.response;

                console.log("Here are the licences: ", this.licences);
                console.log("res: ", res);
            },
            (err)=>{
                console.log("Oups : ", err.error);
            },
            ()=>{
                console.log("Done getting licences");
            }
        );
        
        this.mainService.getAPIObject({
            kind: 'agreement',
            requestedBy: this.mainService.getUserAccount().auth_token,
            query: {author: this.mainService.getUserAccount()._id}
        }).subscribe(
            (res:any)=>{
                this.user_agreements = res.response;

                console.log("Here are the user_agreements: ", this.user_agreements);
                console.log("res: ", res);
            },
            (err)=>{
                console.log("Oups : ", err.error);
            },
            ()=>{
                console.log("Done getting user_agreementss");
            }
        );
    }

    addTag(){
        this.tags = this.formGroup.get('tags') as FormArray;
        this.tags.push(this.fb.group({ name: this.fb.control(''), value: this.fb.control('') }));
    }

    removeTag(index){
        this.tags = this.formGroup.get('tags') as FormArray;
        this.tags.removeAt(index);
    }

    onSubmit(){
        console.warn("formGroup.value", this.formGroup.value);
        console.warn("formGroup.valid", this.formGroup.valid);
        if (!this.formGroup.valid){
            return;
        }
        var resource = this.formGroup.value;
        resource.tags = JSON.stringify(resource.tags.filter(t=> t.name != ''));
        //alert('resource : '+JSON.stringify(resource, null, 2));
        
        this.mainService.createAPIObject({
            kind: 'resource', 
            body: resource, 
            requestedBy: this.mainService.getUserAccount().auth_token, 
            isMultipart: true
        }).subscribe(
            (res:any)=>{
                //
                $.notify("Resource successfully created, redirecting to its page ...", 'success');
                this.router.navigate(['store', 'items', res.response._id]);
            },
            (err)=>{
                console.log("error : ", err.error);
                $.notify(err.error.message);
            }, 
            ()=>{ console.log("Anyway we're done here!!");}
        )
    }
}