import { Component, OnInit } from "@angular/core";
import { MainService } from '../../../../../tools/services/main';
import { ActivatedRoute, Router } from '@angular/router';
import { Buffer } from 'buffer';
import { FormControl, Validators, FormArray, FormGroup } from '@angular/forms';


const $ = window['$'];

const tinymce = window['tinymce'];


function arrayBufferToBase64( buffer: BlobPart, callback: { (blob_url: any): void; (arg0: string | ArrayBuffer): void; } ) {
    var blob = new Blob([buffer],{type:'application/octet-binary'});
    var reader = new FileReader();
    reader.onload = function(evt){
        var dataurl = evt.target.result;
        callback(dataurl);//dataurl.substr(dataurl.indexOf(',')+1));
    };
    reader.readAsDataURL(blob);
}


@Component({
    selector: 'store-item',
    templateUrl: './item.component.html',
    styleUrls: ['./item.component.scss']
})
export class StoreItemComponent implements OnInit{
    resource_fetched: boolean = false;
    resourceForm: FormGroup = new FormGroup({
        _id: new FormControl(''),
        metadata: new FormGroup({
            name: new FormControl('', Validators.required),
            version: new FormControl(''),
            type: new FormControl('', Validators.required),
            introduction: new FormControl(''),
            description: new FormControl(''),
            private: new FormControl(false),
            tags: new FormArray([
                // new FormGroup({ 
                //     name: new FormControl(''), 
                //     value: new FormControl('') 
                // })
            ]),
            docs: new FormGroup({
                media_type: new FormControl('', Validators.required),
                html: new FormControl(''),
                links: new FormArray([]),
                pdf: new FormControl(''),
            }),
            logo: new FormControl(''),
            licence: new FormControl(''),
            agreement: new FormControl('')
        }),
        author: new FormControl(''),
        archiveData: new FormControl('')
    });

    edit_property:string;

    default_icon: string = "/assets/img/algofab.PNG";

    docTypeDisplay: string ;

    has_archiveData: boolean = false;
    has_logo: boolean = false;
    pdf_docs_ready:boolean = false;

    constructor(private activatedRoute: ActivatedRoute, private router: Router, private mainService: MainService){}

    ngOnInit(): void {
        console.log("StoreItemComponent started!!!");
    }

    iAmAuthor():boolean {
        return this.mainService.getUserAccount()._id == this.resourceForm.get('author').value;
    }

    getProperty(prop:string){
        switch(prop){
            case '_id':
                return this.resourceForm.get('_id').value;
            case 'name':
                return this.resourceForm.get('metadata').get('name').value;
            case 'version':
                return this.resourceForm.get('metadata').get('version').value;
            case 'type':
                return this.resourceForm.get('metadata').get('type').value;
            case 'icon':
                let iconSrc = this.resourceForm.get('metadata').get('type').value;
                return iconSrc == '' ? this.default_icon : `/assets/img/${iconSrc}.svg`;
            case 'introduction':
                return this.resourceForm.get('metadata').get('introduction').value;
            case 'description':
                return this.resourceForm.get('metadata').get('description').value;
            case 'private':
                return this.resourceForm.get('metadata').get('private').value.toString().toUpperCase();
            case 'tags':
                return this.resourceForm.get('metadata').get('tags').value;
            case 'docs':
                return this.resourceForm.get('metadata').get('docs').value;
            case 'docs_type':
                return this.resourceForm.get('metadata').get('docs').get('media_type').value;
            case 'docs_html':
                return this.resourceForm.get('metadata').get('docs').get('html').value;
            case 'docs_links':
                return this.resourceForm.get('metadata').get('docs').get('links').value;
            case 'docs_pdf':
                return this.resourceForm.get('metadata').get('docs').get('pdf').value;
            case 'logo':
                return this.resourceForm.get('metadata').get('logo').value;
            case 'licence':
                return this.resourceForm.get('metadata').get('licence').value;
            case 'agreement':
                return this.resourceForm.get('metadata').get('agreement').value;
            case 'archiveData':
                return this.resourceForm.get('archiveData').value;
            default:
                console.warn(`Don't know property "${prop}"`);
        }
    }

