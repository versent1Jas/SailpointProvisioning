package com.versent.sailpoint.test;
import com.sun.jersey.api.client.Client;
import com.sun.jersey.api.client.WebResource;
import com.sun.jersey.api.client.WebResource.Builder;
import com.sun.jersey.api.client.config.ClientConfig;
import com.sun.jersey.api.client.config.DefaultClientConfig;

public class Ping {
	public static void main(String[] argv) {
		ClientConfig cc = new DefaultClientConfig();
	
		Client c = Client.create(cc);
		String authHeaderName="Authorization";
		String authHeaderValue= createAuthHeader();
		c.setConnectTimeout(30000);
		WebResource Ping = c.resource("http://localhost:8080/identityiq/rest/Users/Ping");
		
		Builder resourceBuilder= Ping.header(authHeaderName, authHeaderValue);
		String response = resourceBuilder.get(String.class);
		System.out.println("The response for Ping is "+response);

}
	public static String createAuthHeader()
	{
		String authParams = "spadmin"+":"+"admin";
		String authHeaderValue="Basic " + java.util.Base64.getEncoder().encodeToString(authParams.getBytes() );
		return authHeaderValue;
	}
	
}
