package com.versent.sailpoint.test;

import org.junit.Test;

public class SCIMDelete {
	@Test
	public final void tryNonExistingUser()
	{
		Delete delUser = new Delete();
		Modify modifyUser = new Modify();
		String deleteOutput = delUser.deleteUser("BLAAAAAAA");
		System.out.println("DELETE FOR NON EXISTING USER"+deleteOutput);
		
	}
	@Test
	public final void finallyDeleteUser()
	{
		Delete delUser = new Delete();
		Modify modifyUser = new Modify();
		String deleteOutput = delUser.deleteUser("RRunner");
		System.out.println("DELETE FOR EXISTING USER"+deleteOutput);		
	}


}