    changeDocTypeDisplay(){
        let dt = this.resourceForm.get('metadata').get('docs').get('media_type').value;
        //alert('changeDocTypeDisplay('+dt+')!!!!');
        this.docTypeDisplay = dt;
    }

    editArchiveDataChanged(event){
        if (event.target.files.length > 0) {
            const file = event.target.files[0];
            // this.formGroup.patchValue({
            //     archiveFile: file
            // });
            if (this.resourceForm.get('archiveData').value != ''){
                this.resourceForm.get('archiveData').setValue('');
            }
            this.resourceForm.get('archiveData').setValue(file);      
        }
    }

    editDocsPDFChanged(event){
        if (event.target.files.length > 0) {
            const file = event.target.files[0];
            // this.formGroup.patchValue({
            //     archiveFile: file
            // });
            if (this.resourceForm.get('metadata').get('docs').get('pdf').value != ''){
                this.resourceForm.get('metadata').get('docs').get('pdf').setValue('');
            }
            this.resourceForm.get('metadata').get('docs').get('pdf').setValue(file);      
        }
    }

    editLogoDataChanged(event){
        if (event.target.files.length > 0) {
            const file = event.target.files[0];
            // this.formGroup.patchValue({
            //     archiveFile: file
            // });
            if (this.resourceForm.get('metadata').get('logo').value != ''){
                this.resourceForm.get('metadata').get('logo').setValue('');
            }
            console.log("File : ",file);
            //let reader = new FileReaderSync();
            
            this.resourceForm.get('metadata').get('logo').setValue(file);  
        }
    }
    
    loadResource(){
        this.activatedRoute.params.subscribe(p=> {
			
			this.mainService.getAPIObject({
                kind: 'resource', 
                objectID: p.id
            }).subscribe(
				async (res:any)=>{
                    console.log("res : ", res);
                    var resource = res.response;
                    
                    try {
                        if ('licence' in resource.metadata && resource.metadata.licence && typeof resource.metadata.licence === 'string' ){
                            var licence = await this.mainService.getAPIObject({
                                kind: 'licence', 
                                objectID: resource.metadata.licence
                            }).toPromise();

                            resource.metadata.licence = licence;
                        }
                    } catch (e) {
                        console.log("Failed to fetch licence!!!", e);
                    }

                    try {
                        if ('agreement' in resource.metadata && resource.metadata.agreement && typeof resource.metadata.agreement === 'string'){
                            var agreement = await this.mainService.getAPIObject({
                                kind: 'agreement', 
                                objectID: resource.metadata.agreement
                            }).toPromise();

                            resource.metadata.agreement = agreement;
                        }
                    } catch (e) {
                        console.log("Failed to fetch agreement!!!", e);
                    }
                    
                    try {
                        if ('documentations' in resource.metadata && resource.metadata.documentations && resource.metadata.documentations.media_type == 'pdf' && typeof resource.metadata.documentations.pdf == 'string'){

                            var docsPDF = await this.mainService.getAPIObject({
                                kind: 'resource', 
                                objectID: resource._id,
                                subUrl:"docs",
                                requestedBy: this.mainService.getUserAccount().auth_token
                            }).toPromise();
                            resource.metadata.documentations.pdf = await new Promise((resolve, reject)=>{
                                arrayBufferToBase64(docsPDF, (blob_url: any)=>{

                                    console.log("download link:", $('#docs-pdf-download'));
                                    //debugger;

                                    setTimeout(()=>{
                                        console.log("download link:", $('#docs-pdf-download'));
                                        $('#docs-pdf-download').attr('href', blob_url);
                                        //alert('now that we are ready all is fine!!');
                                        this.pdf_docs_ready = true;
                                    }, 2000);

                                    resolve(blob_url);
                                    
                                });
                            });
                        }
                    } catch (e) {
                        console.log("Failed to fetch agreement!!!", e);
                    }
                    
                    try {
                        if ('archiveData' in resource && resource.archiveData && typeof resource.archiveData === 'string'){
                            var archiveData = await this.mainService.getAPIObject({
                                kind: 'resource', 
                                objectID: resource._id,
                                subUrl:"archive",
                                requestedBy: this.mainService.getUserAccount().auth_token
                            }).toPromise();
                            resource.archiveData = await new Promise((resolve, reject)=>{
                                arrayBufferToBase64(archiveData, (blob_url: any)=>{

                                    console.log("download link:", $('#download-container a'));
                                    //debugger;

                                    $('#download-container a').ready(()=>{
                                        $('#download-container a').attr('href', blob_url);
                                        //alert('now that we are ready all is fine!!');
                                    });
                                    resolve(blob_url);
                                    
                                });
                            });
                            this.has_archiveData = true;
                        }
                    } catch (e) {
                        console.log("Failed to fetch archiveData!!!", e);
                    }
                    
                    if (resource.metadata.logo && resource.metadata.logo.content_type){
                        var ct = resource.metadata.logo.content_type;
                        var data = resource.metadata.logo.data;
                        data = typeof data === 'string' ? data : Buffer.from(data.data).toString('base64');
                        //console.log("data : ", data);
                        resource.metadata.logo = `data:${ct};base64,${data}`;
                        this.has_logo = true;
                    }
                    this.updateResourceForm(resource);
				},
				(err: { error: { message: any; }; })=>{
                    console.log("err: ", err);
                    $.notify(err.error.message);
                    this.router.navigate(['store']);
				},
				()=>{
					console.log("Done!!!");
				}
			)
        });
    }

