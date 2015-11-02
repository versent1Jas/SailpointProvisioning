-- 
-- Tables used by sailpoint.integration.JdbcExecutor
--

create table identityiq.spt_integration_role (
  role varchar(255) not null,
  application varchar(255) not null,
  instance varchar(255),
  type varchar(1),
  name varchar(255) not null,
  value varchar(255)
) IN identityiq_ts;

create table identityiq.spt_integration_request (
  plan_id varchar(128) not null,
  identity_name varchar(255),
  op varchar(32) not null,
  application varchar(255) not null,
  instance varchar(255),
  account varchar(255) not null,
  type varchar(1),
  name varchar(255),
  value varchar(255)
) IN identityiq_ts;

