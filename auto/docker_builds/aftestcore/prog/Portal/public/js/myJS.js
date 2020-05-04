
/*
class Diapo {
	          
	static dotStyle() {
		return {
			"width" : "20px",
			"height" : "20px",
			"border-radius" : "20px",
			"border" : "4px solid lightblue", 
			"background-color" : "grey",
			"display" : "inline-block",
			"text-align" : "center",
			"margin-right": "10px",
			"cursor" : "pointer"
		};
	}
	static dotAcitveStyle() {
		return {
			"width" : "20px",
			"height" : "20px",
			"border-radius" : "20px",
			"border" : "4px solid lightblue",
			"background-color" : "black",
			"display" : "inline-block",
			"text-align" : "center",
			"margin-right": "10px",
			"cursor" : "pointer",
		};
	}
	constructor(id, imgs, options) {
		this.id = id;
		this.imgs = imgs;
		this.options = options;

		this.dotStyle = Diapo.dotStyle();
		this.dotAcitveStyle = Diapo.dotAcitveStyle();
		this.controlsStyle = {
			"text-align" : "center"
		}
		$('#'+id).append( $('<div class="row"><div class="owl-carousel"></div></div>') );
		$('#'+id).append( $('<div id="' + id + '_controls"></div>') );
		$('#'+id + ' #'+id+'_controls').css(this.controlsStyle);
		for(var i=0; i<imgs.length; i++) {
			var curr_Image = $('<img src="' + imgs[i] + '" alt="image ' + i + '"/>');
			curr_Image.css("border-radius", "20px");
			$('#'+id + ' .owl-carousel').append( curr_Image );
			//$('#'+id + ' .owl-carousel').append( '<h1>Please do something</h1>' );

			var elem = $('<div></div>');
			if( i==0 ) {
				elem.css(this.dotAcitveStyle);
			}
			else {
				elem.css(this.dotStyle);
			}
			$('#'+id + ' #'+id+'_controls').append( elem );
			elem.click(function () {
				$('#'+id + ' .owl-carousel').trigger('to.owl.carousel', [$(this).index(), 300]);
			});

		}


		$('#'+id + ' .owl-carousel').on('initialized.owl.carousel', function(event){
			$('#'+id + ' .owl-carousel').on('changed.owl.carousel', function(event){
				$('#banner #banner_controls div').css(Diapo.dotStyle());
				$('#banner #banner_controls div').eq(event.item.index-2).css(Diapo.dotAcitveStyle());
			});
		});
		$('#'+id + ' .owl-carousel').children().height('400px');

		//alert($('#'+id).html())

		$('#'+id + ' .owl-carousel').owlCarousel(options);
	}
};
*/

/*
class ListAlgo {
          
  constructor(id, options) {
    this.id = id;
    this.options = options;

    $('#'+id).append( $('<div class="owl-carousel"></div>') );
    $('#'+id + ' .owl-carousel').owlCarousel(options);
    
  }

  addItem(img, title, description, link) {
    var width = $('#'+this.id).attr("width");
    var height = $('#'+this.id).attr("height");


    var itemImage = $('<img src="' + ((img)? img : '/img/default_algo.jpeg') + '" alt="item" width="'+width+'" height="'+height+'"/>');
    itemImage.css("border-radius" , "10px");
    itemImage.css("position" , "absolute");
    
    var itemTitle = $('<div> ' + title + ' </div>');
    itemTitle.css("text-align" , "center");
    itemTitle.css("margin-top" , height+"px");
    
    var item = $('<div></div>');
    item.append(itemImage);
    item.append(itemTitle);
    
    
    item.css({
      "width" : width,
      "height" : height,
      "display" : "inline-block",
      //"border" : "2px dashed black",
      "border-radius" : "10px",
      "margin" : "2em",
      "vertical-align" : "center"

    });
    item.hover(function(event){
      var l = $(this).children('img').offset().left;
      var t = $(this).children('img').offset().top;
      var w = parseInt(width*120/100);
      var h = parseInt(height*120/100);

      
      var marL = $(this).css("margin-left");
      var marR = $(this).css("margin-right");
      var marT = $(this).css("margin-top");
      var marB = $(this).css("margin-bottom");

      $(this).children('img').width(w);
      $(this).children('img').height(h);

      $(this).children('img').offset({top : t-(h-height)/2, left : l-(w-width)/2});
    }, function(event){
      var l = $(this).children('img').offset().left;
      var t = $(this).children('img').offset().top;

      $(this).css("margin" , "2em");
      
      $(this).children('img').width(width);
      $(this).children('img').height(height);

      $(this).children('img').offset({top : t+ 0.1*width, left : l+ 0.1* height});
    });
    item.wrap('<a href="'+'http://www.google.fr'+'" data-toggle="tooltip" data-html="true" title="'+description+'" target="_blank"></a>');
    item.parent().tooltip();
    //$('#'+ this.id).css("border", "5px solid pink");
    $('#'+ this.id + ' .owl-carousel').append(item.parent());
    $('#'+ this.id + ' .owl-carousel').trigger('refresh.owl.carousel');
  }
};
*/


//---------------------------------------------------------------------------------------
//---------------------------------------------------------------------------------------
//---------------------------------------------------------------------------------------
//---------------------------------------------------------------------------------------


function myModal(title, body, title_colors, body_colors){
	var titleStyle = 'style="';
	if(title_colors && title_colors.foreground) titleStyle += 'color : '+title_colors.foreground+';';
	if(title_colors && title_colors.background) titleStyle += 'background : '+title_colors.background+';';
	titleStyle += '"';
	
	var bodyStyle = 'style="';
	if(body_colors && body_colors.foreground) bodyStyle += 'color : '+body_colors.foreground+';';
	if(body_colors && body_colors.background) bodyStyle += 'background : '+body_colors.background+';';
	bodyStyle += '"';
	
	
	var m = $(`
		<div class="modal fade" role="dialog">
	        <div class="modal-dialog">
	            <div class="modal-content">
	                <div class="modal-header" ${titleStyle}>
	                    <button type="button" class="close" data-dismiss="modal">&times;</button>
	                    <h4 class="modal-title">${title}</h4>
	                </div>
	                <div class="modal-body" ${bodyStyle}>${body}</pre></div>
	            </div>
	        </div>
	   </div>`);
	m.find('.modal-dialog').css('width', '80%');
	return m;
}

var isColorObject = function(obj) {
	try {
		return 'title' in obj || 'body' in obj;
	}
	catch(e){
		return false;
	}
}

