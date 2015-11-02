/**
 * 
 */
package com.versent.sailpoint.utils;

import sailpoint.api.SailPointContext;
import sailpoint.object.Custom;

/**
 * @author Jaspreett
 *
 */
public class Customiser {
	private static Customiser instance = null;
	private Custom config = null;
	
	private Customiser() {
		
	}
	
	public String getString( String key ) {
		
		return( null );
	}
	
	
	
	public static Customiser getInstance( SailPointContext context ) {
		if( instance == null ) {
			instance = new Customiser();
		}
		return( instance );
	}
}
