import { Directive, ElementRef, HostListener, Input } from "@angular/core";
import { MainService, CallOptions } from "../services/main";

const $ = window['$'];
const tinymce = window['tinymce'];

@Directive({
    selector: '[ratings]'
})
export class RatingsDirective {
    @Input() selectedStarColor: string = "orange";
    @Input() unSelectedStarColor: string = "black";
    @Input() resourceID: string;

    icons: string[] = ['fas fa-angry', 'fas fa-frown', 'fas fa-meh', 'fas fa-smile', 'fas fa-smile-beam'];
    icon = $(`<i class="${this.icons[0]}"></i>`).css({ 'font-size': '3em'});
    stars: Array<any> = [
        $('<i class="fa fa-star"></i>').css({'cursor': 'pointer', color: this.selectedStarColor}), 
        $('<i class="fa fa-star"></i>').css({'cursor': 'pointer'}),
        $('<i class="fa fa-star"></i>').css({'cursor': 'pointer'}),
        $('<i class="fa fa-star"></i>').css({'cursor': 'pointer'}),
        $('<i class="fa fa-star"></i>').css({'cursor': 'pointer'})
    ];
    voteMessageModal:any;

    vote_message: string = '';

    ratings : Array<any> = [];

    userRatings: any;

    ratings_details: any;
    constructor(private el : ElementRef, private mainServerice: MainService){}

    async ngOnInit(){
        //alert("RatingsDirective started!! [" + this.resourceID+ "]");
        
    }

    calculateDetails (){
        this.ratings_details = {
            one : {
                count: this.ratings.filter(e=>e.note==1).length,
                percent: this.ratings.filter(e=>e.note==1).length / this.ratings.length
            },
            two : {
                count: this.ratings.filter(e=>e.note==2).length,
                percent: this.ratings.filter(e=>e.note==2).length / this.ratings.length
            },
            three : {
                count: this.ratings.filter(e=>e.note==3).length,
                percent: this.ratings.filter(e=>e.note==3).length / this.ratings.length
            },
            four : {
                count: this.ratings.filter(e=>e.note==4).length,
                percent: this.ratings.filter(e=>e.note==4).length / this.ratings.length
            },
            five : {
                count: this.ratings.filter(e=>e.note==5).length,
                percent: this.ratings.filter(e=>e.note==5).length / this.ratings.length
            }

        }
        this.ratings_details ['overall_note'] = (this.ratings_details.one.count + this.ratings_details.two.count * 2 + this.ratings_details.three.count * 3 + this.ratings_details.four.count * 4 + this.ratings_details.five.count * 5) / this.ratings.length;
        //alert ('details : ' + JSON.stringify(this.ratings_details, null, 2));
    }

    @HostListener('mouseover', ['$event']) onMouseOver(event){
        //console.log("Mouse over :", event.target);
        for (let star of this.stars){
            let i = this.stars.indexOf(star);
            if (event.target == star[0]){
                //console.log("Mouse enter on star ", i);
                this.updateNote(i);
                
            }
        }
    }

    updateNote(note){
        this.icon.attr('class', this.icons[parseInt(note)]);
        this.stars.forEach((e,i)=>{ 
            if(i <= note){
                e.css('color', this.selectedStarColor);
            }
            else{
                e.css('color', this.unSelectedStarColor);
            }
        });
    }

    renderVisual(){
        var stars = $('<span></span>');
        for (let s of this.stars){
            s.click(()=>{ console.log("this : ", this); this.voteMessageModal.modal('show') }) 
            stars.append( s ); 
        }

        var reviews = $(`
            <div> 
                <button class="btn btn-info" id="my-reviews-btn">My Review</button> 
                <button class="btn btn-primary" id="reviews-btn">Reviews</button> 
            </div>`
        ).css({'margin-top': '1em', 'margin-bottom' : '1em'});
        
        reviews.find('#my-reviews-btn').click(()=>{ this.displayMyReview(); });
        reviews.find('#reviews-btn').click(()=>{ this.displayReviews(); });

        console.log('ratings_details = ', this.ratings_details);
        var note = $(`<div>Overall note : ${this.ratings.length == 0 ? 'not yet rated':this.ratings_details.overall_note.toFixed(2)}</div>`)
        $(this.el.nativeElement).css({
            display: "flex",
            'flex-direction': 'column',
            'align-items':'center',
            'justify-content': 'center',
            width: "100%",
            height: "100%",
            'margin-top': "1em",
            //border:  "1px solid black"
        }).append(this.icon).append(stars).append(note).append(reviews);

        this.createVoteMessageModal();
        this.updateNote(this.ratings_details.overall_note-1);
    }

