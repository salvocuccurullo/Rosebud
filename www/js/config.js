
	var storage_keys = [
		{'name':'flip-save-images', 'type':'boolean'},
		{'name':'flip-dld-images', 'type':'boolean'},
		{'name':'show-extra-info', 'type':'boolean'},
		{'name':'enable-notifications', 'type':'boolean'},
		{'name':'enable-geoloc', 'type':'boolean'}
	];


	function get_ls(key){
			
			/*
			if ( ! storage_keys.includes(key) )		// ECMAScript 2016
				return "error";
			*/
			
			ls_value = storage.getItem(key);
			
			if (ls_value === "" || ls_value === null || ls_value === undefined)
				return ""
			else
				return ls_value
	}
	
	function set_ls(key, value){
		
		if (key != "" && key != undefined && key != null && value != undefined && value != null)
			storage.setItem(key,value);
	}
	
	
	function get_all_ls(){
	
		out = {};
		
		$.each( storage_keys, function(idx,value){
			ls_value = storage.getItem(value['name']);
			
			if (ls_value === "" || ls_value === null || ls_value === undefined)
				out[value] = ""
			else{
				if ( value['type'] == 'boolean')
					out[value['name']] = eval(ls_value);
				else
					out[value['name']] = ls_value;
			}
		});
		
		return out;
	}

