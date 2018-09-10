
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

	function encrypt_and_execute(pText, encKeyName, data) {
		result = cryptographyAES.doEncryption(pText, 
			key,
			function(crypted){
				data[encKeyName] = crypted;
				if (data.CB && data.successCB && data.failureCB)
					data.CB(data, data.successCB, data.failureCB);
				else
					data.CB(data);
			},
			function(err){
				if (DEBUG) console.log("iCarusi App============> onFailure: " + JSON.stringify(err));
				if (data.failureCB) data.failureCB(err);
			});
	}
	
	function generic_json_request(url, method, data, successCB, failureCB){
		
		loading(true, "Loading...");

		$.ajax(
		{
			url: BE_URL + url,
			method: method,
			data: JSON.stringify(data),
			contentType: "application/json",
			dataType: "json"
		})
		  .done(function(data) {

			loading(false, "Loading...");

			if (DEBUG) console.log( "Request to " + url + " completed"  );
			if (DEBUG) console.log( "Payload received " + JSON.stringify(data) );
			
			try {
				if (DEBUG) console.log( "Status response: " + data["result"] );
				if (data.result == "failure"){
					if (failureCB) failureCB(err);
				}
			}
			catch(err) {
				if (DEBUG) console.log( err );
				if (failureCB) failureCB(err);
			}
			
			if (successCB)
				successCB(data);

		  })
		  .fail(function(err) {
			loading(false, "Loading...");
			if (DEBUG) console.log("iCarusi App============> Error during generic request to " + url);
			if (DEBUG) console.log("iCarusi App============> " + err.responseText);
			if (failureCB) failureCB(err);
		  })
		  .always(function() {
			  loading(false, "Loading...");
		  });
	}

	function generic_json_request_new(data, successCB, failureCB){
		
		loading(true, "Loading...");

		$.ajax(
		{
			url: BE_URL + data.url,
			method: data.method,
			data: JSON.stringify(data),
			contentType: "application/json",
			dataType: "json"
		})
		  .done(function(data) {

			loading(false, "Loading...");

			if (DEBUG) console.log( "Request to " + data.url + " completed"  );
			if (DEBUG) console.log( "Payload received " + JSON.stringify(data) );
			
			try {
				if (DEBUG) console.log( "Status response: " + data["result"] );
				if (data.result == "failure"){
					if (failureCB) failureCB(err);
				}
			}
			catch(err) {
				if (DEBUG) console.log( err );
				if (failureCB) failureCB(err);
			}
			
			if (successCB)
				successCB(data);

		  })
		  .fail(function(err) {
			loading(false, "Loading...");
			if (DEBUG) console.log("iCarusi App============> Error during generic request to " + url);
			if (DEBUG) console.log("iCarusi App============> " + err.responseText);
			if (failureCB) failureCB(err);
		  })
		  .always(function() {
			  loading(false, "Loading...");
		  });
	}

function locale_date(input_date){
	d = new Date(input_date);
	moment.locale('it');
	return moment(d).format("ddd, DD/MM/YYYY HH:mm");
}
