package com.versent.sailpoint.test;

import com.sun.jersey.api.client.Client;
import com.sun.jersey.api.client.ClientResponse;
import com.sun.jersey.api.client.WebResource;
import com.sun.jersey.api.client.config.ClientConfig;
import com.sun.jersey.api.client.config.DefaultClientConfig;

public class Modify {
	public String modifyUser(String JSON,String resUrl)	
	{
ClientConfig clientConfig = new DefaultClientConfig();
     
	
	Client c = Client.create(clientConfig);
	String authHeaderName="Authorization";
	Ping callMethod= new Ping();
	@SuppressWarnings("static-access")
	 String authHeaderValue= callMethod.createAuthHeader();
	
	WebResource resource  = c.resource(resUrl);
	
	
	/*String input = "{\n\"userName\":\"Daffy2\",\n\"externalId\":\"duck2\",\n"
			+ "\"name\":{\n\"familyName\":\"Duck2\",\n\"givenName\":\"Daffy2\"\n},"
			+ "\n\"emails\":{\n"
			+ " \"value\": \"theduckDaffy2@gmail.com\"\n}\n}";*/

	ClientResponse bean=resource.accept("application/json").type("application/json").header(authHeaderName, authHeaderValue).put(ClientResponse.class,JSON);
	Integer status = bean.getStatus();
	String response = bean.getEntity(String.class);
	String testResponse = response;
	return testResponse;

	}
}
