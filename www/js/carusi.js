	var storage = window.localStorage;
	var DEBUG = false;
	var icarusi_user = "";
	var kanazzi;
	var swipe_left_target = "song.html";
	var swipe_right_target = "movies.html";
	
	var curr_action = "GET";
	var curr_latitude = "";
	var curr_longitude = "";
	var curr_positions = {};
	var curr_caruso_pos = {};
	var map;
	var enable_geoloc = false;
	
	document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);		//CORDOVA
	
	function onDeviceReady() {			// CORDOVA

		var positions = [];
		icarusi_user = storage.getItem("icarusi_user");
		enable_geoloc = storage.getItem("enable-geoloc");
		if (enable_geoloc == "" || enable_geoloc == null)
			enable_geoloc = false;
		else
			enable_geoloc = eval(enable_geoloc);
		
		var networkState = navigator.connection.type;
		$("#connection").html("");
		if (networkState === Connection.NONE) {
			$("#connection").html("No network... Pantalica mode...");
		}
		else{
		}
		
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
		
		
		var onSuccessLocation = function(position) {
			/*
			$("#geoinfo").html('Latitude:<b>'          + position.coords.latitude    + '<br/>' +
			'Longitude:<b>'         + position.coords.longitude         + '</b><br/>' +
			'Altitude:<b>'          + position.coords.altitude          + '</b><br/>' +
			'Accuracy:<b>'          + position.coords.accuracy          + '</b><br/>' +
			'Altitude Accuracy:<b>' + position.coords.altitudeAccuracy  + '</b><br/>' +
			'Heading:<b>'           + position.coords.heading           + '</b><br/>' +
			'Speed:<b>'             + position.coords.speed             + '</b><br/>' +
			'Timestamp:<b>'         + position.timestamp                + '</b><br/>');
			*/

			positions = [];
			if (icarusi_user == "" || icarusi_user == null)
				positions.push({"name":"Not logged Caruso", "latitude": position.coords.latitude, "longitude": position.coords.longitude});
			else{
				curr_caruso_pos = {"name":icarusi_user, "latitude": position.coords.latitude, "longitude": position.coords.longitude};
				positions.push(curr_caruso_pos);
			}
			console.log("CURRENT...");
			console.log(JSON.stringify(positions));
			setMarkers(positions);
			
			if (icarusi_user == "" || icarusi_user == null)
			 return false
			
			if (enable_geoloc==true){
				curr_action = "SET";
				curr_latitude = position.coords.latitude;
				curr_longitude = position.coords.longitude;
				encryptText2( getX(), 'geoLocation');
			}
			else{
				curr_action = "DELETE";
				encryptText2( getX(), 'geoLocation');
			}
			
		};

		// onError Callback receives a PositionError object
		//
		function onErrorLocation(error) {
			alert('code: '    + error.code    + '\n' +'message: ' + error.message + '\n');
		}

		navigator.geolocation.getCurrentPosition(onSuccessLocation, onErrorLocation);

		/* BINDINGS */
		$(document).on("click", "#get_locations", function(){
			curr_action = "GET";
			encryptText2( getX(), "geoLocation" );
		});

		$(document).on("click", "#zoom_to", function(){
			zoomTo("salvo", curr_positions);
		});

		//$("#test").bind('change', function(event, ui) {
		$(document).on("change", "#carusi_loc_buttons", function(){
		  zoomTo(this.value);
		});

		// SWIPE RUDIMENTALE
		  $( "#carusi_page" ).on( "swipeleft", swipeleftHandler );
		  $( "#carusi_page" ).on( "swiperight", swipeRightHandler );
		// FINE SWIPE RUDIMENTALE

	};										// CORDOVA
	

	function zoomTo(username){
		
		//TO BE CHANGED USING A DICTIONARY WITH USERNAME AS KEY
		
		
		if (enable_geoloc==false){
			curr_positions.push(curr_caruso_pos);
		}
		
		
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
					animation: plugin.google.maps.Animation.BOUNCE
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
		if (DEBUG) console.log("Locations array size: " + positions.length);
		
		$.each( positions, function(index, value){

			var marker = map.addMarker({
				position: {"lat": value.latitude, "lng": value.longitude},
				title: "iCarusi nel mondo",
				snippet: value.name + " is here!",
				animation: plugin.google.maps.Animation.BOUNCE
			});
			
			if (value.name == icarusi_user)
				caruso_pos = value;
			
			// Show the info window
			marker.showInfoWindow();
		});

		// Zoom to mypos
		map.setCameraTarget({"lat": caruso_pos.latitude, "lng": caruso_pos.longitude});
		if (curr_action=="SET"){
			map.setCameraZoom(12);
		}
		else if (curr_action=="GET"){
			map.setCameraZoom(5);
		}
	}
	
	/*
	 * SET SELECT FOR ZOOMING I CARUSI
	 */ 
	
	function setButtons(positions){
		$('#carusi_loc_buttons').empty();
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
			alert("Please login for share your location and getting info on iCarusi location");
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
			console.log("CURRENT ACTION ===> " + curr_action);
			if (curr_action == "GET"){
				curr_positions = response.body;
				map.clear();
				setMarkers(curr_positions);
				setButtons(curr_positions);
			}

		  })
		  .fail(function(err) {
				console.log(response);
				alert("Server error! Die Hunde mussen sein!");
		  })
		  .always(function() {
			loading(false,"GeoLocation...");
		  });

	}
