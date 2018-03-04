
	var DEBUG = true;

	var storage = window.localStorage;
	var kanazzi;
	var swipe_left_target = "movies.html";
	var swipe_right_target = "song.html";
	 
	document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
	
	function onDeviceReady() {			// CORDOVA
		
		console.log("========> iCarusi started ");

		/*
		 * 	BINDINGS
		 */ 
		
		$('#flip-dld-images').on('change', function() {
			val = $('#flip-dld-images').prop("checked");
			if (DEBUG) console.log("iCarusi App============> Flip Downloaded images : " + val);
			storage.setItem("flip-dld-images",val);
		});

		$('#flip-save-images').on('change', function() {
			val = $('#flip-save-images').prop("checked");
			if (DEBUG) console.log("iCarusi App============> Flip Downloaded images : " + val);
			storage.setItem("flip-save-images",val);
		});
		
		$('#show-extra-info').on('change', function() {
			val = $('#show-extra-info').prop("checked");
			if (DEBUG) console.log("iCarusi App============> Flip Downloaded images : " + val);
			storage.setItem("show-extra-info",val);
		});

		$(document).on("click", "#login_button", function(){
			encryptText( $("#password").val() );
		});

		
		/*
		 * 		INIT
		 */ 
								
		save_imgs = storage.getItem("flip-save-images");
		dld_imgs = storage.getItem("flip-dld-images");
		extra_info = storage.getItem("show-extra-info");
		
		if (DEBUG) console.log("iCarusi App============> Downloaded images switch STORAGE : " + dld_imgs);
		if (DEBUG) console.log("iCarusi App============> Save Downloaded images switch STORAGE : " + save_imgs);
		if (DEBUG) console.log("iCarusi App============> Show Extra info switch STORAGE : " + extra_info);
		
		if (save_imgs != "" && save_imgs != null)
			$('#flip-save-images').prop("checked", eval(save_imgs));
		else
			storage.setItem("flip-save-images", false);
			
		if (dld_imgs != "" && dld_imgs != null)
			$('#flip-dld-images').prop("checked", eval(dld_imgs));
		else
			storage.setItem("flip-dld-images", false);
							
		if (extra_info != "" && extra_info != null)
			$('#show-extra-info').prop("checked", eval(extra_info));
		else
			storage.setItem("show-extra-info", false);
			
		
		icarusi_user = storage.getItem("icarusi_user");

		if (icarusi_user == "salvo"){
			$("#sabba_info").html(BE_URL);
		}

		var networkState = navigator.connection.type;
		$("#connection").html("");
		
		cordova.getAppVersion.getVersionNumber().then(function (version) {
			$('#version').html("Release " + version);
			$("#info_version").html(version);
		});

		$("#info_user").html(icarusi_user);
		$("#info_network").html(networkState);
		
		if (networkState === Connection.NONE) {
			$("#connection").html("No network... Pantalica mode...");
		}

		if ( icarusi_user != "" && icarusi_user != undefined )
			$("#logged").html('Logged in as <span style="color:green">' + storage.getItem("icarusi_user") + '</span>');
	
		PullToRefresh.init({
			mainElement: '#cover_img',
			onRefresh: function(){
				listDir(cordova.file.applicationDirectory + "www/images/covers/");
			},
			instructionsReleaseToRefresh: "Manadittu !",
			distThreshold : 20,
		});			
		
		/*
		 * SWIPE RUDIMENTALE
		 */ 
		
		  $( "#home_page" ).on( "swipeleft", swipeleftHandler );
		  $( "#home_page" ).on( "swiperight", swipeRightHandler );

	
		/*
		 * INIT
		 */ 

		listDir(cordova.file.applicationDirectory + "www/images/covers/");
		get_remote_random_cover_2();		// GET REMOTE RANDOM COVER
		get_covers();					// GET REMOTE RANDOM COVER
		
	
	};	// CORDOVA

	function make_base_auth(user, password) {
		var tok = user + ':' + password;
		var hash = btoa(tok);
		return 'Basic ' + hash;
	}

	/*
	 * 		COVERS FUNCTIONS
	 */

	function get_remote_random_cover_2(){

		$.ajax(
		{
			url: COVER_BE_URL + "/getRandomCover",
			method: "GET",
			beforeSend: function (xhr) {
				xhr.setRequestHeader('Authorization', make_base_auth(cover_username, cover_passowrd));
			},			  
		  dataType: "json"
		})
		  .done(function(data) {

			console.log(data);
			cover = eval(data);
			
			if (cover != undefined){
				if (DEBUG) console.log("iCarusi App============> Fetched remote random cover data: " + cover.name);
				storage.setItem("remote_cover_url", cover.location);
			}
			
		  })
		  .fail(function(err) {
			if (DEBUG) console.log("iCarusi App============> Error during remote covers retrieving");
			if (DEBUG) console.log("iCarusi App============> " + err.responseText);
		  })
		  .always(function() {
		  });
	}


	function get_covers(){

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

			console.log(data);
			covers = eval(data);

			if (covers.length==0)
				if (DEBUG) console.log("iCarusi App============> No covers found on remote server.");

			$.each(covers, function( index, value ) {
				if (DEBUG) console.log("iCarusi App============> " + value.fileName + " -> " + value.name);
			});
			
			$("#remote_covers").html(covers.length);
			
		  })
		  .fail(function(err) {
			if (DEBUG) console.log("iCarusi App============> Error during remote covers retrieving");
			if (DEBUG) console.log("iCarusi App============> " + err.responseText);
		  })
		  .always(function() {
		  });
	}


	/*
	 * 		LOCAL COVERS
	 */ 

	function listDir(path){
		
		$("#cover_img").attr("src", "images/homer_bass_01.gif");
		old_ts  = new Number(storage.getItem("covers_count_ts"));
		new_ts = new Date().getTime();
		diff = new_ts - old_ts;
		diff_sec = diff / 1000;
					
		var covers_count_cache = storage.getItem("covers_count");
		//var covers_count_cache = "";
		if (diff_sec < 86400 && covers_count_cache != "" && covers_count_cache != null && covers_count_cache != undefined){
			if (DEBUG) console.log("iCarusi App============> Cached covers count: " + covers_count_cache);
			$("#hardcoded_images").html(covers_count_cache);
			setImage(covers_count_cache);
			return false;
		}

		window.resolveLocalFileSystemURL(path, fs_success, fs_error);
		
		function fs_success(fileSystem) {
			if (DEBUG) console.log("iCarusi App============> FS SUCCESSFUL");
			var reader = fileSystem.createReader();
			if (DEBUG) console.log("iCarusi App============> CREATE READER SUCCESSFUL");
			if (DEBUG) console.log("iCarusi App============> Starting to reading the directory...");
			//$("#cover_img").attr("src", "images/spinner_01.gif");
			reader.readEntries(dir_success, dir_error);
		}

		function fs_error(err) {
			if (DEBUG) console.log("iCarusi App============> FS ERROR");
			if (DEBUG) console.log(err);
		}
		
		function dir_success(entries) {
			if (DEBUG) console.log("iCarusi App============> Success!");
			setImage(entries.length);
			if (DEBUG) console.log("iCarusi App============> Found " + entries.length + " cover images.");
			storage.setItem("covers_count", entries.length);
			storage.setItem("covers_count_ts", new Date().getTime());
			$("#hardcoded_images").html(entries.length);
		};
			
		function dir_error(err) {
			if (DEBUG) console.log("iCarusi App============> DIR ERROR");
			if (DEBUG) console.log(err);
		};

	}

	/*
	 * 		SET IMAGE
	 */

	function setImage(tot_imgs){
		
		dld_imgs = storage.getItem("flip-dld-images");
		remote_url = storage.getItem("remote_cover_url");
		var id_img;
		if (remote_url != "" && dld_imgs != "" && eval(dld_imgs))
			id_img = Math.floor((Math.random() * tot_imgs ) + 2);		// Adding 1 for considering also the remote rando image
		else
			id_img = Math.floor((Math.random() * tot_imgs ) + 1);
			
		var image = "";
		
		if (id_img<10)
			image = "0" + id_img + ".jpg";
		else
			image = id_img + ".jpg";
			
		if (id_img>24){
			image = remote_url;
		}
		else
			image = "images/covers/" + image;
			
		if (DEBUG) console.log("iCarusi App============> Cover image seleted: " + image);
		$("#cover_img").attr("src", image);
			
	}
	
	/*
	 * SUBMIT
	 */
	
	function submit(u,p){
			if (u == "" || p == ""){
				alert("Username and/or Passowrd cannot be empty!");
				return false;
			}
			
			$.mobile.loading("show");

			$.ajax(
			{
			  url: BE_URL + "/login",
			  method: "POST",
			  dataType: "json",
			  data: {
				username: u,
				password: p,
				},
			})
			  .done(function(response) {
					if (DEBUG) console.log("========> iCarusi : login completed ");
					console.log("========> iCarusi : Result... ");
					if ( response.result == "success" && response.payload.logged == "yes"){
						if (DEBUG) console.log("========> iCarusi : Login successful");	
						if (DEBUG) console.log("========> iCarusi : " + response.payload.username);
						if (DEBUG) console.log("========> iCarusi : " + response.payload.message);				
						storage.setItem("icarusi_user", response.payload.username);
						$("#logged").html('Logged in as <span style="color:green">' + storage.getItem("icarusi_user") + '</span>');
						$("#popupLogin").popup("close");
						$("#login_message").html(response.payload.message);
						$("#popupLoginResult").popup("open");
					}
					else{
						console.log("========> iCarusi : Login unsuccessful");	
					}
			  })
			  .fail(function(err) {
				var msg = eval(err.responseJSON);
				alert(msg.payload.message);
				console.log( "========> iCarusi : error during login");
			  })
			  .always(function() {
				$.mobile.loading("hide");
			  });
	}

	function encryptText(pText) {
		cryptographyAES.doEncryption(pText, 
			key,
			function(crypted){
				submit($("#username").val(), crypted);
			},
			function(err){
				console.log("onFailure: " + JSON.stringify(err));
			});
	}	
