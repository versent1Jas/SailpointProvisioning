package com.versent.sailpoint.test;

import java.util.LinkedHashMap;

import org.json.JSONException;

import org.junit.FixMethodOrder;
import org.junit.Test;
import org.junit.runners.MethodSorters;


@FixMethodOrder(MethodSorters.NAME_ASCENDING)
public class SCIMCreate {
	
	@Test
	//Empty Request Object
	public final void AttrsEmptyRequest() throws JSONException {
		Create createUserTest = new Create();
		LinkedHashMap<String, Object> reqObj= new LinkedHashMap<String, Object>() ;
		String JSON= InputPayload.createDynamicJSON(reqObj).toString();
		
		String createStatus = createUserTest.createUserTest(JSON);
		System.out.println("Validation of create user request "+createStatus);
		
	}
	//Mandatory Attrs Missing userType
	@Test
	public final void AttrsManadatoryRequest() throws JSONException {
		Create createUserTest = new Create();
		LinkedHashMap<String, Object> reqObj= new LinkedHashMap<String, Object>() ;
		LinkedHashMap<String, Object> name= new LinkedHashMap<String, Object>();
		name.put("familyName", "Doe");
		name.put("givenName", "Sizzles");	
		reqObj.put("name", name);
		String JSON= InputPayload.createDynamicJSON(reqObj).toString();
		
		String createStatus = createUserTest.createUserTest(JSON);
		System.out.println("Validation of create user request "+createStatus);
		
	}
	
	//Successful User Creation with only Mandatory Attributes
	@Test
	
	public final void successfulCreate() throws JSONException {
		Create createUserTest = new Create();
		LinkedHashMap<String, Object> reqObj= new LinkedHashMap<String, Object>() ;
		LinkedHashMap<String, Object> name= new LinkedHashMap<String, Object>();
		name.put("familyName", "Runner");
		name.put("givenName", "Road");	
		LinkedHashMap<String, Object> emails= new LinkedHashMap<String, Object>();
		emails.put("value", "RR@gmail.com");
		
		reqObj.put("userType","employee");
		reqObj.put("name", name);
		reqObj.put("emails", emails);
		String JSON= InputPayload.createDynamicJSON(reqObj).toString();
		String createStatus = createUserTest.createUserTest(JSON);
		
		System.out.println(" SUCCESSFUL USER CREATION "+createStatus);
		
		
			
	}
	



}


