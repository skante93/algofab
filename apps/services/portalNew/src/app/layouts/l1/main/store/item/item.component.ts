import { Component, OnInit } from "@angular/core";
import { MainService } from 'src/app/tools/services/main';
import { ActivatedRoute, Router } from '@angular/router';
import { Buffer } from 'buffer';
import { FormControl, Validators, FormArray, FormGroup } from '@angular/forms';

const $ = window['$'];

const tinymce = window['tinymce'];

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
        introduction: new FormControl(''),
        description: new FormControl(''),
        licence: new FormControl(''),
        agreement: new FormControl(''),
        archive: new FormControl(''),
        archiveFile: new FormControl('')
    };

    constructor(private activatedRoute: ActivatedRoute, private router: Router, private mainService: MainService){}

    ngOnInit(): void {
        console.log("StoreItemComponent started!!!");

        this.activatedRoute.params.subscribe(p=> {
			this.id = p['id'];
			this.mainService.getAPIObject('resource', this.id, null).subscribe(
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
                    
                    for (var m in this.resource.metadata){
                        if (m in this.formGroup ){
                            if (m == "tags"){
                                //
                                this.resource.metadata.tags.forEach((t)=>{ this.formGroup.tags.push(t) });
                            }
                            else{
                                this.formGroup[m].setValue(this.resource.metadata[m]);
                            }
                        }
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
        
        let body;

        if (field == "download"){
            console.log("this.formGroup.archive : ", this.formGroup.archive.value);
            body = new FormData();
            body.append("archive", );
            return;
        }
        else{
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
                if (field == "download"){
                    //
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

    ngAfterViewInit(){
        setTimeout(()=>{
            $('[editable]').each((i,e)=>{
                console.log("Editable # ", i, ": ", e);

                var parent_dim = [$(e).width(), $(e).height()];
                var parent_pos = $(e).position();
                console.log("parent_dim : ", parent_dim);
                console.log("parent_pos : ", parent_pos);


                var edit = $(`<div>Edit</div>`).css({
                    "background-color":"red",
                    "color":"white",
                    "text-decoration":"bold",
                    // "width":"2em",
                    // "font-size":"1em",
                    // "height":parent_dim[1]*0.4,
                    // "font-size": parent_dim[1]*0.3,
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
                        // var w = Math.max( Math.min( parent_dim[0] * .2, editMaxWidth), editMinWidth);
                        // var h = Math.max( Math.min( parent_dim[1] * .2, editMaxHeight), editMinHeight);
                        edit.css({
                            "display": "flex",
                            "width": "60px",
                            "height": "30px",
                            "font-size": "15px",
                            "left": (parent_dim[0]-60)
                            
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