function notificationMsg(title, body, timeLimit, colors){
	//
	console.log("Title : "+title+', body : '+body+', timeLimit : '+timeLimit+', colors : '+colors);
	console.log("isColorObject(timeLimit) : "+isColorObject(timeLimit));
	
	if(typeof colors === 'undefined' && isColorObject(timeLimit)){
		console.log("Case 1");
		colors = timeLimit;
		timeLimit = undefined;
	}

	if(typeof timeLimit === 'undefined'){
		console.log("Case 2");
		timeLimit = 2000;
		if(!colors){
			console.log("Case 3");
			colors = {};
		}
	}

	var mod = myModal(title, body, ('title' in colors)?colors.title:null, ('body' in colors)?colors.body:null);

	mod.modal('show');
    
    setTimeout(function(){ mod.modal("hide"); }, timeLimit);
}

/*
$(function(){
	//notificationMsg("Cool", "Test");
});
*/


var newVersionModal = function(metaId){
    //
    var mod = $(`
        <div class="modal fade" role="dialog">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal">&times;</button>
                        <h4 class="modal-title"> New version </h4>
                    </div>
                    <div class="modal-body">
                        <div class="container-fluid">
                            <form>
                                <label for="json-new-input"><button type="button" class="btn btn-primary"> Upload JSON</button></label>
                                <input type="file" accept="application/json" id="json-new-input" style="display:none"/>
                            </form>
                        </div>
                        <div class="container-fluid" id="sock-trace"></div>
                    </div>
                </div>

            </div>
        </div>
    `);

    mod.find('button').click(function(){
        mod.find('input').click();
    });

    mod.find('button').css({
        "margin-bottom" : "2em",
    });
    
    //mod.find('#sock-result div:even').css({ "background" : "yellow" });
    
    //mod.find('#sock-result div:odd').css({ "background" : "grey" });
    
    mod.on('hidden.bs.modal', function (e) {
        mod.find('#sock-trace').empty();
    });

    mod.find('input').change(function(evt) {
        //console.log("This is readFile");
        var files = evt.target.files;
        var file = files[0];           
        var reader = new FileReader();
        reader.onload = function(event) {
            try{
                //var content = event.target.result;
                //console.log(content.version);
                //console.log(version._id.toString());
                socket.emit("create version", metaId, event.target.result);
            }
            catch(e){
                // JSON Parse Error 
                console.log("JSON Parse Error");
            }
        }
        reader.readAsText(file);
    });

    var onCreateVersionProgress = function(message){
        console.log("on create progress");
        var l = mod.find('#sock-trace').children().length;
        
        mod.find('#sock-trace').append( $('<div '+((l%2==0)?'class="ligh-grey-bg"':'')+'>'+message.toString()+'</div>').css({"margin-top": "0.5em", "padding" : "1em"}) );
    };

    var onCreateVersion = function(status, message){
        console.log("on create");


        if(status == "success"){
            mod.find('#sock-trace').append( $('<div class="alert alert-success">Version sucessfully created, reload the page.</div>').css({"margin-top": "0.5em"}) );      
        }
        else{
            mod.find('#sock-trace').append( $('<div class="alert alert-danger">Could not achieve edition. Cause : '+JSON.stringify(message)+'</div>').css({"margin-top": "0.5em"}) );
        }
    };

    socket.on('create version', onCreateVersion);
    socket.on('create version progress', onCreateVersionProgress);
    return {modal : mod, edit_events : { progress : onCreateVersionProgress, version : onCreateVersion } };
}

var newSpecModal = function(version, kind, name){
	var mod = $(
        `<div class="modal fade" role="dialog">
            <div class="modal-dialog">

                <!-- Modal content-->
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal">&times;</button>
                        <h4 class="modal-title">Version ${version.version} : New Spec for ${kind} ${name} </h4>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-danger" id="new-spec-err"></div>
                        <form method="post">
                            <div class="form-group row">
                                <div class="col-sm-12">
                                    <textarea type="text" class="form-control form-control-lg" width="100%" rows="20" name="new-spec" id="new-spec" required></textarea>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-sm-2 pull-right">
                                    <input type="button" value="Submit" id="submit" class="btn btn-primary pull-right"/>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

            </div>
        </div>`
    );

	mod.find('#submit').click(function(){
        try{
            var content = JSON.parse(mod.find('textarea#new-spec').val())
            mod.find('#new-spec-err').hide();
            if(!content.apiVersion){
                mod.find('#new-spec-err').show();
                mod.find('#new-spec-err').html('Field "apiVersion" is required.');
                return;
            }

            if(!content.kind || content.kind != kind){
                mod.find('#new-spec-err').show();
                mod.find('#new-spec-err').html('Field "kind" is required and must be "'+kind+'"');
                return;
            }

            if(!content.metadata || !content.metadata.name || content.metadata.name != name){
                mod.find('#new-spec-err').show();
                mod.find('#new-spec-err').html('Field "metadata.name" is required and must be "'+name+'"');
                return;
            }
             
            socket.emit('new spec', version._id, kind, name, content);
            console.log("Emit new spec");
        }
        catch(e){
            mod.find('#new-spec-err').show();
            mod.find('#new-spec-err').html(e.toString());
        }
    });

    mod.find('textarea').text(`{\n\t"apiVersion" : "v1",\n\t"kind" : "${kind}",\n\t"metadata" : {\n\t\t"name" : "${name}"\n\t}\n}`);
    mod.find('textarea').keydown(function(e) {
        if(e.keyCode === 9) { // tab was pressed
            // get caret position/selection
            var start = this.selectionStart;
            var end = this.selectionEnd;

            var $this = $(this);
            var value = $this.val();

            // set textarea value to: text before caret + tab + text after caret
            $this.val(value.substring(0, start)
                        + "\t"
                        + value.substring(end));

            // put caret at right position again (add one for the tab)
            this.selectionStart = this.selectionEnd = start + 1;

            // prevent the focus lose
            e.preventDefault();
        }
    });
    mod.find('#new-spec-err').hide();
    mod.find('.modal-dialog').css('width', '80%');
    mod.modal('show');
}

var traceCreateOrUpdateAlgoSocket = function(op){
	//
	var m = $(`
		<div class="modal fade" role="dialog">
            <div class="modal-dialog">
				<div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal">&times;</button>
                        <h4 class="modal-title"> ${(op && op == "create")?"Create Algorithm":"Edit the Algorithm"}</h4>
                    </div>
                    <div class="modal-body">
                    	<div id="s-trace-update-algo" class="row"></div>
                    </div>
                </div>
            </div>
        </div>
		`
	);

    m.find('.modal-dialog').css('width', '80%');

	m.find("#s-trace-update-algo div").css("margin-bottom", "2em");

	var onCreateOrUpdateAlgo = function(status, msg){
		var msg = $(`<div class="alert ${(status == "success")?"alert-success":"alert-danger"}">${msg}</div>`);
		m.find("#s-trace-update-algo").append(msg);
		m.find("#s-trace-update-algo").append( $('<div></div>').append( $(`<button class="btn btn-primary pull-right">Refresh</button>`).click(function(){window.location.reload();}) ) );
	}
	var onCreateOrUpdateAlgoProgress = function(msg){
		//
        console.log('on : msg = '+msg);
		var msg = $(`<div class="alert laert-info">${msg}</div>`);
		m.find("#s-trace-update-algo").append(msg);
	}
    if(op && op == "create"){
    	socket.on("create algo", onCreateOrUpdateAlgo);
    	socket.on("create algo progress", onCreateOrUpdateAlgoProgress);
    }
    else{
        socket.on("update algo", onCreateOrUpdateAlgo);
        socket.on("update algo progress", onCreateOrUpdateAlgoProgress);
    }
	m.modal('show');
	return m;
}

