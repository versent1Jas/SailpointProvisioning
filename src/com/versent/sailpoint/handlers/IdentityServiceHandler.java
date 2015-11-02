/**
 * 
 */
package com.versent.sailpoint.handlers;


import java.util.ArrayList;
import java.util.Arrays;

import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import org.apache.log4j.Logger;
import org.json.JSONException;

import sailpoint.api.Identitizer;
import sailpoint.api.Identitizer.RefreshResult;
import sailpoint.api.IdentityTriggerHandler;
import sailpoint.api.SailPointContext;
import sailpoint.object.Attributes;
import sailpoint.object.AuditEvent;
import sailpoint.object.Configuration;

import sailpoint.object.Filter;
import sailpoint.object.Identity;
import sailpoint.object.IdentityChangeEvent;
import sailpoint.object.IdentityTrigger;
import sailpoint.object.IdentityTrigger.Type;
import sailpoint.object.QueryOptions;
import sailpoint.tools.GeneralException;
import sailpoint.tools.Message;
import sailpoint.tools.Parser.ParseException;
import sailpoint.rest.BaseResource;
import sailpoint.server.Auditor;



import com.versent.sailpoint.constants.Constants;
import com.versent.sailpoint.transformers.SCIMUserTransformer;
import com.versent.sailpoint.utils.Configurator;
import com.versent.sailpoint.utils.GenericFunctions;
import com.versent.sailpoint.utils.JDBCConnector;

/**
 * @author Jaspreet
 *
 */
public class IdentityServiceHandler extends BaseResource  {
	Logger log = Logger.getLogger(IdentityServiceHandler.class);
	
	SCIMUserTransformer transformRespObj = new SCIMUserTransformer();
	
	
	
	
	public LinkedHashMap<String, Object> create( SailPointContext context, Identity reqIdentity,String uri ) throws Exception {
		LinkedHashMap<String, Object> createUserRespObj= new LinkedHashMap<String, Object>();	
	
	try{
	
		
		//Identity identitySearch= context.getObjectByName( Identity.class, reqIdentity.getName());
	
			reqIdentity.setName(generateInitialShortName(context,reqIdentity.getFirstname(), reqIdentity.getLastname()));
			
			context.saveObject(reqIdentity);
			if( log.isDebugEnabled() ) {
				StringBuilder builder = new StringBuilder().append( "Generated shortName for user"+ reqIdentity.getName());
				
				log.debug( builder.toString() );
				
			}
			log.info("Creating SCIM response");
			
			createUserRespObj=transformRespObj.transformSCIM(reqIdentity,context,uri);
			if( log.isDebugEnabled() ) {
				StringBuilder builder = new StringBuilder().append( "Attributes set in the resposne"+ createUserRespObj.keySet());
				
				log.debug( builder.toString() );
				
			}
			if(Auditor.isEnabled("createIdentity"))
			{
				Message auditMessageSuccess= new Message(Message.Type.Info,"USER_CREATION_SUCCESS");
				AuditEvent createIdentityAuditEvent = new AuditEvent();
				createIdentityAuditEvent.setAction("createIdentity");
				createIdentityAuditEvent.setTarget("identity");
				createIdentityAuditEvent.setSource("REST API");
				createIdentityAuditEvent.setAttribute("StatusMessage", auditMessageSuccess.getMessage());
				
				Auditor.log(createIdentityAuditEvent);				
			}
			
			
			context.commitTransaction();
			
			
		IdentityTrigger idTrig = new IdentityTrigger();
		idTrig.setType(IdentityTrigger.Type.Create);
		IdentityChangeEvent result =idTrig.createEvent(null, reqIdentity);
		//IdentityChangeEvent result = new IdentityChangeEvent(reqIdentity);
		System.out.println("the result is "+result.getIdentityFullName());
		System.out.println("********About to call the getTriggers method");
		List<IdentityTrigger> trig =(List<IdentityTrigger>) getTriggers(context,result.getTrigger().getType());
	
		System.out.println("the size of trigger list returned is"+trig.size());
		handle(trig, reqIdentity, context);
			return createUserRespObj;
		
		
	}
	catch(GeneralException ge)
	{
		LinkedHashMap<String, Object> errorObj = new LinkedHashMap<String, Object>();
		LinkedHashMap<String, Object> status = new LinkedHashMap<String, Object>();
		Message auditMessage = new Message(Message.Type.Error,"USER_CREATION_FAILURE");
		Message msgErrorCodeKey = new Message(Message.Type.Error,"CODE");
		Message msgErrorCodeValue = new Message(Message.Type.Error,"INTERNAL_SERVER_ERROR");
		
		Message msgErrorDescriptionKey = new Message(Message.Type.Error,"ERROR_DESCRIPTION");
		Message msgErrorDescriptionValue = new Message(Message.Type.Error,"INTERNAL_SERVER_ERROR_DESCRIPTION",ge.getMessage());
		status.put(msgErrorCodeKey.getMessage(), msgErrorCodeValue.getMessage());
		status.put(msgErrorDescriptionKey.getMessage(),msgErrorDescriptionValue.getMessage());
		errorObj.put("status", status);
		if(Auditor.isEnabled("createIdentity"))
		{
			AuditEvent createIdentityAuditEvent = new AuditEvent();
			createIdentityAuditEvent.setAction("createIdentity");
			createIdentityAuditEvent.setTarget("identity");
			createIdentityAuditEvent.setSource("REST API");
			createIdentityAuditEvent.setAttribute("StatusMessage", auditMessage.getMessage());
			createIdentityAuditEvent.setAttribute("Exception", ge.getClass().getName());
			Auditor.log(createIdentityAuditEvent);				
		}
		log.error(ge.getStackTrace());
		return errorObj;
	}
	
	}
	
