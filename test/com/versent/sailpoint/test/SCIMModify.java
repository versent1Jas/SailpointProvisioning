package com.versent.sailpoint.test;

import static org.junit.Assert.*;

import java.util.LinkedHashMap;

import org.json.JSONException;
import org.junit.Test;

public class SCIMModify {
	


	@Test
	public final void confirmUserNotFoundModify() throws JSONException {
	Modify modifyUserObj = new Modify();
	String resURL = "http://localhost:8080/identityiq/rest/Users/DOEEEE";
	LinkedHashMap<String, Object> reqObj= new LinkedHashMap<String, Object>() ;
	LinkedHashMap<String, Object> emails= new LinkedHashMap<String, Object>() ;
	reqObj.put("externalId","DOEEEE");
	
	String JSON = InputPayload.createDynamicJSON(reqObj) ;
	String modifyStatus=modifyUserObj.modifyUser(JSON,resURL);
	System.out.println("MODIFY NON EXISTING USER"+modifyStatus);
	}
	
@Test
public final void SuccessfulModify() throws JSONException {
Modify modifyUserObj = new Modify();
String resURL = "http://localhost:8080/identityiq/rest/Users/RRunner";
LinkedHashMap<String, Object> reqObj= new LinkedHashMap<String, Object>() ;
LinkedHashMap<String, Object> emails= new LinkedHashMap<String, Object>() ;

emails.put("value", "BTodify@gmail.com");
reqObj.put("emails",emails);
String JSON = InputPayload.createDynamicJSON(reqObj) ;
String modifyStatus=modifyUserObj.modifyUser(JSON,resURL);
System.out.println("USER MODIFY WITH PUT"+modifyStatus);
}

}
