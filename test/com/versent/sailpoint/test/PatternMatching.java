package com.versent.sailpoint.test;

import java.util.ArrayList;
import java.util.Collections;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class PatternMatching
{
    public static void main( String args[] ){

      // String to be scanned to find the pattern.
      String line = "jrandhaw1";
      String c = "jrandhaw";
      
      ArrayList<String>  list= new ArrayList<String>();
      ArrayList<String>  matches = new ArrayList<String>();
      list.add("jrandhaw1");
      list.add("jrandh1");
      list.add("jrandhaw2");
      // Create a Pattern object
      String pattern = c+"(\\d+)";
      Pattern p = Pattern.compile(pattern);
      for (String s:list) {
    	    if (p.matcher(s).matches()) {
    	    	s=s.replaceAll("\\D+","");
    	      matches.add(s);
    	      
    	    }
      }
      
Integer i = Integer.parseInt(Collections.max(matches));
System.out.println("the maximum result"+i);
      // Now create matcher object.
    
      
   
}
}