	public LinkedHashMap<String, Object> deleteIdentity( SailPointContext context,  String id ) throws Exception  {
		Identity origID;
		LinkedHashMap<String, Object> respObj = new LinkedHashMap<String, Object>();
		
		try {
			log.info("retrieving the user");
			origID = retrieve(context, id);
		
		if(origID.getName()==null)
		{
			Message msgErrorCodeKey = new Message(Message.Type.Error,"CODE");
			Message msgErrorCodeValue = new Message(Message.Type.Error,"USER_NOT_FOUND_CODE");
			
			Message msgErrorDescriptionKey = new Message(Message.Type.Error,"ERROR_DESCRIPTION");
			Message msgErrorDescriptionValue = new Message(Message.Type.Error,"USER_NOT_FOUND");
			
			LinkedHashMap<String, Object> status = new LinkedHashMap<String, Object>();
			status.put(msgErrorCodeKey.getMessage(), msgErrorCodeValue.getMessage());
			status.put(msgErrorDescriptionKey.getMessage(), id +msgErrorDescriptionValue.getMessage());
			respObj.put("status", status);	
			return respObj;
		}
		else
		{
			//CALLING THE DELETE TRIGGER HERE:
			IdentityTrigger idTrig = new IdentityTrigger();
			idTrig.setType(IdentityTrigger.Type.AttributeChange);
			IdentityChangeEvent result =idTrig.createEvent(origID, null);
			//IdentityChangeEvent result = new IdentityChangeEvent(reqIdentity);
			System.out.println("the result is "+result.getIdentityFullName());
			System.out.println("********About to call the getTriggers method for delete");
			List<IdentityTrigger> trig =(List<IdentityTrigger>) getTriggers(context,result.getTrigger().getType());
			System.out.println("the trigger from event"+result.getTrigger().getType());
			System.out.println("the size of trigger list returned is"+trig.size());
			System.out.println("the initial trigger is "+trig.get(0));
			handle(trig,origID, context);
			//END OF TRIGGER CALL
			context.removeObject(origID);
			
			
			context.commitTransaction();
			
			if( log.isDebugEnabled() ) {
				StringBuilder builder = new StringBuilder().append( "The id of user deleted is"+origID);
				
				log.debug( builder.toString() );
			}
			log.info("User deleted successfully");
			
			
		}
		}
		catch (GeneralException ge) {
			Message errorMsg = new Message(Message.Type.Error,"USER_NOT_FOUND",ge.getClass().getName());
			Message auditMessageFailure = new Message(Message.Type.Error,"USER_DELETION_FAILURE");
			
			log.error(errorMsg);
			if(log.isDebugEnabled())
			{
				log.debug(errorMsg,ge);
			}
			Message msgErrorCodeKey = new Message(Message.Type.Error,"CODE");
			Message msgErrorCodeValue = new Message(Message.Type.Error,"USER_NOT_FOUND_CODE");
			
			Message msgErrorDescriptionKey = new Message(Message.Type.Error,"ERROR_DESCRIPTION");
			Message msgErrorDescriptionValue = new Message(Message.Type.Error,"USER_NOT_FOUND");
			
			LinkedHashMap<String, Object> status = new LinkedHashMap<String, Object>();
			status.put(msgErrorCodeKey.getMessage(), msgErrorCodeValue.getMessage());
			status.put(msgErrorDescriptionKey.getMessage(), id+msgErrorDescriptionValue);
			respObj.put("status", status);	
			AuditEvent createIdentityAuditEvent = new AuditEvent();
			createIdentityAuditEvent.setAction("deleteIdentity");
			createIdentityAuditEvent.setTarget("identity");
			createIdentityAuditEvent.setSource("REST API");
			createIdentityAuditEvent.setAttribute("StatusMessage", id+auditMessageFailure.getMessage());
			
			return respObj;
		
			
		}
		Message auditMessageSuccess = new Message(Message.Type.Info,"USER_DELETED_SUCCESSFULLY");
		Message msgSuccessDescriptionKey = new Message(Message.Type.Error,"ERROR_DESCRIPTION");
		Message msgErrorCodeKey = new Message(Message.Type.Error,"CODE");
		Message successStatusResponseCode = new Message(Message.Type.Info,"SUCCESSFUL_OPERATION_CODE");
		AuditEvent createIdentityAuditEvent = new AuditEvent();
		createIdentityAuditEvent.setAction("deleteIdentity");
		createIdentityAuditEvent.setTarget("identity");
		createIdentityAuditEvent.setSource("REST API");
		createIdentityAuditEvent.setAttribute("StatusMessage", id+auditMessageSuccess.getMessage());
			respObj.put(msgErrorCodeKey.getMessage(), successStatusResponseCode.getMessage());
			respObj.put(msgSuccessDescriptionKey.getMessage(),id+" "+auditMessageSuccess.getMessage());
		    return respObj ;
	}
	//SCIM retrieve
public LinkedHashMap<String, Object> SCIMretrieve(SailPointContext context,String searchParam,String uri ) throws GeneralException {
		
		
		LinkedHashMap<String, Object> respObj = new LinkedHashMap<String, Object>();
		
		Identity searchIdentity = context.getObjectByName(Identity.class, searchParam);
		Configuration attrs = Configurator.getInstance().getCustomAttributes(context, "SCIM");
		if(searchIdentity==null)
		{
			
			searchIdentity = context.getObjectById(Identity.class, searchParam);
			
			if(searchIdentity==null)
			{
				
				Message msgErrorCodeKey = new Message(Message.Type.Error,"CODE");
				Message msgErrorCodeValue = new Message(Message.Type.Error,"USER_NOT_FOUND_CODE");
				
				Message msgErrorDescriptionKey = new Message(Message.Type.Error,"ERROR_DESCRIPTION");
				Message msgErrorDescriptionValue = new Message(Message.Type.Error,"USER_NOT_FOUND");
				
				LinkedHashMap<String, Object> status = new LinkedHashMap<String, Object>();
				status.put(msgErrorCodeKey.getMessage(), msgErrorCodeValue.getMessage());
				status.put(msgErrorDescriptionKey.getMessage(), searchParam+" "+msgErrorDescriptionValue.getMessage());
				respObj.put("status", status);	
				
				return respObj;
				
			}
		}
			
			
			respObj=transformRespObj.transformSCIM(searchIdentity,context,uri);
			return respObj;
		
		
	}
	//SCIM retrieve
	
	public Identity retrieve(SailPointContext context,String searchParam ) throws GeneralException {
	
		
		Identity searchIdentity = context.getObjectByName(Identity.class, searchParam);
		if(searchIdentity==null)
		{
			
			searchIdentity = context.getObjectById(Identity.class, searchParam);
			
			
			return searchIdentity;
		}
		return searchIdentity;
		
		
	}
	
