create table identityiq.sptr_export (
    task_def_id varchar(128) not null,
    class_name varchar(256) not null,
    start_dt bigint not null,
    end_dt bigint not null
);
create index identityiq.sptr_idx_export_task on identityiq.sptr_export (task_def_id);
create index identityiq.sptr_idx_export_class on identityiq.sptr_export (class_name);

create table identityiq.sptr_identity (
    id varchar(128) not null,
    created bigint,
    created_dt timestamp,
    export_date bigint,
    name varchar(128),
    display_name varchar(128),
    firstname varchar(128),
    lastname varchar(128),
    email varchar(128),
    manager varchar(128),
    manager_display_name varchar(128),
    manager_status smallint,
    inactive smallint,
    correlated smallint,
    primary key (id)
);

create index identityiq.sptr_idx_ident_name on identityiq.sptr_identity (name);
create index identityiq.sptr_idx_ident_fname on identityiq.sptr_identity (firstname);
create index identityiq.sptr_idx_ident_lname on identityiq.sptr_identity (lastname);
create index identityiq.sptr_idx_ident_email on identityiq.sptr_identity (email);
create index identityiq.sptr_idx_ident_manager on identityiq.sptr_identity (manager);

create table identityiq.sptr_identity_scorecard (
    id varchar(128) not null,
    identity_id varchar(128) not null,
    composite_score int not null default 0,
    business_role_score int not null default 0,
    raw_business_role_score int not null default 0,
    entitlement_score int not null default 0,
    raw_entitlement_score int not null default 0,
    policy_score int not null default 0,
    raw_policy_score int not null default 0,
    certification_score int not null default 0,
    total_violations int not null default 0,
    total_remediations int not null default 0,
    total_delegations int not null default 0,
    total_mitigations int not null default 0,
    total_approvals int not null default 0,
    primary key (id)
);

create index sptr_idx_ident_score_ident_id on identityiq.sptr_identity_scorecard (identity_id);

create table identityiq.sptr_identity_attr (
    object_id varchar(128) not null,
    attr_name varchar(128) not null,
    attr_value varchar(@IdentityAttrColLength)
);

create index identityiq.sptr_idx_ident_attr_id on identityiq.sptr_identity_attr (object_id);
create index identityiq.sptr_idx_ident_attr_name on identityiq.sptr_identity_attr (attr_name);

create table identityiq.sptr_identity_entitlements (
    id varchar(128) not null,
    identity_id varchar(128) not null,
    native_identity varchar(256),
    display_name varchar(128),
    application_id varchar(128),
    application_name varchar(256),
    application_instance varchar(128),
    type varchar(128) not null,
    description varchar(255) not null,
    value varchar(2048),
    export_date bigint
);

create index identityiq.sptr_idx_ident_ents_id on identityiq.sptr_identity_entitlements (id);
create index identityiq.sptr_idx_ident_ents_ident_id on identityiq.sptr_identity_entitlements (identity_id);
create index identityiq.sptr_idx_ident_ents_app_id on identityiq.sptr_identity_entitlements (application_id);
create index identityiq.sptr_idx_ident_ents_exp_dt on identityiq.sptr_identity_entitlements (export_date);

create table identityiq.sptr_account (
    id varchar(128) not null,
    native_identity varchar(256),
    display_name varchar(128),
    application_id varchar(128),
    application_name varchar(128),
    application_instance varchar(128),
    identity_id varchar(128),
    identity_name varchar(128),
    identity_display_name varchar(128),
    composite smallint,
    manually_correlated smallint,
    created bigint,
    created_dt timestamp,
    export_date bigint,
    entitlements smallint not null default 0,
    primary key (id)
);

create index identityiq.sptr_idx_account_nat_id on identityiq.sptr_account (native_identity);
create index identityiq.sptr_idx_account_app_id on identityiq.sptr_account (application_id);
create index identityiq.sptr_idx_account_ident_id on identityiq.sptr_account (identity_id);
create index identityiq.sptr_idx_account_ident_name on identityiq.sptr_account (identity_name);
create index identityiq.sptr_idx_account_exp_dt on identityiq.sptr_account (export_date);

create table identityiq.sptr_account_attr (
    object_id varchar(128) not null,
    attr_name varchar(128) not null,
    attr_value varchar(@LinkAttrColLength)
);

create index identityiq.sptr_idx_acct_attr_id on identityiq.sptr_account_attr (object_id);
create index identityiq.sptr_idx_acct_attr_name on identityiq.sptr_account_attr (attr_name);

create table identityiq.sptr_certification (
    id varchar(128) not null,
    name varchar(256),
    short_name varchar(255),
    description varchar(1024),
    type varchar(128),
    target_name varchar(256),
    target_display_name varchar(256),
    continuous smallint,
    phase varchar(255),
    parent_certification_id varchar(128),
    created bigint,
    created_dt timestamp,
    finished bigint,
    finished_dt timestamp,
    signed bigint,
    signed_dt timestamp,
    expiration bigint,
    expiration_dt timestamp,
    export_date bigint,
    creator_name varchar(128),
    creator_display_name varchar(128),
    item_percent_complete integer not null default 0,
    cert_grp_id varchar(128),
    cert_grp_name varchar(256),
    cert_grp_owner varchar(256),
    cert_grp_owner_display_name varchar(256),
    automatic_closing_date bigint,
    total_accounts int not null default 0,
    accounts_allowed int not null default 0,
    accounts_remediated int not null default 0,
    accounts_approved int not null default 0,
    roles_allowed integer not null,
    exceptions_allowed integer not null,
    excluded_entities integer,
    excluded_items integer,
    primary key (id)
);

