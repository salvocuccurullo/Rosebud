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
	var map;
	
	document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);		//CORDOVA
	
	function onDeviceReady() {			// CORDOVA

		var positions = [];
		icarusi_user = storage.getItem("icarusi_user");
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
			positions.push({"name":icarusi_user, "latitude": position.coords.latitude, "longitude": position.coords.longitude});
			console.log("CURRENT...");
			console.log(JSON.stringify(positions));
			setMarkers(positions);
			
			curr_action = "SET";
			curr_latitude = position.coords.latitude;
			curr_longitude = position.coords.longitude;
			encryptText2( getX(), 'geoLocation');
			
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
		/*
		console.log("______________________________________");
		console.log(username);
		console.log(JSON.stringify(positions));
		console.log("______________________________________");
		*/
		
		//TO BE CHANGED
		$.each( curr_positions, function(index, value){
			if (value.name == username){
				map.setCameraTarget({"lat": value.latitude, "lng": value.longitude});
				map.setCameraZoom(14);
				return false
			}
		});
	}

	function setMarkers(positions){
		
		var caruso_pos ={};
		console.log("Locations array size: " + positions.length);
		
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

	function geoLocation(){

		loading(true,"GeoLocation...");
		
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
			console.log(JSON.stringify(response));
			
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
	}
