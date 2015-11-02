package com.versent.sailpoint.test;

import com.sun.jersey.api.client.Client;
import com.sun.jersey.api.client.ClientResponse;
import com.sun.jersey.api.client.WebResource;
import com.sun.jersey.api.client.config.ClientConfig;
import com.sun.jersey.api.client.config.DefaultClientConfig;

public class Search {
	public String searchUserWithFilter()	
	{
	ClientConfig clientConfig = new DefaultClientConfig();
     
	Client c = Client.create(clientConfig);
	String authHeaderName="Authorization";
	Ping callMethod= new Ping();
	@SuppressWarnings("static-access")
	 String authHeaderValue= callMethod.createAuthHeader();
	
	WebResource resource  = c.resource("http://localhost:8080/identityiq/rest/Users/search");
	
	ClientResponse bean=resource.queryParam("filter", "(name.givenName sw(\"John\")and(emails.value co(\"com\")))").accept("application/json").type("application/json").header(authHeaderName, authHeaderValue).get(ClientResponse.class);
	
	String response = bean.getEntity(String.class);
	String testResponse = response;
	return testResponse;


}
	
}
