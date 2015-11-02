package com.versent.sailpoint.test;

import java.io.IOException;
import java.util.HashMap;
import org.codehaus.jackson.JsonGenerationException;
import org.codehaus.jackson.map.JsonMappingException;
import org.json.JSONException;
import com.sun.jersey.api.client.Client;
import com.sun.jersey.api.client.ClientHandlerException;
import com.sun.jersey.api.client.ClientResponse;
import com.sun.jersey.api.client.UniformInterfaceException;
import com.sun.jersey.api.client.WebResource;
import com.sun.jersey.api.client.config.ClientConfig;
import com.sun.jersey.api.client.config.DefaultClientConfig;

import com.versent.sailpoint.test.Ping;;

public class Create {
	
	
	//public static void main(String[] argv) throws JSONException, JsonGenerationException, JsonMappingException, UniformInterfaceException, ClientHandlerException, IOException {
	public String createUserTest(String JSON)	
	{
	ClientConfig clientConfig = new DefaultClientConfig();
     
	
	Client c = Client.create(clientConfig);
	String authHeaderName="Authorization";
	Ping callMethod= new Ping();
	@SuppressWarnings("static-access")
	 String authHeaderValue= callMethod.createAuthHeader();
	
	WebResource resource  = c.resource("http://localhost:8080/identityiq/rest/Users");
	
	
	/*String input = "{\n\"userName\":\"Daffy2\",\n\"externalId\":\"duck2\",\n"
			+ "\"name\":{\n\"familyName\":\"Duck2\",\n\"givenName\":\"Daffy2\"\n},"
			+ "\n\"emails\":{\n"
			+ " \"value\": \"theduckDaffy2@gmail.com\"\n}\n}";*/

	ClientResponse bean=resource.accept("application/json").type("application/json").header(authHeaderName, authHeaderValue).post(ClientResponse.class,JSON);
	Integer status = bean.getStatus();
	String response = bean.getEntity(String.class);
	String testResponse = response;
	return testResponse;
	
}
}