var updateAlgoModal = function(id, title, description, tags){
	var mod = $(
        `<div class="modal fade" role="dialog">
            <div class="modal-dialog">

                <!-- Modal content-->
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal">&times;</button>
                        <h4 class="modal-title"> Edit the Algorithm </h4>
                    </div>
                    <div class="modal-body">
                        <form method="post" enctype="multipart/form-data">
                            <div class="form-group row">
                                <label for="title" class="col-sm-3 col-form-label col-form-label-lg"> Title : </label>
                                <div class="col-sm-9">
                                    <input type="text" class="form-control form-control-lg" name="title" id="title" value="${title}" required/>
                                </div>
                            </div>
                            <div class="form-group row">
                                <label for="logo_upload" class="col-sm-3 col-form-label col-form-label-lg"> Logo : </label>
                                <div class="col-sm-9">
                                	<div>
                                		<button type="button" class="btn btn-primary" id="logo_launch_upload">Upload an image</button>
                                    	<input type="file" name="logo_upload" id="logo_upload" accept="image/*" style="display : none;"/>
                                	</div>
                                	<div id="logo_preview">
                                    </div>
                                </div>
                            </div>
                            <div class="form-group row">
                                <label for="description" class="col-sm-3 col-form-label col-form-label-lg"> Description : <span id="info-description" title="You can use HTML code in the description and, as long as you don't use <script>, it it shall work without a problem.">?</span></label>
                                <div class="col-sm-9">
                                    <textarea class="form-control" rows="20" id="description" name="description" required>${description}</textarea>
                                </div>
                            </div>
                            <div class="form-group row">
                                <label for="kwds" class="col-sm-3 col-form-label col-form-label-lg"> Keywords : </label>
                                <div class="col-sm-3">
                                    <input type="text" class="form-control form-control-lg" name="kwds[]" id="kwds" />
                                </div>
                                <div class="col-sm-2">
                                    <button type="button" id="addkwds" class="btn">Add Keyword</button>
                                </div>
                            </div>

                            <div class="form-group row" id="givenkwds"></div>

                            <div class="row">
                                <div class="col-sm-2 pull-right">
                                    <input type="button" value="Submit" id="submit" class="btn btn-primary pull-right"/>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

            </div>
        </div>`
    );
    var logo_file = null;
    mod.find('#submit').click(function(){
        var title = mod.find('input#title').val();
        var description = mod.find('textarea#description').val();

        console.log('ID : '+id);
        console.log('Title : '+title);
        console.log('Description : '+description);
        console.log('Keywords : '+tags);
        //emitUpdate(title, description, keywords);
        socket.emit('update algo', id, title, description, tags, logo_file);
        var tuas = traceCreateOrUpdateAlgoSocket();
        setTimeout(function(){
            mod.modal('toggle');
        }, 1500)
    });
    
    mod.find('textarea').keydown(function(e) {
        if(e.keyCode === 9) { // tab was pressed
            // get caret position/selection
            var start = this.selectionStart;
            var end = this.selectionEnd;

            var $this = $(this);
            var value = $this.val();

            // set textarea value to: text before caret + tab + text after caret
            $this.val(value.substring(0, start)
                        + "\t"
                        + value.substring(end));

            // put caret at right position again (add one for the tab)
            this.selectionStart = this.selectionEnd = start + 1;

            // prevent the focus lose
            e.preventDefault();
        }
    });

    mod.find('.modal-dialog').css('width', '80%');
    
    console.log("keywords : "+tags);
    var addKWDS = function(){
        if( mod.find('#kwds').val() && tags.indexOf(mod.find('#kwds').val()) ==-1 ){
            tags.push( mod.find('#kwds').val() );
            mod.find('#givenkwds').html(redrawKWDS());
            mod.find('#kwds').val('');
            mod.find('#kwds').focus()
        }
    }

    mod.find('#kwds').on('keydown', function(e) {
        if (e.which == 13) {
            e.preventDefault();
            addKWDS();
        }
    });

    mod.find("#addkwds").click(addKWDS);

    var redrawKWDS = function(){
        console.log("redraw started");
        var cont = $('<div class="col-sm-9"></div>');
        tags.forEach(function(tag, index){
            
            var kwd = $('<pre style="display: inline-block">'+tag+'</pre>').css({"margin-right" : "1em", "cursor" : "pointer"});
            kwd.click(function(){
                console.log('index : '+index);
                tags.splice(index, 1);
                mod.find('#givenkwds').html(redrawKWDS());
            });

            kwd.find('span').css({
                "background-color" : "#DCDCDC",
                "cursor" : "pointer",
                "border-radius" : "3px",
                "font-size" : "1.5em"
            });
            cont.append(kwd);
        });

        var r = $('<div class="row"><div class="col-sm-3"></div></div>');
        r.append(cont);
        console.log("redraw ended");
        return r;
    }

    mod.find('#givenkwds').html(redrawKWDS());

    mod.find('#logo_launch_upload').click(function(e){
    	//
    	mod.find('input#logo_upload').click();
    });

    mod.find('#logo_upload').change(function(evt) {
    	//console.log("This is readFile");
		var files = evt.target.files;
		var file = files[0];           
		var reader = new FileReader();
		console.log("File : "+JSON.stringify(file));

		var img = document.createElement("img");// $("img");//.css({ "max-width" : "200", "max-height" : "200"});
	    
	    img.file = file;
	    
	    mod.find("#logo_preview").html(img);
		mod.find("#logo_preview img").css({ "max-width" : "200px", "max-height" : "200px", "margin-top" : "1em"});
		reader.onload = function(event) {
			logo_file = event.target.result;
			img.src = logo_file;

			//console.log("event.target.result : "+logo_file);
		}
		reader.readAsDataURL(file);
    });

    return mod;
}

