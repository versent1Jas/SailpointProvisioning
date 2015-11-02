--
-- This script is a SAMPLE and can be modified as appropriate by the
-- customer as long as the equivalent tables and indexes are created.
-- The database name, user, and password must match those defined in
-- iiq.properties in the IdentityIQ installation.
--
-- These configuration parameters can be modified to match your environment.
--

-- DB2 has a name size limit we can't use identityiq like the others.
-- You may also consider adding codeset and collation options. 
CREATE DATABASE IIQ AUTOMATIC STORAGE YES PAGESIZE 32 K;

CONNECT TO iiq;

CREATE SCHEMA identityiq AUTHORIZATION identityiq;

CREATE BUFFERPOOL identityiq_bp IMMEDIATE SIZE 2000 AUTOMATIC PAGESIZE 32 K;

CREATE TABLESPACE identityiq_ts PAGESIZE 32 K
     MANAGED BY AUTOMATIC STORAGE
     INITIALSIZE 1 G
     INCREASESIZE 512 M
     BUFFERPOOL identityiq_bp;

-- Grant everything to identityiq user for simplicity in dev/poc environments. 
-- This is not necessary for production environments.  The minimal set of permissions is: 
--   - CONNECT, CREATETAB, DATAACCESS on database
--   - USAGE of all sequences defined in the script

GRANT DBADM ON DATABASE TO USER identityiq;

