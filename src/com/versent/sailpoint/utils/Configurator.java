/**
 * 
 */
package com.versent.sailpoint.utils;
import java.util.HashMap;
import java.util.Map;

import sailpoint.api.SailPointContext;
import sailpoint.object.Configuration;
import sailpoint.object.Custom;
import sailpoint.tools.GeneralException;;

/**
 * @author Jaspreett
 *
 */
public class Configurator {
	private static Configurator instance = null;
	private HashMap<String, Configuration> map = null;
		
	private Configurator() {
		
	}
	
	public String getString( String key ) {
		
		return( null );
	}
	
	
	
	public static Configurator getInstance( )  {
		
			
		if( instance == null ) {
			instance = new Configurator();
			
		}
		return( instance );
	}
	public Configuration getCustomAttributes(SailPointContext context,String customObjName)
	{
		Configuration customObjAttributes=null;
		try {
			customObjAttributes = context.getObjectByName(Configuration.class, customObjName);
			if(customObjAttributes.isDirty())
			{
				customObjAttributes=context.getObjectByName(Configuration.class, customObjName);
			}
		} 
		
		catch (GeneralException e) {
			
			e.printStackTrace();
		}
		return customObjAttributes;
	}
	}