	public LinkedHashMap<String, Object> getIdentities(SailPointContext context,int startIndex,int pageSize) throws GeneralException
	{
		LinkedHashMap<String, Object> respObj = new LinkedHashMap<String, Object>();
		
		
		ArrayList<Identity> userList = (ArrayList<Identity>)context.getObjects(Identity.class);
		
		Integer origUserListSize = userList.size();
		ArrayList formattedUserList = new ArrayList();	
		ArrayList<Identity> finalUserList  = doPagination(userList, startIndex, pageSize);
		for(Identity user:finalUserList)
		{
			LinkedHashMap<String, Object> filteredAttributes = new LinkedHashMap<String, Object>();
			filteredAttributes.put("id", user.getId());
			filteredAttributes.put("name",user.getName());
			formattedUserList.add(filteredAttributes);
			
		}
		
		if(log.isDebugEnabled())
		{
			StringBuilder builder = new StringBuilder("the size of list after pagination");
			log.debug(builder.append(formattedUserList.size()));
		}
		
		
	
		respObj = transformRespObj.transformSCIMSearchList(formattedUserList,origUserListSize,startIndex,pageSize);
		return respObj;
	}

	public LinkedHashMap modify(SailPointContext context, Map<String,Object> req,String id,String uri) {
		
		try{
			
		Identity origID=retrieve(context, id);
		
		LinkedHashMap<String, Object> respObj = new LinkedHashMap<String, Object>();
		if(origID.getName()==null)
		{
			Message msgErrorCodeKey = new Message(Message.Type.Error,"CODE");
			Message msgErrorCodeValue = new Message(Message.Type.Error,"USER_NOT_FOUND_CODE");
			
			Message msgErrorDescriptionKey = new Message(Message.Type.Error,"ERROR_DESCRIPTION");
			Message msgErrorDescriptionValue = new Message(Message.Type.Error,"USER_NOT_FOUND");
			
			LinkedHashMap<String, Object> status = new LinkedHashMap<String, Object>();
			status.put(msgErrorCodeKey.getMessage(), msgErrorCodeValue.getMessage());
			status.put(msgErrorDescriptionKey.getMessage(), id+" "+msgErrorDescriptionValue.getMessage());
			respObj.put("status", status);	
			return respObj;
		}
		else
		{
			log.info("Found the user to be modified.");
			if( log.isDebugEnabled() ) {
				StringBuilder builder = new StringBuilder().append( "The username recieved in request"+id);
				
				log.debug( builder.toString() );
			}
			SCIMUserTransformer reqTransformer = new SCIMUserTransformer();
			Map<String,Object> transformedIdentity= reqTransformer.transformModifyMap(req,context);
			// Retreive the attributes from the Identity
			// Log the original attributes as Trace logging.
			 
		    Attributes<String,Object> origAttList=origID.getAttributes();
		    if( log.isDebugEnabled() ) {
				
				for(Attributes.Entry<String,Object> entry : origAttList.entrySet())
				{
					StringBuilder transformedAttributesKeys = new StringBuilder().append(entry.getKey());
					StringBuilder transformedAttributesValues = new StringBuilder().append(entry.getValue());
					log.debug("the key for original identity is "+transformedAttributesKeys+ "value is"+transformedAttributesValues);
				}
				for(Map.Entry<String,Object> entry : transformedIdentity.entrySet())
				{
					StringBuilder transformedAttributesKeys = new StringBuilder().append(entry.getKey());
					StringBuilder transformedAttributesValues = new StringBuilder().append(entry.getValue());
					log.debug("the key for transformed identity is "+transformedAttributesKeys+ "value is"+transformedAttributesValues);
				}
				
			}
			
			
			// Create a new Attributes object.
			Attributes<String, Object> modifyAttrs = new Attributes<String, Object>();
			
			// Load all the attributes from the request into the Attributes object
			modifyAttrs.setMap(transformedIdentity);
			
			// Set the Attributes on the Identity to be the Attributes object.
			
			origID.setAttributes(modifyAttrs);
			
			// Save the Identity object
			context.saveObject(origID);
			
			// Commit the transaction and catch any exception
			context.commitTransaction();
			log.info("Identity modified successfully");
			Message auditEventSuccess = new Message(Message.Type.Info,"USER_MODIFICATION_SUCCESS");
			if(Auditor.isEnabled("modifyIdentity"))
			{
				AuditEvent createIdentityAuditEvent = new AuditEvent();
				createIdentityAuditEvent.setAction("modifyIdentity");
				createIdentityAuditEvent.setTarget("identity");
				createIdentityAuditEvent.setSource("REST API");
				createIdentityAuditEvent.setAttribute("StatusMessage", auditEventSuccess.getMessage());
				
				Auditor.log(createIdentityAuditEvent);				
			}
			respObj = transformRespObj.transformSCIM(origID,context,uri);
			
		}
		return respObj;
		}catch(GeneralException ge)
		{
			Message msgErrorCodeKey = new Message(Message.Type.Error,"CODE");
			Message msgErrorCodeValue = new Message(Message.Type.Error,"INTERNAL_SERVER_ERROR_CODE");
			
			Message msgErrorDescriptionKey = new Message(Message.Type.Error,"ERROR_DESCRIPTION");
			Message msgErrorDescriptionValue = new Message(Message.Type.Error,"INTERNAL_SERVER_ERROR_DESCRIPTION");
			
			LinkedHashMap<String, Object> status = new LinkedHashMap<String, Object>();
			status.put(msgErrorCodeKey.getMessage(), msgErrorCodeValue.getMessage());
			status.put(msgErrorDescriptionKey.getMessage(), id+" "+msgErrorDescriptionValue.getMessage());
			LinkedHashMap<String, Object> errorObj = new LinkedHashMap<String, Object>();
			errorObj.put("status", status);	
			if(Auditor.isEnabled("createIdentity"))
			{
				Message auditEventFailure = new Message(Message.Type.Info,"USER_MODIFICATION_FAILURE");
				AuditEvent createIdentityAuditEvent = new AuditEvent();
				createIdentityAuditEvent.setAction("modifyIdentity");
				createIdentityAuditEvent.setTarget("identity");
				createIdentityAuditEvent.setSource("REST API");
				createIdentityAuditEvent.setAttribute("StatusMessage", auditEventFailure.getMessage());
				createIdentityAuditEvent.setAttribute("Exception", ge.getClass().getName());
				Auditor.log(createIdentityAuditEvent);				
			}
			Message auditEventFailure = new Message(Message.Type.Error,"USER_MODIFICATION_FAILURE");
			log.error(auditEventFailure.getMessage());
			log.debug(auditEventFailure.getMessage(),ge);
			return errorObj;	 
		}
		catch(JSONException je)
		{
			log.error(je.getStackTrace());
			Message msgErrorCodeKey = new Message(Message.Type.Error,"CODE");
			Message msgErrorCodeValue = new Message(Message.Type.Error,"USER_NOT_FOUND_CODE");
			
			Message msgErrorDescriptionKey = new Message(Message.Type.Error,"ERROR_DESCRIPTION");
			Message msgErrorDescriptionValue = new Message(Message.Type.Error,"USER_NOT_FOUND");
			LinkedHashMap<String, Object> errorObj = new LinkedHashMap<String, Object>();
			LinkedHashMap<String, Object> status = new LinkedHashMap<String, Object>();
			status.put(msgErrorCodeKey.getMessage(), msgErrorCodeValue.getMessage());
			status.put(msgErrorDescriptionKey.getMessage(), id+" "+msgErrorDescriptionValue.getMessage());
			errorObj.putAll(status);
			if(Auditor.isEnabled("createIdentity"))
			{
				Message auditEventFailure = new Message(Message.Type.Error,"USER_MODIFICATION_FAILURE");
				AuditEvent createIdentityAuditEvent = new AuditEvent();
				createIdentityAuditEvent.setAction("modifyIdentity");
				createIdentityAuditEvent.setTarget("identity");
				createIdentityAuditEvent.setSource("REST API");
				createIdentityAuditEvent.setAttribute("StatusMessage", auditEventFailure.getMessage());
				createIdentityAuditEvent.setAttribute("Exception", je.getClass().getName());
				Auditor.log(createIdentityAuditEvent);				
			}
			Message auditEventFailure = new Message(Message.Type.Error,"USER_MODIFICATION_FAILURE");
			log.error(auditEventFailure.getMessage());
			log.debug(auditEventFailure.getMessage(),je);
			return errorObj;	 
		}
		
}
	public LinkedHashMap<String,Object>	patch(SailPointContext context, Map<String,Object> req,String id,String uri)  
	{
		
		try{
		    
			Identity origID = retrieve(context, id);
			LinkedHashMap<String, Object> respObj = new LinkedHashMap<String, Object>();
		
		if(origID.getName()==null)
		{
			Message msgErrorCodeKey = new Message(Message.Type.Error,"CODE");
			Message msgErrorCodeValue = new Message(Message.Type.Error,"USER_NOT_FOUND_CODE");
			
			Message msgErrorDescriptionKey = new Message(Message.Type.Error,"ERROR_DESCRIPTION");
			Message msgErrorDescriptionValue = new Message(Message.Type.Error,"USER_NOT_FOUND");
			LinkedHashMap<String, Object> errorObj = new LinkedHashMap<String, Object>();
			LinkedHashMap<String, Object> status = new LinkedHashMap<String, Object>();
			status.put(msgErrorCodeKey.getMessage(), msgErrorCodeValue.getMessage());
			status.put(msgErrorDescriptionKey.getMessage(), id+" "+msgErrorDescriptionValue.getMessage());
			errorObj.put("status", status);	
			return errorObj;	 	 
			
		}
		else
		{
			SCIMUserTransformer reqTransformer = new SCIMUserTransformer();
			Map<String,Object> transformedIdentity= reqTransformer.transformModifyMap(req,context);
			
			// Retrieve the attributes from the Identity
		     Attributes origAttList=origID.getAttributes();
		    
			// Log the original attributes as Trace logging.
			
			// Retrieve the attributes from the request
			
			// Create a new Attributes object.
			Attributes<String, Object> patchAttrs = new Attributes<String, Object>();
			
			// Load all the attributes from the request into the Attributes object
		  
			// Set the Attributes on the Identity to be the Attributes object.
		  for(String key : transformedIdentity.keySet()) {
	            String value = transformedIdentity.get(key).toString();
	          
	            origID.setAttribute(key, value);
	            		
	         
	          context.saveObject(origID);
	          if(Auditor.isEnabled("modifyIdentity"))
				{
	        	  	Message msgModifySuccess = new Message(Message.Type.Error,"USER_MODIFICATION_SUCCESS");
					AuditEvent createIdentityAuditEvent = new AuditEvent();
					createIdentityAuditEvent.setAction("patchIdentity");
					createIdentityAuditEvent.setTarget("identity");
					createIdentityAuditEvent.setSource("REST API");
					createIdentityAuditEvent.setAttribute("StatusMessage", id+msgModifySuccess.getMessage());
					
					Auditor.log(createIdentityAuditEvent);				
				}
	          context.commitTransaction();
	          
	          respObj = transformRespObj.transformSCIM(origID,context,uri);
		  }
			
			
		}
		
		
		return respObj;
		}
		catch(GeneralException ge)
		{
			log.error("Problem encountered in performing patch operation", ge);
			
			Message msgErrorCodeKey = new Message(Message.Type.Error,"CODE");
			Message msgErrorCodeValue = new Message(Message.Type.Error,"USER_NOT_FOUND_CODE");
			
			Message msgErrorDescriptionKey = new Message(Message.Type.Error,"ERROR_DESCRIPTION");
			Message msgErrorDescriptionValue = new Message(Message.Type.Error,"USER_NOT_FOUND");
			LinkedHashMap<String, Object> errorObj = new LinkedHashMap<String, Object>();
			LinkedHashMap<String, Object> status = new LinkedHashMap<String, Object>();
			status.put(msgErrorCodeKey.getMessage(), msgErrorCodeValue.getMessage());
			status.put(msgErrorDescriptionKey.getMessage(), id+" "+msgErrorDescriptionValue.getMessage());
			errorObj.put("status", status);	
			if(Auditor.isEnabled("modifyIdentity"))
			{
				Message msgModifySuccess = new Message(Message.Type.Error,"USER_MODIFICATION_FAILURE");
				AuditEvent createIdentityAuditEvent = new AuditEvent();
				createIdentityAuditEvent.setAction("patchIdentity");
				createIdentityAuditEvent.setTarget("identity");
				createIdentityAuditEvent.setSource("REST API");
				createIdentityAuditEvent.setAttribute("StatusMessage", msgModifySuccess.getMessage());
				createIdentityAuditEvent.setAttribute("Exception", ge.getClass().getName());
				Auditor.log(createIdentityAuditEvent);				
			}
			return errorObj;
		}
			catch(JSONException je)
			{
				log.error("Problem in performing patch operation", je);
				Message msgErrorCodeKey = new Message(Message.Type.Error,"CODE");
				Message msgErrorCodeValue = new Message(Message.Type.Error,"USER_NOT_FOUND_CODE");
				
				Message msgErrorDescriptionKey = new Message(Message.Type.Error,"ERROR_DESCRIPTION");
				Message msgErrorDescriptionValue = new Message(Message.Type.Error,"USER_NOT_FOUND");
				LinkedHashMap<String, Object> errorObj = new LinkedHashMap<String, Object>();
				LinkedHashMap<String, Object> status = new LinkedHashMap<String, Object>();
				status.put(msgErrorCodeKey.getMessage(), msgErrorCodeValue.getMessage());
				status.put(msgErrorDescriptionKey.getMessage(), id+" "+msgErrorDescriptionValue.getMessage());
				errorObj.put("status", status);	
				if(Auditor.isEnabled("modifyIdentity"))
				{
					Message msgErrorCodeDescription= new Message(Message.Type.Error,"USER_MODIFICATION_FAILURE");
					AuditEvent createIdentityAuditEvent = new AuditEvent();
					createIdentityAuditEvent.setAction("patchIdentity");
					createIdentityAuditEvent.setTarget("identity");
					createIdentityAuditEvent.setSource("REST API");
					createIdentityAuditEvent.setAttribute("StatusMessage",msgErrorCodeDescription.getMessage());
					createIdentityAuditEvent.setAttribute("Exception", je.getClass().getName());
					Auditor.log(createIdentityAuditEvent);				
				}
			return errorObj;
		}
	}
	public LinkedHashMap<String, Object> searchByFilter(SailPointContext context, String searchFilter, HashMap<String, Object> optSearchParams) 
	{
		
		int startIndex=((Integer)optSearchParams.get(Constants.START_INDEX_VAR_NAME));
		String formattedSearchString = transformRespObj.transformIdentitySearchAttributes(context,searchFilter);
		
		LinkedHashMap<String,Object> respObj = new LinkedHashMap<String, Object>();
		QueryOptions queryOps = new QueryOptions();
		Filter compiledFilter =null;
		QueryOptions var=null;
		try{
		compiledFilter= Filter.compile(formattedSearchString);
		if(log.isDebugEnabled())
		{
			StringBuilder builder = new StringBuilder("compiled Filter");
			builder.append(compiledFilter);
			log.debug(builder);
		}
		System.out.println("compiled Filter"+compiledFilter);
		var = queryOps.add(compiledFilter);
		}
		catch(ParseException e)
		{
			Message msgErrorCodeKey = new Message(Message.Type.Error,"CODE");
			Message msgErrorCodeValue = new Message(Message.Type.Error,"BAD_REQUEST_CODE");
			
			Message msgErrorDescriptionKey = new Message(Message.Type.Error,"ERROR_DESCRIPTION");
			Message msgErrorDescriptionValue = new Message(Message.Type.Error,"INVALID_SEARCH_PARAMS");
			LinkedHashMap<String, Object> errorObj = new LinkedHashMap<String, Object>();
			LinkedHashMap<String, Object> status = new LinkedHashMap<String, Object>();
			status.put(msgErrorCodeKey.getMessage(), msgErrorCodeValue.getMessage());
			status.put(msgErrorDescriptionKey.getMessage(),msgErrorDescriptionValue.getMessage());
			errorObj.put("status", status);	
			
			return errorObj;
		}
		Iterator<Object[]> results =null;
		ArrayList searchResults = new ArrayList<Identity>();
		ArrayList pagedResults = new ArrayList<Identity>();
		try{
		 results = context.search(Identity.class, var,Arrays.asList(new String[]{"name","id"}));
		 
	
		
		while(results.hasNext())
		{
			System.out.println("Adding results");
			searchResults.add(results.next());
			
		}
		}
		catch(GeneralException e)
		{
			if(e.getClass().getName().contains("sailpoint.tools.GeneralException"))
			{
				Message msgErrorCodeKey = new Message(Message.Type.Error,"CODE");
				Message msgErrorCodeValue = new Message(Message.Type.Error,"BAD_REQUEST_CODE");
				
				Message msgErrorDescriptionKey = new Message(Message.Type.Error,"ERROR_DESCRIPTION");
				Message msgErrorDescriptionValue = new Message(Message.Type.Error,"INVALID_SEARCH_PARAMS");
				LinkedHashMap<String, Object> errorObj = new LinkedHashMap<String, Object>();
				LinkedHashMap<String, Object> status = new LinkedHashMap<String, Object>();
				status.put(msgErrorCodeKey.getMessage(), msgErrorCodeValue.getMessage());
				status.put(msgErrorDescriptionKey.getMessage(),msgErrorDescriptionValue.getMessage());
				errorObj.put("status", status);	
				
				return errorObj;
			}
			else
			{  LinkedHashMap<String, Object> errorObj = new LinkedHashMap<String, Object>();
			LinkedHashMap<String, Object> status = new LinkedHashMap<String, Object>();
			Message auditMessage = new Message(Message.Type.Error,"USER_CREATION_FAILURE");
			Message msgErrorCodeKey = new Message(Message.Type.Error,"CODE");
			Message msgErrorCodeValue = new Message(Message.Type.Error,"INTERNAL_SERVER_ERROR");
			
			Message msgErrorDescriptionKey = new Message(Message.Type.Error,"ERROR_DESCRIPTION");
			Message msgErrorDescriptionValue = new Message(Message.Type.Error,"INTERNAL_SERVER_ERROR_DESCRIPTION",e.getMessage());
			status.put(msgErrorCodeKey.getMessage(), msgErrorCodeValue.getMessage());
			status.put(msgErrorDescriptionKey.getMessage(),msgErrorDescriptionValue.getMessage());
			errorObj.put("status", status);
			return errorObj;
			}
		}
			catch(NullPointerException e)
			{
				Message msgErrorCodeKey = new Message(Message.Type.Error,"CODE");
				Message msgErrorCodeValue = new Message(Message.Type.Error,"BAD_REQUEST_CODE");
				
				Message msgErrorDescriptionKey = new Message(Message.Type.Error,"ERROR_DESCRIPTION");
				Message msgErrorDescriptionValue = new Message(Message.Type.Error,"INVALID_SEARCH_PARAMS");
				LinkedHashMap<String, Object> errorObj = new LinkedHashMap<String, Object>();
				LinkedHashMap<String, Object> status = new LinkedHashMap<String, Object>();
				status.put(msgErrorCodeKey.getMessage(), msgErrorCodeValue.getMessage());
				status.put(msgErrorDescriptionKey.getMessage(),msgErrorDescriptionValue.getMessage());
				errorObj.put("status", status);	
				
				return errorObj;
			}
		catch(ClassCastException e)
		{
			Message msgErrorCodeKey = new Message(Message.Type.Error,"CODE");
			Message msgErrorCodeValue = new Message(Message.Type.Error,"BAD_REQUEST_CODE");
			
			Message msgErrorDescriptionKey = new Message(Message.Type.Error,"ERROR_DESCRIPTION");
			Message msgErrorDescriptionValue = new Message(Message.Type.Error,"INVALID_SEARCH_PARAMS");
			LinkedHashMap<String, Object> errorObj = new LinkedHashMap<String, Object>();
			LinkedHashMap<String, Object> status = new LinkedHashMap<String, Object>();
			status.put(msgErrorCodeKey.getMessage(), msgErrorCodeValue.getMessage());
			status.put(msgErrorDescriptionKey.getMessage(),msgErrorDescriptionValue.getMessage());
			errorObj.put("status", status);	
			
			return errorObj;
		}
		
		
		if(searchResults.size()>0)
		{
			
			if(startIndex<searchResults.size()&&(startIndex>=0))
			{
			
			
					pagedResults=doPagination(searchResults, startIndex, ((Integer)optSearchParams.get(Constants.PAGE_SIZE_VAR_NAME)));
					
					respObj = transformRespObj.transformSCIMSearchList(pagedResults, searchResults.size(),startIndex,pagedResults.size());
					return respObj;
			}
			else
			{
				startIndex=0;
				pagedResults=doPagination(searchResults, startIndex, ((Integer)optSearchParams.get(Constants.PAGE_SIZE_VAR_NAME)));
				
				respObj = transformRespObj.transformSCIMSearchList(pagedResults, searchResults.size(),startIndex,pagedResults.size());
				return respObj;
				
			}
		}
		else
		{
			Message msgErrorCodeKey = new Message(Message.Type.Error,"CODE");
			Message msgErrorCodeValue = new Message(Message.Type.Error,"USER_NOT_FOUND_CODE");
			
			Message msgErrorDescriptionKey = new Message(Message.Type.Error,"ERROR_DESCRIPTION");
			Message msgErrorDescriptionValue = new Message(Message.Type.Error,"RESULTS_NOT_FOUND");
			LinkedHashMap<String, Object> errorObj = new LinkedHashMap<String, Object>();
			LinkedHashMap<String, Object> status = new LinkedHashMap<String, Object>();
			status.put(msgErrorCodeKey.getMessage(), msgErrorCodeValue.getMessage());
			status.put(msgErrorDescriptionKey.getMessage(), msgErrorDescriptionValue.getMessage());
			errorObj.put("status", status);	
			return errorObj;
			
		}
				
			
		}
		
		
		public ArrayList doPagination(ArrayList<Identity>searchResults,int startIndex,int limit)
		{
			ArrayList<Identity> pagedList = new ArrayList<Identity>();
			
			log.info("Creating the paginated list in the pagination function");
			
			if(startIndex<searchResults.size()&&(startIndex>=0)){
			List<Identity> initialSubList = searchResults.subList(startIndex, (searchResults.size()));
			
			if( log.isDebugEnabled() ) {
				StringBuilder builder = new StringBuilder().append( "SubList created from startIndex to size of size of search results"+initialSubList.size());
				
				log.debug( builder.toString() );
			}
			
				if((initialSubList.size()>=(limit+startIndex))&&(limit>0))
				{
					
			pagedList.addAll(searchResults.subList(startIndex, limit+startIndex));
			if( log.isDebugEnabled() ) {
				StringBuilder builder = new StringBuilder().append( "Size of the paged list created"+pagedList.size());
				
				log.debug( builder.toString() );
			}
			log.info("Paged List created.");
			return pagedList;
				}
				  
				else
				{
				
					pagedList.addAll(initialSubList);
					
					return pagedList;
					
				}
			}
			else
			{
				log.info("Paged list contains all the search results.");
				pagedList.addAll(searchResults.subList(0, (searchResults.size())));
				return pagedList;
			}
			}
		public String generateInitialShortName(SailPointContext context,String firstName, String lastName) throws GeneralException 
		{
			
			String firstNameSubString = firstName.substring(0,1);
			String lastNameSubString = "";
			
			if(lastName.length()>7)
			{
				
				lastNameSubString = lastName.substring(0,7);
				if( log.isDebugEnabled() ) {
					StringBuilder builder = new StringBuilder().append( "The lastname substring of shortName"+lastNameSubString);
					
					log.debug( builder.toString() );
				}
				
			}
			else
			{
				
				lastNameSubString = lastName.substring(0,lastName.length());
				if( log.isDebugEnabled() ) {
					StringBuilder builder = new StringBuilder().append( "The lastname substring of shortName"+lastNameSubString);
					
					log.debug( builder.toString() );
				}
			}

			String initialUserName = firstNameSubString.concat(lastNameSubString);
			if( log.isDebugEnabled() ) {
				StringBuilder builder = new StringBuilder().append( "the initial User name generated is"+initialUserName);
				builder.append( "The initialUserName ->"+initialUserName);
				log.debug( builder.toString() );
			}
			
			
			
			log.info("Check the history table for generated username.");
			String finalUserName=checkCurrentShortNames(context, initialUserName);
			if( log.isDebugEnabled() ) {
				StringBuilder builder = new StringBuilder().append( "the ultimate username generated"+finalUserName);
				builder.append( "The initialUserName ->"+initialUserName);
				log.debug( builder.toString() );
			}
			return finalUserName;
					
}
		/*public String checkHistoryShortNames(SailPointContext context, String initialUserName) 
		{
			
			String userNameAfterHistoryCheck="";
			try{
			
			String shortNameNumeric="";
			
			StringBuilder finalUserName = new StringBuilder(String.valueOf(initialUserName));
			JDBCConnector lookupDatabase = new JDBCConnector();
			
			
			int userNameIndex =0;
			if( log.isDebugEnabled() ) {
				StringBuilder builder = new StringBuilder().append( "the username being looked up in history table"+initialUserName);
				
				log.debug( builder.toString() );
			}
			
			ArrayList historyLookup=lookupDatabase.getResults(context,"select Max(used_shortNames) from identityiq.username_history where used_shortNames like ?",finalUserName.toString());
			if( log.isDebugEnabled() ) {
				StringBuilder builder = new StringBuilder().append( "the size after history table lookup"+historyLookup.size());
				
				log.debug( builder.toString() );
			}
			
			
			if(historyLookup.size()>0)
			{
				log.info("The username exists in history.");
			
				if( log.isDebugEnabled() ) {
					StringBuilder builder = new StringBuilder().append( "the size of dblookup list"+historyLookup.get(0));
					//builder.append(" Size of results after lookup from IIQ"+results.size());
					log.debug( builder.toString() );
				}
				shortNameNumeric=historyLookup.get(0).toString().replaceAll("\\D+","");
				if( log.isDebugEnabled() ) {
					StringBuilder builder = new StringBuilder().append( "Numeric portion of String"+shortNameNumeric);
					
					log.debug( builder.toString() );
				}
				
				if(shortNameNumeric.length()==0)
				{
					log.info("the username is unique.");
					if( log.isDebugEnabled() ) {
						StringBuilder builder = new StringBuilder().append( "historyUsername with no integer part"+shortNameNumeric);
						
						log.debug( builder.toString() );
					}
					
					userNameIndex=1;
					if( log.isDebugEnabled() ) {
						StringBuilder builder = new StringBuilder().append( "username Index with no integer part"+userNameIndex);
						
						log.debug( builder.toString() );
					}
					
				}
				else{
					if( log.isDebugEnabled() ) {
						StringBuilder builder = new StringBuilder().append( "Index of searched username in history"+shortNameNumeric);
						
						log.debug( builder.toString() );
					}
					
				userNameIndex=Integer.parseInt(shortNameNumeric)+1;
				if( log.isDebugEnabled() ) {
					StringBuilder builder = new StringBuilder().append( "usernameIndex for historyUsername with integer part"+userNameIndex);
					
					log.debug( builder.toString() );
				}
				
				}
				userNameAfterHistoryCheck=initialUserName+userNameIndex;
				
				log.info("username generated after verifying the history table");
				if( log.isDebugEnabled() ) {
					StringBuilder builder = new StringBuilder().append( "username generated after verifying the history table -->"+userNameAfterHistoryCheck);
					
					log.debug( builder.toString() );
				}
				log.info("about to verify the IIQ tables .......");
				
			if( log.isDebugEnabled() ) {
				StringBuilder builder = new StringBuilder().append( "Final username after all the checks"+finalUserName.toString());
				
				log.debug( builder.toString() );
			}
			
				
				
			}
			else
			{
				log.info("The generated initial username is unique");
				userNameAfterHistoryCheck=initialUserName;
				if( log.isDebugEnabled() ) {
					StringBuilder builder = new StringBuilder().append( "shortname being passsed for length verification"+userNameAfterHistoryCheck);
					
					log.debug( builder.toString() );
				}	
				
			}
			log.info("performing length validations.");
			String finalShortNameAfterAllChecks=checkCurrentShortNames(context, userNameAfterHistoryCheck);
			if( log.isDebugEnabled() ) {
				StringBuilder builder = new StringBuilder().append( "Username after all checks"+finalShortNameAfterAllChecks);
				
				log.debug( builder.toString() );
			}	
			
			return finalShortNameAfterAllChecks ;
			}
			catch(GeneralException ge)
			{
				Message msg = new Message(Message.Type.Error,"USER_NAME_GENERATION_ERROR", ge.getClass().getName());
				log.error(msg);
				log.debug(msg.getKey(),ge);
				return msg.toString();
						
			}
			
		

		}*/
		public String checkCurrentShortNames(SailPointContext context,String historyVerifiedShortname) throws GeneralException
		{
			System.out.println("in the check current names function");
			log.info("Verifying if the username exists in the Sailpoint DB");
			if( log.isDebugEnabled() ) {
				StringBuilder builder = new StringBuilder().append( "history verified shortname passed to the function"+historyVerifiedShortname);
				
				log.debug( builder.toString() );
			}	
			
				String shortNameCurrentCheck="";
				int userNameIndex=0;
				QueryOptions queryOpts = new QueryOptions();
				Filter checkNameFilter = Filter.like("name", historyVerifiedShortname);
				
				QueryOptions var = queryOpts.add(checkNameFilter);
				List<Identity> results = context.getObjects(Identity.class, var);
				if( log.isDebugEnabled() ) {
					StringBuilder builder = new StringBuilder().append( "/matching results found in IIQ "+results.size());
					
					log.debug( builder.toString() );
				}	
				
				if(results.size()==0)
				{
					
					log.info("The generated username is unique in IIQ");
					
					if( log.isDebugEnabled() ) {
						StringBuilder builder = new StringBuilder().append( "The username being passed from IIQ verification to length check fxn "+historyVerifiedShortname);
						
						log.debug( builder.toString() );
					}
					
					shortNameCurrentCheck= historyVerifiedShortname;
				}
				else if(results.size()==1)
				{
					
					log.info("The generated username is not unique in IIQ");
					
					if( log.isDebugEnabled() ) {
						StringBuilder builder = new StringBuilder().append( "The username being passed from IIQ verification to length check fxn "+historyVerifiedShortname);
						
						log.debug( builder.toString() );
					}
					userNameIndex=1;
					shortNameCurrentCheck= historyVerifiedShortname+userNameIndex;
				}
				
				else
				{
					
					//added the pattern matching code.
					
					String pattern = historyVerifiedShortname+"(\\d+)";
					
					ArrayList<String> matches = new ArrayList<String>();
				      Pattern p = Pattern.compile(pattern);
				      for (Identity resultsIterator:results) {
				    	  String fetchedName = resultsIterator.getName();
				    	 
				    	    if (p.matcher(fetchedName).matches()) {
				    	    	fetchedName=fetchedName.replaceAll("\\D+","");
				    	    	 
				    	      matches.add(fetchedName);
				    	      
				    	    }
				      }
					
				      Integer maxIndexforUsernames = Integer.parseInt(Collections.max(matches));	
					
					log.info("The username is not unique");
					userNameIndex=maxIndexforUsernames+1;
					shortNameCurrentCheck=historyVerifiedShortname+userNameIndex;
					if( log.isDebugEnabled() ) {
						StringBuilder builder = new StringBuilder().append( "the final username passed for length verification"+shortNameCurrentCheck);
						
						log.debug( builder.toString() );
					}
				
				}
				
				String shortNameAfterAllChecks = verifyShortNameLength(context,shortNameCurrentCheck);
				
				return shortNameAfterAllChecks;
		}
		public String verifyShortNameLength(SailPointContext context,String generatedShortName) throws GeneralException
		{
			String substringedShortName="";
			String lengthVerifiedShortName="";
			int shortNameLength = Constants.SHORT_NAME_LENGTH;
			int generatedShortNameLength= generatedShortName.length();
			String alphabeticSection= generatedShortName.replaceAll("[^A-Za-z]+", "");
			
			if(shortNameLength==generatedShortNameLength)
			{
				log.info("The genrated shortname is of valid length");
				if( log.isDebugEnabled() ) {
					StringBuilder builder = new StringBuilder().append( "the final username returned for length verification function"+generatedShortName);
					
					log.debug( builder.toString() );
				}
				
				return generatedShortName;
			}
			if(generatedShortNameLength>shortNameLength)
			{
				log.info("The length of genrated username is greater than max length");
				substringedShortName=alphabeticSection.substring(0, alphabeticSection.length()-1);
				if( log.isDebugEnabled() ) {
					StringBuilder builder = new StringBuilder().append( "The name after substring and passed for history check"+substringedShortName);
					
					log.debug( builder.toString() );
				}
				log.info("Re executing the history and current verification for substringed shortname");
				lengthVerifiedShortName=checkCurrentShortNames(context, substringedShortName);
				if( log.isDebugEnabled() ) {
					StringBuilder builder = new StringBuilder().append( "The final generated shortname passed to the calling function from length verification function"+substringedShortName);
					
					log.debug( builder.toString() );
				}
			}
			if(generatedShortNameLength<shortNameLength)
			{
				log.info("length is accurate");
				if( log.isDebugEnabled() ) {
					StringBuilder builder = new StringBuilder().append( "The length of username is less"+generatedShortName);
					
					log.debug( builder.toString() );
				}
				return generatedShortName;
			}
			return lengthVerifiedShortName;
		}
	///TESTING THE CALL TO EVENT	
		
