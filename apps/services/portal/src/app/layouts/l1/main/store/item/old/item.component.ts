import { Component, OnInit } from "@angular/core";
import { MainService } from 'src/app/tools/services/main';
import { ActivatedRoute, Router } from '@angular/router';
import { Buffer } from 'buffer';
import { FormControl, Validators, FormArray, FormGroup } from '@angular/forms';

const $ = window['$'];

const tinymce = window['tinymce'];


function arrayBufferToBase64( buffer, callback ) {
    var blob = new Blob([buffer],{type:'application/octet-binary'});
    var reader = new FileReader();
    reader.onload = function(evt){
        var dataurl = evt.target.result;
        callback(dataurl);//dataurl.substr(dataurl.indexOf(',')+1));
    };
    reader.readAsDataURL(blob);
}


@Component({
    selector: '',
    templateUrl: './item.component.html',
    styleUrls: ['./item.component.scss']
})
export class StoreItemComponent implements OnInit{
    id: string;
	resource: any;
    default_logo: string = "/assets/img/algofab_white_bg.PNG";
    logo: string;

    formGroup: any = {
        name: new FormControl('', Validators.required),
        version: new FormControl(''),
        type: new FormControl(''),
        tags: new FormArray([
            new FormGroup({ 
                name: new FormControl(''), 
                value: new FormControl('') 
            })
        ]),
        docs: new FormControl(''),
        introduction: new FormControl(''),
        description: new FormControl(''),
        licence: new FormControl(''),
        agreement: new FormControl(''),
        archive: new FormControl(''),
        archiveFile: new FormControl('')
    };

    tags: FormGroup = new FormGroup({
        tags: new FormArray([
            //new FormGroup({ 
            //    name: new FormControl(''), 
            //    value: new FormControl('') 
            //})
        ])
    });

    constructor(private activatedRoute: ActivatedRoute, private router: Router, private mainService: MainService){}

    ngOnInit(): void {
        console.log("StoreItemComponent started!!!");

        this.activatedRoute.params.subscribe(p=> {
			this.id = p['id'];
			this.mainService.getAPIObject({
                kind: 'resource', 
                objectID: this.id
            }).subscribe(
				(res:any)=>{
					console.log("res : ", res);
                    this.resource = res.response;
                    console.log("this.resource.metadata : ", this.resource.metadata);
                    //console.log("this.resource.metadata.tags : ", this.resource.metadata.tags[0].name);
                    if (this.resource.metadata.logo != null){
                        console.log("this.resource.metadata.logo : ", this.resource.metadata.logo);
                        var ct = this.resource.metadata.logo.content_type;
                        var data = this.resource.metadata.logo.data;
                        data = typeof data === 'string' ? data : Buffer.from(data.data).toString('base64');
                        //console.log("data : ", data);
                        this.logo = `data:${ct};base64,${data}`;

                        var img = new Image();
                        img.src = this.logo;
                        this.resource.metadata.logo = img;
                    }
                    if (this.resource.metadata.description){
                        setTimeout(()=> {
                            $('.description-section .description').html(this.resource.metadata.description);
                        },100);
                    }
                    if (this.resource.metadata.documentations && this.resource.metadata.documentations.html_docs){
                        setTimeout(()=> {
                            $('#html-docs').html(this.resource.metadata.documentations.html_docs);
                            $('#docs').html(this.resource.metadata.documentations.html_docs);
                        },100);
                    }
                    for (var m in this.resource.metadata){
                        if (m in this.formGroup ){
                            if (m == "tags"){
                                //
                                if (this.resource.metadata.tags){
                                    this.resource.metadata.tags.forEach((t)=>{ 
                                        this.formGroup.tags.push(
                                            new FormGroup({
                                                name: new FormControl(t.name),
                                                value: new FormControl(t.value) 
                                            })
                                        );
                                        (this.tags.get('tags') as FormArray).push(
                                            new FormGroup({
                                                name: new FormControl(t.name),
                                                value: new FormControl(t.value) 
                                            })
                                        );
                                    });
                                }
                            }
                            else{
                                this.formGroup[m].setValue(this.resource.metadata[m]);
                            }
                        }
                    }

                    if ('archiveData' in this.resource && this.resource.archiveData){
                        //debugger;
                        console.log("######################################## Getting download");
                        this.mainService.getAPIObject({
                            kind: 'resource',
                            objectID: this.resource._id,
                            subUrl: 'archive',
                            author: this.mainService.getUserAccount().auth_token
                        }).subscribe(
                            (res:any)=>{
                                console.log("RECEIVED DOWNLOAD : ", res);
                                arrayBufferToBase64(res, (url)=>{
                                    // console.log("BLOB URL IS : ", url);
                                    $('a#archive-link').attr('href', url);
                                });
                            },
                            (err)=>{
                                $.notify(err.error.message);
                            },
                            ()=>{
                                console.log("Done receiving archive.");
                            }
                        );
                    }
				},
				(err)=>{
					console.log("err: ", err);
				},
				()=>{
					console.log("Done!!!");
				}
			)
		});
    }

    setResource (){
        
    }
    onArchiveChange(event){
        if (event.target.files.length > 0) {
            const file = event.target.files[0];
            // this.formGroup.patchValue({
            //     archiveFile: file
            // });
            if (this.formGroup.archiveFile.value != ''){
                this.formGroup.archiveFile.setValue('');
            }
            this.formGroup.archiveFile.setValue(file);      
          }
    }

