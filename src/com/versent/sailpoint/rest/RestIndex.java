package com.versent.sailpoint.rest;



import java.util.Set;

import com.sun.tools.javac.tree.Tree.Return;

import sailpoint.rest.SailPointRestApplication;


public class RestIndex extends SailPointRestApplication {
	@Override
	
	public Set<Class<?>> getClasses(){
	Set<Class<?>> classes = super.getClasses();
	classes.add(SCIMUserHandler.class);
	//classes.add(ExtendedWorkflow.class);
	return classes;

}
}
