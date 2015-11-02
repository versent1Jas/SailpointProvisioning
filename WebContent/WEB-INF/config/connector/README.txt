10/23/2013

The files in this directory are intended to be imported as part
of the connectorRegistry. The connectorRegistry is defined 
one directory up in a file named connectorRegistry.xml.

The connector xml files in this directory cannot be imported 
on their own.

If there is something deprecated you would like to import you 
can either edit connectorRegistry.xml and reimport it OR 
you can write a separate XML file that contains the following xml 
including the path to the files you are interested in importing.

<?xml version='1.0' encoding='UTF-8'?>
<!DOCTYPE sailpoint PUBLIC "sailpoint.dtd" "sailpoint.dtd">
<sailpoint>
  <ImportAction name="mergeConnectorRegistry">
    <Configuration>
      <Attributes>
        <Map>
          <entry key='fileList'>
            <value>
              <List>
                <String>WEB-INF/config/connector/NIS-FULL.xml</String>
              </List>
            </value>
          </entry>
        </Map>
      </Attributes>
    </Configuration>
  </ImportAction>
</sailpoint>