    updateResourceForm(resource: any){

        this.resourceForm.get('_id').setValue(resource._id);
        // Updating Metadata
        var meta = resource.metadata;
        for (var m in meta){
            if (['name', 'introduction', 'description', 'type', 'logo', 'version', 'private'].indexOf(m) >= 0 ){
                this.resourceForm.get('metadata').get(m).setValue(meta[m]) ;
            }
            else if(m == 'tags' && meta[m]){
                meta[m].forEach( (t: { name: any; value: any; }) => {
                    (this.resourceForm.get('metadata').get(m) as FormArray).push(new FormGroup({ name: new FormControl(t.name), value: new FormControl(t.value)})) ;
                });
            }
            else if (m == 'documentations' && meta[m]){
                if (meta[m].media_type === 'html'){
                    this.resourceForm.get('metadata').get('docs').get('media_type').setValue('html');
                    this.resourceForm.get('metadata').get('docs').get('html').setValue(meta[m].html);
                }
                else if (meta[m].media_type === 'external_links'){
                    this.resourceForm.get('metadata').get('docs').get('media_type').setValue('external_links');
                    
                    meta[m].links.forEach((l:string)=>{
                        alert('link : '+l); 
                        (this.resourceForm.get('metadata').get('docs').get('links') as FormArray).push(new FormControl(l)); 
                    });
                }
                else if (meta[m].media_type === 'pdf'){
                    this.resourceForm.get('metadata').get('docs').get('media_type').setValue('pdf');
                    console.log("meta[m]..pdf : ", meta[m].pdf);
                    //alert("Handling docs PDF");
                    this.resourceForm.get('metadata').get('docs').get('pdf').setValue(meta[m].pdf);
                }
            }
            
        }

        // ArchiveData
        if("archiveData" in resource && resource.archiveData){
            this.resourceForm.get('archiveData').setValue(resource.archiveData); 
        }

        // Author
        if("author" in resource && resource.author){
            //alert("UID : "+this.mainService.getUserAccount()._id + ' | author : '+resource.author);
            this.resourceForm.get('author').setValue(resource.author); 
        }

        this.resource_fetched = true;
    }

