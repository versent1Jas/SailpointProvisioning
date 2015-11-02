package com.versent.sailpoint.transformers;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.log4j.net.SyslogAppender;

import org.json.JSONException;

import sailpoint.api.SailPointContext;
import sailpoint.object.Attributes;
import sailpoint.object.Configuration;
import sailpoint.object.Custom;
import sailpoint.object.Identity;
import sailpoint.object.SailPointObject;
import sailpoint.rest.BaseResource;
import sailpoint.tools.Message;



import com.versent.sailpoint.constants.SCIM;
import com.versent.sailpoint.utils.Configurator;

import openconnector.SystemOutLog;


public class SCIMUserTransformer extends BaseResource implements SCIMTransformer {
	
	Log logObj = LogFactory.getLog(SCIMUserTransformer.class);
	
	
	public Identity transformIdentity(Map<String, Object> jsonObject,SailPointContext context)
			throws JSONException {
		
		
		Configuration customObjAttributes= Configurator.getInstance().getCustomAttributes(context, "SCIM");
		Map attrsSCIM= (Map)customObjAttributes.get("permittedAttributes");
		Map complexAttrsSCIM = (Map) attrsSCIM.get("complexAttributes");
		Map complexMultivaluedAttrsSCIM = (Map) attrsSCIM.get("complexMultivaluedAttributes");
		//Map nameMandatory = (Map) map.get("name.mandatory");
		//Map addressSCIM = (Map) map.get("address");
		//Map costCentersSCIM = (Map) map.get("costCenters");
		Map singleValuedAttributesSCIM = (Map) attrsSCIM.get("singleValuedAttributes");
		//LinkedHashMap nameSCIM = new LinkedHashMap();
		//nameSCIM.putAll(namePermitted);
		//nameSCIM.putAll(nameMandatory);
		
		Identity idObj = new Identity();
		
		//Configurator configObj = Configurator.getInstance(getContext(), "SCIM");
		
	
		Set<String> complexAttrsKeys = complexAttrsSCIM.keySet();
		for (String complexAttrKey : complexAttrsKeys) {
			if (jsonObject.containsKey(complexAttrKey)) {
				Map<String, Object> reqComplexAttr = (Map<String, Object>) jsonObject
						.get(complexAttrKey);
				Map nestedComplexAttrs= (Map)complexAttrsSCIM.get(complexAttrKey);
				Set<String> nestedComplexAttrsKeys = nestedComplexAttrs.keySet();
				for (String nestedComplexAttrKey : nestedComplexAttrsKeys)
				{
				idObj.setAttribute(nestedComplexAttrs.get(nestedComplexAttrKey).toString(),
						reqComplexAttr.get(nestedComplexAttrKey));
			}
			}
		}
		
		Set<String> complexMultivaluedAttrsKeys = complexMultivaluedAttrsSCIM.keySet();
		for (String complexMultiValuedAttrKey : complexMultivaluedAttrsKeys) {
			if (jsonObject.containsKey(complexMultiValuedAttrKey)) {
						idObj.setAttribute(complexMultiValuedAttrKey,
								jsonObject.get(complexMultiValuedAttrKey));
					
			}
		}
		
		
		
/*
		if (!(jsonObject.get(SCIM.EMAILS) == null)) {

			Map<String, Object> reqEmails = (Map<String, Object>) jsonObject
					.get(SCIM.EMAILS);
			if (!(reqEmails.isEmpty())) {
				idObj.setEmail(reqEmails.get(SCIM.VALUE).toString());

			}
		}
		if (!(jsonObject.get(SCIM.ADDRESS) == null)) {

			Map<String, Object> empAddress = (Map<String, Object>) jsonObject
					.get(SCIM.ADDRESS);
			Set<String> addressKeys = addressSCIM.keySet();
			for (String addressKey : addressKeys) {
				if (empAddress.containsKey(addressKey)) {
					idObj.setAttribute(Constants.ADDRESS.get(addressKey)
							.toString(), empAddress.get(addressKey));
				}
			}
		}
		if (!(jsonObject.get(SCIM.COST_CENTER) == null))
		{
			Map<String, Object> empCostCenter = (Map<String, Object>) jsonObject
					.get(SCIM.COST_CENTER);
	
		Set<String> costCenterKeys = costCentersSCIM.keySet();
		for (String costCenterKey : costCenterKeys) {
			if (empCostCenter.containsKey(costCenterKey)) {
				idObj.setAttribute(costCentersSCIM.get(costCenterKey)
						.toString(), empCostCenter.get(costCenterKey));
			}
		}
		}
		//Following code is commented because groups are single valued now
		/*if (!(jsonObject.get(SCIM.GROUPS) == null))
		{
			Map<String, Object> empGroups = (Map<String, Object>) jsonObject
					.get(SCIM.GROUPS);
	
		Set<String> groupKeys = Constants.GROUPS.keySet();
		for (String groupKey : groupKeys) {
			if (empGroups.containsKey(groupKey)) {
				idObj.setAttribute(Constants.GROUPS.get(groupKey)
						.toString(), empGroups.get(groupKey));
			}
		}
		}*/

		
		// The following code adds single valued attributes to idObj based on
		// the user type passed in the request.
		Set<String> singleValuedKeys = singleValuedAttributesSCIM.keySet();
		for (String singleValuedKey : singleValuedKeys) {
			if (jsonObject.containsKey(singleValuedKey)) {
				idObj.setAttribute(singleValuedAttributesSCIM.get(singleValuedKey)
						.toString(), jsonObject.get(singleValuedKey));
			}
		}
		
		
		return idObj;
	}

