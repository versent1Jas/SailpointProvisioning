package com.versent.sailpoint.utils;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;

import sailpoint.api.SailPointContext;

import sailpoint.tools.GeneralException;


public class JDBCConnector {
	 
	   
	   
public ArrayList getResults(SailPointContext context,String sqlQuery,String generatedShortName) 
{
	 ArrayList sqlQueryOutput = new ArrayList();
	 Connection conn = null;
		ResultSet rs = null;
		PreparedStatement pstmt = null;
	try
	{
		
		
		conn = context.getJdbcConnection();
		
		 pstmt = conn.prepareStatement(sqlQuery);
		 pstmt.setString(1,generatedShortName+"%");
		 System.out.println("the query is"+pstmt);
		 rs = pstmt.executeQuery();
		 Boolean isResultSetEmpty=rs.next();
		 System.out.println("output of RS"+isResultSetEmpty);
		 
		 if((isResultSetEmpty))
		 {
		 if(!(rs.getString(1)==null))
				 {
			sqlQueryOutput.add(rs.getString(1));
			System.out.println("the output being added to the history lookup"+rs.getString(1));
			
				 }
		
		 } 
		  
	}
	
	catch(SQLException se)
	{
		se.printStackTrace();
	     
	}
	
	catch(GeneralException ge)
	{
		ge.printStackTrace();
	}
	finally{
		try{
	         if(pstmt!=null)
	            pstmt.close();
	      }catch(SQLException se)
		{
	    	se.printStackTrace();  
	      }
	      try{
	         if(conn!=null)
	            conn.close();
	      }catch(SQLException se){
	         se.printStackTrace();
	      }
	   }
	
	return sqlQueryOutput;
	
	}

}
