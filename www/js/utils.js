
	function loading(show, message){
		if (show){
			//$("body").block({ "message": null });
			$.mobile.loading("show", {
				text: message,
				textVisible:true,
				theme: 'b',
				html: '',
			});
		}
		else{
			$.mobile.loading("hide");
			//$("body").unblock();
		}
	}


	function parseQuery(queryString) {
		var query = {};
		var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
		for (var i = 0; i < pairs.length; i++) {
			var pair = pairs[i].split('=');
			query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
		}
		return query;
	}

	function fancyDate(ts){
		
		var d = new Date(Number(ts));
		
		min = d.getMinutes();
		hour = d.getHours();
		if (min<10) min = "0" + min;
		if (hour<10) hour = "0" + hour;
		
		s = d.getDate() + "/" + (d.getMonth()+1) + "/" + d.getFullYear() + " " + hour + ":" + min;
		
		return s;		
	}

	function get_stars(n){
		var x = "";
		
		for (i=0; i<n; i++)
			x += "*";
			
		return x
	}

	function swipeleftHandler( event ){
		document.location = swipe_left_target;
	}

	function swipeRightHandler( event ){
		document.location = swipe_right_target;
	}


	function make_base_auth(user, password) {
		var tok = user + ':' + password;
		var hash = btoa(tok);
		return 'Basic ' + hash;
	}


	/***
	  DUMMY SECURITY
	 ***/

	function encryptText2(pText, cb) {
		result = cryptographyAES.doEncryption(pText, 
			key,
			function(crypted){
				kanazzi = crypted;
				var fn = window[cb];
				// is object a function?
				if (typeof fn === "function") fn();
			},
			function(err){
				if (DEBUG) console.log("iCarusi App============> onFailure: " + JSON.stringify(err));
			});
	}