    displayReviews(){
        //

        let review_stats = $(`
            <div class="container">
                <div class="row">
                    <div class="col-sm-2"> 5 stars </div>
                    <div class="col-sm-8" id="five-star-progress-bar">
                        <div class="progress" style="background: #D8D8D8;">
                            <div class="progress-bar bg-success" role="progressbar"  aria-valuenow="${this.ratings.length == 0 ? 0 : this.ratings_details.five.percent}" aria-valuemin="0" aria-valuemax="100" style="width: ${this.ratings.length == 0 ? 0 : this.ratings_details.five.percent*100}%"> </div>  
                        </div>
                    </div>
                    <div class="col-sm-2" class="five-star-votes"> ${this.ratings_details.five.count} </div>
                </div>

                <div class="row">
                    <div class="col-sm-2"> 4 stars </div>
                    <div class="col-sm-8" id="four-star-progress-bar">
                        <div class="progress" style="background: #D8D8D8;">
                            <div class="progress-bar bg-primary" role="progressbar"  aria-valuenow="${this.ratings.length == 0 ? 0 : this.ratings_details.four.percent}" aria-valuemin="0" aria-valuemax="100" style="width: ${this.ratings.length == 0 ? 0 : this.ratings_details.four.percent*100}%"> </div>  
                        </div>
                    </div>
                    <div class="col-sm-2" class="four-star-votes"> ${this.ratings_details.four.count} </div>
                </div>

                <div class="row">
                    <div class="col-sm-2"> 3 stars </div>
                    <div class="col-sm-8" id="three-star-progress-bar">
                        <div class="progress" style="background: #D8D8D8;">
                            <div class="progress-bar bg-info" role="progressbar"  aria-valuenow="${this.ratings.length == 0 ? 0 : this.ratings_details.three.percent}" aria-valuemin="0" aria-valuemax="100" style="width: ${this.ratings.length == 0 ? 0 : this.ratings_details.three.percent*100}%"> </div>  
                        </div>
                    </div>
                    <div class="col-sm-2" class="tree-star-votes"> ${this.ratings_details.three.count} </div>
                </div>

                <div class="row">
                    <div class="col-sm-2"> 2 stars </div>
                    <div class="col-sm-8" id="two-star-progress-bar">
                        <div class="progress" style="background: #D8D8D8;">
                            <div class="progress-bar bg-warning" role="progressbar"  aria-valuenow="${this.ratings.length == 0 ? 0 : this.ratings_details.two.percent}" aria-valuemin="0" aria-valuemax="100" style="width: ${this.ratings.length == 0 ? 0 : this.ratings_details.two.percent*100}%"> </div>  
                        </div>
                    </div>
                    <div class="col-sm-2" class="two-star-votes"> ${this.ratings_details.two.count} </div>
                </div>

                <div class="row">
                    <div class="col-sm-2"> 1 stars </div>
                    <div class="col-sm-8" id="one-star-progress-bar">
                        <div class="progress" style="background: #D8D8D8;">
                            <div class="progress-bar bg-danger" role="progressbar"  aria-valuenow="${this.ratings.length == 0 ? 0 : this.ratings_details.one.percent}" aria-valuemin="0" aria-valuemax="100" style="width: ${this.ratings.length == 0 ? 0 : this.ratings_details.one.percent*100}%"> </div>  
                        </div>
                    </div>
                    <div class="col-sm-2" class="one-star-votes"> ${this.ratings_details.one.count} </div>
                </div>
            </div>
        `);

        let modal = $(
            `
            <div class="modal fade" id="reviews" tabindex="-1" role="dialog" aria-labelledby="reviews-label" aria-hidden="true">
                <div class="modal-dialog modal-lg" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="reviews-label">Reviews</h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div class="container" id="review-stats">
                                
                            </div>
                            <div class="container">
                                ${
                                    this.ratings.map(r=>{
                                        return `
                                        <div class="row">
                                            <div class="col-sm ratings-item">
                                                <div class="row">
                                                    <div class="col-sm-2 ratings-item-left">
                                                        ${r.user.profile.username ? r.user.profile.username : r.user.profile.email}
                                                    </div>
                                                    <div class="offset-sm-1 col-sm ratings-item-right">
                                                        ${r.comment}
                                                    </div>
                                                </div>
                                                <div class="row">
                                                    <div class="col-sm badge badge-success">Created: ${r.date}</div>
                                                    <div class="col-sm badge badge-info">Last edited: ${r.last_edited ? r.last_edited : 'Haven\'t been edited'}</div>
                                                </div>
                                            </div>
                                        </div>
                                        `
                                    }).join('\n')
                                }
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" id="save-vote">Save changes</button>
                        </div>
                    </div>
                </div>
            </div>
            `
        );
        modal.find('.modal-body').prepend(review_stats);
        modal.find('.ratings-item').css({"margin-top":"2em", "margin-bottom":"2em", "border":'1px dotted black', "border-radius":"5px"});
        modal.find('.ratings-item-left').css({
            // "border":'1px solid black', 
            "border-radius":"5px",
            "overflow-wrap": "break-word", 
            "background-color": 'rgba(0,0,0,.03)'
        });
        modal.find('.ratings-item-right').css({
            //"border":'1px solid black'
            "background-color": 'rgba(0,0,0,.03)'
        });
        modal.modal('show');

    }
    
