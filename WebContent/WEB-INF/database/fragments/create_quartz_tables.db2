
-- IdentityIQ NOTES
--
-- The job_data columns will contain lists of identities for certifications,
-- e.g. when scheduling a cert from selected identities in the results of a
-- search.  The original size for these columns was 2000, but this restriction
-- has been removed. 
--
-- Removing the 2000 bytes size of the column job_data as its giving DB2 exception if the data 
-- size is more than 2000 bytes. This happens during performing policies simulation for 
-- policies having rule attached.
-- 12/17/2013 updated for Quartz 2.2.1

create table identityiq.qrtz221_job_details(
sched_name varchar(120) not null,
job_name varchar(200) not null,
job_group varchar(80) not null,
description varchar(120),
job_class_name varchar(128) not null,
is_durable varchar(1) not null,
is_nonconcurrent varchar(1) not null,
is_update_data varchar(1) not null,
requests_recovery varchar(1) not null,
job_data blob,
primary key (sched_name,job_name,job_group)
) in identityiq_ts;

create table identityiq.qrtz221_triggers(
sched_name varchar(120) not null,
trigger_name varchar(200) not null,
trigger_group varchar(80) not null,
job_name varchar(200) not null,
job_group varchar(80) not null,
description varchar(120),
next_fire_time bigint,
prev_fire_time bigint,
priority integer,
trigger_state varchar(16) not null,
trigger_type varchar(8) not null,
start_time bigint not null,
end_time bigint,
calendar_name varchar(80),
misfire_instr smallint,
job_data blob(2000),
primary key (sched_name,trigger_name,trigger_group),
foreign key (sched_name,job_name,job_group) references identityiq.qrtz221_job_details(sched_name,job_name,job_group)
) in identityiq_ts;

create table identityiq.qrtz221_simple_triggers(
sched_name varchar(120) not null,
trigger_name varchar(200) not null,
trigger_group varchar(80) not null,
repeat_count bigint not null,
repeat_interval bigint not null,
times_triggered bigint not null,
primary key (sched_name,trigger_name,trigger_group),
foreign key (sched_name,trigger_name,trigger_group) references identityiq.qrtz221_triggers(sched_name,trigger_name,trigger_group)
) in identityiq_ts;

create table identityiq.qrtz221_cron_triggers(
sched_name varchar(120) not null,
trigger_name varchar(200) not null,
trigger_group varchar(80) not null,
cron_expression varchar(120) not null,
time_zone_id varchar(80),
primary key (sched_name,trigger_name,trigger_group),
foreign key (sched_name,trigger_name,trigger_group) references identityiq.qrtz221_triggers(sched_name,trigger_name,trigger_group)
) in identityiq_ts;

CREATE TABLE identityiq.qrtz221_simprop_triggers
  (          
    sched_name varchar(120) not null,
    trigger_name varchar(200) not null,
    trigger_group varchar(200) not null,
    str_prop_1 varchar(512),
    str_prop_2 varchar(512),
    str_prop_3 varchar(512),
    int_prop_1 int,
    int_prop_2 int,
    long_prop_1 bigint,
    long_prop_2 bigint,
    dec_prop_1 numeric(13,4),
    dec_prop_2 numeric(13,4),
    bool_prop_1 varchar(1),
    bool_prop_2 varchar(1),
    primary key (sched_name,trigger_name,trigger_group),
    foreign key (sched_name,trigger_name,trigger_group)
    references identityiq.qrtz221_triggers(sched_name,trigger_name,trigger_group)
) in identityiq_ts;

create table identityiq.qrtz221_blob_triggers(
sched_name varchar(120) not null,
trigger_name varchar(200) not null,
trigger_group varchar(80) not null,
blob_data blob(2000),
primary key (sched_name,trigger_name,trigger_group),
foreign key (sched_name,trigger_name,trigger_group) references identityiq.qrtz221_triggers(sched_name,trigger_name,trigger_group)
) in identityiq_ts;

create table identityiq.qrtz221_calendars(
sched_name varchar(120) not null,
calendar_name varchar(80) not null,
calendar blob(2000) not null,
primary key (sched_name,calendar_name)
) in identityiq_ts;

