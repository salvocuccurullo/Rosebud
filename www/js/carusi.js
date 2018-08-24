	var storage = window.localStorage;
	var DEBUG = true;
	var icarusi_user = "";
	var kanazzi;
	var swipe_left_target = "song.html";
	var swipe_right_target = "movies.html";
	
	var curr_action = "GET";
	var curr_latitude = "";
	var curr_longitude = "";
	var curr_positions = [];
	var curr_caruso_pos = {};
	var map;
	var enable_geoloc = false;
	var geoloc_state = 0;
	
	document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);		//CORDOVA
	
	function onDeviceReady() {			// CORDOVA

		var positions = [];
		icarusi_user = storage.getItem("icarusi_user");
		enable_geoloc = storage.getItem("enable-geoloc");
		$("#geoloc_info").html("");
		
		if (enable_geoloc == "" || enable_geoloc == null)
			enable_geoloc = false;
		else
			enable_geoloc = eval(enable_geoloc);
			
		if (icarusi_user == undefined || icarusi_user == "" || icarusi_user == null){
			$('#get_locations').prop('disabled', true).addClass('ui-state-disabled'); 
			$('#locate_me').prop('disabled', true).addClass('ui-state-disabled');
			alert("You must be logged in for accessing iCarusi page!!");
			return false;
		}	
		
		if (!enable_geoloc)
			$("#geoloc_info").html("You're not sharing your location with iCarusi. Shame on you! Enable it on settings!");
		
		/*
		 * NETWORK INFO
		 */ 
		
		var networkState = navigator.connection.type;
		$("#connection").html("");
		if (networkState === Connection.NONE) {
			$("#connection").html("No network... Pantalica mode...");
		}
		else{
		}

		/*
		 * BUILD GOOGLE MAPS CANVAS
		 */ 
		
		var div = document.getElementById("map_canvas");
		// Create a Google Maps native view under the map_canvas div.
		map = plugin.google.maps.Map.getMap(div);
		map.setOptions({
			'backgroundColor': 'white',
			'mapType': plugin.google.maps.MapTypeId.ROADMAP,
			'controls': {
			'compass': true,
			'myLocationButton': true,
			'indoorPicker': true,
			'zoom': true // Only for Android
			},
		});
		
		/*
		 * DISABLE BUTTONS UNTIL GOOGLE MAP IS NOT READY OR UNDER OTHER CONDITIONS
		 */
		 
		 $('#get_locations').prop('disabled', true).addClass('ui-state-disabled'); 
		 $('#locate_me').prop('disabled', true).addClass('ui-state-disabled');
		
		/*
		 * EXECUTE THE USER GEOLOCATION AFTER MAP IS READY
		 */ 
		
		map.on(plugin.google.maps.event.MAP_READY, function(){
			
			loading(false, "Loading Google Maps...");
			
			if (DEBUG) console.log("Google Maps is ready!");
			
			loading(true, "Retrieving your position using GPS... Cicaledda?");
			
			navigator.geolocation.getCurrentPosition(onSuccessLocation, onErrorLocation, {timeout: 30000, enableHighAccuracy: true});
		});
		
		// var watchID = navigator.geolocation.watchPosition(onSuccessLocation, onErrorLocation, { timeout: 30000 });
		
		
		/*
		 * GEOLOCATION CALLBACKS
		 */ 
		
		var onSuccessLocation = function(position) {
			/*
			$("#geoloc_info").html('Latitude:<b>'          + position.coords.latitude    + '<br/>' +
			'Longitude:<b>'         + position.coords.longitude         + '</b><br/>' +
			'Altitude:<b>'          + position.coords.altitude          + '</b><br/>' +
			'Accuracy:<b>'          + position.coords.accuracy          + '</b><br/>' +
			'Altitude Accuracy:<b>' + position.coords.altitudeAccuracy  + '</b><br/>' +
			'Heading:<b>'           + position.coords.heading           + '</b><br/>' +
			'Speed:<b>'             + position.coords.speed             + '</b><br/>' +
			'Timestamp:<b>'         + position.timestamp                + '</b><br/>');
			*/

			geoloc_state = 0;

			loading(false, "");
			$('#locate_me').prop('disabled', false).removeClass('ui-state-disabled');

			if (icarusi_user == "" || icarusi_user == null)
				positions.push({"name":"Not logged Caruso", "latitude": position.coords.latitude, "longitude": position.coords.longitude});
			else{
				curr_caruso_pos = {"name":icarusi_user, "latitude": position.coords.latitude, "longitude": position.coords.longitude};
				curr_positions.push(curr_caruso_pos);
			}
			console.log("Current positions: " + JSON.stringify(curr_positions));
			setMarkers(curr_positions);
			
			if (icarusi_user == "" || icarusi_user == null || icarusi_user == undefined)
				return false
			else
				zoomTo(icarusi_user);
			
			if (enable_geoloc==true){
				curr_action = "SET";
				curr_latitude = position.coords.latitude;
				curr_longitude = position.coords.longitude;
			}
			else{
				curr_action = "DELETE";
			}
			
			encryptText2( getX(), 'geoLocation');
			
		};

		// onError Callback receives a PositionError object

		function onErrorLocation(error) {
			console.log("GeoLocation ERROR! " + error.message);
			loading(false, "Retrieving your positions...\nCicaledda?");
			if (geoloc_state == 0){
				geoloc_state = 1;
				loading(true, "Retrieving your position using network....Cicaledda?");
				navigator.geolocation.getCurrentPosition(onSuccessLocation, onErrorLocation, {timeout: 30000, enableHighAccuracy: false});
			}
			else{	
				geoloc_state = 0;
				loading(false, "Retrieving your position...\nCicaledda?");
				alert('Non sarai mica a Pantalica dentro una grotta? \n code: '    + error.code    + '\n' +'message: ' + error.message + '\n');
				$('#locate_me').prop('disabled', false).removeClass('ui-state-disabled');
			}
		}

		/* 
		 * BINDINGS
		 */
		 
		$(document).on("click", "#get_locations", function(){
			curr_action = "GET";
			$('#get_locations').prop('disabled', true).addClass('ui-state-disabled');
			encryptText2( getX(), "geoLocation" );
		});

		//$("#test").bind('change', function(event, ui) {
		$(document).on("change", "#carusi_loc_buttons", function(){
		  zoomTo(this.value);
		});

		$(document).on("click", "#locate_me", function(){
			$('#locate_me').prop('disabled', true).addClass('ui-state-disabled'); 
			loading(true, "Retrieving your position using GPS... Cicaledda?");
			navigator.geolocation.getCurrentPosition(onSuccessLocation, onErrorLocation, {timeout: 30000, enableHighAccuracy: true});
		});
		
		// SWIPE RUDIMENTALE
		  $( "#carusi_page" ).on( "swipeleft", swipeleftHandler );
		  $( "#carusi_page" ).on( "swiperight", swipeRightHandler );
		// FINE SWIPE RUDIMENTALE

	};// CORDOVA
	

	function zoomTo(username){
		
		//TO BE CHANGED USING A DICTIONARY WITH USERNAME AS KEY
		if (DEBUG) console.log("------------ ZOOM TO -------------");
		if (DEBUG) console.log("Current caruso location " + JSON.stringify(curr_caruso_pos));
		if (DEBUG) console.log("All carusi locations: " + JSON.stringify(curr_positions));
		if (DEBUG) console.log("----------------------------------");

		$.each( curr_positions, function(index, value){
			if (value.name == username){
				
				map.animateCamera({
				  target: {lat: value.latitude, lng: value.longitude},
				  zoom: 14,
				  tilt: 60,
				  bearing: 0,
				  duration: 5000
				}, function() {
				  //alert("Camera target has been changed");
				});
				
				//map.setCameraTarget({"lat": value.latitude, "lng": value.longitude});
				//map.setCameraZoom(14);

				var marker = map.addMarker({
					position: {"lat": value.latitude, "lng": value.longitude},
					title: "iCarusi nel mondo",
					snippet: username + " is here!",
					animation: plugin.google.maps.Animation.DROP
				});

				// Show the info window
				marker.showInfoWindow();
			
				return false
			}
		});
	}

	/*
	 * SET SELECT FOR ZOOMING I CARUSI
	 */ 

	function setMarkers(positions){
		
		var caruso_pos ={};
		
		if (enable_geoloc==false){
			positions.push(curr_caruso_pos);
			caruso_pos = curr_caruso_pos;
		}
		
		if (DEBUG) console.log("Locations array size: " + positions.length);
		if (DEBUG) console.log("Locations array: " + JSON.stringify(positions));
		
		$.each( positions, function(index, value){

			var marker = map.addMarker({
				position: {"lat": value.latitude, "lng": value.longitude},
				title: "iCarusi nel mondo",
				snippet: value.name + " is here!",
				animation: plugin.google.maps.Animation.DROP
			});
			
			if (value.name == icarusi_user)
				caruso_pos = value;
			
			// Show the info window
			marker.showInfoWindow();
		});

		if (DEBUG) console.log("Locations caruso: " + JSON.stringify(caruso_pos))
		// Zoom to mypos
		map.setCameraTarget({"lat": caruso_pos.latitude, "lng": caruso_pos.longitude});
		if (curr_action=="SET"){
			map.setCameraZoom(12);
		}
		else if (curr_action=="GET"){
			map.setCameraZoom(5);
		}
	}

	function setMarkers2(){
		
		if (curr_positions.length == 0)
			return false

		map.clear().then(function () {
		
			var caruso_pos ={};
			
			if (enable_geoloc==false){
				curr_positions.push(curr_caruso_pos);
				caruso_pos = curr_caruso_pos;
			}
			
			if (DEBUG) console.log("Locations array size: " + curr_positions.length);
			if (DEBUG) console.log("Locations array: " + JSON.stringify(curr_positions));
			
			
			/*
			// Show the current camera target position.
			var target = map.getCameraTarget();
			alert([
			  "lat: " + target.lat,
			  "lng: " + target.lng,
			  "Map cleared!",
			]);
			*/
			
			
			$.each( curr_positions, function(index, value){

				map.addMarker(
					{
						position: {"lat": value.latitude, "lng": value.longitude},
						title: "iCarusi nel mondo",
						snippet: value.name + " is here!",
						animation: plugin.google.maps.Animation.DROP
					}, 
					function( marker ){
						// Show the info window
						marker.showInfoWindow();
					}
				);
				
				if (value.name == icarusi_user)
					caruso_pos = value;
			});
			
			
			if (DEBUG) console.log("Locations caruso: " + JSON.stringify(caruso_pos))
			
			/*
			// Zoom to mypos
			map.setCameraTarget({"lat": caruso_pos.latitude, "lng": caruso_pos.longitude});
			if (curr_action=="SET"){
				map.setCameraZoom(12);
			}
			else if (curr_action=="GET"){
				map.setCameraZoom(5);
			}
			*/ 
		});
	}
	
	
	/*
	 * SET SELECT FOR ZOOMING I CARUSI
	 */ 
	
	function setButtons(positions){
		$('#carusi_loc_buttons').empty();
		if ( ! $.isEmptyObject(curr_caruso_pos) )
			$('#carusi_loc_buttons').append('<option value="' + icarusi_user + '">' + icarusi_user + '</option>');
		$.each( positions, function(index, value){
			if (value.name != icarusi_user){
				content = '<option value="' + value.name + '">' + value.name + '</option>';
				$('#carusi_loc_buttons').append(content);
			}
		});
		$('#carusi_loc_buttons').selectmenu('refresh');
		$('#select_zoom_div').show();
	}

	/*
	 * GET/SET REMOTE DATA
	 */
	
	function geoLocation(){
		console.log("====================>"+icarusi_user);
		if (icarusi_user=="" || icarusi_user == undefined || icarusi_user == null){
			alert("Please login for share your location and/or getting info on iCarusi location");
			return false
		}

		loading(true,"GeoLocation...");
		
		if(DEBUG) console.log("GeoLocation remote action: " + curr_action + " for user: " + icarusi_user); 
		
		$.ajax(
		{
		  url: BE_URL + "/geolocation",
		  method: "POST",
		  data: {
			action: curr_action,
			latitude: curr_latitude,
			longitude: curr_longitude,
			username: icarusi_user,
			kanazzi: kanazzi,
		  },
		})
		  .done(function(data) {
			 
			response = eval(data);
			if (DEBUG) console.log("Response from server =====> " + JSON.stringify(response));
			
			if (response.result == "failure"){
				alert(response.message);
				return false;
			} 
			
			if (curr_action == "GET"){
				curr_positions = response.body;
				setMarkers2();
				setButtons(curr_positions);
			}

		  })
		  .fail(function(err) {
				console.log(error);
				loading(false,"GeoLocation...");
				alert("Server error! Die Hunde mussen sein!");
		  })
		  .always(function() {
			loading(false,"GeoLocation...");
			$('#get_locations').prop('disabled', false).removeClass('ui-state-disabled');
		  });

	}
