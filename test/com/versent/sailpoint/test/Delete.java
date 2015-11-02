package com.versent.sailpoint.test;

import java.io.IOException;
import java.util.HashMap;

import javax.ws.rs.core.MultivaluedMap;

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
import com.sun.jersey.core.util.MultivaluedMapImpl;

public class Delete {
	//public static void main(String[] argv) throws JSONException, JsonGenerationException, JsonMappingException, UniformInterfaceException, ClientHandlerException, IOException {
	public String deleteUser(String id)
	{
	ClientConfig clientConfig = new DefaultClientConfig();
	     
		Client c = Client.create(clientConfig);
		Ping callMethod= new Ping();
		String authHeaderName="Authorization";
		String authHeaderValue = callMethod.createAuthHeader();
		WebResource resource  = c.resource("http://localhost:8080/identityiq/rest/Users");
		ClientResponse bean=resource.path(id).accept("application/json").type("application/json").header(authHeaderName, authHeaderValue).delete(ClientResponse.class);
		return bean.getEntity(String.class);
		
	}
		
	}


