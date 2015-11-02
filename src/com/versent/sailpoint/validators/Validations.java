package com.versent.sailpoint.validators;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;








import java.util.regex.Pattern;

import org.apache.wink.common.model.multipart.OutPart;

import com.versent.sailpoint.constants.Macquarie;
import com.versent.sailpoint.constants.Messages;
import com.versent.sailpoint.constants.Constants;
import com.versent.sailpoint.constants.SCIM;
import com.versent.sailpoint.utils.Configurator;

import sailpoint.object.Configuration;




public class Validations {
	
	
	
	public String reqObjNotNull(Map<String, Object> reqObj)
	{
		String output = "true";
		if((reqObj.size()==0))
		{
			
			
			output="false";
		}			
			return output;
	}
	
	public HashMap<String, Object> validateSearchParams(int startIndex, int pageSize, String attributes)
	{
		HashMap<String, Object> validatedSearchParams = new HashMap<String, Object>();
		
		
		if(startIndex==0){
			startIndex= Constants.START_INDEX;
			validatedSearchParams.put(Constants.START_INDEX_VAR_NAME,startIndex);
			
		}
		else{
			validatedSearchParams.put(Constants.START_INDEX_VAR_NAME,startIndex);
		}
		if(pageSize==0){
			
			validatedSearchParams.put(Constants.PAGE_SIZE_VAR_NAME, Constants.PAGE_SIZE);
			System.out.println("the page size variable is "+ pageSize);
		}
		else{
			validatedSearchParams.put(Constants.PAGE_SIZE_VAR_NAME,pageSize);
			System.out.println("the page size variable is "+ pageSize);
		}
		if(!(attributes==null))
		{
			
			//validatedSearchParams.put(Constants.SEARCH_RETURN_ATTRIBUTES_VAR_NAME, attributes);
			attributes=attributes.replaceAll("(?i)\\b"+SCIM.EXTERNAL_ID+"\\b",Macquarie.USER_NAME);
			attributes=attributes.replaceAll("(?i)\\b"+SCIM.EMAILS+"."+SCIM.VALUE+"\\b",Macquarie.VALUE);
			attributes=attributes.replaceAll("(?i)\\b"+SCIM.NAME+"."+SCIM.FIRST_NAME+"\\b",Macquarie.FIRST_NAME);
			attributes=attributes.replaceAll("(?i)\\b"+SCIM.NAME+"."+SCIM.LAST_NAME+"\\b",Macquarie.LAST_NAME);
			attributes=attributes.replaceAll("(?i)\\b"+SCIM.META+"."+SCIM.CREATED+"\\b",Macquarie.CREATED);
			attributes=attributes.replaceAll("(?i)\\b"+SCIM.META+"."+SCIM.LAST_MODIFIED+"\\b",Macquarie.LAST_MODIFIED);
			System.out.println("attributes are "+attributes);
			validatedSearchParams.put(Constants.SEARCH_RETURN_ATTRIBUTES_VAR_NAME,attributes);
		}
		else
		{
			validatedSearchParams.put(Constants.SEARCH_RETURN_ATTRIBUTES_VAR_NAME,Constants.SEARCH_RETURN_ATTRIBUTES);
		}
		
	return	validatedSearchParams;
	}
	