    editField(field: string){
        var subUrl = (field == "download" ? 'archive' : 'metadata')
        
        let body ;
        if (field == 'tags'){
            //
            body = {};
            body['tags'] = JSON.stringify(this.tags.get('tags').value, null, 2);
        }
        else if (field == "download"){
            console.log("this.formGroup.archive : ", this.formGroup.archive.value);
            body = new FormData();
            body.append("archive", this.formGroup.archiveFile.value);
            
        }
        else if(field == 'docs'){
            //
            body = {
                'documentations': JSON.stringify({ media_type: 'html', html_docs: this.formGroup.docs.value })
            };
            body['tags'] = JSON.stringify(this.tags.get('tags').value, null, 2);
        }
        else{
            body = {};
            body[field] = this.formGroup[field].value;
        }

        console.log("Edit field : ", body);

        this.mainService.updateAPIObject({
            kind: 'resource', 
            subUrl: subUrl,
            objectID: this.resource._id, 
            body: body, 
            author: this.mainService.getUserAccount().auth_token, 
            query: null, 
            isMultipart: true
        }).subscribe(
            (res:any)=>{
                console.log("Done!!");
                $.notify("update successful!", 'success')

                if (field == "tags"){
                    //
                    this.resource.metadata.tags = this.tags.get('tags').value;
                }
                else if (field == "download"){
                    //
                }
                else if(field == 'docs'){
                    $('#html-docs').html(this.formGroup.docs.value);
                }
                else{
                    this.resource.metadata[field] = body[field];
                }
            },
            (err)=>{
                console.log("err", err);
                debugger;
                $.notify(err.error.message);
            },
            ()=>{
                console.log("Done guys");
            }
        );

    }

    addTag(){
        (this.tags.get('tags') as FormArray).push(new FormGroup({ name: new FormControl(''), value: new FormControl('') }));
    }

    removeTag(index){
        (this.tags.get('tags') as FormArray).removeAt(index);
    }

    ngAfterViewInit(){
        setTimeout(()=>{
            $('[editable]').each((i,e)=>{
                console.log("Editable # ", i, ": ", e);

                //if ($(e).attr('editable') == 'name' || $(e).attr('editable') == 'tags'){
                //    console.log("dim : ", dim);
                //    console.log("pos : ", pos);
                //}

                var edit = $(`<div>Edit</div>`).css({
                    "background-color":"red",
                    "color":"white",
                    "text-decoration":"bold",
                    // "width":"2em",
                    // "font-size":"1em",
                    // "height":dim[1]*0.4,
                    // "font-size": dim[1]*0.3,
                    "display":"none",
                    "align-items":"center",
                    "justify-content":"center",
                    "padding":".4em",
                    "border-radius":"5px",
                    "position":"absolute",
                    "cursor":"pointer",
                    "text-align":"center"
                });

                edit.click(()=>{ 
                    //this.editModal($(e).attr('editable'));
                    var id = '#update-'+$(e).attr('editable');
                    console.log("displaying model id : \"", id, "\"");
                    $(id).modal('show'); 
                });
                $(e).append(edit);
                // const editMinWidth = 20, editMaxWidth = 40;
                // const editMinHeight = 20, editMaxHeight = 40;
                $(e).hover(
                    ()=>{
                        // var w = Math.max( Math.min( dim[0] * .2, editMaxWidth), editMinWidth);
                        // var h = Math.max( Math.min( dim[1] * .2, editMaxHeight), editMinHeight);
                        let dim = [$(e).width(), $(e).height()], pos = $(e).position();
                        
                        let top = pos.top + 25, left = pos.left + dim[0] - 80;
                        
                        //if ($(e).attr('editable') == 'name' || $(e).attr('editable') == 'tags'){
                        //    console.log("dim : ", dim);
                        //    console.log("pos : ", pos);
                        //}
                        if ($(e).attr('editable') == 'logo'){
                            top = pos.top + 10, left = pos.left + dim[0]/2 - 80;
                        }

                        edit.css({
                            "display": "flex",
                            "width": "60px",
                            "height": "30px",
                            "font-size": "15px",
                            "top": top,
                            "left": left
                        });
                    },
                    ()=>{
                        edit.hide();
                    }
                );
            });

            tinymce.init({
                selector: '#description',
                setup: (editor)=> {
                    editor.on('change', ()=> {
                        this.formGroup.description.setValue(editor.save());
                    });
                }
            });
            tinymce.init({
                selector: '#docs',
                setup: (editor)=> {
                    editor.on('change', ()=> {
                        this.formGroup.docs.setValue(editor.save());
                    });
                }
            });
        }, 1000);

        
    }

    hoverStar(index: number){
        //console.log("Hoverd on i = ", index);
        $("#smiley i").attr('class', ()=>{
            return index == 0 ? 'fas fa-angry' : 
                        index == 1? 'fas fa-frown' : 
                            index == 2 ? 'fas fa-meh' : 
                                index == 3 ? 'fas fa-smile' : 'fas fa-smile-beam';
        }); 
        var stars = $("#stars span i").css('color', 'black');

        for (var i=0; i<=index; i++){
            $(stars[i]).css('color', 'yellow');
        }
    }

    logoSrc() {
        // if (this.resource != undefined && this.resource.metadata.logo != undefined && this.resource.metadata.logo != null){
        //     // TODO get logo from it
        //     return this.resource.metadata.logo;
        // }
        // else{
        //     return this.default_logo;
        // }
        //console.log("my logo : ", this.resource.metadata.logo);
        return this.logo? this.logo : this.default_logo;
    }
}