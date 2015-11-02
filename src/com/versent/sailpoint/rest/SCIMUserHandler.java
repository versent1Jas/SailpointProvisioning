package com.versent.sailpoint.rest;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.UriInfo;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.log4j.net.SyslogAppender;
import org.json.JSONException;

import sailpoint.object.Identity;
import sailpoint.rest.BaseResource;
import sailpoint.rest.jaxrs.PATCH;
import sailpoint.tools.GeneralException;

import com.versent.sailpoint.constants.Constants;
import com.versent.sailpoint.constants.Messages;
import com.versent.sailpoint.handlers.IdentityServiceHandler;
import com.versent.sailpoint.transformers.SCIMUserTransformer;
import com.versent.sailpoint.utils.Configurator;
import com.versent.sailpoint.validators.Validations;

@Path("/Users")


public class SCIMUserHandler extends BaseResource {
	IdentityServiceHandler svcHanObj = new IdentityServiceHandler();
	Log logObj = LogFactory.getLog(SCIMUserHandler.class);
	LinkedHashMap<String, Object> respObj = new LinkedHashMap<String, Object>();
		
	@Context 
	private UriInfo uriInfo; 
		@Path("/Ping")
		
		@GET
		public String getUriInfo()
		{
			 
			return uriInfo.getBaseUri().toString();
			
		}
	
	
	@Context 
	private UriInfo urlInfo; 
	@POST 
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	
	public LinkedHashMap<String, Object> create(Map<String,Object> reqObj) throws Exception{
		Validations reqValidatorObj = new Validations();
		LinkedHashMap<String, Object> validationResult = reqValidatorObj.checkMandatoryAttributes(reqObj);
		logObj.info("Validating the request Object");	
	if((validationResult.size()==0))
			{
		logObj.info("Validation of request object successful");
		SCIMUserTransformer userTransformer = new SCIMUserTransformer();
		logObj.info("Transforming the SCIM attributes to MGL");
		Identity identity = (Identity)userTransformer.transformIdentity(reqObj,getContext());
		
		
		LinkedHashMap<String, Object> respObj = svcHanObj.create(getContext(), identity,getUriInfo());
		
		
		
		return respObj;		
			}
	else
	{
		logObj.error(validationResult);
		
		
		return validationResult;		
	}
				
	}
	
	
	@PUT
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	@Path("{id}")
	public LinkedHashMap<String, Object> modify(@PathParam("id") String id,Map<String,Object> modifyReqObj)throws  GeneralException, JSONException{
		Validations valObj = new Validations();
		
		if(!(id==null))
		{
			LinkedHashMap<String,Object> valOutput = valObj.validateModifyAttributes(modifyReqObj);
			if(valOutput.size()==0)
			{
		LinkedHashMap<String, Object> modifiedIdentity=svcHanObj.modify(getContext(),modifyReqObj,id,getUriInfo());
		
		return modifiedIdentity;
		}
			else
			{
				return valOutput;
			}
		}
		else
		{ 
			LinkedHashMap<String,Object> errorObj = new LinkedHashMap<String,Object>();
			errorObj.put(Messages.CODE, 400);
			errorObj.put(Messages.ERROR_DESCRIPTION,Messages.BAD_REQUEST);
			return errorObj;
		}
			
	}
	
	@PATCH
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	@Path("{id}")
	public LinkedHashMap<String, Object> Patch(@PathParam("id") String id,Map<String,Object> patchReqObj) 
	{	
		
			respObj = svcHanObj.patch(getContext(), patchReqObj, id,getUriInfo());
		
		return respObj;
	}
	
	@GET
	@Produces("application/json")
	@Path("{id}")
	public LinkedHashMap<String, Object> retrieve(@PathParam("id") String id) throws GeneralException
	{
		
		LinkedHashMap<String, Object> searchResults = svcHanObj.SCIMretrieve(getContext(),id,getUriInfo());
		return searchResults;
	}

	@GET
	@Path("/search")
	
	public LinkedHashMap<String, Object> search(@QueryParam("filter")String filter, @QueryParam("startIndex")int startIndex,@QueryParam("itemsPerPage")int itemsPerPage,@QueryParam("attributes")String attributes) throws GeneralException
	{
		System.out.println("getting the custom object");
		
		LinkedHashMap<String, Object> respObj=new LinkedHashMap<String, Object>();
		if(filter==null)
		{
			System.out.println("in the null");
			System.out.println("startIndex"+startIndex);
			System.out.println("itemsPerPage"+itemsPerPage);
			respObj=svcHanObj.getIdentities(getContext(),startIndex,itemsPerPage);
			return respObj;
		}
		else{
		Validations valObj = new Validations();
		System.out.println("startIndex"+startIndex);
		System.out.println("itemsPerPage"+itemsPerPage);
		HashMap<String, Object>resultsAfterValidation = valObj.validateSearchParams(startIndex, itemsPerPage, attributes);
		respObj=svcHanObj.searchByFilter(getContext(), filter,resultsAfterValidation);	
		return respObj;
		}
	}
	
	@DELETE
	@Produces(MediaType.APPLICATION_JSON)
	@Path("{id}")
	public LinkedHashMap<String, Object> delete(@PathParam("id") String id) throws Exception{
		LinkedHashMap<String, Object> respObj = new LinkedHashMap<String, Object>();	
		if(id.length()>0){
	 respObj= svcHanObj.deleteIdentity(getContext(), id);
	return respObj;
		}
		else
		{
			respObj.put(Messages.CODE, 400);
			respObj.put(Messages.ERROR_DESCRIPTION,Messages.BAD_REQUEST);
			return respObj;
		}
	}
	
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/test")
	
		public LinkedHashMap<String, Object> getAll() throws GeneralException{
		LinkedHashMap<String, Object> list = svcHanObj.SCIMretrieve(getContext(), "JaspreetR1",getUriInfo());
		return list;
		
		}

	
}

