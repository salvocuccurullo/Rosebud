		
		var storage = window.localStorage;
		var icarusi_user = "";
		var kanazzi = "";
		var swipe_left_target = "index.html";
		var swipe_right_target = "carusi.html";
		var DEBUG = false;
		var device_app_path = "";
		
		document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
		
		function onDeviceReady() {
			
			icarusi_user = storage.getItem("icarusi_user");
			covers_storage = storage.getItem("storage_covers");
			device_app_path = cordova.file.applicationDirectory;
			$("#poster_pic").attr("src", "images/loading.gif");

			var networkState = navigator.connection.type;
			$("#connection").html("");
			
			if (networkState === Connection.NONE) {
				$("#connection").html("No network... Pantalica mode...");
			}
			
			if (icarusi_user == "salvo")
				$("#sabba_info").html(BE_URL);
			
			encryptText2(getX(), "get_song");
			
			old_ts  = new Number(storage.getItem("covers_ts"));
			if (old_ts != "" && old_ts != null && old_ts != undefined){

				new_ts = new Date().getTime();
				diff = new_ts - old_ts;
				diff_sec = diff / 1000;
						
				if (diff_sec < 86400 && covers_storage != "" && covers_storage != undefined && covers_storage != null){
					console.log("iCarusi App============> Cached TVShows loading");
					setCovers(covers_storage); // load covers on startup from cache if there is cache and last update time is greater than 1 day
				}
				else
					get_covers();
			}
			else
				get_covers();

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
			
		}
			
	function get_song(){

		$("#lyrics-list").empty();
		$("#lyrics-list").show();

		loading(true,"Loading random song...");

		$("#song_content").hide();
		
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
			
			$("#logo_content").hide();
			$("#song_content").show();
					
			if  (data.message=="song not found" || data.message=="not valid id"){
				$('#lyrics-list').append('<li style="white-space:normal;">Song not found ;(</li>');
				return;
			}
			console.log(data);
			song = eval(data.message);
			
			/*
			$('#title').html(song.title);
			$('#author').html(song.author);
			*/
			
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
			console.log( "error" );
			$("#song_content").html("Error during song loading... i Kani Anassiri!!!");
		  })
		  .always(function() {
			loading(false,"");
			$("#song_content").show();
			//console.log("ajax call completed");
		  });			
	}			

	function make_base_auth(user, password) {
		var tok = user + ':' + password;
		var hash = btoa(tok);
		return 'Basic ' + hash;
	}

	function get_covers(){
		
		loading(true, "Loading covers...");
		
		$.ajax(
		{
		  url: COVER_BE_URL + "/getRemoteCovers",
		  method: "GET",
			beforeSend: function (xhr) {
				xhr.setRequestHeader('Authorization', make_base_auth(cover_username, cover_password));
			},			  
		  dataType: "json"
		})
		  .done(function(data) {

			covers = eval(data);

			storage.setItem("covers_storage", JSON.stringify(covers));		// SAVE ON LOCALSTORAGE
			storage.setItem("covers_ts", new Date().getTime());
			setCacheInfo();
			setCovers(covers);
			
		  })
		  .fail(function(err) {
			if (DEBUG) console.log("iCarusi App============> Error during remote covers retrieving");
			if (DEBUG) console.log("iCarusi App============> " + err.responseText);
		  })
		  .always(function() {
			  loading(false, "");
		  });
	}

	function setCovers(covers){
		
		$('#covers-list').empty();
		
		setCacheInfo();
		
		if (covers.length==0)
			if (DEBUG) console.log("iCarusi App============> No covers found on remote server.");

		covers_header = '<li data-role="list-divider" data-theme="b" style="text-align:center">';
		covers_header += '<button class="ui-btn ui-icon-refresh ui-btn-icon-notext ui-corner-all ui-mini ui-btn-inline ui-btn-b" style="float:right" onclick="get_covers()"></button>';
		covers_header += '<div style="margin-top:10px">Found <span style="color:yellow">' + covers.length + '</span> covers</div>';
		covers_header += '</li>';
		$('#covers-list').append(covers_header);
		
		if (covers.length==0)
			$('#covers-list').append('<li style="white-space:normal;">No covers available</li>');
		
		$.each(covers, function( index, value ) {
			//console.log(JSON.stringify(value));
			var cover_content = '<li style="white-space:normal">';
			cover_content += '<button class="ui-btn ui-icon-camera ui-btn-icon-notext ui-corner-all ui-mini ui-btn-inline" id="btn_show_poster" style="float:right" onclick="poster(\''+value.location+'\')"></button>';
			cover_content += value.name + '<br/>';
			if (value.year != 0 && value.year != "")
				cover_content += '<span style="color:#000099; font-style:italic; font-size:11px;">' + value.author + ' (' + value.year + ')</span>';
			else
				cover_content += '<span style="color:#000099; font-style:italic; font-size:11px;">' + value.author + '</span>';
			cover_content +='</li>';
			$('#covers-list').append(cover_content);
		});
		$('#covers-list').listview('refresh');
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
	
	function loading(show, message){
		if (show)
			$.mobile.loading("show", {
				text: message,
				textVisible:true,
				theme: 'b',
				html: '',
			});
		else
			$.mobile.loading("hide");
	}
