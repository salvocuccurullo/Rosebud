	var storage = window.localStorage;
	var icarusi_user = "";
	var ct_movies = "";
	var tvshows = "";
	var jsonTvShows = [];
	var currentId = 0;
	var kanazzi;
	var DEBUG = false;
	var top_movies_count = 10;
	var sort_type = "datetime_sec";
	var sort_order = 1;
	var swipe_left_target = "carusi.html";
	var swipe_right_target = "index.html";
	var device_app_path = "";

	var icarusi_user = "";
	var tv_shows_storage;
	var tv_shows_storage_ts;
	
	document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);		//CORDOVA
	
	function onDeviceReady() {		// CORDOVA
					
		icarusi_user = storage.getItem("icarusi_user");
		tv_shows_storage = storage.getItem("tv_shows");
		tv_shows_storage_ts = storage.getItem("tv_shows_count_ts");
		device_app_path = cordova.file.applicationDirectory;
		if (DEBUG) console.log("iCarusi App============> Found Tv Shows Storage");
		if (DEBUG) console.log("iCarusi App============> Tv Shows Storage datetime " + tv_shows_storage_ts);

		var networkState = navigator.connection.type;
		
		$("#connection").html("");
					
		if (icarusi_user == "salvo")
			$("#sabba_info").html(BE_URL);

	/*
	 * OFFLINE MODE CHECKER
	 */ 

		if (networkState === Connection.NONE) {
			$("#connection").html("No network... Pantalica mode...");
			
			checkMoviesCT();
			
			if (tv_shows_storage != "" && tv_shows_storage != undefined && tv_shows_storage != null){
				if (DEBUG) console.log("iCarusi App============> Found Tv Shows Storage");
				getTvShows(true);
			}
		}
		else{
			
			old_ts  = new Number(storage.getItem("tv_shows_count_ts"));
			if (old_ts != "" && old_ts != null && old_ts != undefined){

				new_ts = new Date().getTime();
				diff = new_ts - old_ts;
				diff_sec = diff / 1000;
						
				if (diff_sec < 86400 && tv_shows_storage != "" && tv_shows_storage != undefined && tv_shows_storage != null){
					console.log("iCarusi App============> Cached TVShows loading");
					getTvShows(true); // load movies on startup from cache if there is cache and last update time is greater than 1 day
				}
				else
					getTvShows(false);
			}
			else
				getTvShows(true);
		}

	/*
	 *	BINDINGS
	 */
		/*
		$(document).on("change", "#media", function(){
		});
		*/
		
		/*
		$( "#popupMovie" ).bind(
			{
			popupafteropen: function(event, ui) { 
					if (DEBUG) console.log("iCarusi App============> Opening Popup -> Resetting popup elements...");
					resetPopupElements();
			},
			popupafterclose: function(event, ui) { 
					if (DEBUG) console.log("iCarusi App============> Closing Popup -> Resetting popup elements...");
					resetPopupElements();
			}				
		});
		*/

		$( "#popupPhotoPortrait" ).bind(
			{
			popupafteropen: function(event, ui) { 
					if (DEBUG) console.log("iCarusi App============> Opening Picture Popup -> ");
					//$("#poster_pic").attr("src", device_app_path + "www/images/loading_spinner.gif");
			},
			popupafterclose: function(event, ui) { 
					if (DEBUG) console.log("iCarusi App============> Closing Picture Popup -> Resetting picture src");
					//$("#poster_pic").attr("src","");
					//$("#poster_pic").attr("src", device_app_path + "www/images/loading_spinner.gif");
			}				
		});
		
		/*
		 * BUTTONS ACTIONS
		 */
		
		$("#btn_t_sort").on("click", function(){
			sort_type="title";
			sort_movies();
		});

		$("#btn_d_sort").on("click", function(){
			sort_type="datetime_sec";
			sort_movies();
		});

		$("#btn_m_sort").on("click", function(){
			sort_type="media";
			sort_movies();
		});
		
		$("#btn_v_sort").on("click", function(){
			sort_type="avg_vote";
			sort_movies();
		});
		
		
		$('#ct_search').on('change', function() {
			var search = $( "#ct_search" ).val();
			if ( search.length == 0){
				setCtMovies(ct_movies, false, true);
				return false
			}
		});
		
		/*
		 * TABS MANAGEMENT
		 */
		
		$("#movies_page").on( "tabsactivate", function(event,ui){
			console.log(JSON.stringify(ui.oldPanel.selector));
			console.log(JSON.stringify(ui.newPanel.selector));
			
			if (ui.newPanel.selector == "#tab_movies"){
				$("#movie_type_tabs").tabs( "option", "active", 0 );
				$("#movies_link").addClass('ui-btn-active ui-state-persist');
			};
			
			if (ui.newPanel.selector == "#movies_nw"){
				$("#sort_span").hide();
				$("#movie_search_div").hide();
			}
			else{
				$("#sort_span").show();
				$("#movie_search_div").show();
			}
		});
		
		/*
		 * CT SEARCH
		 */
		
		$( "#ct_search" ).bind( "input", function() {
			var search = $( "#ct_search" ).val();
			var result = ct_movies;
			
			if ( search.length == 0){
				setCtMovies(ct_movies, false, true);
				return false
			}
			
			if ( search.length < 4 ){
				return false;
			}
			
			result = $.grep(result, function(element, index) {
				return ( 
					( element.year.toString() === search) || 
					( element.title.toUpperCase().indexOf(search.toUpperCase()) >= 0 ) || 
					( element.cinema.toUpperCase().indexOf(search.toUpperCase()) >= 0 ) || 
					( element.director.toUpperCase().indexOf(search.toUpperCase()) >= 0 ) 
					);
			});
			setCtMovies(result, false, true);
		});

		/*
		 * MOVIE SEARCH
		 */

		$('#movie_search').on('change', function() {
			var search = $( "#movie_search" ).val();
			if ( search.length == 0){
				tvshows = storage.getItem("tv_shows");		// GET FROM LOCALSTORAGE
				votes_user = storage.getItem("votes_user");
				if (tvshows != "" && tvshows != undefined && tvshows != null && votes_user != "" && votes_user != undefined && votes_user != null)
					setTvShows(eval(tvshows), eval(votes_user));
			}
		});
		
		$( "#movie_search" ).bind( "input", function() {
			tvshows = storage.getItem("tv_shows");		// GET FROM LOCALSTORAGE
			votes_user = storage.getItem("votes_user");
			if (tvshows == "" || tvshows == undefined || tvshows == null || votes_user == "" || votes_user == undefined || votes_user == null)
				return false
			
			var search = $( "#movie_search" ).val();
			var result = eval(tvshows);

			if ( search.length == 0){
				setTvShows(result, eval(votes_user));
				return false
			}

			if ( search.length < 4 ){
				return false;
			}
			
			result = $.grep(result, function(element, index) {
				return ( 
					( element.title.toUpperCase().indexOf(search.toUpperCase()) >= 0 ) || 
					( element.media.toUpperCase().indexOf(search.toUpperCase()) >= 0 ) || 
					( element.username.toUpperCase().indexOf(search.toUpperCase()) >= 0 ) 
					);
			});
			setTvShows(result, eval(votes_user));
		});

		/*
		 * PULL DOWN REFRESH
		 */

		PullToRefresh.init({
			mainElement: '#movies-list',
			onRefresh: function(){
				getTvShows(false);
			},
			instructionsReleaseToRefresh: "Pull down for get fresh data from remote server...",
			distThreshold : 20,
		});			
	
		PullToRefresh.init({
			mainElement: '#movies-list_r4',
			onRefresh: function(){
					getTvShows(false);
			},
			instructionsReleaseToRefresh: "Pull down for get fresh data from remote server...",
			distThreshold : 20,
		});

		PullToRefresh.init({
			triggerElement: '#movies-list_nw',
			onRefresh: function(){
					getTvShows(false);
			},
			instructionsReleaseToRefresh: "Pull down for get fresh data from remote server...",
			distThreshold : 20,
		});
		
		/*
		 * SWIPE RUDIMENTALE
		 */ 
		
		  $( "#movies_page" ).on( "swipeleft", swipeleftHandler );
		  $( "#movies_page" ).on( "swiperight", swipeRightHandler );

		  function swipeleftHandler( event ){
			document.location = swipe_left_target;
		  }

		  function swipeRightHandler( event ){
			document.location = swipe_right_target;
		  }
		  
		/*
		 * INITIALIZATION
		 */
		 
		$("#top-list-movies").listview('refresh');
		$("#top-list-voters").listview('refresh');
 

	};	// CORDOVA

		//$("#btn_show_poster").on("click", function(){
		function poster(img_name){	
			
			curr_pic = img_name; //$("#curr_pic").val();
			
			if (curr_pic != "")
				final_pic_url = base_url_poster + curr_pic;
			else
				final_pic_url = device_app_path + "www/images/no-image-available.jpg";
				
			console.log("Show poster called on " + final_pic_url);
			
			android_version = device.version.split(".");
			
			if ( parseInt(android_version[0]) < 5 ){
				//alert(final_pic_url);
				$("#poster_pic").attr("src",final_pic_url);
				$("#popupPhotoPortrait").popup('open');
			}
			else
				PhotoViewer.show(final_pic_url, "");
		}
		//});
		
	 /***
		GET TV SHOWS
	 ***/

	function sort_movies(){
		sort_order = sort_order * -1;
		$( "#movie_search" ).val("");
		tvshows = storage.getItem("tv_shows");		// GET FROM LOCALSTORAGE
		votes_user = storage.getItem("votes_user");
		if (tvshows != "" && tvshows != undefined && tvshows != null && votes_user != "" && votes_user != undefined && votes_user != null){
			setTvShows(eval(tvshows), eval(votes_user));
		}
	}

	function getTvShows(use_cache) {
		
		if (icarusi_user == undefined || icarusi_user == "" || icarusi_user == null){
			alert("You must be logged in for accessing movies!!");
			return false;
		}
		
		if (!use_cache)
			encryptText2( getX(), "getTvShowsGo" );
		else{
			tvshows = storage.getItem("tv_shows");		// GET FROM LOCALSTORAGE
			votes_user = storage.getItem("votes_user");
			
			if (tvshows != "" && tvshows != undefined && tvshows != null && votes_user != "" && votes_user != undefined && votes_user != null){
				setTvShows(eval(tvshows), eval(votes_user));
			}
			else{
				getTvShows(false);
			}
		}
	};

	function getTvShowsGo(){
		
		$.mobile.loading("show", {
			text:'Loading movies...',
			textVisible:true,
			theme: 'e',
			html: '',
		});
		
		$("#movies-list").empty();
		$("#movies-list_r4").empty();
		$("#movies-list_nw").empty();
		$("#top-list-movies").empty();
		$("#top-list-voters").empty();
		$("#ct-movies").empty();
		
		//if (DEBUG) console.log("iCarusi App============> ----------------> " + kanazzi + " <---------------");
		
		$.ajax(
		{
		  url: BE_URL + "/getTvShows",
		  method: "POST",
		  dataType: "json",
		  data: {
			username: icarusi_user,
			kanazzi: kanazzi,
		  },
		})
		  .done(function(data) {

			response = JSON.parse(data.payload);
			tvshows = response.tvshows;
			votes_user = response.votes_user;

			storage.setItem("tv_shows", JSON.stringify(tvshows));		// SAVE ON LOCALSTORAGE
			storage.setItem("tv_shows_count_ts", new Date().getTime());
			storage.setItem("votes_user", JSON.stringify(votes_user));

			setCacheInfo();

			setTvShows(tvshows, votes_user);
			
			// ===================================================
			/*

			*/
			// ===================================================
			
		  })
		  .fail(function(err) {
			console.log( "error " + err.responseText );
			$("#movies_content").html('<br/><span style="color:red; text-align:center">Error during song loading...<br/>Tiricci Pippo !!</span>');
		  })
		  .always(function() {
			$.mobile.loading("hide");
			//if (DEBUG) console.log("iCarusi App============> ajax call completed");
		  });			
	}


	function setTvShows(tvshows, votes_user){
		
		if (DEBUG) console.log("iCarusi App============> SetTvShows called");
		
		$("#movies-list").empty();
		$("#movies-list_r4").empty();
		$("#movies-list_nw").empty();
		$('#top-list-voters').empty();
		$('#top-list-movies').empty();
		
		setCacheInfo();
		
		if (tvshows.length==0)
			$('#movies-list').append('<li style="white-space:normal;">No Movies/Series available</li>');
		
		var bnc=0;
		var r4c=0;

		tvshows.sort(function(a,b){
			if (a[sort_type] > b[sort_type])
				return (sort_order * -1);
			if (a[sort_type] < b[sort_type])
				return sort_order;
			return 0;
		});
		
		$.each(tvshows, function( index, value ) {
			
			var comment_count = 0;
			jsonTvShows[value.id] = value;
			
			var content = '<li style="white-space:normal;">';
			//content += '<a data-transition="slide" href="javascript:setPopupData(' + value.id + ')">';
			
			if (value.avg_vote == 0){
				content += '<b>' + value.title + '</b> <span style="color:#C60419; float:right"> [ N/A ]</span>';
				//content += '<b>' + value.title + '</b>';
			}
			else{
				content += '<b>' + value.title + '</b> <span style="color:#C60419; float:right"> [ ' + value.avg_vote + ' ]</span>';
				//content += '<b>' + value.title + '</b>';
			}
			

/*			
			// COMMENT ICON

			content += '<span style="text-align:right; font-size:10px;">Added on ' + value.datetime + ' by </span>';
			content += '<span style="color:#000099; font-style:italic; font-size:10px;">' +  value.username + '</span>';
			if (sort_type=="media")
				content += '<br/><span style="color:#000099; font-style:italic; font-size:10px;">' +  value.media + '</span>';
			//content += '</a>';
			content += '</li>';
*/

			// NW SECTION
			var content_nw = '<li style="white-space:normal;">';
			content_nw += '<a data-transition="slide" href="javascript:setPopupData(' + value.id + ',\'nw\')">';
			content_nw += '<b>' + value.title + '</b> <br/>';
			content_nw += '<span style="color:#000099; font-style:italic; font-size:11px;">';
			
			at_least_one_nw = false;
			users_votes_keys = Object.keys(value.u_v_dict);
			$.each(users_votes_keys, function( index1, value1 ) {

				comment = value.u_v_dict[value1]['comment'];
				if (comment != "")
					comment_count += 1;

				if (value.u_v_dict[value1]['now_watching']){
					at_least_one_nw = true;
					name = value.u_v_dict[value1]['us_name'];
					epi = value.u_v_dict[value1]['episode'];
					season = value.u_v_dict[value1]['season'];
					content_nw += "[" + name + ' S' + season + 'E' + epi + ']&nbsp;&nbsp;';
				}
			});
			content_nw += '</span>';
			content_nw += '</a>';
			content_nw += '</li>';
			// END NW SECTION
			
			content += '<br/><span style="text-align:right; font-size:10px;">Added on ' + value.datetime + ' by </span>';
			content += '<span style="color:#000099; font-style:italic; font-size:10px;">' +  value.username + '</span>';
			
			if (sort_type=="media")
				content += '<br/><span style="color:#000099; font-style:italic; font-size:10px;">' +  value.media + '</span>';

			// ICONS BLOCK -------------------------
			content += '<span style="color:#C60419; float:right">';
			
			// PICTURE ICON
			if (value.poster != ""){
				content += '<button class="ui-btn ui-icon-camera ui-btn-icon-notext ui-corner-all ui-mini ui-btn-inline" id="btn_show_poster" onclick="poster(\''+value.poster+'\')"></button>';
			}
			
			// EDIT ICON
			content += '<button class="ui-btn ui-icon-edit ui-btn-icon-notext ui-mini ui-corner-all ui-btn-inline" id="btn_show_poster" onclick="setPopupData(\''+value.id+'\',\'a\')"></button>';
			
			// COMMENT ICON
			if (comment_count > 0){
				//content += '<div class="numberCircle">' + comment_count + '</div>';
				//content += '<button class="ui-btn  ui-mini ui-corner-all ui-btn-inline" data-theme="e" onclick="setPopupData(\''+value.id+'\',\'c\')">' + comment_count + '</button>';
				content += '<button class="ui-btn  ui-mini ui-corner-all ui-btn-inline" data-theme="e">' + comment_count + '</button>';
			}
			
			content += '</span><br/>';
			// END ICONS BLOCK ---------------------------
			
			content += '</li>';

			
			if (at_least_one_nw) {
				$('#movies-list_nw').append(content_nw);
			};
			
			if (value.type == 'r4'){
				$('#movies-list_r4').append(content);
				r4c+=1;
			}
			else{
				$('#movies-list').append(content);
				bnc+=1;
			}
			
		});

		header_content = '<li data-role="list-divider" data-theme="b" style="text-align:center">';
		header_content += '<span style="color:yellow"> ' + bnc + ' </span>movies found.';
		header_content += '</li>';
		$('#movies-list').prepend(header_content);

		header_content = '<li data-role="list-divider" data-theme="b" style="text-align:center">';
		header_content += '<span style="color:yellow"> ' + r4c + ' </span>movies found.</li>';
		$('#movies-list_r4').prepend(header_content);

		header_content = '<li data-role="list-divider" data-theme="b" style="text-align:center">';
		header_content += '<span style="color:yellow">Currently ongoing...</span></li>';
		$('#movies-list_nw').prepend(header_content);

		tvshows.sort(function(a,b){
			if (a.avg_vote > b.avg_vote)
				return -1;
			if (a.avg_vote < b.avg_vote)
				return 1;
			return 0;
		});

		header_content = '<li data-role="list-divider" data-theme="b" style="text-align:center">';
		header_content += 'Top<span style="color:yellow"> ' + top_movies_count + ' </span>movies</li>';
		$('#top-list-movies').append(header_content);
		
		count = 0;
		$.each(tvshows, function( index, value ) {
			if (count==top_movies_count) return false;
			var content = '<li style="white-space:normal;">';
			if (value.avg_vote != 0)
				content += '<b>' + value.title + '</b> <span style="color:red; float:right">' + value.avg_vote + '</span>';
			else
				content += '<b>' + value.title + '</b> <span style="color:red; float:right">N/A</span>';
			content += '</li>';
			$('#top-list-movies').append(content);
			count+=1;
		});

		header_content = '<li data-role="list-divider" data-theme="b" style="text-align:center">';
		header_content += '<span style="color:yellow"> Top Voters </span></li>';
		$('#top-list-voters').append(header_content);

		votes_user = votes_user.sort(function(a, b) {
			return a.count < b.count;
		});

		$.each(votes_user, function( index, value ) {
			var content = '<li style="white-space:normal;">';
			content += '<b>' + value.name + '</b> <span style="color:red; float:right">' + value.count + '</span>';
			content += '</li>';
			$('#top-list-voters').append(content);
		});

		$('#movies-list').listview('refresh');
		$('#movies-list_r4').listview('refresh');
		$('#movies-list_nw').listview('refresh');
		$('#top-list-voters').listview('refresh');
		$('#top-list-movies').listview('refresh');
		checkMoviesCT();
	}

	function setCacheInfo(){
		show_info = storage.getItem("show-extra-info");
		if ( show_info != "" && show_info != null && eval(show_info)){
			
			tv_shows_storage = storage.getItem("tv_shows");
			tv_shows_storage_ts = storage.getItem("tv_shows_count_ts");
		
			if (tv_shows_storage != "" && tv_shows_storage != undefined && tv_shows_storage != null)
				$("#cache_info").html("TvShows cached " + eval(tv_shows_storage).length + " element(s) --- last update " + fancyDate(tv_shows_storage_ts));
		}
	}

 /***
	CT MOVIES
 ***/

	function checkMoviesCT(){
		
		var ct_movies = "";
		ct_movies = storage.getItem("baracca");
		
		//CHECK WHETHER THE UL IS ALREADY POPULATED
		ul_ct_size = $('#ct-movies li').length;
		
		if (ct_movies != "" && ul_ct_size >1){
			if (DEBUG) console.log("iCarusi App============> Skipping CT movies rebuild...");
			return false;
		}
		
		if (ct_movies == "" || ct_movies == "undefined" || ct_movies == null ){
			if (DEBUG) console.log("iCarusi App============> No cache for CT movies... going to retrieve from remote server...");
			getMoviesCT();
		}
		else{
			if (DEBUG) console.log("iCarusi App============> Data cached found for CT movies... data retireved from localstorage... Size: " + (JSON.parse(ct_movies)).length);
			ct_movies = JSON.parse(ct_movies);
			if (DEBUG) console.log("iCarusi App============> Data size: " + ct_movies.length);
			setCtMovies( ct_movies, true, false );
		}				
	}

	function getMoviesCT(){
		
		/*
		$.mobile.loading("show", {
			text:'Loading movies...',
			textVisible:true,
			theme: 'e',
			html: '',
		});
		*/

		$.ajax(
		{
		  url: BE_URL + "/moviesct",
		  method: "GET",
		  dataType: "json"
		})
		  .done(function(data) {

			xyz = eval(data);
			storage.setItem("baracca", JSON.stringify(xyz.payload));
			ct_movies = xyz.payload;			// IT'S ME
			setCtMovies(xyz.payload, false, false);
		  })
		  .fail(function() {
			console.log( "error" );
		  })
		  .always(function() {
			//$.mobile.loading("hide");
		  });
	
	}

	function setCtMovies(data, cached, by_search){
		
		$('#ct-movies').empty();
		
		data=eval(data);
		if (cached)
			ct_movies = data;
		data.sort(function(a,b){
			if (a.title < b.title)
				return -1;
			if (a.title > b.title)
				return 1;
			return 0;
		});
		
		//$("#total_ct_movies").html('<span style="color:blue">' + data.length + '</span> movies found');
		
		if (data.length==1)
			movie_str = "movie";
		else
			movie_str = "movies";
		
		header_content = '<li data-role="list-divider" data-theme="b" style="text-align:center">';
		header_content += '<span style="color:yellow">' + data.length + '</span>&nbsp;' + movie_str + ' found</li>';
		
		$('#ct-movies').append(header_content);
		
		$.each(data, function(index,value){
			var content = '<li style="white-space:normal;">';
			content += '<a data-transition="slide" href="javascript:setPopupCT(' + value.id + ')">';
			content += '<div style="font-size:11px">';
			content += '<b>' + value.title + '</b><br/><span style="font-style:italic">' + value.director + '</span>'; 
			content += '<span style="color:red; float:right">' + value.year + " - " + value.cinema + '</span>';
			content += '</div>';
			content += '</li>';
			content += '</a>';
			$('#ct-movies').append(content);
		});
		
		//if (by_search)
			$("#ct-movies").listview('refresh');
	}

	function setPopupCT(id){
		
		if (id == undefined)
			return false;
		
		//if (DEBUG) console.log("iCarusi App============> Id to open.. " + id);
		$("#popupMovieCt").panel("open");
		temp = ct_movies;
		result = $.grep(temp, function(element, index) {
			return ( element.id === id );
		});
		
		content = '<span style="font-size:14px; font-weight:bold">' + result[0].title + "</span><br/><br/>";
		content += "Directed by: <i><b>" + result[0].director + "</b></i><br/><br/>";
		content += 'Cast:<br/><span style="width:65%; font-style:italic; font-weight:bold">' + result[0].cast + '</span><br/><br/>';
		content += 'Year: <b>' + result[0].year + '</b><br/><br/>';
		content += 'Cinema: <b>' + result[0].cinema + '</b><br/><br/>';
		content += '<span style="font-weight:bold">FilmTV:</span><br/>';
		
		if (result[0].filmtv.indexOf("A") == 0)
			content += '<img src="images/green.png" style="width:60px"/>';
		else if (result[0].filmtv.indexOf("B") == 0)
			content += '<img src="images/blue.png" style="width:60px"/>';
		else if (result[0].filmtv.indexOf("C") == 0)
			content += '<img src="images/red.png" style="width:60px"/>';

		content += '<br/><br/><br/><span style="font-style:italic;">Tap outside the panel for close</span>';

		$("#movie-table-custom").html(content);
	}

	 /***
		SAVE NEW MOVIE
	 ***/

	$(document).on("click", "#send_movie_btn", function(){
		var d = getX();
		//encryptText2( d, "saveMovie" );
		encryptText2( d, "saveMovieNew" );
	});

	function saveMovieNew(){

		var username = icarusi_user;

		$("#username").val(username);
		$("#kanazzi").val(kanazzi);
		$("#id").val(currentId);
		var title = $("#title").val();
		var media = $("#media :selected").val();
		var type = $("#type :selected").val();
		
		// TRICK
		$('#media').selectmenu('enable');
		$('#type').selectmenu('enable');
		// END TRICK

		var the_form = $("#movie_form");
		var formData = new FormData( the_form[0] );

		if (username == "" || username == undefined || username == null){
			alert("You must be logged in for saving or updating Movies/Serie");
			return false;
		}
		
		if (title == "" || title == undefined || title == null || media == "" || media == undefined || media == null || type == "" || type == undefined || type == null){
			alert("Title, media and type cannot be blank!!\nTitle: " + title + "\nMedia: " + media + "\nType: " + type);
			return false;
		}
		
		$.mobile.loading("show", {
			text:'Submitting movie...',
			textVisible:true,
			theme: 'e',
			html: '',
			});

		$.ajax(
		{
			url: BE_URL + "/savemovienew",
			method: "POST",
			data: formData,
			cache: false,
			contentType: false,
			processData: false
		})
		  .done(function(data) {
			 
			response = eval(data);
			
			if (response.result == "failure"){
				alert(response.message);
				return false;
			} 
			
			if (DEBUG) console.log(JSON.stringify(response));
			if (response.upload_result.result == "failure"){
				alert(response.upload_result.message);
			} 
			
			resetPopupElements();
			getTvShows(false);
			currentId = 0;
			//$("#popupMovie").popup("close");		//OLD
			$.mobile.back();						//NEW
		  })
		  .fail(function(err) {
				alert("Server error!");
			//var msg = eval(err.responseJSON);
			//alert(msg.message);
			//if (DEBUG) console.log("iCarusi App============> ========> iCarusi : failed to save tv show");
			//if (DEBUG) console.log("iCarusi App============> ========> iCarusi : username " + storage.getItem("icarusi_user"));
		  })
		  .always(function() {
			$.mobile.loading("hide");
		  });
	};

	/***
		DELETE
	***/

	$(document).on("click", "#delete_movie_btn", function(){
		if (confirm("Are you sure?")) {
			var d = getX();
			encryptText2( d, "deleteMovie" );
		}
	});

	function deleteMovie(){

		if (icarusi_user == "" || icarusi_user == undefined || icarusi_user == null){
			alert("You must be logged in for deleting Movies/Serie");
			return false;
		}

		$.mobile.loading("show", {
			text:'Submitting movie...',
			textVisible:true,
			theme: 'e',
			html: '',
			});

		$.ajax(
		{
		  url: BE_URL + "/deletemovie",
		  method: "POST",
		  data: {
			id: currentId,
			username: icarusi_user,
			kanazzi: kanazzi,
		  },
		})
		  .done(function(data) {
			response = eval(data);
			if (DEBUG) console.log("iCarusi App============> ========> " + response.result);
			if (DEBUG) console.log("iCarusi App============> ========> " + response.message);
			
			if (response.result == "failure"){
				alert(response.message);
				return false;
			}
			
			resetPopupElements();
			getTvShows(false);
			currentId = 0;
			
			//$("#popupMovie").popup("close");		//OLD
			$.mobile.back();						//NEW

		  })
		  .fail(function(err) {
			 alert("Server error!");
			//var msg = eval(err.responseJSON);
			//alert(msg.message);
			//if (DEBUG) console.log("iCarusi App============> ========> iCarusi : failed to delete tv show");
			//if (DEBUG) console.log("iCarusi App============> ========> iCarusi : username " + storage.getItem("icarusi_user"));
		  })
		  .always(function() {
			$.mobile.loading("hide");
		  });
	};

	function newMoviePage(){
		$(':mobile-pagecontainer').pagecontainer('change', '#detail_page');
		resetPopupElements();
	}

	/***
	 SET POPUP DATA
	***/

	function setPopupData(id, src){
		//OLD
		//$("#popupMovie").popup("open");
		
		// NEW
		$(':mobile-pagecontainer').pagecontainer('change', '#detail_page');
		resetPopupElements();
		//END NEW
				
		$("#nw").prop("checked",false).checkboxradio("refresh");
		$('#giveup').checkboxradio('enable');

		var item = jsonTvShows[id];
		if (DEBUG) console.log("iCarusi App============> " + item.title + " ** " + item.media + " ** " + item.username + " ** " + item.avg_vote);
		currentId = id;
		
		if (DEBUG) console.log("iCarusi App============> " + JSON.stringify(item.u_v_dict));
		if (!(icarusi_user in item.u_v_dict)){
			vote = 5;
			episode = 1;
			season = 1;
			comment = '';
			if (DEBUG) console.log("iCarusi App============> User " + icarusi_user + " has not voted for this movie. Setting default value to: " + vote);
		}
		else{
			vote = item.u_v_dict[icarusi_user].us_vote;
			nw = item.u_v_dict[icarusi_user].now_watching;
			episode = item.u_v_dict[icarusi_user].episode;
			season = item.u_v_dict[icarusi_user].season;
			comment = item.u_v_dict[icarusi_user].comment;
			if (nw) $("#nw").prop("checked",true).checkboxradio("refresh");
			if (DEBUG) console.log("iCarusi App============> Vote for user " + icarusi_user + " = " + vote + " (Now watching: " + nw + ")");
		}
		
		$("#top_title").html('<span style="text-align:center; vertical-align:middle">' + item.title + '</span>');
		$("#title").val(item.title);
		$("#link").val(item.link);
		$('#media').val(item.media).selectmenu('refresh',true);
		$('#type').val(item.type).selectmenu('refresh',true);
		$("#curr_pic").val(item.poster);
		$("#vote").val(vote).slider("refresh");
		$("#the_votes_d").show();
		$("#episode").val(episode);
		$("#season").val(season);
		$("#comment").val(comment);

		if (icarusi_user == "" || icarusi_user == undefined || icarusi_user == null){
			$("#send_movie_btn").addClass("ui-btn ui-state-disabled");
			$("#delete_movie_btn").addClass("ui-btn ui-state-disabled");
		}

		var collapse_vote = $("#the_votes_d").collapsible( "option", "collapsed");
		if ( collapse_vote == false)
			$("#the_votes_d").collapsible( "option", "collapsed", "true" );

		var additional_info = $("#additional_info").collapsible( "option", "collapsed");
		if ( additional_info == false)
			$("#additional_info").collapsible( "option", "collapsed", "true" );

		if (icarusi_user != item.username){

			$("#title").prop('readonly',true);
			$("#link").prop('readonly',true);
			$("#title").textinput( "option", "clearBtn", false );
			$("#link").textinput( "option", "clearBtn", false );
			$("#title").textinput("refresh");
			$("#link").textinput("refresh");


			$('#media').selectmenu('disable');
			$('#type').selectmenu('disable'); 
			$('#media').prop('readonly',true);
			$('#type').prop('readonly',true);
			$("#send_movie_btn").text("Vote...");
			$("#pic").addClass("ui-btn ui-state-disabled");
			$("#delete_movie_btn").addClass("ui-btn ui-state-disabled");
		}
		else{
			$("#send_movie_btn").text("Update...");
			$("#send_movie_btn").removeClass("ui-state-disabled");
			$("#delete_movie_btn").removeClass("ui-state-disabled");
		}
		
		/*
		
		header_content = '<li data-role="list-divider" data-theme="b" style="text-align:center">';
		header_content += '<span style="color:yellow"> ' + item.title + ' </span></li>';
		$('#users_votes').prepend(header_content);
		*/
		
		$('#users_votes').empty();
		$.each(item.u_v_dict, function( index, value ) {
			var content = '<li style="white-space:normal;">';
			if (value.now_watching == true)
				content += '<b>' + value.us_username + '</b> <span style="color:red; float:right">now watching...</span>';
			else{
				content += '<b>' + value.us_username + '</b> <span style="color:red; float:right">' + value.us_vote + '</span>';
				content += '<br/><p style="white-space:normal; font-style:italic">' + value.comment+ '</p>';
			}
			content += '</li>';
			$('#users_votes').append(content);
		});
		$('#users_votes').listview('refresh');
		
		/*
		var offset = $.mobile.activePage.find('#the_votes_d').offset();
		console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ " + JSON.stringify(offset));
		if (src == "c"){
			$("#the_votes_d").collapsible( "option", "collapsed", "false" );
			$.mobile.silentScroll($("#the_votes_d").offset().top);
		}
		else
			$("#the_votes_d").collapsible( "option", "collapsed", "true" );
		*/
	}

	/***
	 RESET POPUP DATA
	***/

	function resetPopupElements(){
		currentId = 0;
		$("#title").prop('readonly',false);
		$("#link").prop('readonly',false);
		$("#title").textinput( "option", "clearBtn", true );
		$("#link").textinput( "option", "clearBtn", true );
		$('#media').selectmenu('enable');
		$('#type').selectmenu('enable');
		$('#giveup').checkboxradio('disable');
		$("#title").val('');
		$("#link").val('');
		$("#curr_pic").val('');
		$('#media').val("").attr('selected', true).siblings('option').removeAttr('selected');
		$('#media').selectmenu('refresh',true);
		$('#type').val("").attr('selected', true).siblings('option').removeAttr('selected')
		$('#type').selectmenu('refresh',true);
		$("#the_votes_d").hide();
		$("#vote").val(5).slider("refresh");
		$("#send_movie_btn").text("Send...");
		$("#delete_movie_btn").addClass("ui-btn ui-state-disabled");
		$("#send_movie_btn").removeClass("ui-state-disabled");
		$("#pic").removeClass("ui-btn ui-state-disabled");
		$("#nw").prop("checked",false).checkboxradio("refresh");
		$("#giveup").prop("checked",false).checkboxradio("refresh");
		$("#season").val('');
		$("#episode").val('');
		$("#comment").val('');
		$("#pic").val(null);
		$('#users_votes').empty();
		$("#top_title").html('Add a new movie/serie...');
	}