    displayMyReview(){
        //
    }
    
    createVoteMessageModal(){
        this.voteMessageModal = $(
            `
            <div class="modal fade" id="update-ratings" tabindex="-1" role="dialog" aria-labelledby="update-ratings-label" aria-hidden="true">
                <div class="modal-dialog modal-lg" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="update-ratings-label">Any accompanying Message</h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div class="container">
                                <div class="row">
                                    <form class="col-sm" >
                                        <textarea class="form-control" id="ratings-message" placeholder="Enter a message to justify your note if you feel like it."></textarea>
                                    </form>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" id="save-vote">Save changes</button>
                        </div>
                    </div>
                </div>
            </div>
            `
        );

        this.voteMessageModal.on('shown.bs.modal', () => {
            console.log("MODAL JUST APEARED!!!");
            tinymce.init({
                selector: '#ratings-message',
                plugins: 'advlist autolink lists link image charmap print preview hr anchor pagebreak',
                toolbar_mode: 'floating',
                setup: (editor)=> {
                    editor.on('change', ()=> {
                        //console.log("Just saved : ", editor.save());
                        this.vote_message = editor.save();
                    });
                }
            });
        });

        this.voteMessageModal.find('#save-vote').click(()=>{
            this.publishVote();
        })
    }

    async ngAfterViewInit(){
        //alert("RatingsDirective started!!");
        // console.log('RATINGS ELEMENT REF : ', $(this.el.nativeElement));
        // console.log('RATINGS ELEMENT REF : ', this.stars);
        if (this.resourceID){
            var ratings = await this.mainServerice.getAPIObject({
                kind: 'ratings',
                requestedBy: this.mainServerice.getUserAccount().auth_token,
                query: {
                    resourceID: this.resourceID
                }
            }).toPromise();

            this.ratings = ratings.response;

            // alert('We found '+this.ratings.length+' ratings!!!');
            // alert('Also first rating is  '+JSON.stringify(this.ratings[0], null, 2));
        }
        this.calculateDetails();
        this.renderVisual();
    }

    publishVote(){
        
        var note = this.stars.filter(s => s.css('color') == this.stars[0].css('color')).length;
        console.log('You voted ', note, ' | message : ', this.vote_message);
        
        var lastRating = this.ratings.filter(e=>(typeof e.user ==='string' && e.user == this.mainServerice.getUserAccount()._id) || (e.user._id == this.mainServerice.getUserAccount()._id));
        let callOptions: CallOptions = {
            kind: 'ratings',
            requestedBy: this.mainServerice.getUserAccount().auth_token,
            body: {
                resource: this.resourceID,
                note : note,
                comment: this.vote_message
            }
        }
        // alert("user : " + this.mainServerice.getUserAccount()._id);
        // alert('lastRating.length : '+ lastRating.length);
        // return;
        // Not creating rather updating
        if (lastRating.length != 0){
            callOptions.objectID = lastRating[0]._id;
            console.log("lastRating[0] : ", lastRating[0]);
            console.log("lastRating[0].id : ", lastRating[0]._id);
            this.mainServerice.updateAPIObject(callOptions).subscribe(
                ()=>{
                    $.notify('Vote successfully updated!', 'success');
                },
                (err)=>{
                    $.notify(err.error.message);
                }
            );
        }
        else{
            this.mainServerice.createAPIObject(callOptions).subscribe(
                ()=>{
                    $.notify('Vote successfully submitted!', 'success');
                },
                (err)=>{
                    $.notify(err.error.message);
                }
            );
        }
    }
}