var editVersionModal = function(version){
	//
	var mod = $(`
    	<div class="modal fade" role="dialog">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal">&times;</button>
                        <h4 class="modal-title">Edit version ${version.version} </h4>
                    </div>
                    <div class="modal-body">
	                    <div class="container-fluid">
					    	<form>
					    		<label for="json-edit-input"><button type="button" class="btn btn-primary"> Upload JSON</button></label>
					    		<input type="file" accept="application/json" id="json-edit-input"  style="display:none"/>
					    	</form>
				    	</div>
				    	<div class="container-fluid" id="sock-result"></div>
                    </div>
                </div>

            </div>
        </div>
    `);

    mod.find('button').click(function(){
    	mod.find('input').click();
    });

    mod.find('button').css({
    	"margin-bottom" : "2em",
    });
    
    //mod.find('#sock-result div:even').css({ "background" : "yellow" });
    
    //mod.find('#sock-result div:odd').css({ "background" : "grey" });
    
    mod.on('hidden.bs.modal', function (e) {
    	mod.find('#sock-result').empty();
    });

    mod.find('input').change(function(evt) {
    	//console.log("This is readFile");
		var files = evt.target.files;
		var file = files[0];           
		var reader = new FileReader();
		reader.onload = function(event) {
			try{
				var content = JSON.parse(event.target.result);
				console.log(content.version);
				console.log(version._id.toString());
				socket.emit("edit version", version._id.toString(), content);
			}
			catch(e){
				// JSON Parse Error 
				console.log("JSON Parse Error");
			}
		}
		reader.readAsText(file);
    });

    var onEditVersionProgress = function(id, message){
    	if(version._id != id) return;
    	console.log("on edit progress");
    	var l = mod.find('#sock-result').children().length;
    	
    	mod.find('#sock-result').append( $('<div '+((l%2==0)?'class="ligh-grey-bg"':'')+'>'+message+'</div>').css({"margin-top": "0.5em", "padding" : "1em"}) );
    };
    var onEditVersion = function(status, id, message){

    	if(version._id != id) return;
    	console.log("on edit");


    	if(status == "success"){
    		mod.find('#sock-result').append( $('<div class="alert alert-success">Version sucessfully updated, reload the page.</div>').css({"margin-top": "0.5em"}) ); 		
    	}
    	else{
    		mod.find('#sock-result').append( $('<div class="alert alert-danger">Could not achieve edition. Cause : '+message+'</div>').css({"margin-top": "0.5em"}) );
    	}
    };

    socket.on('edit version', onEditVersion);
    socket.on('edit version progress', onEditVersionProgress);
    return {modal : mod, edit_events : { progress : onEditVersionProgress, version : onEditVersion } };
}

var healthModal = function(version){
	//
	
	var pods = [], svcs = [], rcs = [], v = version.version;
	for(let i=0; i < version.deployment.kubernetes.length; i++){
		if(version.deployment.kubernetes[i].kind == "Pod")
			pods.push(version.deployment.kubernetes[i]);
		else if (version.deployment.kubernetes[i].kind == "Service")
			svcs.push(version.deployment.kubernetes[i]);
		else if (version.deployment.kubernetes[i].kind == "ReplicationController")
			rcs.push(version.deployment.kubernetes[i]);
	}
	console.log(`Version ${version.version}, found : ${pods.length} pods, ${svcs.length} svc and ${rcs.length} rcs`);
	//setTimeout(function(){
		console.log("retrieve states for "+version.version+" : id = "+version._id);
		socket.emit('states', version._id);
	//}, 2000);
	var state_events = [];
	var pods_tbody = $('<tbody></tbody>');
	pods.forEach(function(pod, index, arr) {
		//
		var state = $(`<td> Loading information ... </td>`);
		var s_event = function(version, kind, name, s){
			console.log("version : "+version+'\tmine : '+v);
			console.log("kind : "+kind+'\tmine : '+"Pod");
			console.log("name : "+name+'\tmine : '+pod.metadata.name);
			if(v == version && kind == "Pod" && name == pod.metadata.name){
				state.text(s);
			}
		}
		state_events.push(s_event);
		socket.on("states", s_event);
		

		var events = $(`<button class="btn btn-info">Events</button>`).click(function(){
			if(typeof socket !== 'undefined'){
                console.log(`Version ${version.version}: health -- events pod ${pod.metadata.name}`);
            	socket.emit('events', 'Pod', pod.metadata.name);
			}
		});
		var spec = $(`<button class="btn btn-info">Spec</button>`).click(function(){
			if(typeof socket !== 'undefined'){
				console.log(`Version ${version.version}: health -- Spec pod ${pod.metadata.name}`);
                socket.emit('spec', 'Pod', pod.metadata.name);
			}
		});
		var update_spec = $(`<button class="btn btn-info">Update spec (patch)</button>`).click(function(){
			
			if(typeof socket !== 'undefined'){
				console.log(`Version ${version.version}: health -- Update Spec pod ${pod.metadata.name}`);
                newSpecModal(version, "Pod", pod.metadata.name);
				//socket.emit('new spec', 'Pod', pod.metadata.name);
			}
			
		});
		console.log("Index : "+index);
		
		pods_tbody.append( $(`<tr></tr>`).append(`<td>${pod.metadata.name}</td>`).append(state)
				.append( $(`<td></td>`).append(events) )
					.append( $(`<td></td>`).append(spec) )
						.append( $(`<td></td>`).append(update_spec) )
		);
	});
	
	var svcs_tbody = $('<tbody></tbody>');
	svcs.forEach(function(svc, index, arr) {
		//
		var state = $(`<td> Loading information ... </td>`);
		var s_event = function(version, kind, name, s){
			console.log("version : "+version+'\tmine : '+v);
			console.log("kind : "+kind+'\tmine : '+"Pod");
			console.log("name : "+name+'\tmine : '+svc.metadata.name);
			if(v == version && kind == "Service" && name == svc.metadata.name){
				state.text(s);
			}
		}
		state_events.push(s_event);
		socket.on("states", s_event);
		

		var events = $(`<button class="btn btn-info">Events</button>`).click(function(){
			if(typeof socket !== 'undefined'){
				console.log(`Version ${version.version}: health -- events Service ${svc.metadata.name}`);
                socket.emit('events', 'Service', svc.metadata.name);
				
			}
		});
		var spec = $(`<button class="btn btn-info">Spec</button>`).click(function(){
			if(typeof socket !== 'undefined'){
				console.log(`Version ${version.version}: health -- Spec Service ${svc.metadata.name}`);
                socket.emit('spec', 'Service', svc.metadata.name);
			}
		});
		var update_spec = $(`<button class="btn btn-info">Update spec (patch)</button>`).click(function(){
			
			if(typeof socket !== 'undefined'){
				console.log(`Version ${version.version}: health -- Update Spec Service ${svc.metadata.name}`);
                newSpecModal(version, "Service", svc.metadata.name);
				//socket.emit('new spec', 'Pod', pod.metadata.name);
			}
		});

		svcs_tbody.append( $(`<tr></tr>`).append(`<td>${svc.metadata.name}</td>`).append(state)
				.append( $(`<td></td>`).append(events) )
					.append( $(`<td></td>`).append(spec) )
						.append( $(`<td></td>`).append(update_spec) )
		);
	});

	var rcs_tbody = $('<tbody></tbody>');
	if(rcs.length > 0){
		rcs.forEach(function(rc, index, arr) {
			//
			var state = $(`<td> Loading information ... </td>`);
			var s_event = function(version, kind, name, s){
				console.log("version : "+version+'\tmine : '+v);
				console.log("kind : "+kind+'\tmine : '+"Pod");
				console.log("name : "+name+'\tmine : '+rc.metadata.name);
				if(v == version && kind == "ReplicationController" && name == rc.metadata.name){
					state.text(s);
				}
			}
			state_events.push(s_event);
			socket.on("states", s_event);	
			

			var events = $(`<button class="btn btn-info">Events</button>`).click(function(){
				if(typeof socket !== 'undefined'){
					console.log(`Version ${version.version}: health -- events rc ${rc.metadata.name}`);
                    socket.emit('events', 'ReplicationController', rc.metadata.name);
				}
			});
			var spec = $(`<button class="btn btn-info">Spec</button>`).click(function(){
				if(typeof socket !== 'undefined'){
					console.log(`Version ${version.version}: health -- Spec rc ${rc.metadata.name}`);
                    socket.emit('spec', 'ReplicationController', rc.metadata.name);
				}
			});
			var update_spec = $(`<button class="btn btn-info">Update spec (patch)</button>`).click(function(){
				
				if(typeof socket !== 'undefined'){
					console.log(`Version ${version.version}: health -- Update Spec rc ${rc.metadata.name}`);
                    newSpecModal(version, "ReplicationController", rc.metadata.name);
					//socket.emit('new spec', 'Pod', pod.metadata.name);
				}
			});

			rcs_tbody.append( $(`<tr></tr>`).append(`<td>${rc.metadata.name}</td>`).append(state)
					.append( $(`<td></td>`).append(events) )
						.append( $(`<td></td>`).append(spec) )
							.append( $(`<td></td>`).append(update_spec) )
			);
		});
	}

	var thead = `
		<thead>
            <tr>
                <th> Name </th>
                <th> State </th>
                <th></th>
                <th></th>
                <th></th>
            </tr>
        </thead>
	`;
 	
 	var t1 = $(`<fieldset></fieldset>`).append( $(`<legend style="color : green"> Pods : </legend>`) )
 				.append( $(`<table class="table"></table>`).append( $(thead) ).append(pods_tbody) );
 	var t2 = $(`<fieldset></fieldset>`).append( $(`<legend style="color : green"> Services : </legend>`) )
 				.append( $(`<table class="table"></table>`).append( $(thead) ).append(svcs_tbody) );
 	var t3;
 	if(rcs.length > 0){
	 	t3 = $(`<fieldset></fieldset>`).append( $(`<legend style="color : green"> Replication Controllers : </legend>`) )
	 				.append( $(`<table class="table"></table>`).append( $(thead) ).append(rcs_tbody) );
 	}

 	var modal_body = $(`<div class="modal-body" style="color: white; background: black"></div>`).append(t1).append(t2);
 	if(rcs.length > 0) modal_body.append(t3);
	var modal_head = $(`
		<div class="modal-header">
            <button type="button" class="close" data-dismiss="modal">&times;</button>
            <h4 class="modal-title">V${version.version} Health on Kuberentes Cluster</b></h4>
        </div>
    `);
	var modal_content = $(`<div class="modal-content"></div>`).append(modal_head).append(modal_body);

	var m = $(`<div class="modal fade" role="dialog" id="v-${version.version.replace(/\./g, '-')}"></div>`).append( $(`<div class="modal-dialog" width="80%"></div>`).css("width", "80%").append(modal_content) )
	var health_events = health_socket_handler(version);
	health_events.states = state_events;
	return {modal : m, health_events : health_events} ;	
}