create table identityiq.qrtz221_fired_triggers(
sched_name varchar(120) not null,
entry_id varchar(95) not null,
trigger_name varchar(200) not null,
trigger_group varchar(80) not null,
instance_name varchar(80) not null,
fired_time bigint not null,
sched_time bigint not null,
priority integer not null,
state varchar(16) not null,
job_name varchar(200),
job_group varchar(80),
is_nonconcurrent varchar(1),
requests_recovery varchar(1),
primary key (sched_name,entry_id)
) in identityiq_ts;

create table identityiq.qrtz221_paused_trigger_grps(
sched_name varchar(120) not null,
trigger_group varchar(80) not null,
primary key (sched_name,trigger_group)
) in identityiq_ts;

create table identityiq.qrtz221_scheduler_state(
sched_name varchar(120) not null,
instance_name varchar(80) not null,
last_checkin_time bigint not null,
checkin_interval bigint not null,
primary key (sched_name,instance_name)
) in identityiq_ts;

create table identityiq.qrtz221_locks(
sched_name varchar(120) not null,
lock_name varchar(40) not null,
primary key (sched_name,lock_name)
) in identityiq_ts;

insert into identityiq.qrtz221_locks values('QuartzScheduler', 'TRIGGER_ACCESS');
insert into identityiq.qrtz221_locks values('QuartzScheduler', 'JOB_ACCESS');
insert into identityiq.qrtz221_locks values('QuartzScheduler', 'CALENDAR_ACCESS');
insert into identityiq.qrtz221_locks values('QuartzScheduler', 'STATE_ACCESS');
insert into identityiq.qrtz221_locks values('QuartzScheduler', 'MISFIRE_ACCESS');

create index identityiq.idx_qrtz221_j_req_recovery on identityiq.qrtz221_job_details(sched_name,requests_recovery);
create index identityiq.idx_qrtz221_j_grp on identityiq.qrtz221_job_details(sched_name,job_group);
create index identityiq.idx_qrtz221_t_j on identityiq.qrtz221_triggers(sched_name,job_name,job_group);
create index identityiq.idx_qrtz221_t_jg on identityiq.qrtz221_triggers(sched_name,job_group);
create index identityiq.idx_qrtz221_t_c on identityiq.qrtz221_triggers(sched_name,calendar_name);
create index identityiq.idx_qrtz221_t_g on identityiq.qrtz221_triggers(sched_name,trigger_group);
create index identityiq.idx_qrtz221_t_state on identityiq.qrtz221_triggers(sched_name,trigger_state);
create index identityiq.idx_qrtz221_t_n_state on identityiq.qrtz221_triggers(sched_name,trigger_name,trigger_group,trigger_state);
create index identityiq.idx_qrtz221_t_n_g_state on identityiq.qrtz221_triggers(sched_name,trigger_group,trigger_state);
create index identityiq.idx_qrtz221_t_next_fire_time on identityiq.qrtz221_triggers(sched_name,next_fire_time);
create index identityiq.idx_qrtz221_t_nft_st on identityiq.qrtz221_triggers(sched_name,trigger_state,next_fire_time);
create index identityiq.idx_qrtz221_t_nft_misfire on identityiq.qrtz221_triggers(sched_name,misfire_instr,next_fire_time);
create index identityiq.idx_qrtz221_t_nft_st_misfire on identityiq.qrtz221_triggers(sched_name,misfire_instr,next_fire_time,trigger_state);
create index identityiq.idx_qrtz221_t_nft_st_misfire_grp on identityiq.qrtz221_triggers(sched_name,misfire_instr,next_fire_time,trigger_group,trigger_state);
create index identityiq.idx_qrtz221_ft_trig_inst_name on identityiq.qrtz221_fired_triggers(sched_name,instance_name);
create index identityiq.idx_qrtz221_ft_inst_job_req_rcvry on identityiq.qrtz221_fired_triggers(sched_name,instance_name,requests_recovery);
create index identityiq.idx_qrtz221_ft_j_g on identityiq.qrtz221_fired_triggers(sched_name,job_name,job_group);
create index identityiq.idx_qrtz221_ft_jg on identityiq.qrtz221_fired_triggers(sched_name,job_group);
create index identityiq.idx_qrtz221_ft_t_g on identityiq.qrtz221_fired_triggers(sched_name,trigger_name,trigger_group);
create index identityiq.idx_qrtz221_ft_tg on identityiq.qrtz221_fired_triggers(sched_name,trigger_group);
