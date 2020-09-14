$(function(){

	$.fn.extend({
		scrollBackground: function(velocity){
			if (typeof velocity === 'undefined') velocity = 0.2;

			return this.each(function(index, e){
				var pos = $(window).scrollTop();
				$(window).bind('scroll', ()=>{
					var height = $(window).scrollTop()-18;
					var v = Math.round((height - pos) * velocity);
					$(e).css('background-position', '0% ' + v +  'px');
				});
			});
		},

		attachIMTBackground: function(smallSizeThreshold){
			if (typeof smallSizeThreshold === 'undefined') smallSizeThreshold = 700;

			return this.each(function(index, e){
				var navHeight = $(e).height();
				console.log("navHeight: ", navHeight);

				var bg = $('<div><div class="bg-left"></div><div class="bg-middle"></div><div class="bg-right"></div></div>')
				
				var icon = $('<div class="icon"><i class="fa fa-bars" ></i></div>');

				icon.click(function(){
					$(e).find('section').each(function(index, s){
						if (!$(s).hasClass('wide-only')){
							$(s).toggle();
						}
					});
				});

				var defaultStyles = ()=>{
					bg.css({
						"display": "flex",
						"position": "absolute",
						"width": "100vw",
						"height": navHeight+'px',
						"z-index": -1
					});


					bg.find('.bg-left').css({
						"background-color": "transparent",
						"background-image": `linear-gradient(225deg, #00b8de ${navHeight*25/90}%, #ffffff 0%)`,
						"height": navHeight+"px",
						"flex-grow": 4,
						//border: "1px dotted grey"
					});

					bg.find('.bg-middle').css({
						"background-color": "#00b8de",
						"height": navHeight+"px",
						"flex-grow": 5,
						//border: "1px dotted grey"
					});

					bg.find('.bg-right').css({
						"background-color": "transparent",
						"background-image": "linear-gradient(135deg, #00b8de 51%, #0c2340 0%)",
						"height": navHeight+"px",
						"flex-grow": 2,
						//border: "1px dotted grey"
					});


					icon.css({
						"position": "absolute",
						"display": "none",
						"float": "right",
						"top": (navHeight*0.1)+'px',
						"right": "1em",
						"font-size": navHeight/2+'px',
						"padding-left": "5px",
						"padding-right": "5px",
						"padding-top": "2px",
						"padding-bottom": "2px",
						"cursor": "pointer",
						"border": "1px black solid",
						"border-radius": "5px",
						"text-decoration": "bold",
					});
				}

				var drawSmall = ()=>{
					console.log("drawing small!!");
					defaultStyles();

					icon.show();
					
					bg.find('.bg-middle, .bg-right').hide();
					$(e).find('section').css('display', 'none');
				}

				var drawBig = ()=>{
					console.log("drawing big!!");
					defaultStyles();
					
					icon.hide();
					
					bg.find('.bg-left, .bg-middle, .bg-right').show();
					$(e).find('section').css('display', 'flex');
				}

				var isCurrentlySmall = $(document).width() <= smallSizeThreshold;

				if (isCurrentlySmall){drawSmall();}else{drawBig();}
				$(window).resize(function(){
					/*console.log("wind width: ", $(document).width());*/
					var wasSmall = isCurrentlySmall;
					isCurrentlySmall = $(document).width() <= smallSizeThreshold;

					if (isCurrentlySmall && !wasSmall){
						drawSmall();
					}
					else if (!isCurrentlySmall && wasSmall){
						drawBig();
					}
				});

				$(e).append(bg);
				$(e).append(icon);
			});
		},

		styleResource: function(){
			
			var maxElementWidth = 350, minElementWidth = 250;
			return this.each(function(index, e){

				var name = $(e).attr('name');
				var intro = $(e).attr('intro');
				var type = $(e).attr('type');
				var id = $(e).attr('id');

				//$(e).attr('title', intro); $(e).tooltip();
				
				var header = $(`<div><div class="resource_name">${name}</div><div class="resource_type"><img src="/assets/img/${type}.svg"></div></div>`);

				var content = $('<div><div class="resource_logo">Logo</div><button class="resource_redirect_btn"> More... </button></div>');

				var redraw = ()=>{
					var width = Math.max(Math.min($(document).width()/3, maxElementWidth), minElementWidth), height = width*1.2;
					console.log("width : ", width, " height : ", height);

					header.css({
						"display": "flex",
						"position": "absolute",
						"align-items": "center",
						"margin-left": "1em",
						"margin-top": "1em",
						"border": "1px solid blue",
						"border-radius": "0.5em 0 0.5em 0",
						"background-image": "linear-gradient(350deg, #00b8de 5%, rgba(250,250,250,1) 90%)",
						"box-shadow": "5px 5px 5px grey",
						"width": width,
						"height": height*0.2,
						"z-index": 2
					});

					header.find('.resource_name').css({
						"width": (width*0.7)+'px',
						"padding":"1em",
						/*"border": "1px solid green",*/
					});

					header.find('.resource_type').css({
						"width": (width*0.3)+'px',
									
					});

					content.css({
						"width": width,
						"height": height*0.8,
						"padding-top": "2em",
						"bottom": 0,
						"color": "white",
						"border-radius": "0.5em",
						"position": "absolute",
						"background-image": "linear-gradient(350deg, rgba(10,10,10,1) 5%, rgba(0,0,128,1) 90%)",
						"border": "1px solid orange",
						"box-shadow": "5px 5px 5px grey",
						"z-index": 1
					});

					content.find('.resource_redirect_btn').addClass('btn btn-primary').css({ 
						"position": "absolute", 
						"bottom": "5px", 
						"right": "5px",
						/*"cursor": "pointer"*/
					});

					
					$(e).css({
						"width": width+"px",
						"height": height+'px',
						"position": "relative",
						"margin": "1em",
						/*"border": "1px solid black"*/
					});
				}
				
				redraw();
				$(window).resize(function(){
					redraw();
				});

				$(e).append(header);
				$(e).append(content);
			});
		}
	});

	$('resource').styleResource();

	var bannerIMG = ()=>{
		$('.banner, .banner-full, #signin-container, #signup-container').each(function(index, e){
			$(e).css({
				"background-image": `url(${$(e).attr('banner-img')})`,
				"background-position": "0% 0%"
			});
		});
	}
	//bannerIMG();

	$('.banner').scrollBackground();

	//$('.header-nav').attachIMTBackground();


	var handleCustomStyles = ()=>{
		$("[my-custom-styles]").each(function(index, e){
			console.log("My custome style [", index, "]: ", $(e).attr('my-custom-styles'));
			try{
				var style = JSON.parse($(e).attr('my-custom-styles'));
				/*for (var s in style){
					style[s] = style[s]+' !important';
				}
				console.log('style: ', style);*/
				$(e).css(style);
			}catch(e){
				console.log("Could not apply custom style because : ", e);
			}
		});
	}

	//handleCustomStyles();
});