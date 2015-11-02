create table identityiq.sptr_cef_export (
    task_def_id varchar(128) not null,
    class_name varchar(256) not null,
    start_dt bigint not null,
    end_dt bigint not null
);

create index identityiq.sptr_idx_export_task on identityiq.sptr_cef_export (task_def_id);
create index identityiq.sptr_idx_export_class on sptr_cef_export (class_name);

create table identityiq.sptr_cef_identity (
    created_dt timestamp,
    hostname varchar(128) not null,
    cef_version varchar(128) not null,
    device_vendor varchar(128) not null,
    device_product varchar(128) not null,
    device_version varchar(128) not null,
    signature_id varchar(128) not null,
    name varchar(128) not null,
    severity varchar(128) not null,
    extension clob(17000000),
    primary key (signature_id)
);

create table identityiq.sptr_cef_link (
    created_dt timestamp,
    hostname varchar(128) not null,
    cef_version varchar(128) not null,
    device_vendor varchar(128) not null,
    device_product varchar(128) not null,
    device_version varchar(128) not null,
    signature_id varchar(128) not null,
    name varchar(128) not null,
    severity varchar(128) not null,
    extension clob(17000000),
    primary key (signature_id)
);


create table identityiq.sptr_cef_audit_event (
    created_dt timestamp,
    hostname varchar(128) not null,
    cef_version varchar(128) not null,
    device_vendor varchar(128) not null,
    device_product varchar(128) not null,
    device_version varchar(128) not null,
    signature_id varchar(128) not null,
    name varchar(128) not null,
    severity varchar(128) not null,
    extension clob(17000000),
    primary key (signature_id)
);

create table identityiq.sptr_cef_syslog_event (
    created_dt timestamp,
    hostname varchar(128) not null,
    cef_version varchar(128) not null,
    device_vendor varchar(128) not null,
    device_product varchar(128) not null,
    device_version varchar(128) not null,
    signature_id varchar(128) not null,
    name varchar(128) not null,
    severity varchar(128) not null,
    extension clob(17000000),
    primary key (signature_id)
);
