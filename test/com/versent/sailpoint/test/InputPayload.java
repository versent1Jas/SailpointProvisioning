package com.versent.sailpoint.test;

import java.util.LinkedHashMap;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.google.gson.Gson;

public class InputPayload {
	public static String createDynamicJSON(LinkedHashMap<String, Object> Testinput) throws JSONException{
				
		Gson jsonConverter = new Gson();
		String JSON = jsonConverter.toJson(Testinput, LinkedHashMap.class);		
		
		return JSON;	
	}
	
}

		