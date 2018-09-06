		
		var storage = window.localStorage;
		var icarusi_user = "";
		var kanazzi;
		var swipe_left_target = "index.html";
		var swipe_right_target = "carusi.html";
		var DEBUG = false;
		var device_app_path = "";
		var sort_type = "created";
		var sort_order = -1;
		var current_covers = "";
		var curr_file_size = 0;
		var curr_cover_id = "";
		
		document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
		
		function onDeviceReady() {
			
			icarusi_user = storage.getItem("icarusi_user");
			covers_storage = storage.getItem("covers_storage");
			device_app_path = cordova.file.applicationDirectory;
			$("#poster_pic").attr("src", "images/loading.gif");

			var networkState = navigator.connection.type;
			$("#connection").html("");
			$("#random_song_message").html("");
			
			if (networkState === Connection.NONE) {
				$("#connection").html("No network... Pantalica mode...");
			}
			
			if (icarusi_user == "salvo")
				$("#sabba_info").html(BE_URL);

			if (networkState === Connection.NONE) {
				$("#connection").html("No network... Pantalica mode...");
				
				$("#random_song_message").html("No Random Song available<br/>on Pantalica mode! ;)");
				
				if (icarusi_user != "" && covers_storage != "" && covers_storage != undefined && covers_storage != null){
					console.log("iCarusi App============> NO NETWORK -> Cached Covers loading");
					sort_covers("created");
				}

			}
			else {
			
				encryptText2(getX(), "get_song");
				
				old_ts  = new Number(storage.getItem("covers_ts"));
				if (old_ts != "" && old_ts != null && old_ts != undefined){

					new_ts = new Date().getTime();
					diff = new_ts - old_ts;
					diff_sec = diff / 1000;
							
					if (icarusi_user != "" && diff_sec < 86400 && covers_storage != "" && covers_storage != undefined && covers_storage != null){
						if (DEBUG) console.log("iCarusi App============> CACHE AVAILABLE AND NOT EXPIRED -> Cached Covers loading");
						sort_covers("created");
					}
					else
						encryptText2(getX(), "get_covers");
				}
				else
					encryptText2(getX(), "get_covers");
			}
			
			/*
			PullToRefresh.init({
				mainElement: '#lyrics-list',
				onRefresh: function(){
					get_song();
				},
				distThreshold : 20,
				instructionsReleaseToRefresh: "I kani anassiri!",
			});
			*/
			
			// SWIPE RUDIMENTALE
			  $( "#song_page" ).on( "swipeleft", swipeleftHandler );
			  $( "#song_page" ).on( "swiperight", swipeRightHandler );  
			// FINE SWIPE RUDIMENTALE

			$('#cover_search').on('change', function() {
				var search = $( "#cover_search" ).val();
				if ( search.length == 0){
					sort_covers(sort_type);
					return false;
				}
			});

			$( "#cover_search" ).bind( "input", function() {
				var search = $( "#cover_search" ).val();
				var result = current_covers;

				if ( search.length == 0){
					//setCovers(current_covers);
					sort_order = -1;
					sort_covers(sort_type);
					return false
				}
				
				if ( search.length < 4 ){
					return false;
				}
				
				result = $.grep(result, function(element, index) {
					return ( 
						( element.year.toString() === search) || 
						( element.name.toUpperCase().indexOf(search.toUpperCase()) >= 0 ) || 
						( element.author.toUpperCase().indexOf(search.toUpperCase()) >= 0 )
						);
				});
				setCovers(result);
			});

			
			$( "#popupPhotoPortrait" ).bind(
			{
				/*
				popupafteropen: function(event, ui) { 
					if (DEBUG) console.log("iCarusi App============> Opening popupPhotoPortrait Popup");
					$("#poster_pic").attr("src", "images/loading.gif");
				},
				*/
				popupafterclose: function(event, ui) { 
					if (DEBUG) console.log("iCarusi App============> Closing popupPhotoPortrait Popup");
					$("#poster_pic").attr("src", "images/loading.gif");
				}
			});
			
		$(document).on("click", "#send_album_btn", function(){
			encryptText2( getX(), "uploadCover" );
		});
			
		$('#pic').bind('change', function() {
			var size = this.files[0].size;
			curr_file_size = size;
			var sizekb = this.files[0].size/1024;
			if (size <= 512000)
				$("#upload_result").html('<span style="color:green">File size (' +  sizekb.toFixed(2) + " KB) OK !</span>");
			else
				$("#upload_result").html('<span style="color:red">File size (' +  sizekb.toFixed(2) + " KB) not OK! Max 500 KB! </span>");
		});

		}
			
	function get_song(){

		$("#lyrics-list").empty();

		//loading(true,"Loading random song...");
		
		$.ajax(
		{
		  url: BE_URL + "/randomSong",
		  method: "POST",
		  data: { 
			  username : icarusi_user,
			  kanazzi : kanazzi
			},
		  dataType: "json"
		})
		  .done(function(data) {

			if  (data.message=="song not found" || data.message=="not valid id"){
				$('#lyrics-list').append('<li style="white-space:normal;">Song not found ;(</li>');
				return;
			}
			
			//if (DEBUG) console.log("Retrieved song data:" + JSON.stringify(data));
			song = eval(data.message);
			if (DEBUG) console.log("Retrieved song data:" + song.title + " - " + song.author);
			
			song_header = '<li data-role="list-divider" data-theme="b" style="text-align:center">';
			song_header += '<button class="ui-btn ui-icon-refresh ui-btn-icon-notext ui-corner-all ui-mini ui-btn-inline ui-btn-b" style="float:right" onclick="get_song()"></button>';
			song_header += '<span style="color:yellow">' + song.title + '</span><br/>' + song.author + '</li>';
			$('#lyrics-list').append(song_header);
			
			if (song.lyrics.length==0)
				$('#lyrics-list').append('<li style="white-space:normal;">No lyrics available for this song</li>');
			
			$.each(song.lyrics, function( index, value ) {
				$('#lyrics-list').append('<li style="white-space:normal;">' + value.text + '</li>');
			});
			
			$('#lyrics-list').listview('refresh');
			
		  })
		  .fail(function() {
			console.log( "Error while retrieving random song");
			$("#song_content").html("Error during song loading... i Kani Anassiri!!!");
		  })
		  .always(function() {
			//loading(false,"");
			//console.log("ajax call completed");
		  });			
	}			


	function get_covers(){

		if (icarusi_user == undefined || icarusi_user == "" || icarusi_user == null){
			alert("You must be logged in for accessing covers!!");
			return false;
		}

		if (DEBUG) console.log("iCarusi App============> Starting covers retrieving...");
		
		loading(true, "Loading covers...");
		
		$.ajax(
		{
		url: BE_URL + "/getcovers",
		method: "POST",
		data: { 
			username : icarusi_user,
			kanazzi : kanazzi
		},
		dataType: "json"
		})
		.done(function(data) {

			covers = eval(data);

			storage.setItem("covers_storage", JSON.stringify(covers));		// SAVE ON LOCALSTORAGE
			storage.setItem("covers_ts", new Date().getTime());
			setCacheInfo();
			current_covers = covers;
			sort_type="";
			sort_covers("created");
			//setCovers(covers);
			
		  })
		  .fail(function(err) {
			if (DEBUG) console.log("iCarusi App============> Error during remote covers retrieving");
			if (DEBUG) console.log("iCarusi App============> " + err.responseText);
		  })
		  .always(function() {
			  loading(false, "");
		  });
	}


	function sort_covers(s_type){
		
		if (DEBUG) console.log("Sort type current: " + sort_type + " --- Sort type passe: " + s_type);
		
		if (sort_type != s_type)
			sort_order = 1
		else
			sort_order = sort_order * -1;
			
		if (DEBUG) console.log("Sort type: " + sort_type + " --- Sort order: " + sort_order);
			
		sort_type=s_type;
		$( "#cover_search" ).val("");
		covers = storage.getItem("covers_storage");		// GET FROM LOCALSTORAGE
		if (covers != "" && covers != undefined && covers != null){
			covers = JSON.parse(covers);
			current_covers = covers;
			if (sort_type=="avg_vote")
			covers.sort(function(a,b){
				if (parseFloat(a[sort_type]) > parseFloat(b[sort_type]))
					return (sort_order * -1);
				if (parseFloat(a[sort_type]) < parseFloat(b[sort_type]))
					return sort_order;
				return 0;
			});
			else
				covers.sort(function(a,b){
					if (a[sort_type] > b[sort_type])
						return (sort_order * -1);
					if (a[sort_type] < b[sort_type])
						return sort_order;
					return 0;
			});
			setCovers(covers);
		}		
	}

	function setCovers(covers){
		
		$('#covers-list').empty();
		
		setCacheInfo();
		
		if (covers.length==0)
			if (DEBUG) console.log("iCarusi App============> No covers found on remote server.");

		covers_header = '<li data-role="list-divider" data-theme="b" style="text-align:center">';
		covers_header += 'Found <span style="color:yellow">' + covers.length + '</span> covers';
		covers_header += '</li>';
		$('#covers-list').append(covers_header);
		
		if (covers.length==0)
			$('#covers-list').append('<li style="white-space:normal;">No covers available</li>');
		
		$.each(covers, function( index, value ) {

			var cover_content = '<li style="white-space:normal">';
			
			if (value.type == undefined || value.type == "local")
				cover_location = device_app_path + "www/images/covers/" + value.location;
			else
				cover_location = value.location;
			
			if (value.type == "remote" && value.id != undefined && value.id != "")
				cover_content += '<button class="ui-btn ui-icon-edit ui-btn-icon-notext ui-corner-all ui-mini ui-btn-inline" id="btn_edit_cover" style="float:right" onclick="edit_cover(\''+value.id+'\')"></button>';
				
			cover_content += '<button class="ui-btn ui-icon-camera ui-btn-icon-notext ui-corner-all ui-mini ui-btn-inline" id="btn_show_cover" style="float:right" onclick="poster(\''+cover_location+'\')"></button>';
			cover_content += value.name + '<br/>';
			if (value.year != 0 && value.year != "")
				cover_content += '<span style="color:#000099; font-style:italic; font-size:11px;">' + value.author + ' (' + value.year + ')</span>';
			else
				cover_content += '<span style="color:#000099; font-style:italic; font-size:11px;">' + value.author + '</span>';
			
			
			if (value.created != undefined && sort_type == "created")	
				cover_content += '<br/><span style="color:#C60419; font-style:italic; font-size:10px;">' + value.created + '</span>';
			
			
			cover_content +='</li>';
			$('#covers-list').append(cover_content);
		});
		$('#covers-list').listview('refresh');
	}

	function new_cover(){
		edit_cover(0);
	}

	function edit_cover(id){
		$(':mobile-pagecontainer').pagecontainer('change', '#cover_page');
		
		$("#cover_img").show();
		$("#cover_img").attr("src","");
		if (id==0)
			$("#cover_img").hide();
		$("#title").val("");
		$("#author").val("");
		$("#year").val("");
		$("#pic").val("");
		$("#upload_result").html("");
		
		if (id != 0){
			var result = $.grep(current_covers, function(element, index) {
				return (element.id === id);
			});
			
			if (DEBUG) console.log("==========================");
			if (DEBUG) console.log(JSON.stringify(result));
			if (DEBUG) console.log("==========================");
			
			result = result[0];
			$("#id").val(result.id);
			$("#title").val(result.name);
			$("#author").val(result.author);
			$("#year").val(result.year);
			if (result.location != "")
				$("#cover_img").attr("src", result.location);
			if (DEBUG) console.log("cover img src: " + $("#cover_img").attr("src"));
			curr_cover_id = result.id;
		}
		else{
			$("#id").val("");
		}
	}

	function poster(img_name){

		console.log("Show poster called on " + img_name);
		
		android_version = device.version.split(".");
		
		if ( parseInt(android_version[0]) < 5 ){
			loading(true,"Loading cover..");
			$("#popupPhotoPortrait").popup('open');
			$("#poster_pic").attr("src",img_name);
		}
		else
			PhotoViewer.show(img_name, "");
	}

	function setCacheInfo(){
		show_info = storage.getItem("show-extra-info");
		if ( show_info != "" && show_info != null && eval(show_info)){
			
			covers_storage = storage.getItem("covers_storage");
			covers_storage_ts = storage.getItem("covers_ts");
		
			if (covers_storage != "" && covers_storage != undefined && covers_storage != null)
				$("#cache_info").html("Covers cached " + eval(covers).length + " element(s) --- last update " + fancyDate(covers_storage_ts));
		}
	}
	
	
	/*
	 * 	UPLOAD COVER
	 */ 
	
	function uploadCover(){

		console.log("UPLOAD COVER CALLED...");

		var username = icarusi_user;

		$("#username2").val(icarusi_user);
		$("#kanazzi").val(kanazzi);
		var title = $("#title").val();
		var author = $("#author").val();
		var year = $("#year").val();
		
		var the_form = $("#cover_form");
		var formData = new FormData( the_form[0] );
		

		if (username == "" || username == undefined || username == null){
			alert("You must be logged in for saving a cover");
			return false;
		}
		
		if (title == "" || title == undefined || title == null || author == "" || author == undefined || author == null){
			alert("Title and author cannot be blank!! Title: " + title + " - Author: " + author);
			return false;
		}
		
		if (curr_file_size!=undefined && curr_file_size > 512000){
			alert("File size exceeded! Max 500KB");
			return false;
		}


		if ($("#pic").val() == "" && curr_cover_id == ""){
			alert("File cannot be empty!");
			return false;
		}
	
		if ( year != "" && (isNaN(parseInt(year)) || parseInt(year)<0) ){
			alert("Year value not valid: " + year);
			return false;
		}
		
		loading(true,"Submitting album cover...");
		
		$.ajax(
		{
			url: BE_URL + "/uploadcover",
			method: "POST",
			data: formData,
			cache: false,
			contentType: false,
			processData: false
		})
		  .done(function(data) {
			 
			response = data;
			
			try {
				res = JSON.parse(response);
				if (DEBUG) console.log("Upload Cover -> Result: " + res.result);
				if (DEBUG) console.log("Upload Cover -> Message: " + res.message);
				
				if (res.result == "failure"){
					alert("Error" + res.message);
					return false;
				}
			}
			catch(err) {
				console.log("JSON parsing of upload cover response failed.");
				if (DEBUG) console.log(JSON.stringify(response));
			}
			
			
			if (DEBUG) console.log("Reloading covers...");
			encryptText2( getX(), 'get_covers');

			
			$("#title").val("");
			$("#author").val("");
			$("#year").val("");
			$("#pic").val("");

			$("#upload_result").html('<span style="font-weight:bold; color:green">Success!</span>');
			$(':mobile-pagecontainer').pagecontainer('change', '#song_page');
			//' + res.message+ '

		  })
		  .fail(function(err) {
				alert("Server error!");
			//var msg = eval(err.responseJSON);
			//alert(msg.message);
			//if (DEBUG) console.log("iCarusi App============> ========> iCarusi : failed to save tv show");
			//if (DEBUG) console.log("iCarusi App============> ========> iCarusi : username " + storage.getItem("icarusi_user"));
		  })
		  .always(function() {
			loading(false,"");
		  });
	};

	function no_image(){
		$("#cover_img").attr("src", device_app_path + "www/images/no-image-available.jpg");
	}