	public LinkedHashMap<String, Object> transformSCIM(Identity idObj,SailPointContext context,
			String uri)  {
		
		Configuration customObjAttributes= Configurator.getInstance().getCustomAttributes(context, "SCIM");
		Map map= (Map)customObjAttributes.get("permittedAttributes");
		Map complexAttrsSCIM = (Map) map.get("complexAttributes");
		Map complexMultivaluedAttrsSCIM = (Map) map.get("complexMultivaluedAttributes");
		//Map nameMandatory = (Map) map.get("name.mandatory");
		//Map addressSCIM = (Map) map.get("address");
		//Map costCentersSCIM = (Map) map.get("costCenters");
		List<String> metaSCIM = (List<String>) map.get("meta");
		Map singleValuedAttributesSCIM = (Map) map.get("singleValuedAttributes");
		//LinkedHashMap nameSCIM = new LinkedHashMap();
		//nameSCIM.putAll(namePermitted);
		//nameSCIM.putAll(nameMandatory);
		

		LinkedHashMap<String, Object> respObj = new LinkedHashMap<String, Object>();
		LinkedHashMap<String, Object> meta = new LinkedHashMap<String, Object>();
		
		
		meta.put(SCIM.RESOURCE_TYPE, "user");
		meta.put(SCIM.CREATED, idObj.getCreated());
		meta.put(SCIM.LAST_MODIFIED, idObj.getModified());
		meta.put("location", uri.concat(idObj.getName()));
		/*LinkedHashMap<String, Object> name = new LinkedHashMap<String, Object>();
		Set<String> nameKeys = nameSCIM.keySet();
		for (String nameKey : nameKeys) {
			name.put(nameKey, idObj.getAttribute(nameSCIM.get(nameKey).toString()));
		}
		
		LinkedHashMap<String, Object> addresses = new LinkedHashMap<String, Object>();
		
		Set<String> addressKeys = addressSCIM.keySet();
		for (String addressKey : addressKeys) {
			addresses.put(addressKey, idObj.getAttribute(addressSCIM.get(addressKey).toString()));
		}
		
		LinkedHashMap<String, Object> emails = new LinkedHashMap<String, Object>();
		emails.put(SCIM.VALUE, idObj.getEmail());
		LinkedHashMap<String, Object> CostCenters = new LinkedHashMap<String, Object>();
		Set<String> costCenterskeys = costCentersSCIM.keySet();
		for (String costCenterKey : costCenterskeys) {
			CostCenters.put(costCenterKey, idObj.getAttribute(costCentersSCIM.get(costCenterKey).toString()));
		}
		
		
		LinkedHashMap<String, Object> Groups = new LinkedHashMap<String, Object>();
		Groups.put(SCIM.GROUP_CODE, idObj.getAttribute(Macquarie.MGL_EMP_GROUP_CODE));
		Groups.put(SCIM.GROUP_DESC, idObj.getAttribute(Macquarie.MGL_EMP_GROUP_DESC));
		
		
		//respObj.put(SCIM.EXTERNAL_ID, idObj.getName());
		respObj.put(SCIM.NAME, name);
		respObj.put(SCIM.EMAILS, emails);
		respObj.put(SCIM.ADDRESS, addresses);
		respObj.put(SCIM.USER_NAME, idObj.getName());
		
		//respObj.put(SCIM.USER_TYPE, idObj.getAttribute(Macquarie.MGL_IDENTITY_TYPE));
		//respObj.put(SCIM.EMPLOYEE_NUMBER, idObj.getAttribute(Macquarie.MGL_EMP_NUMBER));
		//respObj.put(SCIM.JOB_TITLE, idObj.getAttribute(Macquarie.MGL_JOB_BUS_TITLE));
		//respObj.put(SCIM.EMPLOYMENT_TYPE, idObj.getAttribute(Macquarie.MGL_EMP_TYPE));
		//respObj.put(SCIM.DEPARTMENT, idObj.getAttribute(Macquarie.MGL_DEPARTMENT));
		//respObj.put(SCIM.DIVISION, idObj.getAttribute(Macquarie.MGL_DIVISION));
		respObj.put(SCIM.COST_CENTER, CostCenters);
		//respObj.put(SCIM.MANAGER_ID, idObj.getAttribute(Macquarie.EMP_MANAGER));
		//respObj.put(SCIM.EMP_START_DATE, idObj.getAttribute(Macquarie.MGL_EMP_START_DATE));
		//respObj.put(SCIM.EMP_END_DATE, idObj.getAttribute(Macquarie.MGL_EMP_END_DATE));
		respObj.put(SCIM.GROUPS, Groups);*/
		
		respObj.put(SCIM.SCHEMAS, "urn:ietf:params:scim:schemas:core:1.1:mgl:user");
		respObj.put("id", idObj.getId());
		//respObj.put("externalId",idObj.getName());
		Set<String> complexAttrsKeys = complexAttrsSCIM.keySet();
		for (String complexAttrKey : complexAttrsKeys) {
			LinkedHashMap nestedComplexAttrResponse = new LinkedHashMap();
				Map nestedComplexAttrs= (Map)complexAttrsSCIM.get(complexAttrKey);
				Set<String> nestedComplexAttrsKeys = nestedComplexAttrs.keySet();
				
				for (String nestedComplexAttrKey : nestedComplexAttrsKeys)
				{
					nestedComplexAttrResponse.put(nestedComplexAttrKey, idObj.getAttribute(nestedComplexAttrs.get(nestedComplexAttrKey).toString()));
					
				}
			
				respObj.put(complexAttrKey, nestedComplexAttrResponse);
		}
		logObj.info("Location for new user is"+respObj.get(meta.get("location")));
		Set<String> singleValuesKeys = singleValuedAttributesSCIM.keySet();
		for (String singleValuesKey : singleValuesKeys) {
			respObj.put(singleValuesKey, idObj.getAttribute(singleValuedAttributesSCIM.get(singleValuesKey).toString()));
		}
		Set<String> complexMultivaluedKeys = complexMultivaluedAttrsSCIM.keySet();
		for (String complexMultivaluedKey : complexMultivaluedKeys) {
			
			respObj.put(complexMultivaluedKey, idObj.getAttribute(complexMultivaluedKey.toString()));
		}
		
		respObj.put(SCIM.META, meta);
		
		return respObj;
	}

