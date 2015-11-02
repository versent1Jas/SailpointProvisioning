-- ----------------------------------------------------
--
-- IdentityIQ Views
--
-- Creates views for object tables which include
-- extended attributes. To generate the view SQL
-- the exportviews should be run from the console.
--
-- Drop ddl for the views can be found in drop_views.sql
--
-- ----------------------------------------------------

CREATE VIEW identityiq.spv_identity
  (id, created, modified, assigned_scope, assigned_scope_path,
  controls_assigned_scope,
  workgroup, owner,
  name, display_name,
  firstname, lastname, email,inactive,
  manager_status, manager,
  bundle_summary, assigned_role_summary,
  last_login, last_refresh,
  correlated, correlated_overridden,
  password, password_expiration, password_history,
  failed_auth_question_attempts, failed_login_attempts, auth_lock_start,
  scorecard
  @IdentityExtendedViewColumns
  )
AS SELECT
  id, created, modified, assigned_scope,assigned_scope_path,
  controls_assigned_scope,
  workgroup, owner,
  name, display_name,
  firstname, lastname, email,inactive,
  manager_status, manager,
  bundle_summary, assigned_role_summary,
  last_login, last_refresh,
  correlated, correlated_overridden,
  password, password_expiration, password_history,
  failed_auth_question_attempts, failed_login_attempts, auth_lock_start,
  scorecard
  @IdentityExtendedColumns
FROM spt_identity;
@BetweenStatements

CREATE VIEW identityiq.spv_link
  (id, created, modified,
  identity_id, display_name, assigned_scope,assigned_scope_path,
  application, instance, native_identity,
  manually_correlated, entitlements,
  last_refresh, last_target_aggregation,
  key1, key2, key3, key4
  @LinkExtendedViewColumns
  )
AS SELECT
  id, created, modified,
  identity_id, display_name, assigned_scope,assigned_scope_path,
  application, instance, native_identity,
  manually_correlated, entitlements,
  last_refresh, last_target_aggregation,
  key1, key2, key3, key4
  @LinkExtendedColumns
FROM spt_link;
@BetweenStatements

CREATE VIEW identityiq.spv_role
  (id, created, modified,
  name, display_name, displayable_name,
  disabled, activation_date, deactivation_date,
  owner, type, scorecard, role_index,
  pending_workflow, or_profiles,
  assigned_scope,assigned_scope_path
  @RoleExtendedViewColumns
  )
AS SELECT
  id, created, modified,
  name, display_name, displayable_name,
  disabled, activation_date, deactivation_date,
  owner, type, scorecard, role_index,
  pending_workflow, or_profiles,
  assigned_scope,assigned_scope_path
  @RoleExtendedColumns
FROM spt_bundle;
@BetweenStatements

CREATE VIEW identityiq.spv_managed_attribute
  (id, created, modified,
  owner, assigned_scope, assigned_scope_path,
  application, type, purview,
  aggregated, attribute, value,
  display_name, displayable_name,
  requestable, uncorrelated,
  last_refresh, last_target_aggregation,
  key1, key2, key3, key4
  @ManagedAttributeExtendedViewColumns
  )
AS SELECT
  id, created, modified,
  owner, assigned_scope,  assigned_scope_path,
  application, type, purview,
  aggregated, attribute, value,
  display_name, displayable_name,
  requestable, uncorrelated,
  last_refresh, last_target_aggregation,
  key1, key2, key3, key4
  @ManagedAttributeExtendedColumns
FROM spt_managed_attribute;
@BetweenStatements

CREATE VIEW identityiq.spv_application
  (
    id, created, modified,
    owner, assigned_scope,assigned_scope_path,
    name, type, scorecard,
    connector, features_string, authoritative, logical,
    authentication_resource, supports_provisioning, supports_authenticate,
    app_cluster
    @ApplicationExtendedViewColumns
  )
AS SELECT
  id, created, modified,
  owner, assigned_scope,assigned_scope_path,
  name, type, scorecard,
  connector, features_string, authoritative, logical,
  authentication_resource, supports_provisioning, supports_authenticate,
  app_cluster
  @ApplicationExtendedColumns
FROM spt_application;
@BetweenStatements

CREATE VIEW identityiq.spv_certification_item
(
  id, created, modified,
  assigned_scope, assigned_scope_path,
  certification_entity_id, type,
  action, delegation, challenge,
  completed, summary_status, continuous_state,
  last_decision, next_continuous_state_change, overdue_date,
  has_differences, action_required,
  target_id, target_name, target_display_name,
  custom1, custom2, custom_map,
  role, sub_type, violation_summary,
  exception_entitlements,
  reminders_sent, next_phase_transition, finished_date, wake_up_date
  @CertItemExtendedViewColumns
)
AS SELECT
  id, created, modified,
  assigned_scope, assigned_scope_path,
  certification_entity_id, type,
  action, delegation, challenge,
  completed, summary_status, continuous_state,
  last_decision, next_continuous_state_change, overdue_date,
  has_differences, action_required,
  target_id, target_name, target_display_name,
  custom1, custom2, custom_map,
  bundle, sub_type, violation_summary,
  exception_entitlements,
  reminders_sent, next_phase_transition, finished_date, wake_up_date
  @CertItemExtendedColumns
FROM spt_certification_item;
@BetweenStatements
