import { Component, OnInit } from "@angular/core";
import { MainService } from '../../../../../tools/services/main';
import { FormControl } from "@angular/forms";


const $ = window['$'];

@Component({
    selector: '',
    templateUrl: './list.component.html',
    styleUrls: ['./list.component.scss']
})
export class StoreListComponent implements OnInit{

    store_items: Array<any> = [];

    search_text: FormControl = new FormControl('');

    constructor(private mainService: MainService){}

    ngOnInit(): void {
        console.log("StoreListComponent started!!!");
        
        this.mainService.getAPIObject({
            kind: "resources"
        }).subscribe(
            (res:any)=>{
                //console.log("resources : ", res.response);
                this.refereshList(res.response);
            },
            (err)=>{
                console.log("oups:", err.error.message);
                $.notify(err.error.message);
            },
            ()=>{
                console.log("We are done here!!");
            }
        );
    }

    refereshList(resources: Array<any>){
        //
        this.store_items = [];

        resources.forEach((resource)=>{
            var item:any = {
                title: resource.metadata.name,
                //logo: resource.metadata.logo,
                icon: `/assets/img/${resource.metadata.type}.svg`,
                introduction: resource.metadata.introduction,
                redirect: "/store/items/" + resource._id,
            }
            if (resource.metadata.logo != null){
                var ct = resource.metadata.logo.content_type;
                var data = resource.metadata.logo.data;
                data = typeof data === 'string' ? data : Buffer.from(data.data).toString('base64');
                item.logo = `data:${ct};base64,${data}`;
            }
            //console.log("RESOURCE ITEM : ", item);
            this.store_items.push(item);
        });
    }

    search(){
        console.log('Search [ q = ', this.search_text.value,']...');

        this.mainService.getAPIObject({
            kind: 'resources',
            subUrl: 'search',
            query: {
                q : this.search_text.value
            },
            requestedBy: this.mainService.getUserAccount().auth_token,
            
        }).subscribe(
            (res:any)=>{
                //console.log("resources : ", res.response);
                console.log("SREACH RESULTS : ", res.response);
                this.refereshList(res.response);
            },
            (err)=>{
                console.log("oups:", err.error.message);
                $.notify(err.error.message);
            }
        )
    }
}