var health_socket_handler = function(version){
	console.log("health_socket_handler is called");
	var handle = function(k, n){
		var isPresent = false;
		version.deployment.kubernetes.forEach(function(kubeObject, index){
			if(kubeObject.kind == k && kubeObject.metadata.name == n)
				isPresent = true;
		});
		return isPresent;
	}

    /*
	var events = (kind, name, result) => {
		if(handle(kind, name)){
			console.log("Kind : "+kind);
			console.log("Name : "+name);
			console.log("Result : "+result);
			
			result = `<pre style="background: black; color: green">${result}</pre>`;
			
			myModal("Result of events " + kind + " " + name, result, { foreground: "indigo", background : "grey" }, {background : "black"}).modal('show');
			//alert(result);
		}
	}
    */

    var events = (kind, name, result) => {
        if(handle(kind, name)){
            console.log("Kind : "+kind);
            console.log("Name : "+name);
            console.log("Result : "+result);
            console.log("result[0] : "+JSON.stringify(result[0]));
            
            var table = (result.length == 0)? "No Event available" : `
                <div class="container">
                    <table cellpadding="10" style="color: green">
                        <thead>
                            <tr>
                                <th>Action</th>
                                <th>Date</th>
                                <th>Message</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${ result.map(i => `
                                <tr>
                                    <td style="padding-right:2em">${i.action}</td> 
                                    <td style="padding-right:2em">${i.date}</td> 
                                    <td style="padding-right:2em">${i.message}</td>
                                </tr>`).join('\n') }
                        </tbody>
                    <table>
                </div>
            `
            
            result = `<pre style="background: black; color: green">${table}</pre>`;
            
            myModal("Result of events " + kind + " " + name, result, { foreground: "indigo", background : "grey" }, {background : "black"}).modal('show');
            //alert(result);
        }
    }

	var spec = (kind, name, result) => {
		if(handle(kind, name)){
			console.log("Kind : "+kind);
			console.log("Name : "+name);
			console.log("Result : "+result);
			
			result = `<pre style="background: black; color: green">${result}</pre>`;

			myModal("Result of Spec " + kind + " " + name, result, { foreground: "indigo", background : "grey" }, {background : "black"}).modal('show');
			//alert(result);
		}
	}
	var new_spec = (kind, name, result) => {
		if(handle(kind, name)){
			console.log("Kind : "+kind);
			console.log("Name : "+name);
			console.log("Result : "+result);
			
			result = `<pre style="background: black; color: green">${result}</pre>`;

			notificationMsg("Result of Spec " + kind + " " + name, 
				result, 
				{
					title : { foreground: "indigo", background : "grey" }, 
					body : {background : "black"}
				}
			);
			//alert(result);
		}
	}
	socket.on('Hello', function(){
		console.log("You can go on");
		socket.on("events", events);
		socket.on("spec", spec);
		socket.on("new spec", new_spec);
	});
	return { events : events, spec : spec, new_spec : new_spec};
}