	public Attributes<String, Object> transformModifyMap(
			Map<String, Object> reqObj,SailPointContext context) throws JSONException {

		Attributes<String, Object> modifyIDObj = new Attributes<String, Object>();
	Identity modifyIdentity=transformIdentity(reqObj,context);
	modifyIDObj.setMap(modifyIdentity.getAttributes());
		return modifyIDObj;

				}
		
	

	public String transformIdentitySearchAttributes(SailPointContext context,String searchFilter) {
		// Following transforms the Singular attributes
		String transformedIdentity = "";
		Configuration customObjAttributes= Configurator.getInstance().getCustomAttributes(context, "SCIM");
		Map map= (Map)customObjAttributes.get("permittedAttributes");
		Map searchFormatComplexAttributes = (Map) map.get("searchFormatComplexAttributes");
		Map singleValuedAttributes = (Map) map.get("singleValuedAttributes");
		
		if (searchFilter.length() > 0) {
			Set<String> singleValuedKeys = singleValuedAttributes.keySet();
			for (String singleValuedKey : singleValuedKeys) {
				if (searchFilter.contains(singleValuedKey)) {
					searchFilter = searchFilter.replaceAll("(?i)\\b" + singleValuedKey
							+ "\\b", singleValuedAttributes.get(singleValuedKey).toString());
				}
			}
			Set<String> searchFormatComplexAttributesKeys = searchFormatComplexAttributes.keySet();
			for (String searchFormatComplexAttributesKey : searchFormatComplexAttributesKeys) {
				if (searchFilter.contains(searchFormatComplexAttributesKey)) {
					searchFilter = searchFilter.replaceAll("(?i)\\b" + searchFormatComplexAttributesKey
							+ "\\b", searchFormatComplexAttributes.get(searchFormatComplexAttributesKey).toString());
				}
			}
		}
		transformedIdentity = formatSearchFilter(searchFilter);
		return transformedIdentity;
			/*searchFilter = searchFilter.replaceAll("(?i)\\b" + SCIM.EXTERNAL_ID
					+ "\\b", Macquarie.USER_NAME);
			searchFilter = searchFilter.replaceAll("(?i)\\b" + SCIM.EMAILS
					+ "." + SCIM.VALUE + "\\b", Macquarie.VALUE);
			searchFilter = searchFilter.replaceAll("(?i)\\b" + SCIM.NAME + "."
					+ SCIM.PREFIX + "\\b", Macquarie.PREFIX);
			searchFilter = searchFilter.replaceAll("(?i)\\b" + SCIM.NAME + "."
					+ SCIM.FIRST_NAME + "\\b", Macquarie.FIRST_NAME);
			searchFilter = searchFilter.replaceAll("(?i)\\b" + SCIM.NAME + "."
					+ SCIM.MIDDLE_NAME + "\\b", Macquarie.MIDDLE_NAME);
			searchFilter = searchFilter.replaceAll("(?i)\\b" + SCIM.NAME + "."
					+ SCIM.LAST_NAME + "\\b", Macquarie.LAST_NAME);
			searchFilter = searchFilter.replaceAll("(?i)\\b" + SCIM.USER_TYPE
					+ "\\b", Macquarie.MGL_IDENTITY_TYPE);
			searchFilter = searchFilter.replaceAll("(?i)\\b" + SCIM.USER_STATUS
					+ "\\b", Macquarie.MGL_IDENTITY_STATUS);
			searchFilter = searchFilter.replaceAll("(?i)\\b"
					+ SCIM.EMPLOYMENT_TYPE + "\\b", Macquarie.MGL_EMP_TYPE);
			searchFilter = searchFilter.replaceAll("(?i)\\b"
					+ SCIM.EMPLOYEE_NUMBER + "\\b", Macquarie.MGL_EMP_NUMBER);
			searchFilter = searchFilter
					.replaceAll("(?i)\\b" + SCIM.EMP_START_DATE + "\\b",
							Macquarie.MGL_EMP_START_DATE);
			searchFilter = searchFilter.replaceAll("(?i)\\b"
					+ SCIM.EMP_END_DATE + "\\b", Macquarie.MGL_EMP_END_DATE);
			searchFilter = searchFilter.replaceAll("(?i)\\b" + SCIM.JOB_TITLE
					+ "\\b", Macquarie.MGL_JOB_BUS_TITLE);
			searchFilter = searchFilter.replaceAll("(?i)\\b" + SCIM.DIVISION
					+ "\\b", Macquarie.MGL_DIVISION);
			searchFilter = searchFilter.replaceAll("(?i)\\b" + SCIM.DEPARTMENT
					+ "\\b", Macquarie.MGL_DEPARTMENT);
			searchFilter = searchFilter.replaceAll("(?i)\\b" + SCIM.HR_STATUS
					+ "\\b", Macquarie.MGL_HR_STATUS);
			searchFilter = searchFilter.replaceAll("(?i)\\b" + SCIM.ADDRESS
					+ "." + SCIM.LOCALITY + "\\b", Macquarie.MGL_LOCALITY);
			searchFilter = searchFilter.replaceAll("(?i)\\b" + SCIM.ADDRESS
					+ "." + SCIM.COUNTRY + "\\b", Macquarie.MGL_COUNTRY);
			searchFilter = searchFilter.replaceAll("(?i)\\b" + SCIM.ADDRESS
					+ "." + SCIM.STATE + "\\b", Macquarie.MGL_STATE);
			searchFilter = searchFilter.replaceAll("(?i)\\b" + SCIM.GROUPS
					+ "." + SCIM.GROUP_DESC + "\\b",
					Macquarie.MGL_EMP_GROUP_DESC);
			searchFilter = searchFilter.replaceAll("(?i)\\b" + SCIM.GROUPS
					+ "." + SCIM.GROUP_CODE + "\\b",
					Macquarie.MGL_EMP_GROUP_CODE);
			searchFilter = searchFilter.replaceAll("(?i)\\b" + SCIM.COST_CENTER
					+ "." + SCIM.GL4_COST_CENTER + "\\b",
					Macquarie.MGL4_COST_CENTER);
			searchFilter = searchFilter.replaceAll("(?i)\\b" + SCIM.COST_CENTER
					+ "." + SCIM.GL3_COST_CENTER + "\\b",
					Macquarie.MGL3_COST_CENTER);
			searchFilter = searchFilter.replaceAll("(?i)\\b" + SCIM.META + "."
					+ SCIM.LAST_MODIFIED + "\\b", Macquarie.LAST_MODIFIED);
*/
		
	}

