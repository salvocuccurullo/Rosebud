		
		var storage = window.localStorage;
		var icarusi_user = "";
		var swipe_left_target = "index.html";
		var swipe_right_target = "carusi.html";
		
		document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
		
		function onDeviceReady() {
			
			icarusi_user = storage.getItem("icarusi_user");

			var networkState = navigator.connection.type;
			$("#connection").html("");
			
			if (networkState === Connection.NONE) {
				$("#connection").html("No network... Pantalica mode...");
			}
			
			if (icarusi_user == "salvo")
				$("#sabba_info").html(BE_URL);
			
			get_song();
			
			
			PullToRefresh.init({
				mainElement: '#lyrics-list',
				onRefresh: function(){
					get_song();
				},
				distThreshold : 20,
				instructionsReleaseToRefresh: "I kani anassiri!",
			});
			
			// SWIPE RUDIMENTALE
			
			  $( "#song_page" ).on( "swipeleft", swipeleftHandler );
			  $( "#song_page" ).on( "swiperight", swipeRightHandler );
 			  
			// FINE SWIPE RUDIMENTALE			
			
		}
			
	function get_song(){

		$("#lyrics-list").empty();
		$("#lyrics-list").show();
		
		$.mobile.loading("show", {
			text:'Loading random song...',
			textVisible:true,
			theme: 'e',
			html: '',
		});

		$("#song_content").hide();
		
		$.ajax(
		{
		  url: BE_URL + "/randomSong",
		  method: "GET",
		  data: { 
			  username : icarusi_user,
			  kanazzi : ''
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
			$.mobile.loading("hide");
			$("#song_content").show();
			//console.log("ajax call completed");
		  });			
	}			
	
