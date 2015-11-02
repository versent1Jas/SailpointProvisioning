package com.versent.sailpoint.constants;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.GregorianCalendar;
import java.util.LinkedHashMap;
import java.util.Properties;

import com.unboundid.scim.data.Address;

import flexjson.factories.DateObjectFactory;

public final class Constants {
	/*public static final String USER_CREATION_SUCCESS = "User created successfully";
	public static final String DUPLICATE_USER = "User already exsists";
	public static final String USER_CREATION_FAILURE = "User creation failed";
	public static final String USER_MODIFICATION_SUCCESS = "modified successfully";
	public static final String USER_NOT_FOUND = " not found";
	public static final String USER_DELETED_SUCCESSFULLY = "deleted successfully";
	public static final String INVALID_FORMAT = "was in an invalid format";
	public static final String USER_NAME ="userName" ;
	public static final String FIRST_NAME="givenName";
	public static final String LAST_NAME="familyName";
	public static final String MIDDLE_NAME="middleName";
	public static final String HONORIFIC_PREFIX="honorificPrefix";
	public static final String HONORIFIC_SUFFIX="honorificSuffix";
	public static final String DEPARTMENT ="department";
	public static final String FORMATTED ="formatted";
	public static final String EXTERNAL_ID="externalId";
	public static final String SCHEMAS="schemas";
	public static final String NAME="name";
	public static final String EMAILS="emails";
	public static final String VALUE="value";
	public static final String TYPE="type";
	public static final String PRIMARY="primary";
	public static final String META="meta";
	public static final String CREATED="created";
	public static final String LAST_MODIFIED="lastModified";
	public static final String VERSION="version";*/
	
	public static final int SHORT_NAME_LENGTH=8;
	public static final int PAGE_SIZE=10;
	//public static final String INSUFFICIENT_INFORMATION ="Mandatory attribute missing from request.";
	//public static final String BAD_REQUEST ="UserID or Name is required as query parameter.";
	//public static final String RESOURCE_TYPE="resourceType";
	
	
	
	public static final Date CREATION_DATE = new Date(new Date().getTime());
	public static final Date MODIFICATION_DATE = new Date(new Date().getTime());
	
	public static final int START_INDEX = 0;
	public static final String START_INDEX_VAR_NAME = "startIndex";
	public static final String PAGE_SIZE_VAR_NAME = "itemsPerPage";
	public static final String SEARCH_RETURN_ATTRIBUTES_VAR_NAME = "attributes";
	public static final String SEARCH_RETURN_ATTRIBUTES = "\"name\",\"id\"";
	
	public static final ArrayList<String> MANDATORY_ATTRIBUTES_USER = new ArrayList<String>();
	
	static
	{
		MANDATORY_ATTRIBUTES_USER.add(SCIM.USER_TYPE);	
		MANDATORY_ATTRIBUTES_USER.add(SCIM.FIRST_NAME);
		MANDATORY_ATTRIBUTES_USER.add(SCIM.LAST_NAME);

	}