create index identityiq.sptr_idx_cert_type on identityiq.sptr_certification (type);
create index identityiq.sptr_idx_cert_target on identityiq.sptr_certification (target_name);
create index identityiq.sptr_idx_cert_exp_dt on identityiq.sptr_certification (export_date);
create index identityiq.sptr_idx_cert_sign_dt on identityiq.sptr_certification (signed);
create index identityiq.sptr_idx_cert_expiration on identityiq.sptr_certification (expiration);
create index identityiq.sptr_idx_cert_creator on identityiq.sptr_certification (creator_name);
create index identityiq.sptr_idx_cert_grp on identityiq.sptr_certification (cert_grp_name);
create index identityiq.sptr_idx_cert_grp_owner on identityiq.sptr_certification (cert_grp_owner);
create index identityiq.sptr_ids_cert_auto_close_date on identityiq.sptr_certification (automatic_closing_date);

create table identityiq.sptr_certification_attr (
    object_id varchar(128) not null,
    attr_name varchar(128) not null,
    attr_value varchar(450)
);

create index identityiq.sptr_idx_cert_attr_id on identityiq.sptr_certification_attr (object_id);
create index identityiq.sptr_idx_cert_attr_name on identityiq.sptr_certification_attr (attr_name);

create table identityiq.sptr_cert_item (
    id varchar(128) not null,
    certification_id varchar(128),
    target varchar(128),
    target_display_name varchar(256),
    target_type varchar(255),
    type varchar(255),
    role varchar(255),
    violationSummary varchar(256),
    decision varchar(255),
    actor_name varchar(128),
    actor_display_name varchar(128),
    decision_comments clob(8192),
    bulk_decision smallint,
    mitigation_expiration bigint,
    mitigation_expiration_dt timestamp,
    remediation_kicked_off smallint,
    remediation_completed smallint,
    delegation smallint,
    challenge_decision varchar(255),
    challenge_decision_maker varchar(128),
    challenge_comments clob(8192),
    exclusion_reason varchar(255),
    exclusion_explanation clob(17000000),
    created bigint,
    created_dt timestamp,    
    export_date bigint,
    completed smallint,
    manager varchar(128),
    manager_display_name varchar(128),    
    summary_status varchar(128),
    primary key (id)
);

create index identityiq.sptr_idx_cert_item_certid on identityiq.sptr_cert_item (certification_id);
create index identityiq.sptr_idx_cert_item_type on identityiq.sptr_cert_item (type);
create index identityiq.sptr_idx_cert_item_target on identityiq.sptr_cert_item (target);
create index identityiq.sptr_idx_cert_item_target_type on identityiq.sptr_cert_item (target_type);
create index identityiq.sptr_idx_cert_item_exp_dt on identityiq.sptr_cert_item (export_date);

create table identityiq.sptr_cert_item_attr (
    object_id varchar(128) not null,
    attr_name varchar(128) not null,
    attr_value varchar(450)
);

create index identityiq.sptr_idx_item_attr_id on identityiq.sptr_cert_item_attr (object_id);
create index identityiq.sptr_idx_item_attr_name on identityiq.sptr_cert_item_attr (attr_name);

create table identityiq.sptr_cert_item_entitlements (
    certification_item_id varchar(128) not null,
    certification_id varchar(128) not null,
    native_identity varchar(256),
    display_name varchar(128),
    application_id varchar(128),
    application_name varchar(256),
    application_instance varchar(128),
    type varchar(128) not null,
    description varchar(255) not null,
    value varchar(2048),
    export_date bigint,
    account_only smallint not null default 0
);

create index identityiq.sptr_idx_ents_item_id on identityiq.sptr_cert_item_entitlements (certification_item_id);
create index identityiq.sptr_idx_ents_cert_id on identityiq.sptr_cert_item_entitlements (certification_id);
create index identityiq.sptr_idx_ents_app_id on identityiq.sptr_cert_item_entitlements (application_id);
create index identityiq.sptr_idx_ents_exp_dt on identityiq.sptr_cert_item_entitlements (export_date);

create table identityiq.sptr_tag (
    id varchar(128) not null,
    name varchar(128) not null,
    primary key (id)
);

create index identityiq.sptr_idx_tag_name on identityiq.sptr_tag (name);

create table identityiq.sptr_certification_tag (
    certification_id varchar(128) not null,
    tag_id varchar(128) not null,
    idx integer not null,
    primary key (certification_id, idx)
);

create index identityiq.sptr_idx_cert_tag_cert_id on identityiq.sptr_certification_tag (certification_id);
