import { Component, OnInit } from "@angular/core";
import { MainService } from 'src/app/tools/services/main';




@Component({
    selector: '',
    templateUrl: './list.component.html',
    styleUrls: ['./list.component.scss']
})
export class StoreListComponent implements OnInit{

    store_items: Array<any> = [];

    constructor(private mainService: MainService){}

    ngOnInit(): void {
        console.log("StoreListComponent started!!!");
        
        this.mainService.getAPIObject("resources", null, null).subscribe(
            (res:any)=>{
                console.log("resources : ", res.response);
                res.response.forEach((resource)=>{
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
                    console.log("RESOURCE ITEM : ", item);
                    this.store_items.push(item);
                });
            },
            (err)=>{
                console.log("oups:", err.error.message);
            },
            ()=>{
                console.log("We are done here!!");
            }
        );
    }
}