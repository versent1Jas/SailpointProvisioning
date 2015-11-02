//THIS IS A BACKUP OF THE ORIGINAL CODE
/*package com.versent.sailpoint.transformers;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.log4j.net.SyslogAppender;
import org.json.JSONException;

import sailpoint.object.Attributes;
import sailpoint.object.Identity;
import sailpoint.object.SailPointObject;
import sailpoint.rest.BaseResource;

import com.versent.sailpoint.constants.Constants;
import com.versent.sailpoint.constants.SCIM;
import com.versent.sailpoint.utils.Configurator;
import com.versent.sailpoint.constants.Macquarie;

/*public class SCIMUserTransformer2 implements SCIMTransformer {
	
	Log logObj = LogFactory.getLog(SyslogAppender.class);
	public Identity transformIdentity(Map<String, Object> jsonObject)
			throws JSONException {

		Identity idObj = new Identity();
		System.out.println("before the config object");
		
		
		if (!(jsonObject.get(SCIM.NAME) == null)) 
		{
		Map<String, Object> reqName = (Map<String, Object>) jsonObject
				.get(SCIM.NAME);
		Set<String> nameKeys = Constants.NAME.keySet();
		for (String nameKey : nameKeys) {
			if (reqName.containsKey(nameKey)) {
				idObj.setAttribute(Constants.NAME.get(nameKey).toString(),
						reqName.get(nameKey));
			}
		}
		}
		

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
			Set<String> addressKeys = Constants.ADDRESS.keySet();
			for (String addressKey : addressKeys) {
				if (empAddress.containsKey(addressKey)) {
					idObj.setAttribute(Constants.ADDRESS.get(addressKey)
							.toString(), empAddress.get(addressKey));
				}
			}
		}

		
		// The following code adds single valued attributes to idObj based on
		// the user type passed in the request.
		Set<String> singleValuedKeys = Constants.SINGLE_VALUED_ATTRS_EMPLOYEE.keySet();
		for (String singleValuedKey : singleValuedKeys) {
			if (jsonObject.containsKey(singleValuedKey)) {
				idObj.setAttribute(Constants.SINGLE_VALUED_ATTRS_EMPLOYEE.get(singleValuedKey)
						.toString(), jsonObject.get(singleValuedKey));
			}
		}
		if (!(jsonObject.get(SCIM.COST_CENTER) == null))
		{
			Map<String, Object> empCostCenter = (Map<String, Object>) jsonObject
					.get(SCIM.COST_CENTER);
	
		Set<String> costCenterKeys = Constants.COST_CENTERS.keySet();
		for (String costCenterKey : costCenterKeys) {
			if (empCostCenter.containsKey(costCenterKey)) {
				idObj.setAttribute(Constants.COST_CENTERS.get(costCenterKey)
						.toString(), empCostCenter.get(costCenterKey));
			}
		}
		}
		if (!(jsonObject.get(SCIM.GROUPS) == null))
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
		}
		return idObj;
	}

	public LinkedHashMap<String, Object> transformSCIM(Identity idObj,
			String uri) {

		LinkedHashMap<String, Object> respObj = new LinkedHashMap<String, Object>();
		LinkedHashMap<String, Object> meta = new LinkedHashMap<String, Object>();
		
		
		meta.put(SCIM.RESOURCE_TYPE, "user");
		meta.put(SCIM.CREATED, idObj.getCreated());
		meta.put(SCIM.LAST_MODIFIED, idObj.getModified());
		meta.put("location", uri.concat(idObj.getName()));
		LinkedHashMap<String, Object> name = new LinkedHashMap<String, Object>();
		name.put(SCIM.PREFIX, idObj.getAttribute(Macquarie.PREFIX));
		name.put(SCIM.LAST_NAME, idObj.getLastname());
		name.put(SCIM.MIDDLE_NAME, idObj.getAttribute(Macquarie.MIDDLE_NAME));
		name.put(SCIM.FIRST_NAME, idObj.getFirstname());
		
		
		LinkedHashMap<String, Object> addresses = new LinkedHashMap<String, Object>();
		
		addresses.put(SCIM.COUNTRY, idObj.getAttribute(Macquarie.MGL_COUNTRY));
		addresses.put(SCIM.STATE, idObj.getAttribute(Macquarie.MGL_STATE));
		addresses.put(SCIM.LOCALITY, idObj.getAttribute(Macquarie.MGL_LOCALITY));
		addresses.put(SCIM.FORMATTED, idObj.getAttribute(Macquarie.MGL_WORK_MAIL_ADDRESS));
		
		LinkedHashMap<String, Object> emails = new LinkedHashMap<String, Object>();
		emails.put(SCIM.VALUE, idObj.getEmail());
		LinkedHashMap<String, Object> CostCenters = new LinkedHashMap<String, Object>();
		CostCenters.put(SCIM.GL3_COST_CENTER, idObj.getAttribute(Macquarie.MGL3_COST_CENTER));
		CostCenters.put(SCIM.GL4_COST_CENTER, idObj.getAttribute(Macquarie.MGL4_COST_CENTER));
		
		LinkedHashMap<String, Object> Groups = new LinkedHashMap<String, Object>();
		Groups.put(SCIM.GROUP_CODE, idObj.getAttribute(Macquarie.MGL_EMP_GROUP_CODE));
		Groups.put(SCIM.GROUP_DESC, idObj.getAttribute(Macquarie.MGL_EMP_GROUP_DESC));
		
		respObj.put(SCIM.SCHEMAS, "urn:ietf:params:scim:schemas:core:1.1:user");
		respObj.put("id", idObj.getId());
		respObj.put(SCIM.EXTERNAL_ID, idObj.getName());
		respObj.put(SCIM.NAME, name);
		respObj.put(SCIM.EMAILS, emails);
		respObj.put(SCIM.ADDRESS, addresses);
		respObj.put(SCIM.USER_NAME, idObj.getName());
		respObj.put(SCIM.USER_TYPE, idObj.getAttribute(Macquarie.MGL_IDENTITY_TYPE));
		respObj.put(SCIM.EMPLOYEE_NUMBER, idObj.getAttribute(Macquarie.MGL_EMP_NUMBER));
		respObj.put(SCIM.JOB_TITLE, idObj.getAttribute(Macquarie.MGL_JOB_BUS_TITLE));
		respObj.put(SCIM.EMPLOYMENT_TYPE, idObj.getAttribute(Macquarie.MGL_EMP_TYPE));
		respObj.put(SCIM.DEPARTMENT, idObj.getAttribute(Macquarie.MGL_DEPARTMENT));
		respObj.put(SCIM.DIVISION, idObj.getAttribute(Macquarie.MGL_DIVISION));
		respObj.put(SCIM.COST_CENTER, CostCenters);
		respObj.put(SCIM.MANAGER_ID, idObj.getAttribute(Macquarie.EMP_MANAGER));
		respObj.put(SCIM.EMP_START_DATE, idObj.getAttribute(Macquarie.MGL_EMP_START_DATE));
		respObj.put(SCIM.EMP_END_DATE, idObj.getAttribute(Macquarie.MGL_EMP_END_DATE));
		respObj.put(SCIM.GROUPS, Groups);
		
		logObj.info("Location for new user is"+respObj.get(meta.get("location")));
		
		
		
		respObj.put(SCIM.META, meta);
		return respObj;
	}

	public Attributes<String, Object> transformModifyMap(
			Map<String, Object> reqObj) throws JSONException {

		Attributes<String, Object> modifyIDObj = new Attributes<String, Object>();
	Identity modifyIdentity=transformIdentity(reqObj);
	modifyIDObj.setMap(modifyIdentity.getAttributes());
		return modifyIDObj;

				}
		
	

	public String transformIdentitySearchAttributes(String searchFilter) {
		// Following transforms the Singular attributes
		String transformedIdentity = "";

		if (searchFilter.length() > 0) {
			
			searchFilter = searchFilter.replaceAll("(?i)\\b" + SCIM.EXTERNAL_ID
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

		}
		transformedIdentity = formatSearchFilter(searchFilter);
		return transformedIdentity;
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
		
		System.out.println("transformed search changed.");
		System.out.println("the config object");
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
*/