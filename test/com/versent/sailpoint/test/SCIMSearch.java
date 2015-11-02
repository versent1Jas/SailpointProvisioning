package com.versent.sailpoint.test;

import static org.junit.Assert.*;

import org.junit.Test;

public class SCIMSearch {

	@Test
	public final void extractUserDetailswithFilter()
	{
		Search searchUserFilter = new Search();
		String searchStatus=searchUserFilter.searchUserWithFilter();
		System.out.println("SEARCH RESULTS"+searchStatus);
		
	}
}