var presentVersionAPI = function(version) {
	//
	var api = $(`<div class="panel-group" id="accordion-${version.version.replace(/\./g, '-')}">`);
	for(verb in version.API){
		//
		var uri_panel_group = $(`<div class="panel-group" id="accordion-${verb}-uri"></div>`);
		
		for(var i=0; i < version.API[verb].length; i++) {
			//
			var uri_inputs = '';
			for (var j=0; j < version.API[verb][i].inputs.length; j++){
				uri_inputs += `
					<tr>
						<td> ${version.API[verb][i].inputs[j].name} </td>
						<td> ${version.API[verb][i].inputs[j].mime_types.join(', ')} </td>
						<td> ${version.API[verb][i].inputs[j].required} </td>
    				</tr>
    				`;
			}
			uri_inputs = $(`
				<div class="row">
					<div class="col-sm-2"> Inputs : </div>
					<div class="col-sm-10">
						<table class="table">
				            <thead>
				                <tr>
									<th> Name </th>
									<th> Types </th>
									<th> Required </th>
								</tr>
							</thead>
							<tbody>
								${uri_inputs}
							</tbody>
						</table>		
					</div>
				</div>
			`);

			var uri_outputs = '';
			for (var j=0; j < version.API[verb][i].outputs.length; j++) { 
				uri_outputs += `<span> ${version.API[verb][i].outputs[j]} </span>`;
			}

			uri_outputs = $(`
				<div class="row">
					<div class="col-sm-2"> Outputs : </div>
					<div class="col-sm-10"> 
						${uri_outputs}
					</div>
				</div>`);

			var uri_panel_body = $(`<div id="collapse-${version.version.replace(/\./g, '-')}-${verb}-${i}" class="panel-collapse collapse"></div>`).append(
				$('<div class="panel-body"></div>').append(uri_inputs).append(uri_outputs).append( $(`
						<div class="row">
							<div class="col-sm-2"> Description : </div>
							<div class="col-sm-10"> 
								${version.API[verb][i].description}
							</div>
						</div>
					`))
				);

			var uri_panel_heading = $(`
				<div class="panel-heading">
					
					<a data-toggle="collapse" data-parent="#accordion-${version.version.replace(/\./g, '-')}-${verb}-uri" href="#collapse-${version.version.replace(/\./g, '-')}-${verb}-${i}">
						<h4 class="panel-title">
							${version.API[verb][i].uri}
						</h4>
					</a>
				</div>`);
			
			var panel_default = $(`<div class="panel panel-default"></div>`).append(uri_panel_heading).append(uri_panel_body);

			uri_panel_group.append(panel_default);

		}

		var panel_body = $(`<div id="collapse-${version.version.replace(/\./g, '-')}-${verb}" class="panel-collapse collapse"></div>`).append(
				$('<div class="panel-body"></div>').append(uri_panel_group)
			);
		
		var panel_heading = $(`
			<div class="panel-heading">
				<a data-toggle="collapse" data-parent="#accordion-${version.version.replace(/\./g, '-')}" href="#collapse-${version.version.replace(/\./g, '-')}-${verb}">
					<h3 class="panel-title" style="color: ${(verb.toUpperCase() == 'GET')? 'green' : (verb.toUpperCase() == 'POST')? 'blue' : (verb.toUpperCase() == 'PUT')? 'grey' : 'red'}">
						<b>${verb.toUpperCase()}</b>
					</h3>
				</a>
			</div>`);
		
		var v_api = $('<div class="panel panel-default"></div>').append(panel_heading).append(panel_body);
		api.append(v_api);
	}
	return api;
}

var versionCollapseContent = function(version, authorID){
	
	var current_display = $('<div></div>');
	
	var inf_content = $('<div></div>').append(version.comment);
	var api_content = presentVersionAPI(version);
	var demo_content = $('<div class="row"></div>').append( $('<button type="button" class="btn btn-primary col-md-2">Show demo</button>').click(function(){
		window.open('/demo/'+version._id+'/','_blank','directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=no,width='+$(document).width()+',height='+$(document).height());
	}) ).append('<div style="margin-right: 2em; text-align: left;" class="col-md-offset-1 col-md-5">(You might have to allow pop up windows first).</div>');

	var bug_content = $('<div></div>').append(`
		<form method="post" action="/user/bugreports">
                  
			<div class="form-group row ">
				<textarea name="report" class="form-control" rows="5" placeholder="Describe the bug here" required></textarea>
			</div>
            <input type="hidden" name="authorID" value="${authorID}"/>
            <input type="hidden" name="versionID" value="${version._id}"/>
            <div class="form-group row col-sm-2 pull-right" >
				<button type="submit" class="btn btn-primary pull-right"> Submit </button>
			</div>

		</form>
	`);
	
	//console.log("JSON.stringify(version) : "+JSON.stringify(version));
	var tab_inf = $(`<li role="presentation" class="active" id="tab-inf-${version.version.replace(/\./g, '-')}"><a href="#"> Version Specific Info </a></li>`).click(function(){
		console.log("Tab inf");
		tab_inf.addClass('active');
		tab_api.removeClass('active');
		tab_demo.removeClass('active');
		tab_bug.removeClass('active');
		
		current_display.empty();
		current_display.append(inf_content);
	});
	var tab_api = $(`<li role="presentation" id="tab-api-${version.version.replace(/\./g, '-')}"><a href="#"> API </a></li>`).click(function(){
		console.log("Tab API");
		tab_api.addClass('active');
		tab_inf.removeClass('active');
		tab_demo.removeClass('active');
		tab_bug.removeClass('active');

		current_display.empty();
		current_display.append(api_content);
	});
	var tab_demo = $(`<li role="presentation" id="tab-demo-${version.version.replace(/\./g, '-')}"><a href="#"> Demo </a></li>`).click(function(){
		console.log("Tab DEMO");
		tab_demo.addClass('active');
		tab_inf.removeClass('active');
		tab_api.removeClass('active');
		tab_bug.removeClass('active');

		current_display.empty();
		current_display.append(demo_content);
	});
	var tab_bug = $(`<li role="presentation" id="tab-bug-${version.version.replace(/\./g, '-')}"><a href="#"> Report a bug </a></li>`).click(function(){
		console.log("Tab BUG");
		tab_bug.addClass('active');
		tab_inf.removeClass('active');
		tab_api.removeClass('active');
		tab_demo.removeClass('active');

		current_display.empty();
		current_display.append(bug_content);
	});

	var tab = $(`<ul class="nav nav-tabs" style="margin-bottom:2em;"></ul>`).append(tab_inf).append(tab_api).append(tab_demo).append(tab_bug);

	tab.find('a').click(function(e){ e.preventDefault(); });
	
	console.log("------------------------------------------");
	console.log("- - - - - - - - - Finally- - - - - - - - - ");
	console.log("------------------------------------------");

	current_display.append(inf_content);
	
	var main_content = $('<div class="container-fluid"></div>').append( $('<div class="row"></div>').append(tab) ).append( $('<div class="row"></div>').append(current_display) );
	
	/*
	setTimeout(function(){
		var maxheight = Math.max( Math.max( tab_inf.height(), tab_api.height()) , Math.max( tab_demo.height(), tab_bug.height() ) );
		//tab_inf.height(maxheight);
		tab_api.height(maxheight);
		tab_demo.height(maxheight);
		tab_bug.height(maxheight);
	}, 2000);
	*/
	return main_content;
}