	public LinkedHashMap<String, Object> validateModifyAttributes(Map<String,Object>reqObj)
	{
		
		LinkedHashMap<String, Object> errorObj = new LinkedHashMap<String, Object>();
		LinkedHashMap<String, Object> status = new LinkedHashMap<String, Object>();
		ArrayList<String> description = new ArrayList();
		if((isUserTypePresent(reqObj)).equalsIgnoreCase("true"))
		{
			description.add("userType cannot be modified.");
		}
		if((isExternalIdPresent(reqObj)).equalsIgnoreCase("true"))
		{
			description.add("userName cannot be modified.");
		}
		
	 
	if(!(description.size()==0))
	{
		status.put(Messages.CODE, Messages.BAD_REQUEST_CODE);
		status.put(Messages.ERROR_DESCRIPTION, description);
		errorObj.put(Messages.STATUS,status);
	}
	return status;
	}
	public LinkedHashMap<String, Object> checkMandatoryAttributes(Map<String, Object> reqObj)
	{
		LinkedHashMap<String, Object> errorObj = new LinkedHashMap<String, Object>();
		LinkedHashMap<String, Object> status = new LinkedHashMap<String, Object>();
		ArrayList<String>userRequiredAttribs = Constants.MANDATORY_ATTRIBUTES_USER;
		ArrayList<String> description = new ArrayList();
		if((reqObjNotNull(reqObj)).equalsIgnoreCase("true"))
		{
			
			 if((reqObj.size()<=userRequiredAttribs.size()))
			 {
				 
				 /*if(!(isExternalIdPresent(reqObj)).equalsIgnoreCase("true"))
				 {
					 description.add(isExternalIdPresent(reqObj));
				 }*/
				 if(!(isNamePresent(reqObj)).equalsIgnoreCase("true"))
				 {
					 description.add(isNamePresent(reqObj));
				 }
				/* if(!(isEmailPresent(reqObj)).equalsIgnoreCase("true"))
				 {
					 description.add(isEmailPresent(reqObj)); 
				 }*/
				 
				 if(!(isUserTypePresent(reqObj)).equalsIgnoreCase("true"))
				 {
					 
					 description.add(isUserTypePresent(reqObj)); 
					 
					 
				 } 
				 
			 }
			
			
			 
		}
		else
		{
			
			description.add(Messages.EMPTY_REQUEST);
		}
		if(!(description.size()==0))
		{
			status.put(Messages.CODE, Messages.BAD_REQUEST_CODE);
			status.put(Messages.ERROR_DESCRIPTION, description);
			errorObj.put(Messages.STATUS,status);
		}
		
		return errorObj;
	}
	public String isExternalIdPresent(Map<String, Object> reqObj)
	{
		String output = "false";
		
						if(!(reqObj.get(SCIM.EXTERNAL_ID)==null))
						{
							output="true";
						}
						else
						{
							output="ExternalId not provided.";
						}
					
		return output;
	}
	public String isNamePresent(Map<String, Object> reqObj)
	{
		String output = "true";
		
			
						if(!(reqObj.get(SCIM.NAME)==null))
						{
							HashMap<String, Object> name =  (HashMap<String, Object>) reqObj.get(SCIM.NAME);
							if ((!(name.get(SCIM.FIRST_NAME)==null))&&(!(name.get(SCIM.LAST_NAME)==null)))
								
							{
								
								return output;
							}
							else
							{
								
								output=SCIM.NAME+Messages.INSUFFICIENT_INFORMATION;
								return output;
							}
							
						}
						else
						{
							output= SCIM.NAME+Messages.INSUFFICIENT_INFORMATION;
							return output;
						}
						
					
		
	}
	/*public String isEmailPresent(Map<String, Object> reqObj)
	{
		String output = "false";
		
						if(!(reqObj.get(SCIM.EMAILS)==null))
						{
							HashMap<String, Object> emails =  (HashMap<String, Object>) reqObj
									.get(SCIM.EMAILS);
							if ((!(emails.get(SCIM.VALUE)==null)))
									
							{
								String EMAIL_REGEX = "^[\\w-_\\.+]*[\\w-_\\.]\\"+
									      "@([\\w]+\\.)+[\\w]+[\\w]$";
								if(emails.get(SCIM.VALUE).toString().matches(EMAIL_REGEX)){
								output="true";
								}
								else
								{
									output="Email is in an invalid format";
								}
							}
							
						}
						else
						{
							output="EMail address not provided.";
						}
					
		return output;
	}*/
	public String isUserTypePresent(Map<String, Object> reqObj)
	{
		String output = "true";
		if(!(reqObj.get(SCIM.USER_TYPE)==null))
		{
			for (Macquarie.empTypeValues emptype : Macquarie.empTypeValues.values()) {
			    if((reqObj.get(SCIM.USER_TYPE)).toString().equals(emptype))
			    {
			    	//System.out.println(reqObj.get(SCIM.USER_TYPE));
			    	return output;
			    }
			    
			}
			
		}
		else
		{
			//System.out.println("in else for UserType");
			output=SCIM.USER_TYPE+Messages.INSUFFICIENT_INFORMATION;
		}
		
		//System.out.println("output"+output);
		return output;
	}
	
}