	public String formatSearchFilter(String searchFilter) {

		if (searchFilter.length() > 0) {
			searchFilter = searchFilter.replaceAll("(?i)\\beq\\b", "==");
			searchFilter = searchFilter.replaceAll("(?i)\\bne\\b", "!=");
			searchFilter = searchFilter.replaceAll("(?i)\\blt\\b", "<");
			searchFilter = searchFilter.replaceAll("(?i)\\bgt\\b", ">");
			searchFilter = searchFilter.replaceAll("(?i)\\ble\\b", "<=");
			searchFilter = searchFilter.replaceAll("(?i)\\bge\\b", ">=");
			searchFilter = searchFilter.replaceAll("(?i)\\bsw\\b",
					".startsWith");
			searchFilter = searchFilter.replaceAll("(?i)\\bew\\b", ".endsWith");
			searchFilter = searchFilter.replaceAll("(?i)\\bco\\b",
					".containsIgnoreCase");
			searchFilter = searchFilter
					.replaceAll("(?i)\\bpr\\b", ".notNull()");
			searchFilter = searchFilter.replaceAll("(?i)\\band\\b", "&&");
			searchFilter = searchFilter.replaceAll("(?i)\\bor\\b", "||");
		}
		System.out.println("the formatted string is" + searchFilter);
		return searchFilter;

	}

	public LinkedHashMap<String, Object> transformSCIMSearchList(
			ArrayList<Identity> arlIdObj, int totalResults,int startIndex,int resultsPerPage) {
		
		
		LinkedHashMap<String, Object> resources = new LinkedHashMap<String, Object>();
		
		
		resources.put(SCIM.SCHEMAS,
				"urn:ietf:params:scim:schemas:core:1.1:user");
		// Iterator<Identity> iterator = arlIdObj.iterator();
		resources.put("results", arlIdObj);
		resources.put("startIndex", startIndex);
		resources.put("resultsPerPage", resultsPerPage);
		resources.put("totalResults", totalResults);

		return resources;
	}

	public SailPointObject transform(Map<String, Object> jsonObject)
			throws JSONException {
		// TODO Auto-generated method stub
		return null;
	}

}