			public List<IdentityTrigger> getTriggers(SailPointContext context,IdentityTrigger.Type type) throws GeneralException {
				QueryOptions qo = new QueryOptions();
				qo.addFilter( Filter.eq( "type", IdentityTrigger.Type.Create) );
				 
				List<IdentityTrigger> triggers = context.getObjects( IdentityTrigger.class, qo );
				 
				return( triggers );
				}
			/*public void createEvent(Identity neu,SailPointContext context) throws Exception {
				 
				List<IdentityTrigger> triggers = getTriggers(IdentityTrigger.Type.Create );
				handle( triggers, neu,context );
				}*/
				 
				private void handle( List<IdentityTrigger> triggers,Identity neu,SailPointContext context) throws Exception {
				if( triggers != null ) {
				for( IdentityTrigger trigger : triggers ) {
				IdentityChangeEvent event = trigger.createEvent(null, neu);
				execute( event,context );
				}
				}
				 
				}
				
				private void execute( IdentityChangeEvent event,SailPointContext context) throws Exception {
					IdentityTrigger trigger = event.getTrigger();
					 
					String handlerName = trigger.getHandler();

					Class clazz = Class.forName( handlerName );
					 
					IdentityTriggerHandler handler = (IdentityTriggerHandler)clazz.newInstance();
					handler.setContext( context );
					handler.setExecuteInBackground( true );
					handler.handleEvent( event, trigger );
					
					}
				/*public void deleteEvent( String name,SailPointContext context,Identity neu ) throws Exception {
					List<IdentityTrigger> triggers = getTriggers(IdentityTrigger.Type.Create );
					handle( triggers,neu,context);
					 
					}
				public boolean testTrigger( Identity prev, Identity current, IdentityTrigger trigger ) {
					return( false );
					}
					 
					public void modifyEvent(Identity prev, Identity current,SailPointContext context) throws Exception {
					List<IdentityTrigger> potentials = getTriggers(IdentityTrigger.Type.AttributeChange );
					List<IdentityTrigger> triggers = new ArrayList<IdentityTrigger>();
					 
					if( potentials != null ) {
					for( IdentityTrigger potential : potentials ) {
					// Test if potential trigger applies
					boolean applies = testTrigger( prev, current, potential );
					if( applies ) triggers.add( potential );
					}
					}
					 
					handle( triggers,current,context);
					}*/
	
		
}


