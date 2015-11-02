package com.versent.sailpoint.utils;

import java.security.SecureRandom;
import java.util.Map;

import sailpoint.object.AuditConfig;
import sailpoint.object.PasswordPolicy;
import sailpoint.rest.BaseResource;

public class GenericFunctions extends BaseResource {
	public  Map<String,Object> generateInitialPassword()
	{
	Map<String,Object>PasswordConstraints=null;
	
	
	
	PasswordPolicy passwordPolicyObj = new PasswordPolicy();
	Integer minNumeric = (Integer)PasswordConstraints.get("passwordMinNumeric");
	Integer passwordMinUpper=(Integer)PasswordConstraints.get("passwordMinUpper");
	Integer passwordMinLower=(Integer)PasswordConstraints.get("passwordMinLower");
	Integer passwordMinSpecial=(Integer)PasswordConstraints.get("passwordMinSpecial");
	Integer passwordMaxLength=(Integer)PasswordConstraints.get("passwordMaxLength");
	return passwordPolicyObj.getPasswordConstraints();
	}
	
	
}