    editPropertyForm(prop:string){
        //alert('editPropertyForm : '+prop);
        this.edit_property = prop;

        $('#edit-form').modal('show');
    }

    addTag(){
        (this.resourceForm.get('metadata').get('tags') as FormArray).push(new FormGroup({ name: new FormControl(''), value: new FormControl('') }));
    }

    removeTag(index){
        (this.resourceForm.get('metadata').get('tags') as FormArray).removeAt(index);
    }
    addLink(){
        (this.resourceForm.get('metadata').get('docs').get('links') as FormArray).push(new FormControl(''));
    }

    removeLink(index){
        (this.resourceForm.get('metadata').get('docs').get('links') as FormArray).removeAt(index);
    }

    updateProperty(){
        let body = new FormData(), subUrl = this.edit_property == "archiveData" ? 'archive' : this.edit_property == 'docs'? 'docs' : 'metadata';

        if (['name', 'introduction', 'description', 'type', 'version', 'logo', 'tags', 'licence', 'agreement', 'private'].indexOf(this.edit_property)>=0){
            body.append(this.edit_property, 
                this.edit_property == 'tags' ? JSON.stringify(this.resourceForm.get('metadata').get('tags').value) : 
                    this.resourceForm.get('metadata').get(this.edit_property).value 
            );
        }
        else if(this.edit_property == 'archiveData'){
            body.append('archive', this.resourceForm.get('archiveData').value);
        }
        else if(this.edit_property == 'docs'){
            body.append('media_type', this.resourceForm.get('metadata').get('docs').get('media_type').value);
            //alert('docTypeDisplay : '+this.resourceForm.get('metadata').get('docs').get('media_type').value);
            switch (this.resourceForm.get('metadata').get('docs').get('media_type').value){
                case 'html':
                    body.append('html', this.resourceForm.get('metadata').get('docs').get('html').value);
                break;
                case 'external_links':
                    alert('links are : '+ JSON.stringify(this.resourceForm.get('metadata').get('docs').get('links').value ));
                    body.append('links', JSON.stringify(this.resourceForm.get('metadata').get('docs').get('links').value ));
                break;
                default :
                    body.append('pdf', this.resourceForm.get('metadata').get('docs').get('pdf').value);
                break;
            }
        }
        

        this.mainService.updateAPIObject({
            kind: 'resource', 
            subUrl: subUrl,
            objectID: this.resourceForm.get('_id').value, 
            body: body, 
            requestedBy: this.mainService.getUserAccount().auth_token, 
            query: null, 
        }).subscribe(
            (res:any)=>{
                $.notify(`${this.edit_property} successfully updated!`, 'success')
            },
            (err)=>{
                $.notify(err.error.message);
            }
        );
    }

    ngAfterViewInit(){
        this.loadResource();
        
        

        setTimeout(()=>{
            //alert("DOnin my part");
            tinymce.init({
                selector: '#edit-description-property',
                plugins: 'advlist autolink lists link image charmap print preview hr anchor pagebreak',
                toolbar_mode: 'floating',
                setup: (editor)=> {
                    editor.on('change', ()=> {
                        //console.log("Just saved : ", editor.save());
                        this.resourceForm.get('metadata').get('description').setValue(editor.save());
                    });
                }
            });
            tinymce.init({
                selector: '#edit-docs-html-property',
                plugins: 'advlist autolink lists link image charmap print preview hr anchor pagebreak',
                toolbar_mode: 'floating',
                setup: (editor)=> {
                    editor.on('change', ()=> {
                        //console.log("Just saved : ", editor.save());
                        this.resourceForm.get('metadata').get('docs').get('html').setValue(editor.save());
                    });
                }
            });
            
        }, 1000);
    }
}