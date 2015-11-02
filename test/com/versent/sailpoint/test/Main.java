package com.versent.sailpoint.test;

import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;

import org.apache.log4j.Logger;
import org.hibernate.id.CompositeNestedGeneratedValueGenerator.GenerationContextLocator;

import sailpoint.api.SailPointContext;
import sailpoint.rest.BaseResource;
import sailpoint.tools.Message;

import com.versent.sailpoint.constants.Constants;
import com.versent.sailpoint.constants.SCIM;
import com.versent.sailpoint.utils.Configurator;
import com.versent.sailpoint.utils.JDBCConnector;
import com.versent.sailpoint.validators.User;
import com.versent.sailpoint.validators.Validations;



public class Main extends BaseResource {
	public static void main(String[] argv)
	{
	/*	Logger log = Logger.getLogger(Main.class);
		ArrayList<LinkedHashMap> list = new ArrayList<LinkedHashMap>();
		LinkedHashMap address = new LinkedHashMap();
		LinkedHashMap name = new LinkedHashMap();
		LinkedHashMap complexAttrs = new LinkedHashMap();
		LinkedHashMap nameManA = new LinkedHashMap();
		LinkedHashMap namePermittedC = new LinkedHashMap();
		nameManA.put("givenName","bla1");
		nameManA.put("familyName","bla2");
		list.add(nameManA);
		
		namePermittedC.put("prefix", "blaC");
		namePermittedC.put("middlename","blaD");
		list.add(namePermittedC);
		address.put("address", nameManA);
		name.put("name", namePermittedC);
		String test ="ABCD1234";
		System.out.println("after number replacement"+test.replaceAll("[^A-Za-z]+", ""));
		System.out.println("after alphabet replacement"+test.replaceAll("\\D+",""));*/
		
		/*complexAttrs.putAll(address);
		complexAttrs.putAll(name);
		LinkedHashMap reqObj = new LinkedHashMap();
		reqObj.put("address", nameManA);
		System.out.println("the values are"+complexAttrs.keySet());
		Set<String> nameKeys = complexAttrs.keySet();
		for (String nameKey : nameKeys) {
			if(reqObj.containsKey(nameKey))
			{
			LinkedHashMap retValues= (LinkedHashMap)complexAttrs.get(nameKey);
			Set<String> nestedKeys = retValues.keySet();	
			for (String nestedKey : nestedKeys) {
			System.out.println("the keys"+retValues.get(nestedKey));
		}
	}
			}
		for (LinkedHashMap<String, String> map : list)
		     for (Entry<String, String> mapEntry : map.entrySet())
		        {
		        String key = mapEntry.getKey();
		        //System.out.println("key"+key);
		        String value = mapEntry.getValue();
		        //System.out.println("value"+value);
		        }

}*/
		String test ="ABCD1234";
		System.out.println("length is"+test.length());
		System.out.println("substringed username"+test.substring(0, 7));
	}
}
