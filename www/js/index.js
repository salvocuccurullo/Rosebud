
	var DEBUG = false;

	var storage = window.localStorage;
	var kanazzi;
	var swipe_left_target = "movies.html";
	var swipe_right_target = "song.html";
	var curr_file_size = 0;
	
	//THESE GLOBAL VARIABLES ARE THE EVIL
	//AND THEY SHOULD NOT USED EVER :D
	var curr_action = "SET";
	var curr_latitude = "";
	var curr_longitude = "";
	var enable_geoloc = false;
	
	var appVersion;
	 
	document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
	
	function onDeviceReady() {			// CORDOVA
		
		console.log("========> iCarusi started. Running on Android " + device.version);
		
		if (DEBUG) console.log("Localstorage status START ===============");
		if (DEBUG) console.log(JSON.stringify( storage_keys ));
		if (DEBUG) console.log(JSON.stringify( get_ls("show-extra-info") ));
		if (DEBUG) console.log("Localstorage status END ===============");
		
		icarusi_user = storage.getItem("icarusi_user");
		
		/*
		 * FIREBASE AUTH WITH GOOGLE
		 */

		firebase.initializeApp(firebase_config);
  
		var provider = new firebase.auth.GoogleAuthProvider();

		$(document).on("click", "#loginGoogle", function(){
			firebase.auth().signInWithRedirect(provider).then(function() {
				return firebase.auth().getRedirectResult();
				}).then(function(result) {
					// This gives you a Google Access Token.
					// You can use it to access the Google API.
					var token = result.credential.idToken;
					// The signed-in user info.
					var user = result.user;
					
					if (DEBUG){
						console.log("========== GOOGLE LOGIN ===================");
						console.log(" * * CREDENTIALS * * ");
						console.log(JSON.stringify(result.credential));
						console.log(" * * USER * * ");
						console.log(JSON.stringify(user));
						console.log("===========================================");
					}
					
					storage.setItem("firebase_id_token", token );
					$("#logged").html('Logged in as <span style="color:green">' + user.displayName + '</span> (Google)');
					$("#cover_img").attr("src", user.photoURL);
					storage.setItem("google_photo_url", user.photoURL );
					
				}).catch(function(error) {
					// Handle Errors here.
					var errorCode = error.code;
					var errorMessage = error.message;
					
					console.log("========== GOOGLE LOGIN ERROR ===================");
					console.log(errorCode);
					console.log(errorMessage);
					console.log("===========================================");
				});
		});
		

		/*
		 * FIREBASE AUTHENTICATION
		 */

		/*
		if ( icarusi_user!= "" ) {
			data = {"username":icarusi_user};
			loading(true,"Checking Firebase token...");
			generic_json_request("/checkFBToken", "POST", data, tokenSuccess, tokenFailure);
		}
		
		if (DEBUG) console.log( "Firebase username saved on localstorage: " + storage.getItem("fb_user"));
		
		$(document).on("click", "#login_button_fireb", function(){
			loading(true,"Logging in with Google Firebase...");
			cordova.plugins.firebase.auth.signInWithEmailAndPassword( $("#username_fireb").val(), $("#password_fireb").val() )
			.then(function(userInfo) {
				console.log( JSON.stringify(userInfo) );
				storage.setItem("firebase_uid",userInfo.uid);
				loading(false,"");
				storage.setItem("fb_user", $("#username_fireb").val());
				storage.setItem("fb_pass", $("#password_fireb").val());
				alert("Login Successful!");
				$("#popupLoginFireBase").popup("close");
			})
			.catch(function(error) {
				loading(false,"");
				alert("Login failed! " + error);					
			});
		});
		*/
		
		$(document).on("click", "#register_button_fireb", function(){
			loading(true,"Registering a new user\non Google Firebase...");
			cordova.plugins.firebase.auth.createUserWithEmailAndPassword( $("#username_fireb").val(), $("#password_fireb").val() )
			.then(function(userInfo) {
				
				console.log( JSON.stringify(userInfo) );
				/*
				storage.setItem("firebase_uid",userInfo.uid);
				
				storage.setItem("fb_user", $("#username_fireb").val());
				storage.setItem("fb_pass", $("#password_fireb").val());
				*/
				loading(false,"");
				/*
				cordova.plugins.firebase.auth.sendEmailVerification()
					.then(function(data) {
						alert("Email verification succeded! " + data);
					})
					.catch(function(error) {
						alert("Email verification failed! " + error);
					});
				*/
				alert("User creation Successful! Email verification sent...");
				$("#popupLoginFireBase").popup("close");
			})
			.catch(function(error) {
				loading(false,"");
				alert("User creation failed! " + error);
			});
		});		

		/*
		 * FIREBASE MESSAGING: ON STARTUP THE FCM TOKEN IS RETRIEVED FROM GOOGLE
		 * IF SUCCESS: IT WILL BE SAVED ON BOTH LOCALSTORAGE AND SERVER SIDE
		 */
		if ( icarusi_user!= "" ) {
			window.FirebasePlugin.getToken(function(token) {
				// save this server-side and use it to push notifications to this device
				if (DEBUG) console.log("==========> FIREBASE MESSAGING TOKEN ========> " + token);
				storage.setItem("firebase_token",token);
				
				data = {"username":icarusi_user,
						"token":token,
						"method":"POST",
						"url":"/setFBToken",
						"app_version":appVersion,
						"CB":generic_json_request_new
						};
				encrypt_and_execute( getX(), "kanazzi", data);
				
			}, function(error) {
				console.error("==========> FIREBASE MESSAGING ERROR ========> " + error);
			});
		}
		/*
		 * FIREBASE MESSAGING ON NOTIFICATION EVENT MANAGEMENT
		 * CURRENTLY JUST PRINT SOMETHING ON CONSOLE
		 */

		window.FirebasePlugin.onNotificationOpen(function(notification) {
			console.log("======= FCM NOTIFICATION OPEN EVENT ======> " + JSON.stringify(notification));
		}, function(error) {
			console.error("======= FCM NOTIFICATION OPEN EVENT ERROR ======> " + error);
		});
		
		
		/*
		 * FIREBASE MESSAGING: IF THE "ENABLE PUSH NOTIFICATION" IS ON THEN SUBSCRIBE TO FCM TOPIC "iCarusiNotification" 
		*/
		
		enable_notif = storage.getItem("enable-notifications");
		if (enable_notif != "" && enable_notif != undefined && eval(enable_notif)){
			if (DEBUG) console.log("iCarusi App============> Enabling Push notification : " + enable_notif);
			window.FirebasePlugin.subscribe("iCarusiNotifications");
		}
		else{
			if (DEBUG) console.log("iCarusi App============> Disabling Push notification : " + enable_notif);
			window.FirebasePlugin.unsubscribe("iCarusiNotifications");
		}
		 

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
			if (DEBUG) console.log("iCarusi App============> Flip Save images : " + val);
			storage.setItem("flip-save-images",val);
		});
		
		$('#show-extra-info').on('change', function() {
			val = $('#show-extra-info').prop("checked");
			if (DEBUG) console.log("iCarusi App============> Flip Show extra info : " + val);
			storage.setItem("show-extra-info",val);
		});

		$('#enable-geoloc').on('change', function() {
			val = $('#enable-geoloc').prop("checked");
			if (DEBUG) console.log("iCarusi App============> Flip enable geolocation : " + val);
			storage.setItem("enable-geoloc",val);
			if (icarusi_user != "" && icarusi_user != undefined){
				if (!val){
					id_token = storage.getItem("firebase_id_token");
					if (id_token == undefined)
						id_token = "";
					/*
					data = {"username":icarusi_user, "action":"DELETE", "firebase_id_token":id_token};
					generic_json_request("/geolocation2", "POST", data, geolocationSuccess, geolocationFailure);
					*/ 
					data = {"username":icarusi_user, 
							"action":"DELETE", 
							"firebase_id_token":id_token, 
							"method":"POST", 
							"url":"/geolocation2",
							"CB":generic_json_request_new,
							"successCB":geolocationSuccess,
							"failureCB":geolocationFailure
							};
					encrypt_and_execute(getX(), "kanazzi", data);
				}
				else{
					alert("Thanks for sharing your location!\n\nPlease open 'iCarusi' page for sharing your gps coords");
				}
			}
		});
		
		
		$('#check-session').on('change', function() {
			if (DEBUG) console.log("iCarusi App============> Flip check session (" + icarusi_user + ")");
			if (icarusi_user != "" && icarusi_user != undefined){
				id_token = storage.getItem("firebase_id_token");
				if (id_token == undefined)
					id_token = "";
				data = {"username":icarusi_user, 
						"action":"DELETE",
						"firebase_id_token":id_token,
						"method":"POST",
						"url":"/testSession",
						"CB":generic_json_request_new,
						"successCB":geolocationSuccess,
						"failureCB":geolocationFailure
				};
				encrypt_and_execute(getX(), "kanazzi", data);
			}
		});

		$('#enable-notifications').on('change', function() {
			val = $('#enable-notifications').prop("checked");
			if (DEBUG) console.log("iCarusi App============> Flip Enable Notifications : " + val);
			if (val)
				window.FirebasePlugin.subscribe("iCarusiNotifications");
			else
				window.FirebasePlugin.unsubscribe("iCarusiNotifications");
			
			if (DEBUG) console.log("iCarusi App============> Push notification Status: " + val);
			
			storage.setItem("enable-notifications",val);
		});


		$(document).on("click", "#login_button", function(){
			encryptText2( $("#password").val(), "submit" );
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
		
		$( "#settings_page" ).on( "pagecontainerload", function( event, ui ) {
			reset_cover_upload();
		});
		
		/*
		 * 		INIT
		 */ 
								
		save_imgs = storage.getItem("flip-save-images");
		dld_imgs = storage.getItem("flip-dld-images");
		extra_info = storage.getItem("show-extra-info");
		enable_notif = storage.getItem("enable-notifications");
		enable_geoloc = storage.getItem("enable-geoloc");
		
		if (DEBUG) console.log("iCarusi App============> Downloaded images switch STORAGE : " + dld_imgs);
		if (DEBUG) console.log("iCarusi App============> Save Downloaded images switch STORAGE : " + save_imgs);
		if (DEBUG) console.log("iCarusi App============> Show Extra info switch STORAGE : " + extra_info);
		if (DEBUG) console.log("iCarusi App============> Enable Push Notification STORAGE : " + enable_notif);
		if (DEBUG) console.log("iCarusi App============> Enable Geo Location : " + enable_geoloc);
		
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

		if (enable_notif != "" && enable_notif != null)
			$('#enable-notifications').prop("checked", eval(enable_notif));
		else
			storage.setItem("enable-notifications", false);

		if (enable_geoloc != "" && enable_geoloc != null)
			$('#enable-geoloc').prop("checked", eval(enable_geoloc));
		else
			storage.setItem("enable-geoloc", false);
		

		var networkState = navigator.connection.type;
		$("#connection").html("");
		
		cordova.getAppVersion.getVersionNumber().then(function (version) {
			appVersion = version;
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
		show_post_login_features();		// User can be already logged in from previous session
		
	
	};	// CORDOVA

	/*
	 * 
	 * CALLBACKS
	 * 
	 */ 

		function tokenFailure(data){
			loading(true,"Token verification error. Refreshing...");
			cordova.plugins.firebase.auth.getIdToken()
			.then(function(idToken) {
				loading(false,"");
				// send token to server
				console.log("_______________________________");
				console.log("Sending new token to server...");
				console.log(idToken);
				console.log("_______________________________");
				if ( icarusi_user!= "") {
					storage.setItem("firebase_id_token", idToken);
					data = {"username":icarusi_user, 
							"token":token, 
							"method":"POST", 
							"url":"/setFBToken",
							"app_version":appVersion,
							"CB":generic_json_request_new,
							"successCB":geolocationSuccess,
							"failureCB":geolocationFailure
							};
					encrypt_and_execute( getX(), "kanazzi", data);
				}
			})
			.catch(function(error){
				if (DEBUG) console.log( "Firebase idToken failure" + error );
				loading(true,"Token expired or not valid. Trying automatic login...");
				cordova.plugins.firebase.auth.signInWithEmailAndPassword( storage.getItem("fb_user"), storage.getItem("fb_pass") )
				.then(function(userInfo) {
					loading(false,"");
					if (DEBUG) console.log( JSON.stringify(userInfo) );
					storage.setItem("firebase_uid",userInfo.uid);
				})
				.catch(function(error) {
					loading(false,"");
					alert("Automatic login failed! Please enter your credentials again." + error);
					$("#popupLoginFireBase").popup("open");
				});
				
			});
		}

		function tokenSuccess(data){
			console.log("Firebase token on server is valid. " + JSON.stringify(data));
			storage.setItem("firebase_id_token", data.payload.firebase_id_token);
		}

		function geolocationSuccess(data){
			try{
				alert("Status: " + data["result"] + "\n\n" + data["message"]);
			}
			catch(err) {
				alert("I cagnolini sono stati!");
			}
		}
		
		function geolocationFailure(error){
			try{
				alert("Status: " + data.result + "\n\n" + data.message);
			}
			catch(err) {
				alert("I cagnolini sono stati!");
			}
		}



	/*
	 * 		COVERS FUNCTIONS
	 */

	function get_remote_random_cover_2(){

		$.ajax(
		{
			url: BE_URL + "/getrandomcover",
			method: "POST",
			data: { 
				username : icarusi_user,
				kanazzi : kanazzi
			},
			dataType: "json"
		})
		  .done(function(data) {

			if (DEBUG) console.log(data);
			cover=JSON.parse(data);
			
			if (cover != undefined){
				if (DEBUG) console.log("iCarusi App============> Fetched remote random cover data: " + cover.name);
				storage.setItem("remote_cover_url", cover.location);
				set_remote_image();
			}
			
		  })
		  .fail(function(err) {
			if (DEBUG) console.log("iCarusi App============> Error during remote covers retrieving");
			if (DEBUG) console.log("iCarusi App============> " + err.responseText);
		  })
		  .always(function() {
		  });
	}


	function get_remote_covers_stats(){

		$.ajax(
		{
			url: BE_URL + "/getcoversstats",
			method: "POST",
			data: { 
				username : icarusi_user,
				kanazzi : kanazzi
			},
			dataType: "json"
		})
		  .done(function(data) {

			if (DEBUG) console.log("Covers statistics: " + data);
			covers = JSON.parse(data);

			if (covers.payload.remote_covers==0)
				if (DEBUG) console.log("iCarusi App============> No remote covers found on server.");

			/*
			$.each(covers, function( index, value ) {
				if (DEBUG) console.log("iCarusi App============> " + value.fileName + " -> " + value.name);
			});
			*/ 
			
			$("#remote_covers").html(covers.payload.remote_covers);
			if (covers.payload.remote_covers > 0)
				storage.setItem("remote_covers_count", covers.payload.remote_covers);
			
			
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
		
		//$("#cover_img").attr("src", "images/homer_bass_01.gif");
		$("#cover_img").attr("src", "images/loading.gif");
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

	function set_remote_image(){
		remote_url = storage.getItem("remote_cover_url");
		if (remote_url != "" && remote_url != undefined)
			$("#cover_img").attr("src", remote_url);
		else
			$("#cover_img").attr("src", "images/covers/01.jpg");
	}

	function setImage(tot_imgs){
		
		dld_imgs = storage.getItem("flip-dld-images");
		remote_url = storage.getItem("remote_cover_url");
		remote_covers_count = storage.getItem("remote_covers_count");
		var networkState = navigator.connection.type;
		
		if (DEBUG) console.log("iCarusi App============> Remote covers count: " + remote_covers_count);
		
		var id_img = 0;

		if (networkState != Connection.NONE && remote_url != "" && dld_imgs != "" && eval(dld_imgs) && remote_covers_count != undefined && remote_covers_count > 0 ){
			if (DEBUG) console.log("iCarusi App============> Considering remote images...");
			id_img = Math.floor((Math.random() * (parseInt(tot_imgs) + parseInt(remote_covers_count)) ) + 1);		// Consider also the remote images
		}
		else{
			if (DEBUG) console.log("iCarusi App============> Considering ony local images...");
			id_img = Math.floor((Math.random() * tot_imgs ) + 1);							// Consider only local images
		}
		
		if (DEBUG) console.log("iCarusi App============> Image id selected: " + id_img);
		
		var image = "";
		
		if (id_img<10)
			image = "0" + id_img + ".jpg";
		else
			image = id_img + ".jpg";
			
		if (id_img>24){
			$("#cover_img").attr("images/covers/loading_spinner.gif");
			encryptText2( getX(), 'get_remote_random_cover_2');
			return false;
		}
		else
			image = "images/covers/" + image;
			
		if (DEBUG) console.log("iCarusi App============> Cover image seleted: " + image);
		$("#cover_img").attr("src", image);
			
	}
	
	function set_fallback_image(){
	
		$("#cover_img").attr("src", "images/covers/01.jpg");
	
	}
	
	/*
	 * SUBMIT
	 */
	
	function submit(){
		
		u = $("#username").val();
		p = kanazzi;
		
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
					icarusi_user = response.payload.username;
					$("#logged").html('Logged in as <span style="color:green">' + storage.getItem("icarusi_user") + '</span>');
					$("#popupLogin").popup("close");
					$("#login_message").html(response.payload.message);
					$("#popupLoginResult").popup("open");
					show_post_login_features();
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
		
		if (curr_file_size > 512000){
			alert("File size exceeded! Max 500KB");
			return false;
		}

		if ($("#pic").val() == ""){
			alert("File cannot be empty!");
			return false;
		}
		
		if ( year != "" && (isNaN(parseInt(year)) || parseInt(year)<0) ){
			alert("Year value not valid: " + year);
			return false;
		}
		
		loading(false,"Submitting album cover...");

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
			encryptText2( getX(), 'get_remote_covers_stats');

			reset_cover_upload();

			$("#upload_result").html('<span style="font-weight:bold; color:green">Success</span>');

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

	/*
	 * DO SOMETHING AFTER THE SUCCESSFUL LOGIN
	 */ 

	function show_post_login_features(){
		
			encryptText2( getX(), 'get_remote_covers_stats');
		
			if (icarusi_user == "salvo"){
				$("#sabba_info").html(BE_URL);
				$("#debug_session").show();
			}
	}
