--
-- This script contains DDL statements to upgrade a database schema to
-- reflect changes to the model.  This file should only be used to
-- upgrade from the last formal release version to the current code base.
--

CONNECT TO iiq;

-- Add assigned roles to IdentitySnapshot
alter table identityiq.spt_identity_snapshot add assigned_roles clob(17000000);

-- Add attributes map to Schema
alter table identityiq.spt_application_schema add config clob(17000000);

-- Add featuresString to Schema
alter table identityiq.spt_application_schema add features_string varchar(512);

-- Set schemaObjectType on groups
update identityiq.spt_managed_attribute set type = 'group' where is_group=1;

-- Add aggregated column and transfer data from is_group, is_group will be removed in post upgrade script
alter table identityiq.spt_managed_attribute add aggregated smallint default 0;
create index identityiq.spt_managed_attr_aggregated on identityiq.spt_managed_attribute (aggregated);
update identityiq.spt_managed_attribute set aggregated = is_group where is_group is not null;

-- Add schemaObjectType to schemaAttributes
alter table identityiq.spt_schema_attributes add schema_object_type varchar(128);

-- Add pendingDelete to Bundle
alter table identityiq.spt_bundle add pending_delete smallint;
update identityiq.spt_bundle set pending_delete = 0;

-- Create table to persist role change events
create table identityiq.spt_role_change_event (
    id varchar(128) not null,
    created bigint,
    bundle_id varchar(128),
    provisioning_plan clob(17000000),
    bundle_deleted smallint,
    primary key (id)
) IN identityiq_ts;

create index identityiq.spt_role_change_event_created on identityiq.spt_role_change_event (created);

-- Remove constraint_name_ci, increase, constraint_name, then regen constraint_name_ci

drop index identityiq.spt_mitigation_const_ci;
alter table identityiq.spt_mitigation_expiration drop column constraint_name_ci;
alter table identityiq.spt_mitigation_expiration alter column constraint_name set data type varchar(2000);
alter table identityiq.spt_mitigation_expiration add column constraint_name_ci varchar(2000);

reorg table identityiq.spt_mitigation_expiration;
set integrity for identityiq.spt_mitigation_expiration OFF CASCADE DEFERRED;
alter table identityiq.spt_mitigation_expiration alter column
constraint_name_ci SET GENERATED ALWAYS AS (UPPER(constraint_name));
set integrity for identityiq.spt_mitigation_expiration IMMEDIATE CHECKED FULL
ACCESS FORCE GENERATED;

-- Similar dance for identity_history_item

drop index identityiq.spt_id_hist_item_constr_ci;
alter table identityiq.spt_identity_history_item drop column constraint_name_ci;
alter table identityiq.spt_identity_history_item alter column constraint_name set data type varchar(2000);
alter table identityiq.spt_identity_history_item add column constraint_name_ci varchar(2000);

reorg table identityiq.spt_identity_history_item;
set integrity for identityiq.spt_identity_history_item OFF CASCADE DEFERRED;
alter table identityiq.spt_identity_history_item alter column
constraint_name_ci SET GENERATED ALWAYS AS (UPPER(constraint_name));
set integrity for identityiq.spt_identity_history_item IMMEDIATE CHECKED FULL
ACCESS FORCE GENERATED;

-- add schemaObjectType to cert entity both archived and regular
alter table identityiq.spt_certification_entity add schema_object_type varchar(128);
alter table identityiq.spt_archived_cert_entity add schema_object_type varchar(128);

-- Add hidden to Form
alter table identityiq.spt_form add hidden smallint;
update identityiq.spt_form set hidden = 0;

-- Add lock to Workitem
alter table identityiq.spt_work_item add iiqlock varchar(128);

--
-- WorkflowTestSuite
--

    create table identityiq.spt_workflow_test_suite (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        name varchar(128) not null unique,
        description varchar(4000),
        replicated smallint,
        case_name varchar(255),
        tests clob(17000000),
        responses clob(17000000),
        attributes clob(17000000),
        name_ci generated always as (upper(name)),
        primary key (id)
    ) IN identityiq_ts;

    create index identityiq.spt_workflow_test_suite_name on identityiq.spt_workflow_test_suite (name_ci);


--
-- make sure to change the schema version here. LEAVE THIS HERE
--
update identityiq.spt_database_version set schema_version = '6.4-15' where name = 'main';