var versionHandler = function(algoID, authorID, version, mode){

	var v_title = $('<h4 class="panel-title"></h4>').append( $(`<a data-toggle="collapse" data-parent="#accordion" href="#collapse-${version.version.replace(/\./g, '-')}">${version.version}</a>`));
	if(mode == "admin" ){
		var health = $(`<span class="glyphicon glyphicon-heart algo-version-option-health" aria-hidden="true" id="health-version-${version.version}" title="Check this version's health" vid="${version._id}"></span>`);
		var edit = $(`<span class="glyphicon glyphicon-pencil algo-version-option-edit" aria-hidden="true" id="edit-version-${version.version}" title="Edit this version" vid="${version._id}"></span>`);
		var hide = $(`<span class="glyphicon glyphicon-${(version.hidden == true)?'eye-open':'eye-close'} algo-version-option-hide" aria-hidden="true" id="hide-version-${version.version}" title="${(version.hidden == true)?'Expose this version to users.':'Hide this version from users.'}" vid="${version._id}"></span>`);
		var remove = $(`<span class="glyphicon glyphicon-trash algo-version-option-remove" aria-hidden="true" id="remove-version-${version.version}" title="Remove this version" vid="${version._id}; margin-left: 2em"></span>`);
		
		var options = $(`<span class="pull-right"></span>`);
		options.append(health).append(edit).append(hide).append(remove);
		
		v_title.append(options);
		
		var hm = healthModal(version);
		health.click(function(){
			console.log(`Version ${version.version}: health`);
			hm.modal.modal('show');
		});
		//if(version.version == "1.0.0")
		//	setTimeout(function(){ socket.removeListener("events", hm.health_events.events);console.log("Removed events"); }, 10*1000);

		var evm = editVersionModal(version);
		edit.click(function(){
			evm.modal.modal("show");
			//socket.emit("edit version", version._id);
			console.log(`Version ${version.version}: edit`);
		});
		
		var hide_event_handler = function(status, vers, message){
			if(vers == version.version){
				if(hide.hasClass("glyphicon-eye-open")){
					//
					hide.removeClass("glyphicon-eye-open");
					hide.addClass("glyphicon-eye-close");
					hide.attr('title', 'Hide this version from users.');
				}
				else {
					//
					hide.removeClass("glyphicon-eye-close");
					hide.addClass("glyphicon-eye-open");
					hide.attr('title', 'Expose this version to users.');
				}
				message = `<pre style="background: black; color: ${(status=="success")?"green":"red"}">This version is now ${(message)? "hidden": "visible"}.</pre>`;
				//myModal("Result of Toggle Hidden property on Version "+vers, message, { foreground: "indigo", background : "grey" }, {background : "black"}).modal('show');
				
				notificationMsg("Result of Toggle Hidden property on Version "+vers, 
					message, 
					5000,
					{
						title : { foreground: "indigo", background : "grey" }, 
						body : {background : "black"}
					}
				);
			}
		}
		socket.on('toggle hidden', hide_event_handler);
		hide.click(function(){
			socket.emit("toggle hidden", version._id);
			console.log(`Version ${version.version}: hide`);
		});
		
		var remove_event_handler = function(status, vers, message){
			if(vers == version.version){
				hm.health_events.states.forEach(function(ev){
					socket.removeListener("states", ev);
				});
				socket.removeListener("events", hm.health_events.events);
				socket.removeListener("spec", hm.health_events.spec);
				socket.removeListener("new_spec", hm.health_events.new_spec);
                socket.removeListener("toggle hidden", hide_event_handler);
				socket.removeListener("remove version", remove_event_handler);
				socket.removeListener("edit version", evm.edit_events.version);
				socket.removeListener("edit version progress", evm.edit_events.progress);

                var done = (message == "Done");
				message = `<pre style="background: black; color: ${(status=="success")?"green":"red"}">${(message=="Done")?"Version successfully removed": message}</pre>`;
				//myModal("Result of remove version "+vers, message, { foreground: "indigo", background : "grey" }, {background : "black"}).modal('show');
				
				notificationMsg("Result of remove version "+vers, 
					message, 
					5000,
					{
						title : { foreground: "indigo", background : "grey" }, 
						body : {background : "black"}
					}
				);

				if(done)
					v_title.parent().parent().empty();
			}
		}
		socket.on('remove version', remove_event_handler);
		remove.click(function(){
			socket.emit("remove version", version._id);
			console.log(`Version ${version.version}: remove`);
		});
	}
	var panel_heading = $('<div class="panel-heading"></div>').append(v_title);

	
	//var panel_collapse = $(`
	//	<div id="collapse-${version.version.replace(/\./g, '-')}" class="panel-collapse collapse">
    //        <div class="panel-body">
    //            <div id="version-${version.version.replace(/\./g, '-')}-comment">${version.comment}</div>
    //            <hr/>
    //            <p><a href="/algo/${algoID}/version/${version.version}">More about this version</a></p>
    //        </div>                          
    //    </div>
	//`);
	
	var collapse_content = versionCollapseContent(version, authorID);

	var panel_collapse = $(`
		<div id="collapse-${version.version.replace(/\./g, '-')}" class="panel-collapse collapse"></div>
		`).append( $(`<div class="panel-body"></div>`).append(collapse_content) );
	
	var v = $(`<div class="panel panel-default"></div>`);
	v.append(panel_heading);
	v.append(panel_collapse);
	console.log("Cool for : "+version.version);
	return v;
}

var removeAlgoConfirmation = function(id) {
    var mod = $(`
        <div class="modal fade" role="dialog">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal">&times;</button>
                        <h4 class="modal-title"> Warning </h4>
                    </div>
                    <div class="modal-body">
                        <div>
                            You are about to remove this algorithm, this means the removal of all the versions of your algorithm.
                        </div>
                        <div class="alert alert-warning">
                            The removal of a version means the removal of all the Kubernetes Objects related to that version (check 
                            the health of your version to find them out). Therefore if another version of another of your algorithm depend on a Kubernetes Object
                            form the version to be deleted, i will likely crash down.
                        </div>
                        <div>
                            You have 1 week to think it over before the deletion. You can allways cancel the deletion order if in the mean time have a change of mind.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `);
    
    var onRemoveAlgo = function(status, msg){
        var result = (status == 'success')? 'Remove count down started, the algorithm will be remove in one week':
            'An error occurred : '+msg;
        
        notificationMsg("Removing algorithm", 
            result, 
            {
                title : { foreground: "indigo", background : "grey" }, 
                body : {foreground : 'white', background : "black"}
            }
        );
    }
    if(typeof socket !== 'undefined')
        socket.on('remove algo', onRemoveAlgo);
    return { modal : mod, sock : onRemoveAlgo } ;
}