	/*
	public static final LinkedHashMap<String,Object> SINGLE_VALUED_ATTRS_EMPLOYEE = new LinkedHashMap<String,Object>();
	static
	{
		SINGLE_VALUED_ATTRS_EMPLOYEE.put(SCIM.HR_STATUS,Macquarie.MGL_HR_STATUS);
		SINGLE_VALUED_ATTRS_EMPLOYEE.put(SCIM.EMPLOYMENT_TYPE,Macquarie.MGL_EMP_TYPE);
		SINGLE_VALUED_ATTRS_EMPLOYEE.put(SCIM.USER_TYPE,Macquarie.MGL_IDENTITY_TYPE);
		SINGLE_VALUED_ATTRS_EMPLOYEE.put(SCIM.USER_STATUS,Macquarie.MGL_IDENTITY_STATUS);
		SINGLE_VALUED_ATTRS_EMPLOYEE.put(SCIM.EMP_START_DATE,Macquarie.MGL_EMP_START_DATE);
		SINGLE_VALUED_ATTRS_EMPLOYEE.put(SCIM.EMP_END_DATE,Macquarie.MGL_EMP_END_DATE);
		SINGLE_VALUED_ATTRS_EMPLOYEE.put(SCIM.MANAGER_ID,Macquarie.EMP_MANAGER);
		SINGLE_VALUED_ATTRS_EMPLOYEE.put(SCIM.JOB_TITLE,Macquarie.MGL_JOB_BUS_TITLE);
		SINGLE_VALUED_ATTRS_EMPLOYEE.put(SCIM.DEPARTMENT,Macquarie.MGL_DEPARTMENT);
		SINGLE_VALUED_ATTRS_EMPLOYEE.put(SCIM.DIVISION,Macquarie.MGL_DIVISION);
		SINGLE_VALUED_ATTRS_EMPLOYEE.put(SCIM.EMPLOYEE_NUMBER,Macquarie.MGL_EMP_NUMBER);
	
	}
	/*public static final LinkedHashMap<String,Object> PERMITTED_ATTRIBUTES_MODIFY_EMPLOYEE = new LinkedHashMap<String,Object>();
	static
	{
		PERMITTED_ATTRIBUTES_MODIFY_EMPLOYEE.put(SCIM.HR_STATUS,Macquarie.MGL_HR_STATUS);
		
		PERMITTED_ATTRIBUTES_MODIFY_EMPLOYEE.put(SCIM.MIDDLE_NAME,Macquarie.MIDDLE_NAME);
		PERMITTED_ATTRIBUTES_MODIFY_EMPLOYEE.put(SCIM.PREFIX,Macquarie.PREFIX);
		PERMITTED_ATTRIBUTES_MODIFY_EMPLOYEE.put(SCIM.VALUE,Macquarie.VALUE);
		PERMITTED_ATTRIBUTES_MODIFY_EMPLOYEE.put(SCIM.COUNTRY,Macquarie.MGL_COUNTRY);
		PERMITTED_ATTRIBUTES_MODIFY_EMPLOYEE.put(SCIM.LOCALITY,Macquarie.MGL_LOCALITY);
		PERMITTED_ATTRIBUTES_MODIFY_EMPLOYEE.put(SCIM.EMPLOYMENT_TYPE,Macquarie.MGL_EMP_TYPE);
		PERMITTED_ATTRIBUTES_MODIFY_EMPLOYEE.put(SCIM.EMP_START_DATE,Macquarie.MGL_EMP_START_DATE);
		PERMITTED_ATTRIBUTES_MODIFY_EMPLOYEE.put(SCIM.EMP_END_DATE,Macquarie.MGL_EMP_END_DATE);
		PERMITTED_ATTRIBUTES_MODIFY_EMPLOYEE.put(SCIM.MANAGER_ID,Macquarie.EMP_MANAGER);
		PERMITTED_ATTRIBUTES_MODIFY_EMPLOYEE.put(SCIM.JOB_TITLE,Macquarie.MGL_JOB_BUS_TITLE);
		PERMITTED_ATTRIBUTES_MODIFY_EMPLOYEE.put(SCIM.GL4_COST_CENTER,Macquarie.MGL4_COST_CENTER);
		PERMITTED_ATTRIBUTES_MODIFY_EMPLOYEE.put(SCIM.DEPARTMENT,Macquarie.MGL_DEPARTMENT);
		PERMITTED_ATTRIBUTES_MODIFY_EMPLOYEE.put(SCIM.DIVISION,Macquarie.MGL_DIVISION);
		
	}
	
	public static final LinkedHashMap<String,Object> PERMITTED_ATTRIBUTES_GENERIC_ACCOUNT = new LinkedHashMap<String,Object>();
	static
	{
		PERMITTED_ATTRIBUTES_GENERIC_ACCOUNT.put(SCIM.HR_STATUS,Macquarie.MGL_HR_STATUS);
		PERMITTED_ATTRIBUTES_GENERIC_ACCOUNT.put(SCIM.USER_NAME,Macquarie.USER_NAME);
		PERMITTED_ATTRIBUTES_GENERIC_ACCOUNT.put(SCIM.MIDDLE_NAME,Macquarie.MIDDLE_NAME);
		PERMITTED_ATTRIBUTES_GENERIC_ACCOUNT.put(SCIM.PREFIX,Macquarie.PREFIX);
		PERMITTED_ATTRIBUTES_GENERIC_ACCOUNT.put(SCIM.VALUE,Macquarie.VALUE);
		PERMITTED_ATTRIBUTES_GENERIC_ACCOUNT.put(SCIM.COUNTRY,Macquarie.MGL_COUNTRY);
		PERMITTED_ATTRIBUTES_GENERIC_ACCOUNT.put(SCIM.LOCALITY,Macquarie.MGL_LOCALITY);
		PERMITTED_ATTRIBUTES_GENERIC_ACCOUNT.put(SCIM.MANAGER_ID,Macquarie.EMP_MANAGER);
		
	} 
	public static final LinkedHashMap<String, Object> ADDRESS = new LinkedHashMap<String, Object>();
	static
	{
		ADDRESS.put(SCIM.COUNTRY, Macquarie.MGL_COUNTRY);
		ADDRESS.put(SCIM.STATE, Macquarie.MGL_STATE);
		ADDRESS.put(SCIM.LOCALITY, Macquarie.MGL_LOCALITY);
		ADDRESS.put(SCIM.FORMATTED, Macquarie.MGL_WORK_MAIL_ADDRESS);
		
	}
	public static final LinkedHashMap<String, Object> COST_CENTERS = new LinkedHashMap<String, Object>();
	static
	{
		COST_CENTERS.put(SCIM.GL4_COST_CENTER, Macquarie.MGL4_COST_CENTER);
		COST_CENTERS.put(SCIM.GL3_COST_CENTER, Macquarie.MGL3_COST_CENTER);
		
	}
	public static final LinkedHashMap<String, Object> GROUPS = new LinkedHashMap<String, Object>();
	static
	{
		GROUPS.put(SCIM.GROUP_CODE, Macquarie.MGL_EMP_GROUP_CODE);
		GROUPS.put(SCIM.GROUP_DESC, Macquarie.MGL_EMP_GROUP_DESC);
		
	}
	/*public static final LinkedHashMap<String, Object> NAME = new LinkedHashMap<String, Object>();
	static
	{
		NAME.put(SCIM.FIRST_NAME, Macquarie.FIRST_NAME);
		NAME.put(SCIM.LAST_NAME, Macquarie.LAST_NAME);
		NAME.put(SCIM.MIDDLE_NAME, Macquarie.MIDDLE_NAME);
		NAME.put(SCIM.PREFIX, Macquarie.PREFIX);
		
	}*/
	
		
	

}
