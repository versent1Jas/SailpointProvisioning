package com.versent.sailpoint.transformers;

import java.util.ArrayList;
import java.util.Map;

import org.json.JSONException;
import org.json.JSONObject;

import sailpoint.object.Identity;
import sailpoint.object.SailPointObject;

public interface SCIMTransformer {

	public SailPointObject transform( Map<String,Object> jsonObject ) throws JSONException;
}
