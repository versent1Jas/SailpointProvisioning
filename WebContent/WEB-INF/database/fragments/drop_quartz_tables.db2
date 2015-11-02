-- From the Quartz 2.2.1 Distribution
CONNECT TO IIQ;

delete from identityiq.qrtz221_fired_triggers;
delete from identityiq.qrtz221_simple_triggers;
delete from identityiq.qrtz221_cron_triggers;
delete from identityiq.qrtz221_blob_triggers;
delete from identityiq.qrtz221_triggers;
delete from identityiq.qrtz221_job_details;
delete from identityiq.qrtz221_calendars;
delete from identityiq.qrtz221_paused_trigger_grps;
delete from identityiq.qrtz221_locks;
delete from identityiq.qrtz221_scheduler_state;
delete from identityiq.QRTZ221_SIMPROP_TRIGGERS;

drop table identityiq.qrtz221_calendars;
drop table identityiq.qrtz221_fired_triggers;
drop table identityiq.qrtz221_blob_triggers;
drop table identityiq.qrtz221_cron_triggers;
drop table identityiq.qrtz221_simple_triggers;
drop table identityiq.qrtz221_triggers;
drop table identityiq.qrtz221_job_details;
drop table identityiq.qrtz221_paused_trigger_grps;
drop table identityiq.qrtz221_locks;
drop table identityiq.qrtz221_scheduler_state;
DROP TABLE identityiq.QRTZ221_SIMPROP_TRIGGERS;

-- End Quartz configuration
