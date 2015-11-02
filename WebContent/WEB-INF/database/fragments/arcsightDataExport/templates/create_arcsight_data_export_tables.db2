create table identityiq.sptr_arcsight_export (
    task_def_id varchar(128) not null,
    class_name varchar(256) not null,
    start_dt bigint not null,
    end_dt bigint not null
);

create index identityiq.sptr_arcsight_idx1 on identityiq.sptr_arcsight_export (task_def_id);

create table identityiq.sptr_arcsight_identity (
    linkid varchar(128) NOT NULL,
    identityid varchar(128) NOT NULL,
    modified_dt timestamp NOT NULL with default current timestamp,
    identity_display_name varchar(128) DEFAULT NULL,
    identity_firstname varchar(128) DEFAULT NULL,
    identity_lastname varchar(128) DEFAULT NULL,
    application_type varchar(255) DEFAULT NULL,
    application_host varchar(128) DEFAULT NULL,
    application_name varchar(128) NOT NULL,
    link_display_name varchar(128) DEFAULT NULL,
    entitlements clob(17000000) DEFAULT NULL,
    risk_score integer DEFAULT NULL,
    PRIMARY KEY (linkid)
);

create table identityiq.sptr_arcsight_audit_event (
    auditid varchar(128) NOT NULL,
    created_dt timestamp DEFAULT CURRENT_TIMESTAMP,
    owner varchar(128) DEFAULT NULL,
    source varchar(128) DEFAULT NULL,
    action varchar(128) DEFAULT NULL,
    target varchar(255) DEFAULT NULL,
    application varchar(128) DEFAULT NULL,
    account_name varchar(256) DEFAULT NULL,
    attribute_name varchar(128) DEFAULT NULL,
    attribute_value varchar(450) DEFAULT NULL,
    PRIMARY KEY (auditid)
);
