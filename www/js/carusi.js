	var storage = window.localStorage;		
	var DEBUG = false;
	var icarusi_user = "";
	var kanazzi;
	var swipe_left_target = "song.html";
	var swipe_right_target = "movies.html";
	
	document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);		//CORDOVA
	
	function onDeviceReady() {			// CORDOVA
	//$( document ).ready(function() {	// LOCAL DEVELOP
		
		var positions = [];
		icarusi_user = storage.getItem("icarusi_user");
		var networkState = navigator.connection.type;
		$("#connection").html("");
								
		if (networkState === Connection.NONE) {
			$("#connection").html("No network... Pantalica mode...");
			loadDogma(true, false);
			loadPeople(true, false);
		}
		else{
			loadDogma(false, false);
			loadPeople(false, false);
		}
		
		var div = document.getElementById("map_canvas");
		// Create a Google Maps native view under the map_canvas div.
		var map = plugin.google.maps.Map.getMap(div);
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
			
			positions.push({"user":icarusi_user, "gps":{"lat": position.coords.latitude, "lng": position.coords.longitude}});
			
			setMarkers(positions);
		};

		// onError Callback receives a PositionError object
		//
		function onErrorLocation(error) {
			alert('code: '    + error.code    + '\n' +'message: ' + error.message + '\n');
		}

		function setMarkers(positions){
			
			var caruso_pos ={};

			$.each( positions, function(index, value){
				// Add a maker
				var marker = map.addMarker({
					position: value.gps,
					title: "iCarusi nel mondo",
					snippet: value.user + " is here!",
					animation: plugin.google.maps.Animation.BOUNCE
				});
				
				if (value.user == icarusi_user)
					caruso_pos = value;
				
				// Show the info window
				marker.showInfoWindow();
			});

			// Zoom to mypos
			map.setCameraTarget(caruso_pos.gps);
			map.setCameraZoom(10);
		}

		navigator.geolocation.getCurrentPosition(onSuccessLocation, onErrorLocation);

		/*
		setCacheInfo();
		
		$(document).on("click", "#send_minchiata_btn", function(){

			if (icarusi_user == undefined || icarusi_user == "" || icarusi_user == null){
				alert("You must be logged in for saving carusate!!");
				return false;
			}				
			encryptText2( getX(), "saveMinchiata" );
		});
		
		$(document).on("change", "#type", function(){
			console.log("iCarusi App============> XXXXXXX " + $("#type").val() + " XXXXXXXXXX");
			type = $("#type").val();
			
			$("#d_dogma").hide();
			$("#d_name").hide();
			$("#d_desc").hide();
			
			if (type == "dogma"){
				$("#d_dogma").show();
			}
			else if (type == "people"){
				$("#d_name").show();
				$("#d_desc").show();
			}
			else{
				$("#dogma").val('');
				$("#name").val('');
				$("#desc").val('');					
			}

		});			
		
		PullToRefresh.init({
			mainElement: '#dogma-list',
			onRefresh: function(){
				// What do you want to do when the user does the pull-to-refresh gesture
				$("#dogma-list").empty();
				$("#people-list").empty();
				loadDogma(false, true);
				loadPeople(false, true);
			},
			instructionsReleaseToRefresh: "Manadittu!",
			distThreshold : 20,
		});
		*/
		// SWIPE RUDIMENTALE
		
		  $( "#carusi_page" ).on( "swipeleft", swipeleftHandler );
		  $( "#carusi_page" ).on( "swiperight", swipeRightHandler );

		// FINE SWIPE RUDIMENTALE			

	//});									// LOCAL DEVELOP
	};										// CORDOVA
	

	function resetPopupElements(){
		$("#d_dogma").hide();
		$("#d_name").hide();
		$("#d_desc").hide();

		$("#dogma").val('');
		$("#name").val('');
		$("#desc").val('');	
		$("#type").val("").selectmenu('refresh',true);
	}

	/*
	 * SAVE DATA
	 */ 

	function saveMinchiata(){

		type = $("#type").val();
		
		var name = $("#name").val();
		var dogma = $("#dogma").val();
		var desc = $("#desc").val();
		
		if (type == "dogma" && (  dogma == "" || dogma == undefined )){
			alert("A scrivila qualche cosa!!!");
			return false;
		}
		else if (type == "people" && (
			( name == "" || name == undefined ) ||
			(  desc == "" || desc == undefined )
			)){
			alert("A sto personaggio manca qualcosa...");
			return false;
		}
		else if (type == "" || type == "undefined"){
			alert("A scrivila qualche cosa!!!");
			return false;
		}
		
		$.mobile.loading("show", {
			text:'Saving carusata...',
			textVisible:true,
			theme: 'e',
			html: '',
		});
		
		$.ajax(
		{
		  url: BE_URL + "/saveminchiata",
		  method: "POST",
		  data: {
			type: type,
			name: name,
			desc: desc,
			dogma: dogma,
			username: icarusi_user,
			kanazzi: kanazzi,
		  },
		})
		  .done(function(data) {
			 
			response = eval(data);
			
			if (response.result == "failure"){
				alert(response.message);
				return false;
			} 
			  
			$("#popupMinchiata").popup("close");
			resetPopupElements();
			loadDogma(false, true);		//NO OFFLINE + FORCE
			loadPeople(false, true);	//NO OFFLINE + FORCE

		  })
		  .fail(function(err) {
				alert("Server error! Die Hunde mussen sein!");
		  })
		  .always(function() {
			$.mobile.loading("hide");
		  });

	}

	function setCacheInfo(){
		show_info = storage.getItem("show-extra-info");
		if ( show_info != "" && show_info != null && eval(show_info)){
			
			dogma_ts = storage.getItem("the_dogma_count_ts")
		
			if (dogma_ts != "" && dogma_ts != undefined && dogma_ts != null)
				$("#cache_info").html("Dogma&amp;People cache --- Last update " + fancyDate(dogma_ts));
		}
	}

	/*
	 * DOGMA
	 */ 

	function loadDogma(offline, force){
		
		$.mobile.loading("show");
		var the_dogma = JSON.parse(storage.getItem("the_dogma"));
		
		if (offline && the_dogma != "" && the_dogma != null && the_dogma != undefined){
			console.log("iCarusi App============> Pantalica Mode -> Cached dogma loading: " + the_dogma.length + " rules in total");
			setDogma(the_dogma);
			return false;
		}			
		
		old_ts  = new Number(storage.getItem("the_dogma_count_ts"));
		if (!force && old_ts != "" && old_ts != null && old_ts != undefined){
			new_ts = new Date().getTime();
			diff = new_ts - old_ts;
			diff_sec = diff / 1000;
						
			if (diff_sec < 86400 && the_dogma != "" && the_dogma != null && the_dogma != undefined){
				console.log("iCarusi App============> Cached dogma loading: " + the_dogma.length + " rules in total");
				setDogma(the_dogma);
				return false;
			}
		}
		
		$.ajax(
		{
		  url: BE_URL + "/getDogma",
		  method: "GET",
		  dataType: "json"
		})
		  .done(function(data) {
			
			//console.log(data);
			
			storage.setItem("the_dogma", JSON.stringify(data.payload));
			storage.setItem("the_dogma_count_ts", new Date().getTime());
			
			setCacheInfo();
													
			setDogma(data.payload);
			
		  })
		  .fail(function() {
			console.log( "error" );
			$("#dogma_content").html('<br/><span style="color:red; text-align:center">Error during dogma loading...<br/> i Kani Anassiri!!</span>');
		  })
		  .always(function() {
			$.mobile.loading("hide");
			//console.log("iCarusi App============> ajax call completed");
		  });			
	}
	
	function setDogma(the_dogma){
		
		$('#dogma-list').empty();
		$.mobile.loading("hide");
					
		if  (the_dogma.length==0){
			$('#dogma-list').append('<li style="white-space:normal;">Dogma not found ;(</li>');
			return;
		}
		else{
			$('#dogma-list').append('<li data-role="list-divider" data-theme="b" style="text-align:center">Il Dogma!</li>');
		}
		
		$.each(the_dogma, function( index, value ) {
			$('#dogma-list').append('<li style="white-space:normal;">' + value + '</li>');
		});
		
		$('#dogma-list').listview('refresh');

	}

	/*
	 * PEOPLE
	 */
	 
	 function loadPeople(offline, force){
		
		$.mobile.loading("show");
		var the_people = JSON.parse(storage.getItem("the_people"));
		
		if (offline && the_people != "" && the_people != null && the_people != undefined){
			console.log("iCarusi App============> Pantalica Mode -> Cached dogma loading: " + the_people.length + " rules in total");
			setPeople(the_people);
			return false;
		}			
		
		old_ts  = new Number(storage.getItem("the_people_count_ts"));
		if (!force && old_ts != "" && old_ts != null && old_ts != undefined){
			new_ts = new Date().getTime();
			diff = new_ts - old_ts;
			diff_sec = diff / 1000;
						
			if (diff_sec < 86400 && the_people != "" && the_people != null && the_people != undefined){
				console.log("iCarusi App============> Cached people loading: " + the_people.length + " rules in total");
				setPeople(the_people);
				return false;
			}
		}
		
		$.ajax(
		{
		  url: BE_URL + "/getPeople",
		  method: "GET",
		  dataType: "json"
		})
		  .done(function(data) {
			
			//console.log(data);
			
			storage.setItem("the_people", JSON.stringify(data.payload));
			storage.setItem("the_people_count_ts", new Date().getTime());
			
			setCacheInfo();
			
			setPeople(data.payload);
			
		  })
		  .fail(function() {
			console.log( "error" );
			$("#people_content").html('<br/><span style="color:red; text-align:center">Error during People loading...<br/> i Kani Anassiri!!</span>');
		  })
		  .always(function() {
			$.mobile.loading("hide");
			//console.log("iCarusi App============> ajax call completed");
		  });			
	}
	
	function setPeople(the_people){
		
		$("#people-list").empty();
		$.mobile.loading("hide");
					
		if  (the_people.length==0){
			$('#people-list').append('<li style="white-space:normal;">People not found ;(</li>');
			return;
		}
		else{
			$('#people-list').append('<li data-role="list-divider" data-theme="b" style="text-align:center">Laggente!</li>');
		}
		
		$.each(the_people, function( index, value ) {
			d = eval(value);
			$('#people-list').append('<li style="white-space:normal;">' + d.name + '<br/><span style="float:right; text-style:italic; font-size:11px">' + d.desc + '</span></li>');
		});
		
		$('#people-list').listview('refresh');

	} 