var cancelAlgoRemoval = function(id){

    var onCancelAlgoRemoval = function(status){
        var result = (status == 'success')? 'Remove process successfully aborted':
            'An error occurred : '+msg;
        
        notificationMsg("Removing algorithm", 
            result, 
            {
                title : { foreground: "indigo", background : "grey" }, 
                body : {foreground : 'white', background : "black"}
            }
        );
    };
    if(typeof socket !== 'undefined')
        socket.on('cancel algo removal', onCancelAlgoRemoval);

    return {sock : onCancelAlgoRemoval};
}

$(function(){

	$.fn.algoInList = function(initiator){
		//console.log("$(this).html() : " + $(this).html())
		var id = $(this).attr('m_id');
		console.log("id : "+id);
		
		var title = $(this).attr('m_title');
		console.log("title : "+title);
		
		var logo = $(this).attr('m_logo');
		console.log("logo : "+logo);
		
		var description = $(this).attr('m_description');
		//console.log("description : "+description);
		
		var author = {
			email : $(this).attr('m_author_email'),
			company_name : $(this).attr('m_author_company_name')
		};
		console.log("author : "+JSON.stringify(author));
		
		
		var algo_title = $('<div class="algo-title">'+title+'</div>');
		
		
		var algo_logo = $(`<div class="algo-logo" width="100%" height="100%"></div>`);
		

		if(logo && logo != 'undefined'){
			algo_logo.css({
				"background" : 'url("'+logo+'") no-repeat center',
	    		"background-size" : "contain"
			});
		}
		else {
			algo_logo.html("There is no logo for this algorithm.");
		}
		algo_logo.click(function(){
			var win = window.open( (initiator == "myalgos")? '/user/myalgos/'+id : '/algo/'+id+'/page', '_blank');
          	win.focus();
      	});

		$(this).addClass("col-sm-3");
		$(this).append(algo_title);
		$(this).append( $("<hr/>") );
		$(this).append(algo_logo);


		
		var algo_description = $('<div class="algo-description">'+description+'</div>');
		algo_description.appendTo('body');
		algo_description.hide();
		

		var position = $(this).position(), 
			top = (position.top+$(this).height()), 
				left = (position.left+$(this).width()/2);
		
		if(top + algo_description.height() > $( document ).height()){
			top -= $(this).height() + algo_description.height()+24;
		}

		//console.log("algo_description.width() : "+algo_description.innerWidth()+', algo_description.height() : '+algo_description.innerHeight());
		//console.log("left : "+left+", algo_description.width() : "+algo_description.width()+", + : "+(left + algo_description.width())+", $( document ).width() : "+docwidth);
		if(left + algo_description.width() > $( document ).width()){
			left -= algo_description.width();
		}
		

		algo_description.css({
			"position" : "absolute",
			"top" : top,
			"left" : left 
		});

		algo_logo.hover(function(){
			console.log("Entered :");
			console.log("position : "+ JSON.stringify(position));
			console.log("left : "+left+", algo_description.width() : "+algo_description.width()+", + : "+(left + algo_description.width())+", docwidth : "+$( document ).width());
			console.log("top : "+top+", algo_description.height() : "+algo_description.height()+", + : "+(top + algo_description.height())+", docHeight : "+$( document ).height());
			
			algo_description.show();
			//algo_description.show();
		}, function(){
			console.log("Leaved");
			//algo_description.detach();
			algo_description.hide();
			//algo_description.hide();
		});
		
		console.log("MADE AN ALGO!!!");
	}

	/*
	console.log("$(\"algo\").length : " + $("algo").length);
	$("algo").each(function(){
		$(this).algoInList("myalgos");
	});
	*/

	$.fn.algoPage = function(mode){
		//
		$(this).find('section').css({
			"background" : "#dcdcdc",
			"margin-bottom" : "2em",
			"padding" : "1em",
			//"border" : "5px grey dashed",
			"border-radius" : "5px"
		});
        /*
        if(mode != "admin"){
            $(this).find('#edit-algo-information').hide();
            $(this).find('#create-new-v').hide();
            $(this).find('#remove-algo').hide();
        }
        */

		var id = $(this).attr('_id');
        console.log("id : "+id);
        
        var authorID = $(this).attr('a_id');
        console.log("id : "+id);
        
        var title = $(this).find('#title').text();
		console.log("title : "+title);
		
		var description = $(this).find('#description').html();

		var tags = [];
		$(this).find('#tags pre').each(function(elem){
			console.log('Tags :  ' + (($(this).html())? 'true':'false') );
			tags.push($(this).text());
		});
        //var logo = $(this).attr('m_logo');
		//console.log("logo : "+logo);
		
		var um = updateAlgoModal(id, title, description, tags);
		$('#edit-algo-information').click(function(){
			um.modal("show");
		});

        var rmv = removeAlgoConfirmation(id);
        $('#remove-algo').click(function(){
            console.log("Remove algo");
            rmv.modal.modal('show');
            
            if(typeof socket !== 'undefined')
                socket.emit('remove algo', id);
        });

        var car = cancelAlgoRemoval(id);
        $('#cancel-algo-removal').click(function(){
            console.log("Cancel Algo Removal");
            
            if(typeof socket !== 'undefined')
                socket.emit('cancel algo removal', id);
        });

        var nvm = newVersionModal(id);
		$('#create-new-v').click(function(){
			console.log("Create new V");
			nvm.modal.modal('show');
		});
		
		//console.log("description : "+description);
		
		var versions = $(this).find('#versions').text();
		try{
			versions = JSON.parse(versions);
			console.log("Found : "+versions.length+" versions");
			//console.log("versions[0].comment : "+versions[0].comment);
			let tmp = $('<div class="panel-group" id="accordion">');
			for(let i=0; i < versions.length; i++){
				//console.log("Trying for  : "+versions[i].version);
				tmp.append( versionHandler(id, authorID, versions[i], mode) );
			}
			//health_socket_handler(versions);
			versions = tmp;
			$(this).find('#versions').html("");
			$(this).find('#versions').append(versions);
		}
		catch(e){ console.log("versions : "+versions); }
		
	}

	//$("algopage").algoPage("admin");
});
