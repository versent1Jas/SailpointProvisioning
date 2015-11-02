
    create table identityiq.spt_account_group (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128),
        description varchar(1024),
        native_identity varchar(322),
        reference_attribute varchar(128),
        member_attribute varchar(128),
        last_refresh bigint,
        last_target_aggregation bigint,
        uncorrelated smallint,
        application varchar(128),
        attributes clob(17000000),
        key1 varchar(128),
        key2 varchar(128),
        key3 varchar(128),
        key4 varchar(128),
        native_identity_ci generated always as (upper(native_identity)),
        key1_ci generated always as (upper(key1)),
        key3_ci generated always as (upper(key3)),
        key2_ci generated always as (upper(key2)),
        name_ci generated always as (upper(name)),
        key4_ci generated always as (upper(key4)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_account_group_inheritance (
        account_group varchar(128) not null,
        inherits_from varchar(128) not null,
        idx integer not null,
        primary key (account_group, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_account_group_perms (
        accountgroup varchar(128) not null,
        target varchar(255),
        rights varchar(4000),
        annotation varchar(255),
        idx integer not null,
        primary key (accountgroup, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_account_group_target_perms (
        accountgroup varchar(128) not null,
        target varchar(255),
        rights varchar(4000),
        annotation varchar(255),
        idx integer not null,
        primary key (accountgroup, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_activity_constraint (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(2000),
        description varchar(4000),
        policy varchar(128),
        violation_owner_type varchar(255),
        violation_owner varchar(128),
        violation_owner_rule varchar(128),
        compensating_control clob(17000000),
        disabled smallint,
        weight integer,
        remediation_advice clob(17000000),
        violation_summary clob(17000000),
        identity_filters clob(17000000),
        activity_filters clob(17000000),
        time_periods clob(17000000),
        idx integer,
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_activity_data_source (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128) not null,
        description varchar(1024),
        collector varchar(255),
        type varchar(255),
        configuration clob(17000000),
        last_refresh bigint,
        targets clob(17000000),
        correlation_rule varchar(128),
        transformation_rule varchar(128),
        application varchar(128),
        idx integer,
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_activity_time_periods (
        application_activity varchar(128) not null,
        time_period varchar(128) not null,
        idx integer not null,
        primary key (application_activity, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_app_dependencies (
        application varchar(128) not null,
        dependency varchar(128) not null,
        idx integer not null,
        primary key (application, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_app_secondary_owners (
        application varchar(128) not null,
        elt varchar(128) not null,
        idx integer not null,
        primary key (application, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_application (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        extended1 varchar(450),
        extended2 varchar(450),
        extended3 varchar(450),
        extended4 varchar(450),
        name varchar(128) not null unique,
        proxied_name varchar(128),
        app_cluster varchar(255),
        icon varchar(255),
        connector varchar(255),
        type varchar(255),
        features_string varchar(512),
        profile_class varchar(255),
        authentication_resource smallint,
        case_insensitive smallint,
        authoritative smallint,
        logical smallint,
        supports_provisioning smallint,
        supports_authenticate smallint,
        supports_account_only smallint,
        supports_additional_accounts smallint,
        no_aggregation smallint,
        sync_provisioning smallint,
        attributes clob(17000000),
        templates clob(17000000),
        provisioning_config clob(17000000),
        manages_other_apps smallint not null,
        proxy varchar(128),
        correlation_rule varchar(128),
        creation_rule varchar(128),
        manager_correlation_rule varchar(128),
        customization_rule varchar(128),
        managed_attr_customize_rule varchar(128),
        account_correlation_config varchar(128),
        scorecard varchar(128),
        target_source varchar(128),
        name_ci generated always as (upper(name)),
        extended1_ci generated always as (upper(extended1)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_application_activity (
        id varchar(128) not null,
        time_stamp bigint,
        source_application varchar(128),
        action varchar(255),
        result varchar(255),
        data_source varchar(128),
        instance varchar(128),
        username varchar(128),
        target varchar(128),
        info varchar(512),
        identity_id varchar(128),
        identity_name varchar(128),
        assigned_scope varchar(128),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_application_remediators (
        application varchar(128) not null,
        elt varchar(128) not null,
        idx integer not null,
        primary key (application, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_application_schema (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128),
        object_type varchar(255),
        native_object_type varchar(255),
        identity_attribute varchar(255),
        display_attribute varchar(255),
        instance_attribute varchar(255),
        group_attribute varchar(255),
        hierarchy_attribute varchar(255),
        reference_attribute varchar(255),
        include_permissions smallint,
        perm_remed_mod_type varchar(255),
        config clob(17000000),
        features_string varchar(512),
        application varchar(128),
        idx integer,
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_application_scorecard (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        incomplete smallint,
        composite_score integer,
        attributes clob(17000000),
        items clob(17000000),
        application_id varchar(128),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_arch_cert_item_apps (
        arch_cert_item_id varchar(128) not null,
        application_name varchar(255),
        idx integer not null,
        primary key (arch_cert_item_id, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_archived_cert_entity (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        entity clob(17000000),
        reason varchar(255),
        explanation clob(17000000),
        certification_id varchar(128),
        target_name varchar(255),
        identity_name varchar(255),
        account_group varchar(255),
        application varchar(255),
        native_identity varchar(322),
        reference_attribute varchar(255),
        schema_object_type varchar(255),
        target_id varchar(255),
        target_display_name varchar(255),
        account_group_ci generated always as (upper(account_group)),
        target_name_ci generated always as (upper(target_name)),
        identity_name_ci generated always as (upper(identity_name)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_archived_cert_item (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        type varchar(255),
        sub_type varchar(255),
        item_id varchar(128),
        exception_application varchar(128),
        exception_attribute_name varchar(255),
        exception_attribute_value varchar(2048),
        exception_permission_target varchar(255),
        exception_permission_right varchar(255),
        exception_native_identity varchar(256),
        constraint_name varchar(2000),
        policy varchar(256),
        bundle varchar(255),
        violation_summary varchar(256),
        entitlements clob(17000000),
        parent_id varchar(128),
        target_display_name varchar(255),
        target_name varchar(255),
        target_id varchar(255),
        idx integer,
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_audit_config (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128) not null unique,
        disabled smallint,
        classes clob(17000000),
        attributes clob(17000000),
        actions clob(17000000),
        name_ci generated always as (upper(name)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_audit_event (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        interface varchar(128),
        source varchar(128),
        action varchar(128),
        target varchar(255),
        application varchar(128),
        account_name varchar(256),
        instance varchar(128),
        attribute_name varchar(128),
        attribute_value varchar(450),
        tracking_id varchar(128),
        attributes clob(17000000),
        string1 varchar(255),
        string2 varchar(255),
        string3 varchar(255),
        string4 varchar(255),
        interface_ci generated always as (upper(interface)),
        instance_ci generated always as (upper(instance)),
        application_ci generated always as (upper(application)),
        source_ci generated always as (upper(source)),
        target_ci generated always as (upper(target)),
        attribute_value_ci generated always as (upper(attribute_value)),
        attribute_name_ci generated always as (upper(attribute_name)),
        account_name_ci generated always as (upper(account_name)),
        tracking_id_ci generated always as (upper(tracking_id)),
        action_ci generated always as (upper(action)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_authentication_answer (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        identity_id varchar(128),
        question_id varchar(128),
        answer varchar(512),
        idx integer,
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_authentication_question (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        question varchar(1024),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_batch_request (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        file_name varchar(255),
        header varchar(255),
        run_date bigint,
        completed_date bigint,
        record_count integer,
        completed_count integer,
        error_count integer,
        invalid_count integer,
        message varchar(4000),
        file_contents clob(17000000),
        status varchar(255),
        run_config clob(17000000),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_batch_request_item (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        request_data varchar(255),
        status varchar(255),
        message varchar(4000),
        result varchar(255),
        identity_request_id varchar(255),
        target_identity_id varchar(255),
        batch_request_id varchar(128),
        idx integer,
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_bundle (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        extended1 varchar(450),
        extended2 varchar(450),
        extended3 varchar(450),
        extended4 varchar(450),
        name varchar(128) not null unique,
        display_name varchar(128),
        displayable_name varchar(128),
        disabled smallint,
        risk_score_weight integer,
        activity_config clob(17000000),
        mining_statistics clob(17000000),
        attributes clob(17000000),
        type varchar(128),
        join_rule varchar(128),
        pending_workflow varchar(128),
        role_index varchar(128),
        selector clob(17000000),
        provisioning_plan clob(17000000),
        templates clob(17000000),
        or_profiles smallint,
        activation_date bigint,
        deactivation_date bigint,
        scorecard varchar(128),
        pending_delete smallint,
        name_ci generated always as (upper(name)),
        extended1_ci generated always as (upper(extended1)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_bundle_archive (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128),
        source_id varchar(128),
        version integer,
        creator varchar(128),
        archive clob(17000000),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_bundle_children (
        bundle varchar(128) not null,
        child varchar(128) not null,
        idx integer not null,
        primary key (bundle, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_bundle_permits (
        bundle varchar(128) not null,
        child varchar(128) not null,
        idx integer not null,
        primary key (bundle, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_bundle_requirements (
        bundle varchar(128) not null,
        child varchar(128) not null,
        idx integer not null,
        primary key (bundle, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_capability (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128) not null unique,
        description varchar(1024),
        display_name varchar(128),
        applies_to_analyzer smallint,
        name_ci generated always as (upper(name)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_capability_children (
        capability_id varchar(128) not null,
        child_id varchar(128) not null,
        idx integer not null,
        primary key (capability_id, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_capability_rights (
        capability_id varchar(128) not null,
        right_id varchar(128) not null,
        idx integer not null,
        primary key (capability_id, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_category (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128) not null unique,
        targets clob(17000000),
        name_ci generated always as (upper(name)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_cert_action_assoc (
        parent_id varchar(128) not null,
        child_id varchar(128) not null,
        idx integer not null,
        primary key (parent_id, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_cert_item_applications (
        certification_item_id varchar(128) not null,
        application_name varchar(255),
        idx integer not null,
        primary key (certification_item_id, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_certification (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        attributes clob(17000000),
        iiqlock varchar(128),
        name varchar(256),
        short_name varchar(255),
        description varchar(1024),
        creator varchar(255),
        complete smallint,
        complete_hierarchy smallint,
        signed bigint,
        approver_rule varchar(512),
        finished bigint,
        expiration bigint,
        automatic_closing_date bigint,
        application_id varchar(255),
        manager varchar(255),
        group_definition varchar(512),
        group_definition_id varchar(128),
        group_definition_name varchar(255),
        comments clob(8192),
        error clob(8192),
        entities_to_refresh clob(17000000),
        commands clob(17000000),
        activated bigint,
        total_entities integer,
        excluded_entities integer,
        completed_entities integer,
        delegated_entities integer,
        percent_complete integer,
        certified_entities integer,
        cert_req_entities integer,
        overdue_entities integer,
        total_items integer,
        excluded_items integer,
        completed_items integer,
        delegated_items integer,
        item_percent_complete integer,
        certified_items integer,
        cert_req_items integer,
        overdue_items integer,
        remediations_kicked_off integer,
        remediations_completed integer,
        total_violations integer not null,
        violations_allowed integer not null,
        violations_remediated integer not null,
        violations_acknowledged integer not null,
        total_roles integer not null,
        roles_approved integer not null,
        roles_allowed integer not null,
        roles_remediated integer not null,
        total_exceptions integer not null,
        exceptions_approved integer not null,
        exceptions_allowed integer not null,
        exceptions_remediated integer not null,
        total_grp_perms integer not null,
        grp_perms_approved integer not null,
        grp_perms_remediated integer not null,
        total_grp_memberships integer not null,
        grp_memberships_approved integer not null,
        grp_memberships_remediated integer not null,
        total_accounts integer not null,
        accounts_approved integer not null,
        accounts_allowed integer not null,
        accounts_remediated integer not null,
        total_profiles integer not null,
        profiles_approved integer not null,
        profiles_remediated integer not null,
        total_scopes integer not null,
        scopes_approved integer not null,
        scopes_remediated integer not null,
        total_capabilities integer not null,
        capabilities_approved integer not null,
        capabilities_remediated integer not null,
        total_permits integer not null,
        permits_approved integer not null,
        permits_remediated integer not null,
        total_requirements integer not null,
        requirements_approved integer not null,
        requirements_remediated integer not null,
        total_hierarchies integer not null,
        hierarchies_approved integer not null,
        hierarchies_remediated integer not null,
        type varchar(255),
        task_schedule_id varchar(255),
        trigger_id varchar(128),
        certification_definition_id varchar(128),
        phase varchar(255),
        next_phase_transition bigint,
        phase_config clob(17000000),
        process_revokes_immediately smallint,
        next_remediation_scan bigint,
        entitlement_granularity varchar(255),
        bulk_reassignment smallint,
        continuous smallint,
        continuous_config clob(17000000),
        next_cert_required_scan bigint,
        next_overdue_scan bigint,
        exclude_inactive smallint,
        parent varchar(128),
        immutable smallint,
        electronically_signed smallint,
        idx integer,
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_certification_action (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        owner_name varchar(255),
        email_template varchar(255),
        comments clob(8192),
        expiration timestamp,
        work_item varchar(255),
        completion_state varchar(255),
        completion_comments clob(8192),
        completion_user varchar(128),
        actor_name varchar(128),
        actor_display_name varchar(128),
        acting_work_item varchar(255),
        description varchar(1024),
        status varchar(255),
        decision_date bigint,
        decision_certification_id varchar(128),
        reviewed smallint,
        bulk_certified smallint,
        mitigation_expiration bigint,
        remediation_action varchar(255),
        remediation_details clob(17000000),
        additional_actions clob(17000000),
        revoke_account smallint,
        ready_for_remediation smallint,
        remediation_kicked_off smallint,
        remediation_completed smallint,
        source_action varchar(128),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_certification_archive (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128),
        certification_id varchar(255),
        certification_group_id varchar(255),
        signed bigint,
        expiration bigint,
        creator varchar(128),
        comments clob(8192),
        archive clob(17000000),
        immutable smallint,
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_certification_challenge (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        owner_name varchar(255),
        email_template varchar(255),
        comments clob(8192),
        expiration timestamp,
        work_item varchar(255),
        completion_state varchar(255),
        completion_comments clob(8192),
        completion_user varchar(128),
        actor_name varchar(128),
        actor_display_name varchar(128),
        acting_work_item varchar(255),
        description varchar(1024),
        challenged smallint,
        decision varchar(255),
        decision_comments clob(8192),
        decider_name varchar(255),
        challenge_decision_expired smallint,
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_certification_def_tags (
        cert_def_id varchar(128) not null,
        elt varchar(128) not null,
        idx integer not null,
        primary key (cert_def_id, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_certification_definition (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(255) not null unique,
        description varchar(1024),
        attributes clob(17000000),
        name_ci generated always as (upper(name)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_certification_delegation (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        owner_name varchar(255),
        email_template varchar(255),
        comments clob(8192),
        expiration timestamp,
        work_item varchar(255),
        completion_state varchar(255),
        completion_comments clob(8192),
        completion_user varchar(128),
        actor_name varchar(128),
        actor_display_name varchar(128),
        acting_work_item varchar(255),
        description varchar(1024),
        review_required smallint,
        revoked smallint,
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_certification_entity (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        action varchar(128),
        delegation varchar(128),
        completed bigint,
        summary_status varchar(255),
        continuous_state varchar(255),
        last_decision bigint,
        next_continuous_state_change bigint,
        overdue_date bigint,
        has_differences smallint,
        action_required smallint,
        target_display_name varchar(255),
        target_name varchar(255),
        target_id varchar(255),
        custom1 varchar(450),
        custom2 varchar(450),
        custom_map clob(17000000),
        type varchar(255),
        bulk_certified smallint,
        attributes clob(17000000),
        identity_id varchar(255),
        firstname varchar(255),
        lastname varchar(255),
        composite_score integer,
        snapshot_id varchar(255),
        differences clob(17000000),
        new_user smallint,
        account_group varchar(255),
        application varchar(255),
        native_identity varchar(322),
        reference_attribute varchar(255),
        schema_object_type varchar(255),
        certification_id varchar(128),
        idx integer,
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_certification_group (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(256),
        type varchar(255),
        status varchar(255),
        attributes clob(17000000),
        total_certifications integer,
        percent_complete integer,
        completed_certifications integer,
        certification_definition varchar(128),
        messages clob(17000000),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_certification_groups (
        certification_id varchar(128) not null,
        group_id varchar(128) not null,
        idx integer not null,
        primary key (certification_id, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_certification_item (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        action varchar(128),
        delegation varchar(128),
        completed bigint,
        summary_status varchar(255),
        continuous_state varchar(255),
        last_decision bigint,
        next_continuous_state_change bigint,
        overdue_date bigint,
        has_differences smallint,
        action_required smallint,
        target_display_name varchar(255),
        target_name varchar(255),
        target_id varchar(255),
        custom1 varchar(450),
        custom2 varchar(450),
        custom_map clob(17000000),
        bundle varchar(255),
        type varchar(255),
        sub_type varchar(255),
        bundle_assignment_id varchar(128),
        certification_entity_id varchar(128),
        exception_entitlements varchar(128),
        exception_application varchar(128),
        exception_attribute_name varchar(255),
        exception_attribute_value varchar(2048),
        exception_permission_target varchar(255),
        exception_permission_right varchar(255),
        policy_violation clob(17000000),
        violation_summary varchar(256),
        challenge varchar(128),
        wake_up_date bigint,
        reminders_sent integer,
        needs_continuous_flush smallint,
        phase varchar(255),
        next_phase_transition bigint,
        finished_date bigint,
        attributes clob(17000000),
        extended1 varchar(450),
        extended2 varchar(450),
        extended3 varchar(450),
        extended4 varchar(450),
        extended5 varchar(450),
        idx integer,
        extended1_ci generated always as (upper(extended1)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_certification_tags (
        certification_id varchar(128) not null,
        elt varchar(128) not null,
        idx integer not null,
        primary key (certification_id, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_certifiers (
        certification_id varchar(128) not null,
        certifier varchar(255),
        idx integer not null,
        primary key (certification_id, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_child_certification_ids (
        certification_archive_id varchar(128) not null,
        child_id varchar(255),
        idx integer not null,
        primary key (certification_archive_id, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_configuration (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128) not null unique,
        description varchar(1024),
        attributes clob(17000000),
        name_ci generated always as (upper(name)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_correlation_config (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128) not null unique,
        description varchar(256),
        attribute_assignments clob(17000000),
        direct_assignments clob(17000000),
        name_ci generated always as (upper(name)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_custom (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128),
        description varchar(1024),
        attributes clob(17000000),
        name_ci generated always as (upper(name)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_dashboard_content (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128) not null unique,
        description varchar(1024),
        title varchar(255),
        source varchar(255),
        required smallint,
        region_size varchar(255),
        source_task_id varchar(128),
        type varchar(255),
        parent varchar(128),
        arguments clob(17000000),
        enabling_attributes clob(17000000),
        name_ci generated always as (upper(name)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_dashboard_content_rights (
        dashboard_content_id varchar(128) not null,
        right_id varchar(128) not null,
        idx integer not null,
        primary key (dashboard_content_id, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_dashboard_layout (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128) not null unique,
        type varchar(255),
        regions clob(17000000),
        name_ci generated always as (upper(name)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_dashboard_reference (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        identity_dashboard_id varchar(128),
        content_id varchar(128),
        region varchar(128),
        order_id integer,
        minimized smallint,
        arguments clob(17000000),
        idx integer,
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_database_version (
        name varchar(255) not null,
        system_version varchar(128),
        schema_version varchar(128),
        primary key (name)
    ) IN identityiq_ts;

    create table identityiq.spt_deleted_object (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        uuid varchar(128),
        name varchar(128),
        native_identity varchar(322) not null,
        last_refresh bigint,
        object_type varchar(128),
        application varchar(128),
        attributes clob(17000000),
        name_ci generated always as (upper(name)),
        object_type_ci generated always as (upper(object_type)),
        native_identity_ci generated always as (upper(native_identity)),
        uuid_ci generated always as (upper(uuid)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_dictionary (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_dictionary_term (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        value varchar(128) not null unique,
        dictionary_id varchar(128),
        idx integer,
        value_ci generated always as (upper(value)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_dynamic_scope (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128) not null unique,
        selector clob(17000000),
        allow_all smallint,
        name_ci generated always as (upper(name)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_dynamic_scope_exclusions (
        dynamic_scope_id varchar(128) not null,
        identity_id varchar(128) not null,
        idx integer not null,
        primary key (dynamic_scope_id, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_dynamic_scope_inclusions (
        dynamic_scope_id varchar(128) not null,
        identity_id varchar(128) not null,
        idx integer not null,
        primary key (dynamic_scope_id, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_email_template (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128) not null unique,
        description varchar(1024),
        from_address varchar(255),
        to_address varchar(255),
        cc_address varchar(255),
        bcc_address varchar(255),
        subject varchar(255),
        body clob(17000000),
        signature clob(17000000),
        name_ci generated always as (upper(name)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_email_template_properties (
        id varchar(128) not null,
        value varchar(255),
        name varchar(78) not null,
        primary key (id, name)
    ) IN identityiq_ts;

    create table identityiq.spt_entitlement_group (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128),
        application varchar(128),
        instance varchar(128),
        native_identity varchar(322),
        display_name varchar(128),
        account_only smallint not null,
        attributes clob(17000000),
        identity_id varchar(128),
        idx integer,
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_entitlement_snapshot (
        id varchar(128) not null,
        application varchar(255),
        instance varchar(128),
        native_identity varchar(322),
        display_name varchar(128),
        account_only smallint not null,
        attributes clob(17000000),
        certification_item_id varchar(128),
        idx integer,
        native_identity_ci generated always as (upper(native_identity)),
        application_ci generated always as (upper(application)),
        display_name_ci generated always as (upper(display_name)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_file_bucket (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        file_index integer,
        parent_id varchar(128),
        data blob(1700000),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_form (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128) not null unique,
        description varchar(4000),
        type varchar(255),
        sections clob(17000000),
        buttons clob(17000000),
        attributes clob(17000000),
        hidden smallint,
        name_ci generated always as (upper(name)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_full_text_index (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        name varchar(128) not null unique,
        description varchar(1024),
        iiqlock varchar(128),
        last_refresh bigint,
        attributes clob(17000000),
        name_ci generated always as (upper(name)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_generic_constraint (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(2000),
        description varchar(4000),
        policy varchar(128),
        violation_owner_type varchar(255),
        violation_owner varchar(128),
        violation_owner_rule varchar(128),
        compensating_control clob(17000000),
        disabled smallint,
        weight integer,
        remediation_advice clob(17000000),
        violation_summary clob(17000000),
        arguments clob(17000000),
        selectors clob(17000000),
        idx integer,
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_group_definition (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(255),
        description varchar(1024),
        filter clob(17000000),
        last_refresh bigint,
        null_group smallint,
        indexed smallint,
        private smallint,
        factory varchar(128),
        group_index varchar(128),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_group_factory (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(255),
        description varchar(1024),
        factory_attribute varchar(255),
        enabled smallint,
        last_refresh bigint,
        group_owner_rule varchar(128),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_group_index (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        incomplete smallint,
        composite_score integer,
        attributes clob(17000000),
        items clob(17000000),
        business_role_score integer,
        raw_business_role_score integer,
        entitlement_score integer,
        raw_entitlement_score integer,
        policy_score integer,
        raw_policy_score integer,
        certification_score integer,
        total_violations integer,
        total_remediations integer,
        total_delegations integer,
        total_mitigations integer,
        total_approvals integer,
        definition varchar(128),
        name varchar(255),
        member_count integer,
        band_count integer,
        band1 integer,
        band2 integer,
        band3 integer,
        band4 integer,
        band5 integer,
        band6 integer,
        band7 integer,
        band8 integer,
        band9 integer,
        band10 integer,
        certifications_due integer,
        certifications_on_time integer,
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_group_permissions (
        entitlement_group_id varchar(128) not null,
        target varchar(255),
        annotation varchar(255),
        rights varchar(4000),
        attributes clob(17000000),
        idx integer not null,
        primary key (entitlement_group_id, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_identity (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        extended1 varchar(450),
        extended2 varchar(450),
        extended3 varchar(450),
        extended4 varchar(450),
        extended5 varchar(450),
        extended6 varchar(450),
        extended7 varchar(450),
        extended8 varchar(450),
        extended9 varchar(450),
        extended10 varchar(450),
        extended_identity1 varchar(128),
        extended_identity2 varchar(128),
        extended_identity3 varchar(128),
        extended_identity4 varchar(128),
        extended_identity5 varchar(128),
        name varchar(128) not null unique,
        description varchar(1024),
        protected smallint,
        iiqlock varchar(128),
        attributes clob(17000000),
        manager varchar(128),
        display_name varchar(128),
        firstname varchar(128),
        lastname varchar(128),
        email varchar(128),
        manager_status smallint,
        inactive smallint,
        last_login bigint,
        last_refresh bigint,
        password varchar(450),
        password_expiration bigint,
        password_history varchar(2000),
        bundle_summary varchar(2000),
        assigned_role_summary varchar(2000),
        correlated smallint,
        correlated_overridden smallint,
        auth_lock_start bigint,
        failed_auth_question_attempts integer,
        failed_login_attempts integer,
        controls_assigned_scope smallint,
        certifications clob(17000000),
        activity_config clob(17000000),
        preferences clob(17000000),
        scorecard varchar(128),
        uipreferences varchar(128),
        attribute_meta_data clob(17000000),
        workgroup smallint,
        name_ci generated always as (upper(name)),
        lastname_ci generated always as (upper(lastname)),
        extended2_ci generated always as (upper(extended2)),
        email_ci generated always as (upper(email)),
        extended1_ci generated always as (upper(extended1)),
        firstname_ci generated always as (upper(firstname)),
        display_name_ci generated always as (upper(display_name)),
        extended4_ci generated always as (upper(extended4)),
        extended3_ci generated always as (upper(extended3)),
        extended5_ci generated always as (upper(extended5)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_identity_archive (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128),
        source_id varchar(128),
        version integer,
        creator varchar(128),
        archive clob(17000000),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_identity_assigned_roles (
        identity_id varchar(128) not null,
        bundle varchar(128) not null,
        idx integer not null,
        primary key (identity_id, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_identity_bundles (
        identity_id varchar(128) not null,
        bundle varchar(128) not null,
        idx integer not null,
        primary key (identity_id, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_identity_capabilities (
        identity_id varchar(128) not null,
        capability_id varchar(128) not null,
        idx integer not null,
        primary key (identity_id, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_identity_controlled_scopes (
        identity_id varchar(128) not null,
        scope_id varchar(128) not null,
        idx integer not null,
        primary key (identity_id, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_identity_dashboard (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128),
        description varchar(1024),
        identity_id varchar(128),
        type varchar(255),
        layout varchar(128),
        arguments clob(17000000),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_identity_entitlement (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        start_date bigint,
        end_date bigint,
        attributes clob(17000000),
        name varchar(255),
        value varchar(450),
        annotation varchar(450),
        display_name varchar(255),
        native_identity varchar(450),
        instance varchar(128),
        application varchar(128),
        identity_id varchar(128) not null,
        aggregation_state varchar(255),
        source varchar(64),
        assigned smallint,
        allowed smallint,
        granted_by_role smallint,
        assigner varchar(128),
        assignment_id varchar(64),
        assignment_note varchar(1024),
        type varchar(255),
        request_item varchar(128),
        pending_request_item varchar(128),
        certification_item varchar(128),
        pending_certification_item varchar(128),
        instance_ci generated always as (upper(instance)),
        name_ci generated always as (upper(name)),
        native_identity_ci generated always as (upper(native_identity)),
        value_ci generated always as (upper(value)),
        source_ci generated always as (upper(source)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_identity_external_attr (
        id varchar(128) not null,
        object_id varchar(64),
        attribute_name varchar(64),
        value varchar(322),
        value_ci generated always as (upper(value)),
        attribute_name_ci generated always as (upper(attribute_name)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_identity_history_item (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        identity_id varchar(128),
        type varchar(255),
        certifiable_descriptor clob(17000000),
        action clob(17000000),
        certification_link clob(17000000),
        comments clob(8192),
        certification_type varchar(255),
        status varchar(255),
        actor varchar(128),
        entry_date bigint,
        application varchar(128),
        instance varchar(128),
        account varchar(128),
        native_identity varchar(256),
        attribute varchar(450),
        value varchar(450),
        policy varchar(255),
        constraint_name varchar(2000),
        role varchar(255),
        attribute_ci generated always as (upper(attribute)),
        account_ci generated always as (upper(account)),
        value_ci generated always as (upper(value)),
        native_identity_ci generated always as (upper(native_identity)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_identity_request (
        id varchar(128) not null,
        name varchar(255),
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        state varchar(255),
        type varchar(255),
        source varchar(255),
        target_id varchar(128),
        target_display_name varchar(255),
        target_class varchar(255),
        requester_display_name varchar(255),
        requester_id varchar(128),
        end_date bigint,
        verified bigint,
        priority varchar(128),
        completion_status varchar(128),
        execution_status varchar(128),
        has_messages smallint not null,
        external_ticket_id varchar(128),
        attributes clob(17000000),
        external_ticket_id_ci generated always as (upper(external_ticket_id)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_identity_request_item (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        start_date bigint,
        end_date bigint,
        attributes clob(17000000),
        name varchar(255),
        value varchar(450),
        annotation varchar(450),
        display_name varchar(255),
        native_identity varchar(450),
        instance varchar(128),
        application varchar(255),
        owner_name varchar(128),
        approver_name varchar(128),
        operation varchar(128),
        retries integer,
        provisioning_engine varchar(255),
        approval_state varchar(128),
        provisioning_state varchar(128),
        compilation_status varchar(128),
        expansion_cause varchar(128),
        identity_request_id varchar(128),
        idx integer,
        name_ci generated always as (upper(name)),
        value_ci generated always as (upper(value)),
        native_identity_ci generated always as (upper(native_identity)),
        instance_ci generated always as (upper(instance)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_identity_role_metadata (
        identity_id varchar(128) not null,
        role_metadata_id varchar(128) not null,
        idx integer not null,
        primary key (identity_id, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_identity_snapshot (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128),
        identity_id varchar(255),
        identity_name varchar(255),
        summary varchar(2000),
        differences varchar(2000),
        applications varchar(2000),
        scorecard clob(17000000),
        attributes clob(17000000),
        bundles clob(17000000),
        exceptions clob(17000000),
        links clob(17000000),
        violations clob(17000000),
        assigned_roles clob(17000000),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_identity_trigger (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(256),
        description varchar(1024),
        disabled smallint,
        type varchar(255),
        rule_id varchar(128),
        attribute_name varchar(256),
        old_value_filter varchar(256),
        new_value_filter varchar(256),
        selector clob(17000000),
        handler varchar(256),
        parameters clob(17000000),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_identity_workgroups (
        identity_id varchar(128) not null,
        workgroup varchar(128) not null,
        idx integer not null,
        primary key (identity_id, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_integration_config (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128) not null unique,
        description varchar(4000),
        executor varchar(255),
        exec_style varchar(255),
        role_sync_style varchar(255),
        template smallint,
        signature clob(17000000),
        attributes clob(17000000),
        plan_initializer varchar(128),
        resources clob(17000000),
        application_id varchar(128),
        role_sync_filter clob(4000),
        container_id varchar(128),
        name_ci generated always as (upper(name)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_jasper_files (
        result varchar(128) not null,
        elt varchar(128) not null,
        idx integer not null,
        primary key (result, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_jasper_page_bucket (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        bucket_number integer,
        handler_id varchar(128),
        xml clob(1073741823),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_jasper_result (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        handler_id varchar(128),
        print_xml clob(1073741823),
        page_count integer,
        pages_per_bucket integer,
        handler_page_count integer,
        attributes clob(17000000),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_jasper_template (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128) not null unique,
        design_xml clob(1073741823),
        name_ci generated always as (upper(name)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_link (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        key1 varchar(450),
        key2 varchar(255),
        key3 varchar(255),
        key4 varchar(255),
        extended1 varchar(450),
        extended2 varchar(450),
        extended3 varchar(450),
        extended4 varchar(450),
        extended5 varchar(450),
        uuid varchar(128),
        display_name varchar(128),
        instance varchar(128),
        native_identity varchar(322) not null,
        last_refresh bigint,
        last_target_aggregation bigint,
        manually_correlated smallint,
        entitlements smallint not null,
        identity_id varchar(128),
        application varchar(128),
        attributes clob(17000000),
        password_history varchar(2000),
        component_ids varchar(256),
        attribute_meta_data clob(17000000),
        idx integer,
        key1_ci generated always as (upper(key1)),
        extended1_ci generated always as (upper(extended1)),
        display_name_ci generated always as (upper(display_name)),
        native_identity_ci generated always as (upper(native_identity)),
        uuid_ci generated always as (upper(uuid)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_link_external_attr (
        id varchar(128) not null,
        object_id varchar(64),
        attribute_name varchar(64),
        value varchar(322),
        value_ci generated always as (upper(value)),
        attribute_name_ci generated always as (upper(attribute_name)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_localized_attribute (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        name varchar(255),
        locale varchar(128),
        attribute varchar(128),
        value varchar(1024),
        target_class varchar(255),
        target_name varchar(255),
        target_id varchar(255),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_managed_attr_inheritance (
        managedattribute varchar(128) not null,
        inherits_from varchar(128) not null,
        idx integer not null,
        primary key (managedattribute, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_managed_attr_perms (
        managedattribute varchar(128) not null,
        target varchar(255),
        rights varchar(4000),
        annotation varchar(255),
        attributes clob(17000000),
        idx integer not null,
        primary key (managedattribute, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_managed_attr_target_perms (
        managedattribute varchar(128) not null,
        target varchar(255),
        rights varchar(4000),
        annotation varchar(255),
        attributes clob(17000000),
        idx integer not null,
        primary key (managedattribute, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_managed_attribute (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        extended1 varchar(450),
        extended2 varchar(450),
        extended3 varchar(450),
        purview varchar(128),
        application varchar(128),
        type varchar(255),
        aggregated smallint,
        attribute varchar(322),
        value varchar(450),
        display_name varchar(450),
        displayable_name varchar(450),
        uuid varchar(128),
        attributes clob(17000000),
        requestable smallint,
        uncorrelated smallint,
        last_refresh bigint,
        last_target_aggregation bigint,
        key1 varchar(128),
        key2 varchar(128),
        key3 varchar(128),
        key4 varchar(128),
        attribute_ci generated always as (upper(attribute)),
        key4_ci generated always as (upper(key4)),
        uuid_ci generated always as (upper(uuid)),
        extended3_ci generated always as (upper(extended3)),
        key3_ci generated always as (upper(key3)),
        key1_ci generated always as (upper(key1)),
        key2_ci generated always as (upper(key2)),
        value_ci generated always as (upper(value)),
        extended2_ci generated always as (upper(extended2)),
        displayable_name_ci generated always as (upper(displayable_name)),
        extended1_ci generated always as (upper(extended1)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_message_template (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128) not null unique,
        description varchar(1024),
        text clob(100000),
        name_ci generated always as (upper(name)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_mining_config (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128) not null unique,
        description varchar(1024),
        arguments clob(17000000),
        name_ci generated always as (upper(name)),
        app_constraints clob(17000000),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_mitigation_expiration (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        expiration bigint not null,
        mitigator varchar(128) not null,
        comments clob(8192),
        identity_id varchar(128),
        certification_link clob(17000000),
        certifiable_descriptor clob(17000000),
        action varchar(255),
        action_parameters clob(17000000),
        last_action_date bigint,
        role_name varchar(128),
        policy varchar(128),
        constraint_name varchar(2000),
        application varchar(128),
        instance varchar(128),
        native_identity varchar(322),
        account_display_name varchar(128),
        attribute_name varchar(450),
        attribute_value varchar(450),
        permission smallint,
        idx integer,
        attribute_name_ci generated always as (upper(attribute_name)),
        attribute_value_ci generated always as (upper(attribute_value)),
        native_identity_ci generated always as (upper(native_identity)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_object_config (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128) not null unique,
        object_attributes clob(17000000),
        config_attributes clob(17000000),
        name_ci generated always as (upper(name)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_partition_result (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        stack clob(17000000),
        attributes clob(17000000),
        launcher varchar(255),
        host varchar(255),
        launched bigint,
        completed bigint,
        progress varchar(255),
        percent_complete integer,
        type varchar(255),
        messages clob(17000000),
        task_result varchar(128),
        name varchar(255) not null unique,
        task_terminated smallint,
        completion_status varchar(255),
        name_ci generated always as (upper(name)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_password_policy (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        name varchar(128) not null unique,
        description varchar(512),
        name_ci generated always as (upper(name)),
        password_constraints clob(17000000),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_password_policy_holder (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        policy varchar(128),
        selector clob(17000000),
        application varchar(128),
        idx integer,
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_persisted_file (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(256),
        description varchar(1024),
        content_type varchar(128),
        content_length bigint,
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_policy (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128) not null unique,
        template smallint,
        type varchar(255),
        type_key varchar(255),
        executor varchar(255),
        config_page varchar(255),
        certification_actions varchar(255),
        violation_owner_type varchar(255),
        violation_owner varchar(128),
        violation_owner_rule varchar(128),
        state varchar(255),
        arguments clob(17000000),
        signature clob(17000000),
        alert clob(17000000),
        name_ci generated always as (upper(name)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_policy_violation (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(2000),
        description varchar(4000),
        identity_id varchar(128),
        pending_workflow varchar(128),
        renderer varchar(255),
        active smallint,
        policy_id varchar(255),
        policy_name varchar(255),
        constraint_id varchar(255),
        status varchar(255),
        constraint_name varchar(2000),
        left_bundles clob(8192),
        right_bundles clob(8192),
        activity_id varchar(255),
        bundles_marked_for_remediation clob(8192),
        entitlements_marked_for_remed clob(8192),
        mitigator varchar(255),
        arguments clob(17000000),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_process (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128) not null unique,
        description varchar(1024),
        name_ci generated always as (upper(name)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_process_application (
        process varchar(128) not null,
        application varchar(128) not null,
        idx integer not null,
        primary key (process, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_process_bundles (
        process varchar(128) not null,
        elt varchar(128) not null,
        idx integer not null,
        primary key (process, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_process_log (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        process_name varchar(128),
        case_id varchar(128),
        workflow_case_name varchar(450),
        launcher varchar(128),
        case_status varchar(128),
        step_name varchar(128),
        approval_name varchar(128),
        owner_name varchar(128),
        start_time bigint,
        end_time bigint,
        step_duration integer,
        escalations integer,
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_profile (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128),
        description varchar(1024),
        bundle_id varchar(128),
        disabled smallint,
        account_type varchar(128),
        application varchar(128),
        attributes clob(17000000),
        idx integer,
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_profile_constraints (
        profile varchar(128) not null,
        elt clob(17000000),
        idx integer not null,
        primary key (profile, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_profile_permissions (
        profile varchar(128) not null,
        target varchar(255),
        rights varchar(4000),
        attributes clob(17000000),
        idx integer not null,
        primary key (profile, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_provisioning_request (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        identity_id varchar(128),
        target varchar(128),
        requester varchar(128),
        expiration bigint,
        provisioning_plan clob(17000000),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_quick_link (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128) not null unique,
        message_key varchar(128),
        action varchar(128),
        icon varchar(128),
        allow_bulk smallint,
        hidden smallint,
        category varchar(128),
        ordering integer,
        arguments clob(17000000),
        name_ci generated always as (upper(name)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_quick_link_dynamic_scopes (
        quick_link_id varchar(128) not null,
        dynamic_scope_id varchar(128) not null,
        idx integer not null,
        primary key (quick_link_id, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_remediation_item (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        description varchar(1024),
        remediation_entity_type varchar(255),
        work_item_id varchar(128),
        certification_item varchar(255),
        assignee varchar(128),
        remediation_identity varchar(255),
        remediation_details clob(17000000),
        completion_comments clob(8192),
        completion_date bigint,
        assimilated smallint,
        comments clob(17000000),
        idx integer,
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_remote_login_token (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128) not null,
        creator varchar(128) not null,
        remote_host varchar(128),
        expiration bigint,
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_request (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        stack clob(17000000),
        attributes clob(17000000),
        launcher varchar(255),
        host varchar(255),
        launched bigint,
        completed bigint,
        progress varchar(255),
        percent_complete integer,
        type varchar(255),
        messages clob(17000000),
        expiration bigint,
        name varchar(450),
        definition varchar(128),
        task_result varchar(128),
        phase integer,
        dependent_phase integer,
        next_launch bigint,
        retry_count integer,
        retry_interval integer,
        string1 varchar(2048),
        completion_status varchar(255),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_request_arguments (
        signature varchar(128) not null,
        name varchar(255),
        type varchar(255),
        filter_string varchar(255),
        description clob(8192),
        prompt clob(8192),
        multi smallint,
        required smallint,
        idx integer not null,
        primary key (signature, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_request_definition (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128) not null unique,
        description varchar(4000),
        executor varchar(255),
        form_path varchar(128),
        template smallint,
        hidden smallint,
        result_expiration integer,
        progress_interval integer,
        sub_type varchar(128),
        type varchar(255),
        progress_mode varchar(255),
        arguments clob(17000000),
        parent varchar(128),
        retry_max integer,
        retry_interval integer,
        sig_description clob(8192),
        return_type varchar(255),
        name_ci generated always as (upper(name)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_request_definition_rights (
        request_definition_id varchar(128) not null,
        right_id varchar(128) not null,
        idx integer not null,
        primary key (request_definition_id, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_request_returns (
        signature varchar(128) not null,
        name varchar(255),
        type varchar(255),
        filter_string varchar(255),
        description clob(8192),
        prompt clob(8192),
        multi smallint,
        idx integer not null,
        primary key (signature, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_resource_event (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        application varchar(128),
        provisioning_plan clob(17000000),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_right (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128) not null unique,
        description varchar(1024),
        display_name varchar(128),
        name_ci generated always as (upper(name)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_right_config (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128) not null unique,
        rights clob(17000000),
        name_ci generated always as (upper(name)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_role_change_event (
        id varchar(128) not null,
        created bigint,
        bundle_id varchar(128),
        provisioning_plan clob(17000000),
        bundle_deleted smallint,
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_role_index (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        incomplete smallint,
        composite_score integer,
        attributes clob(17000000),
        items clob(17000000),
        bundle varchar(128),
        assigned_count integer,
        detected_count integer,
        associated_to_role smallint,
        last_certified_membership bigint,
        last_certified_composition bigint,
        last_assigned bigint,
        entitlement_count integer,
        entitlement_count_inheritance integer,
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_role_metadata (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        role varchar(128),
        name varchar(255),
        additional_entitlements smallint,
        missing_required smallint,
        assigned smallint,
        detected smallint,
        detected_exception smallint,
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_role_mining_result (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128),
        pending smallint,
        config clob(17000000),
        roles clob(17000000),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_role_scorecard (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        role_id varchar(128),
        members integer,
        members_extra_ent integer,
        members_missing_req integer,
        detected integer,
        detected_exc integer,
        provisioned_ent integer,
        permitted_ent integer,
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_rule (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128) not null unique,
        description varchar(1024),
        language varchar(255),
        source clob(17000000),
        type varchar(255),
        attributes clob(17000000),
        sig_description clob(8192),
        return_type varchar(255),
        name_ci generated always as (upper(name)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_rule_dependencies (
        rule_id varchar(128) not null,
        dependency varchar(128) not null,
        idx integer not null,
        primary key (rule_id, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_rule_registry (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128) not null unique,
        templates clob(17000000),
        name_ci generated always as (upper(name)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_rule_registry_callouts (
        rule_registry_id varchar(128) not null,
        rule_id varchar(128) not null,
        callout varchar(78) not null,
        primary key (rule_registry_id, callout)
    ) IN identityiq_ts;

    create table identityiq.spt_rule_signature_arguments (
        signature varchar(128) not null,
        name varchar(255),
        type varchar(255),
        filter_string varchar(255),
        description clob(8192),
        prompt clob(8192),
        multi smallint,
        idx integer not null,
        primary key (signature, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_rule_signature_returns (
        signature varchar(128) not null,
        name varchar(255),
        type varchar(255),
        filter_string varchar(255),
        description clob(8192),
        prompt clob(8192),
        multi smallint,
        idx integer not null,
        primary key (signature, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_schema_attributes (
        applicationschema varchar(128) not null,
        name varchar(255),
        type varchar(255),
        description clob(8192),
        required smallint,
        entitlement smallint,
        is_group smallint,
        managed smallint,
        multi_valued smallint,
        minable smallint,
        correlation_key integer,
        source varchar(255),
        internal_name varchar(255),
        default_value varchar(255),
        remed_mod_type varchar(255),
        schema_object_type varchar(255),
        idx integer not null,
        primary key (applicationschema, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_scope (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128) not null,
        display_name varchar(128),
        parent_id varchar(128),
        manually_created smallint,
        dormant smallint,
        path varchar(450),
        dirty smallint,
        idx integer,
        name_ci generated always as (upper(name)),
        display_name_ci generated always as (upper(display_name)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_score_config (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128) not null unique,
        maximum_score integer,
        maximum_number_of_bands integer,
        application_configs clob(17000000),
        identity_scores clob(17000000),
        application_scores clob(17000000),
        bands clob(17000000),
        right_config varchar(128),
        name_ci generated always as (upper(name)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_scorecard (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        incomplete smallint,
        composite_score integer,
        attributes clob(17000000),
        items clob(17000000),
        business_role_score integer,
        raw_business_role_score integer,
        entitlement_score integer,
        raw_entitlement_score integer,
        policy_score integer,
        raw_policy_score integer,
        certification_score integer,
        total_violations integer,
        total_remediations integer,
        total_delegations integer,
        total_mitigations integer,
        total_approvals integer,
        identity_id varchar(128),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_server (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        name varchar(128) not null unique,
        heartbeat bigint,
        inactive smallint,
        attributes clob(17000000),
        name_ci generated always as (upper(name)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_service_definition (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        name varchar(128) not null unique,
        description varchar(1024),
        executor varchar(255),
        exec_interval integer,
        hosts varchar(255),
        attributes clob(17000000),
        name_ci generated always as (upper(name)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_service_status (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        name varchar(128) not null unique,
        description varchar(1024),
        definition varchar(128),
        host varchar(255),
        last_start bigint,
        last_end bigint,
        attributes clob(17000000),
        name_ci generated always as (upper(name)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_sign_off_history (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        sign_date bigint,
        signer_id varchar(128),
        signer_name varchar(128),
        signer_display_name varchar(128),
        application varchar(128),
        account varchar(128),
        text clob(17000000),
        electronic_sign smallint,
        certification_id varchar(128),
        idx integer,
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_snapshot_permissions (
        snapshot varchar(128) not null,
        target varchar(255),
        rights varchar(4000),
        attributes clob(17000000),
        idx integer not null,
        primary key (snapshot, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_sodconstraint (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(2000),
        description varchar(4000),
        policy varchar(128),
        violation_owner_type varchar(255),
        violation_owner varchar(128),
        violation_owner_rule varchar(128),
        compensating_control clob(17000000),
        disabled smallint,
        weight integer,
        remediation_advice clob(17000000),
        violation_summary clob(17000000),
        arguments clob(17000000),
        idx integer,
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_sodconstraint_left (
        sodconstraint varchar(128) not null,
        businessrole varchar(128) not null,
        idx integer not null,
        primary key (sodconstraint, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_sodconstraint_right (
        sodconstraint varchar(128) not null,
        businessrole varchar(128) not null,
        idx integer not null,
        primary key (sodconstraint, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_sync_roles (
        config varchar(128) not null,
        bundle varchar(128) not null,
        idx integer not null,
        primary key (config, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_syslog_event (
        id varchar(128) not null,
        created bigint,
        quick_key varchar(12),
        event_level varchar(6),
        classname varchar(128),
        line_number varchar(6),
        message varchar(450),
        thread varchar(128),
        server varchar(128),
        username varchar(128),
        stacktrace clob(17000000),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_tag (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128) not null unique,
        name_ci generated always as (upper(name)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_target (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(512),
        native_owner_id varchar(128),
        application varchar(128),
        target_source varchar(128),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_target_association (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        target_id varchar(128),
        type varchar(255),
        rights varchar(512),
        object_id varchar(322),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_target_source (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128),
        description varchar(1024),
        collector varchar(255),
        last_refresh bigint,
        configuration clob(17000000),
        correlation_rule varchar(128),
        creation_rule varchar(128),
        transformation_rule varchar(128),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_target_sources (
        application varchar(128) not null,
        elt varchar(128) not null,
        idx integer not null,
        primary key (application, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_task_definition (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128) not null unique,
        description varchar(4000),
        executor varchar(255),
        form_path varchar(128),
        template smallint,
        hidden smallint,
        result_expiration integer,
        progress_interval integer,
        sub_type varchar(128),
        type varchar(255),
        progress_mode varchar(255),
        arguments clob(17000000),
        parent varchar(128),
        result_renderer varchar(255),
        concurrent smallint,
        deprecated smallint not null,
        result_action varchar(255),
        signoff_config varchar(128),
        sig_description clob(8192),
        return_type varchar(255),
        name_ci generated always as (upper(name)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_task_definition_rights (
        task_definition_id varchar(128) not null,
        right_id varchar(128) not null,
        idx integer not null,
        primary key (task_definition_id, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_task_event (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        phase varchar(128),
        task_result varchar(128),
        rule_id varchar(128),
        attributes clob(17000000),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_task_result (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        stack clob(17000000),
        attributes clob(17000000),
        launcher varchar(255),
        host varchar(255),
        launched bigint,
        completed bigint,
        progress varchar(255),
        percent_complete integer,
        type varchar(255),
        messages clob(17000000),
        expiration bigint,
        verified bigint,
        name varchar(255) not null unique,
        definition varchar(128),
        schedule varchar(255),
        pending_signoffs integer,
        signoff clob(17000000),
        report varchar(128),
        target_class varchar(255),
        target_id varchar(255),
        target_name varchar(255),
        task_terminated smallint,
        partitioned smallint,
        completion_status varchar(255),
        name_ci generated always as (upper(name)),
        target_name_ci generated always as (upper(target_name)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_task_signature_arguments (
        signature varchar(128) not null,
        name varchar(255),
        type varchar(255),
        filter_string varchar(255),
        help_key varchar(255),
        input_template varchar(255),
        description clob(8192),
        prompt clob(8192),
        multi smallint,
        required smallint,
        default_value varchar(255),
        idx integer not null,
        primary key (signature, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_task_signature_returns (
        signature varchar(128) not null,
        name varchar(255),
        type varchar(255),
        filter_string varchar(255),
        description clob(8192),
        prompt clob(8192),
        multi smallint,
        idx integer not null,
        primary key (signature, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_time_period (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128),
        classifier varchar(255),
        init_parameters clob(17000000),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_uiconfig (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128) not null unique,
        attributes clob(17000000),
        name_ci generated always as (upper(name)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_uipreferences (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        preferences clob(17000000),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_work_item (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(255),
        description varchar(1024),
        handler varchar(255),
        renderer varchar(255),
        target_class varchar(255),
        target_id varchar(255),
        target_name varchar(255),
        type varchar(255),
        state varchar(255),
        severity varchar(255),
        requester varchar(128),
        completion_comments clob(8192),
        notification bigint,
        expiration bigint,
        wake_up_date bigint,
        reminders integer,
        escalation_count integer,
        notification_config clob(17000000),
        workflow_case varchar(128),
        attributes clob(17000000),
        owner_history clob(17000000),
        certification varchar(255),
        certification_entity varchar(255),
        certification_item varchar(255),
        identity_request_id varchar(128),
        assignee varchar(128),
        iiqlock varchar(128),
        certification_ref_id varchar(128),
        idx integer,
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_work_item_archive (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        work_item_id varchar(128),
        name varchar(255),
        owner_name varchar(255),
        identity_request_id varchar(128),
        assignee varchar(255),
        requester varchar(255),
        description varchar(1024),
        handler varchar(255),
        renderer varchar(255),
        target_class varchar(255),
        target_id varchar(255),
        target_name varchar(255),
        archived bigint,
        type varchar(255),
        state varchar(255),
        severity varchar(255),
        attributes clob(17000000),
        system_attributes clob(17000000),
        immutable smallint,
        signed smallint,
        completer varchar(255),
        owner_name_ci generated always as (upper(owner_name)),
        requester_ci generated always as (upper(requester)),
        assignee_ci generated always as (upper(assignee)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_work_item_comments (
        work_item varchar(128) not null,
        author varchar(255),
        comments clob(8192),
        comment_date bigint,
        idx integer not null,
        primary key (work_item, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_work_item_config (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128),
        description_template varchar(1024),
        disabled smallint,
        no_work_item smallint,
        parent varchar(128),
        owner_rule varchar(128),
        hours_till_escalation integer,
        hours_between_reminders integer,
        max_reminders integer,
        notification_email varchar(128),
        reminder_email varchar(128),
        escalation_email varchar(128),
        escalation_rule varchar(128),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_work_item_owners (
        config varchar(128) not null,
        elt varchar(128) not null,
        idx integer not null,
        primary key (config, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_workflow (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128) not null unique,
        description varchar(4000),
        type varchar(128),
        task_type varchar(255),
        template smallint,
        explicit_transitions smallint,
        monitored smallint,
        result_expiration integer,
        complete smallint,
        handler varchar(128),
        work_item_renderer varchar(128),
        variable_definitions clob(17000000),
        config_form varchar(128),
        steps clob(17000000),
        work_item_config clob(17000000),
        variables clob(17000000),
        libraries varchar(128),
        name_ci generated always as (upper(name)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_workflow_case (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        stack clob(17000000),
        attributes clob(17000000),
        launcher varchar(255),
        host varchar(255),
        launched bigint,
        completed bigint,
        progress varchar(255),
        percent_complete integer,
        type varchar(255),
        messages clob(17000000),
        name varchar(450),
        description varchar(1024),
        complete smallint,
        target_class varchar(255),
        target_id varchar(255),
        target_name varchar(255),
        workflow clob(17000000),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_workflow_registry (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128) not null unique,
        types clob(17000000),
        templates clob(17000000),
        callables clob(17000000),
        attributes clob(17000000),
        name_ci generated always as (upper(name)),
        primary key (id)
    ) IN identityiq_ts;

    create table identityiq.spt_workflow_rule_libraries (
        rule_id varchar(128) not null,
        dependency varchar(128) not null,
        idx integer not null,
        primary key (rule_id, idx)
    ) IN identityiq_ts;

    create table identityiq.spt_workflow_target (
        id varchar(128) not null,
        created bigint,
        modified bigint,
        owner varchar(128),
        assigned_scope varchar(128),
        assigned_scope_path varchar(450),
        name varchar(128),
        description varchar(1024),
        class_name varchar(255),
        object_id varchar(255),
        object_name varchar(255),
        workflow_case_id varchar(128) not null,
        idx integer,
        primary key (id)
    ) IN identityiq_ts;

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

    create index identityiq.spt_actgroup_attr on identityiq.spt_account_group (reference_attribute);






    create index identityiq.spt_actgroup_lastAggregation on identityiq.spt_account_group (last_target_aggregation);


    alter table identityiq.spt_account_group 
        add constraint FK54D3916539D71460 
        foreign key (application) 
        references identityiq.spt_application;

    create index identityiq.FK54D3916539D71460 on identityiq.spt_account_group (application);

    alter table identityiq.spt_account_group 
        add constraint FK54D39165486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK54D39165486634B7 on identityiq.spt_account_group (assigned_scope);

    alter table identityiq.spt_account_group 
        add constraint FK54D39165A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK54D39165A5FB1B1 on identityiq.spt_account_group (owner);

    alter table identityiq.spt_account_group_inheritance 
        add constraint FK64E35CF0B106CC7F 
        foreign key (account_group) 
        references identityiq.spt_account_group;

    create index identityiq.FK64E35CF0B106CC7F on identityiq.spt_account_group_inheritance (account_group);

    alter table identityiq.spt_account_group_inheritance 
        add constraint FK64E35CF034D1C743 
        foreign key (inherits_from) 
        references identityiq.spt_account_group;

    create index identityiq.FK64E35CF034D1C743 on identityiq.spt_account_group_inheritance (inherits_from);

    alter table identityiq.spt_account_group_perms 
        add constraint FK196E8029128ABF04 
        foreign key (accountgroup) 
        references identityiq.spt_account_group;

    create index identityiq.FK196E8029128ABF04 on identityiq.spt_account_group_perms (accountgroup);

    alter table identityiq.spt_account_group_target_perms 
        add constraint FK8C6393EF128ABF04 
        foreign key (accountgroup) 
        references identityiq.spt_account_group;

    create index identityiq.FK8C6393EF128ABF04 on identityiq.spt_account_group_target_perms (accountgroup);

    alter table identityiq.spt_activity_constraint 
        add constraint FKD7E392852E02D59E 
        foreign key (violation_owner_rule) 
        references identityiq.spt_rule;

    create index identityiq.FKD7E392852E02D59E on identityiq.spt_activity_constraint (violation_owner_rule);

    alter table identityiq.spt_activity_constraint 
        add constraint FKD7E3928557FD28A4 
        foreign key (policy) 
        references identityiq.spt_policy;

    create index identityiq.FKD7E3928557FD28A4 on identityiq.spt_activity_constraint (policy);

    alter table identityiq.spt_activity_constraint 
        add constraint FKD7E39285486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FKD7E39285486634B7 on identityiq.spt_activity_constraint (assigned_scope);

    alter table identityiq.spt_activity_constraint 
        add constraint FKD7E39285A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FKD7E39285A5FB1B1 on identityiq.spt_activity_constraint (owner);

    alter table identityiq.spt_activity_constraint 
        add constraint FKD7E3928516E8C617 
        foreign key (violation_owner) 
        references identityiq.spt_identity;

    create index identityiq.FKD7E3928516E8C617 on identityiq.spt_activity_constraint (violation_owner);

    alter table identityiq.spt_activity_data_source 
        add constraint FK34D17AA839D71460 
        foreign key (application) 
        references identityiq.spt_application;

    create index identityiq.FK34D17AA839D71460 on identityiq.spt_activity_data_source (application);

    alter table identityiq.spt_activity_data_source 
        add constraint FK34D17AA8B854BFAE 
        foreign key (transformation_rule) 
        references identityiq.spt_rule;

    create index identityiq.FK34D17AA8B854BFAE on identityiq.spt_activity_data_source (transformation_rule);

    alter table identityiq.spt_activity_data_source 
        add constraint FK34D17AA8BE1EE0D5 
        foreign key (correlation_rule) 
        references identityiq.spt_rule;

    create index identityiq.FK34D17AA8BE1EE0D5 on identityiq.spt_activity_data_source (correlation_rule);

    alter table identityiq.spt_activity_data_source 
        add constraint FK34D17AA8486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK34D17AA8486634B7 on identityiq.spt_activity_data_source (assigned_scope);

    alter table identityiq.spt_activity_data_source 
        add constraint FK34D17AA8A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK34D17AA8A5FB1B1 on identityiq.spt_activity_data_source (owner);

    alter table identityiq.spt_activity_time_periods 
        add constraint FK7ABC1208E6D76F5D 
        foreign key (application_activity) 
        references identityiq.spt_application_activity;

    create index identityiq.FK7ABC1208E6D76F5D on identityiq.spt_activity_time_periods (application_activity);

    alter table identityiq.spt_activity_time_periods 
        add constraint FK7ABC1208E6ED34A1 
        foreign key (time_period) 
        references identityiq.spt_time_period;

    create index identityiq.FK7ABC1208E6ED34A1 on identityiq.spt_activity_time_periods (time_period);

    alter table identityiq.spt_app_dependencies 
        add constraint FK4354140F39D71460 
        foreign key (application) 
        references identityiq.spt_application;

    create index identityiq.FK4354140F39D71460 on identityiq.spt_app_dependencies (application);

    alter table identityiq.spt_app_dependencies 
        add constraint FK4354140FDBA1E25B 
        foreign key (dependency) 
        references identityiq.spt_application;

    create index identityiq.FK4354140FDBA1E25B on identityiq.spt_app_dependencies (dependency);

    alter table identityiq.spt_app_secondary_owners 
        add constraint FK1228593139D71460 
        foreign key (application) 
        references identityiq.spt_application;

    create index identityiq.FK1228593139D71460 on identityiq.spt_app_secondary_owners (application);

    alter table identityiq.spt_app_secondary_owners 
        add constraint FK1228593140D47AB 
        foreign key (elt) 
        references identityiq.spt_identity;

    create index identityiq.FK1228593140D47AB on identityiq.spt_app_secondary_owners (elt);

    create index identityiq.spt_application_authoritative on identityiq.spt_application (authoritative);

    create index identityiq.spt_app_proxied_name on identityiq.spt_application (proxied_name);

    create index identityiq.spt_application_provisioning on identityiq.spt_application (supports_provisioning);

    create index identityiq.spt_app_sync_provisioning on identityiq.spt_application (sync_provisioning);

    create index identityiq.spt_application_cluster on identityiq.spt_application (app_cluster);

    create index identityiq.spt_application_addt_acct on identityiq.spt_application (supports_additional_accounts);

    create index identityiq.spt_application_acct_only on identityiq.spt_application (supports_account_only);


    create index identityiq.spt_application_no_agg on identityiq.spt_application (no_aggregation);

    create index identityiq.spt_application_mgd_apps on identityiq.spt_application (manages_other_apps);

    create index identityiq.spt_application_logical on identityiq.spt_application (logical);

    create index identityiq.spt_application_authenticate on identityiq.spt_application (supports_authenticate);

    alter table identityiq.spt_application 
        add constraint FK798846C84FE65998 
        foreign key (creation_rule) 
        references identityiq.spt_rule;

    create index identityiq.FK798846C84FE65998 on identityiq.spt_application (creation_rule);

    alter table identityiq.spt_application 
        add constraint FK798846C86FB29924 
        foreign key (customization_rule) 
        references identityiq.spt_rule;

    create index identityiq.FK798846C86FB29924 on identityiq.spt_application (customization_rule);

    alter table identityiq.spt_application 
        add constraint FK798846C83D65E622 
        foreign key (managed_attr_customize_rule) 
        references identityiq.spt_rule;

    create index identityiq.FK798846C83D65E622 on identityiq.spt_application (managed_attr_customize_rule);

    alter table identityiq.spt_application 
        add constraint FK798846C853AF4414 
        foreign key (scorecard) 
        references identityiq.spt_application_scorecard;

    create index identityiq.FK798846C853AF4414 on identityiq.spt_application (scorecard);

    alter table identityiq.spt_application 
        add constraint FK798846C88954E327 
        foreign key (manager_correlation_rule) 
        references identityiq.spt_rule;

    create index identityiq.FK798846C88954E327 on identityiq.spt_application (manager_correlation_rule);

    alter table identityiq.spt_application 
        add constraint FK798846C82F001D5 
        foreign key (target_source) 
        references identityiq.spt_target_source;

    create index identityiq.FK798846C82F001D5 on identityiq.spt_application (target_source);

    alter table identityiq.spt_application 
        add constraint FK798846C8E392D97E 
        foreign key (proxy) 
        references identityiq.spt_application;

    create index identityiq.FK798846C8E392D97E on identityiq.spt_application (proxy);

    alter table identityiq.spt_application 
        add constraint FK798846C8BE1EE0D5 
        foreign key (correlation_rule) 
        references identityiq.spt_rule;

    create index identityiq.FK798846C8BE1EE0D5 on identityiq.spt_application (correlation_rule);

    alter table identityiq.spt_application 
        add constraint FK798846C8486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK798846C8486634B7 on identityiq.spt_application (assigned_scope);

    alter table identityiq.spt_application 
        add constraint FK798846C8198B5515 
        foreign key (account_correlation_config) 
        references identityiq.spt_correlation_config;

    create index identityiq.FK798846C8198B5515 on identityiq.spt_application (account_correlation_config);

    alter table identityiq.spt_application 
        add constraint FK798846C8A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK798846C8A5FB1B1 on identityiq.spt_application (owner);

    alter table identityiq.spt_application_activity 
        add constraint FK5077FEA6486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK5077FEA6486634B7 on identityiq.spt_application_activity (assigned_scope);

    alter table identityiq.spt_application_remediators 
        add constraint FKA10D3C1639D71460 
        foreign key (application) 
        references identityiq.spt_application;

    create index identityiq.FKA10D3C1639D71460 on identityiq.spt_application_remediators (application);

    alter table identityiq.spt_application_remediators 
        add constraint FKA10D3C1640D47AB 
        foreign key (elt) 
        references identityiq.spt_identity;

    create index identityiq.FKA10D3C1640D47AB on identityiq.spt_application_remediators (elt);

    alter table identityiq.spt_application_schema 
        add constraint FK62F93AF839D71460 
        foreign key (application) 
        references identityiq.spt_application;

    create index identityiq.FK62F93AF839D71460 on identityiq.spt_application_schema (application);

    alter table identityiq.spt_application_schema 
        add constraint FK62F93AF8486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK62F93AF8486634B7 on identityiq.spt_application_schema (assigned_scope);

    alter table identityiq.spt_application_schema 
        add constraint FK62F93AF8A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK62F93AF8A5FB1B1 on identityiq.spt_application_schema (owner);

    create index identityiq.app_scorecard_cscore on identityiq.spt_application_scorecard (composite_score);

    alter table identityiq.spt_application_scorecard 
        add constraint FK314187EB907AB97A 
        foreign key (application_id) 
        references identityiq.spt_application;

    create index identityiq.FK314187EB907AB97A on identityiq.spt_application_scorecard (application_id);

    alter table identityiq.spt_application_scorecard 
        add constraint FK314187EB486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK314187EB486634B7 on identityiq.spt_application_scorecard (assigned_scope);

    alter table identityiq.spt_application_scorecard 
        add constraint FK314187EBA5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK314187EBA5FB1B1 on identityiq.spt_application_scorecard (owner);

    alter table identityiq.spt_arch_cert_item_apps 
        add constraint FKFBD89444D6D1B4E0 
        foreign key (arch_cert_item_id) 
        references identityiq.spt_archived_cert_item;

    create index identityiq.FKFBD89444D6D1B4E0 on identityiq.spt_arch_cert_item_apps (arch_cert_item_id);

    create index identityiq.spt_arch_entity_tgt_display on identityiq.spt_archived_cert_entity (target_display_name);



    create index identityiq.spt_arch_entity_target_id on identityiq.spt_archived_cert_entity (target_id);


    create index identityiq.spt_arch_entity_app on identityiq.spt_archived_cert_entity (application);

    create index identityiq.spt_arch_entity_ref_attr on identityiq.spt_archived_cert_entity (reference_attribute);

    create index identityiq.spt_arch_entity_native_id on identityiq.spt_archived_cert_entity (native_identity);

    alter table identityiq.spt_archived_cert_entity 
        add constraint FKE3ED1F09DB59193A 
        foreign key (certification_id) 
        references identityiq.spt_certification;

    create index identityiq.FKE3ED1F09DB59193A on identityiq.spt_archived_cert_entity (certification_id);

    alter table identityiq.spt_archived_cert_entity 
        add constraint FKE3ED1F09486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FKE3ED1F09486634B7 on identityiq.spt_archived_cert_entity (assigned_scope);

    alter table identityiq.spt_archived_cert_entity 
        add constraint FKE3ED1F09A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FKE3ED1F09A5FB1B1 on identityiq.spt_archived_cert_entity (owner);

    create index identityiq.spt_arch_cert_item_tdisplay on identityiq.spt_archived_cert_item (target_display_name);

    create index identityiq.spt_arch_cert_item_tname on identityiq.spt_archived_cert_item (target_name);

    create index identityiq.spt_arch_item_app on identityiq.spt_archived_cert_item (exception_application);

    create index identityiq.spt_arch_item_policy on identityiq.spt_archived_cert_item (policy);

    create index identityiq.spt_arch_cert_item_type on identityiq.spt_archived_cert_item (type);

    create index identityiq.spt_arch_item_native_id on identityiq.spt_archived_cert_item (exception_native_identity);

    create index identityiq.spt_arch_item_bundle on identityiq.spt_archived_cert_item (bundle);

    alter table identityiq.spt_archived_cert_item 
        add constraint FK764147B9486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK764147B9486634B7 on identityiq.spt_archived_cert_item (assigned_scope);

    alter table identityiq.spt_archived_cert_item 
        add constraint FK764147B9BAC8DC8B 
        foreign key (parent_id) 
        references identityiq.spt_archived_cert_entity;

    create index identityiq.FK764147B9BAC8DC8B on identityiq.spt_archived_cert_item (parent_id);

    alter table identityiq.spt_archived_cert_item 
        add constraint FK764147B9A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK764147B9A5FB1B1 on identityiq.spt_archived_cert_item (owner);

    alter table identityiq.spt_audit_config 
        add constraint FK15F2D5AE486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK15F2D5AE486634B7 on identityiq.spt_audit_config (assigned_scope);

    alter table identityiq.spt_audit_config 
        add constraint FK15F2D5AEA5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK15F2D5AEA5FB1B1 on identityiq.spt_audit_config (owner);











    alter table identityiq.spt_audit_event 
        add constraint FK536922AE486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK536922AE486634B7 on identityiq.spt_audit_event (assigned_scope);

    alter table identityiq.spt_audit_event 
        add constraint FK536922AEA5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK536922AEA5FB1B1 on identityiq.spt_audit_event (owner);

    alter table identityiq.spt_authentication_answer 
        add constraint FK157EEDD56651F3A 
        foreign key (identity_id) 
        references identityiq.spt_identity;

    create index identityiq.FK157EEDD56651F3A on identityiq.spt_authentication_answer (identity_id);

    alter table identityiq.spt_authentication_answer 
        add constraint FK157EEDD48ADCCD2 
        foreign key (question_id) 
        references identityiq.spt_authentication_question;

    create index identityiq.FK157EEDD48ADCCD2 on identityiq.spt_authentication_answer (question_id);

    alter table identityiq.spt_authentication_answer 
        add constraint FK157EEDDA5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK157EEDDA5FB1B1 on identityiq.spt_authentication_answer (owner);

    alter table identityiq.spt_authentication_question 
        add constraint FKE3609F45486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FKE3609F45486634B7 on identityiq.spt_authentication_question (assigned_scope);

    alter table identityiq.spt_authentication_question 
        add constraint FKE3609F45A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FKE3609F45A5FB1B1 on identityiq.spt_authentication_question (owner);

    alter table identityiq.spt_batch_request 
        add constraint FKA7055A02486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FKA7055A02486634B7 on identityiq.spt_batch_request (assigned_scope);

    alter table identityiq.spt_batch_request 
        add constraint FKA7055A02A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FKA7055A02A5FB1B1 on identityiq.spt_batch_request (owner);

    alter table identityiq.spt_batch_request_item 
        add constraint FK9118CB302C200325 
        foreign key (batch_request_id) 
        references identityiq.spt_batch_request;

    create index identityiq.FK9118CB302C200325 on identityiq.spt_batch_request_item (batch_request_id);

    alter table identityiq.spt_batch_request_item 
        add constraint FK9118CB30486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK9118CB30486634B7 on identityiq.spt_batch_request_item (assigned_scope);

    alter table identityiq.spt_batch_request_item 
        add constraint FK9118CB30A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK9118CB30A5FB1B1 on identityiq.spt_batch_request_item (owner);

    create index identityiq.spt_bundle_type on identityiq.spt_bundle (type);


    create index identityiq.spt_bundle_disabled on identityiq.spt_bundle (disabled);

    create index identityiq.spt_bundle_dispname on identityiq.spt_bundle (displayable_name);

    alter table identityiq.spt_bundle 
        add constraint FKFC45E40ABF46222D 
        foreign key (join_rule) 
        references identityiq.spt_rule;

    create index identityiq.FKFC45E40ABF46222D on identityiq.spt_bundle (join_rule);

    alter table identityiq.spt_bundle 
        add constraint FKFC45E40ABD5A5736 
        foreign key (pending_workflow) 
        references identityiq.spt_workflow_case;

    create index identityiq.FKFC45E40ABD5A5736 on identityiq.spt_bundle (pending_workflow);

    alter table identityiq.spt_bundle 
        add constraint FKFC45E40ACC129F2E 
        foreign key (scorecard) 
        references identityiq.spt_role_scorecard;

    create index identityiq.FKFC45E40ACC129F2E on identityiq.spt_bundle (scorecard);

    alter table identityiq.spt_bundle 
        add constraint FKFC45E40AF7616785 
        foreign key (role_index) 
        references identityiq.spt_role_index;

    create index identityiq.FKFC45E40AF7616785 on identityiq.spt_bundle (role_index);

    alter table identityiq.spt_bundle 
        add constraint FKFC45E40A486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FKFC45E40A486634B7 on identityiq.spt_bundle (assigned_scope);

    alter table identityiq.spt_bundle 
        add constraint FKFC45E40AA5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FKFC45E40AA5FB1B1 on identityiq.spt_bundle (owner);

    create index identityiq.spt_bundle_archive_source on identityiq.spt_bundle_archive (source_id);

    alter table identityiq.spt_bundle_archive 
        add constraint FK4C6C18D486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK4C6C18D486634B7 on identityiq.spt_bundle_archive (assigned_scope);

    alter table identityiq.spt_bundle_archive 
        add constraint FK4C6C18DA5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK4C6C18DA5FB1B1 on identityiq.spt_bundle_archive (owner);

    alter table identityiq.spt_bundle_children 
        add constraint FK5D48969480A503DE 
        foreign key (child) 
        references identityiq.spt_bundle;

    create index identityiq.FK5D48969480A503DE on identityiq.spt_bundle_children (child);

    alter table identityiq.spt_bundle_children 
        add constraint FK5D48969428E03F44 
        foreign key (bundle) 
        references identityiq.spt_bundle;

    create index identityiq.FK5D48969428E03F44 on identityiq.spt_bundle_children (bundle);

    alter table identityiq.spt_bundle_permits 
        add constraint FK8EAE08380A503DE 
        foreign key (child) 
        references identityiq.spt_bundle;

    create index identityiq.FK8EAE08380A503DE on identityiq.spt_bundle_permits (child);

    alter table identityiq.spt_bundle_permits 
        add constraint FK8EAE08328E03F44 
        foreign key (bundle) 
        references identityiq.spt_bundle;

    create index identityiq.FK8EAE08328E03F44 on identityiq.spt_bundle_permits (bundle);

    alter table identityiq.spt_bundle_requirements 
        add constraint FK582892A580A503DE 
        foreign key (child) 
        references identityiq.spt_bundle;

    create index identityiq.FK582892A580A503DE on identityiq.spt_bundle_requirements (child);

    alter table identityiq.spt_bundle_requirements 
        add constraint FK582892A528E03F44 
        foreign key (bundle) 
        references identityiq.spt_bundle;

    create index identityiq.FK582892A528E03F44 on identityiq.spt_bundle_requirements (bundle);

    alter table identityiq.spt_capability 
        add constraint FK5E9BD4A0486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK5E9BD4A0486634B7 on identityiq.spt_capability (assigned_scope);

    alter table identityiq.spt_capability 
        add constraint FK5E9BD4A0A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK5E9BD4A0A5FB1B1 on identityiq.spt_capability (owner);

    alter table identityiq.spt_capability_children 
        add constraint FKC7A8EEBEA526F8FA 
        foreign key (capability_id) 
        references identityiq.spt_capability;

    create index identityiq.FKC7A8EEBEA526F8FA on identityiq.spt_capability_children (capability_id);

    alter table identityiq.spt_capability_children 
        add constraint FKC7A8EEBEC4BCFA76 
        foreign key (child_id) 
        references identityiq.spt_capability;

    create index identityiq.FKC7A8EEBEC4BCFA76 on identityiq.spt_capability_children (child_id);

    alter table identityiq.spt_capability_rights 
        add constraint FKDCDA3656A526F8FA 
        foreign key (capability_id) 
        references identityiq.spt_capability;

    create index identityiq.FKDCDA3656A526F8FA on identityiq.spt_capability_rights (capability_id);

    alter table identityiq.spt_capability_rights 
        add constraint FKDCDA3656D22635BD 
        foreign key (right_id) 
        references identityiq.spt_right;

    create index identityiq.FKDCDA3656D22635BD on identityiq.spt_capability_rights (right_id);

    alter table identityiq.spt_category 
        add constraint FK528AAE86486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK528AAE86486634B7 on identityiq.spt_category (assigned_scope);

    alter table identityiq.spt_category 
        add constraint FK528AAE86A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK528AAE86A5FB1B1 on identityiq.spt_category (owner);

    alter table identityiq.spt_cert_action_assoc 
        add constraint FK9F3F8E7F84D52C6E 
        foreign key (child_id) 
        references identityiq.spt_certification_action;

    create index identityiq.FK9F3F8E7F84D52C6E on identityiq.spt_cert_action_assoc (child_id);

    alter table identityiq.spt_cert_action_assoc 
        add constraint FK9F3F8E7F9D51C620 
        foreign key (parent_id) 
        references identityiq.spt_certification_action;

    create index identityiq.FK9F3F8E7F9D51C620 on identityiq.spt_cert_action_assoc (parent_id);

    alter table identityiq.spt_cert_item_applications 
        add constraint FK4F97C0FCBCA86BEF 
        foreign key (certification_item_id) 
        references identityiq.spt_certification_item;

    create index identityiq.FK4F97C0FCBCA86BEF on identityiq.spt_cert_item_applications (certification_item_id);

    create index identityiq.spt_cert_nxt_phs_tran on identityiq.spt_certification (next_phase_transition);

    create index identityiq.spt_cert_application on identityiq.spt_certification (application_id);

    create index identityiq.spt_cert_electronic_signed on identityiq.spt_certification (electronically_signed);

    create index identityiq.nxt_overdue_scan on identityiq.spt_certification (next_overdue_scan);

    create index identityiq.spt_certification_phase on identityiq.spt_certification (phase);

    create index identityiq.spt_cert_type on identityiq.spt_certification (type);

    create index identityiq.spt_certification_finished on identityiq.spt_certification (finished);

    create index identityiq.spt_cert_task_sched_id on identityiq.spt_certification (task_schedule_id);

    create index identityiq.spt_cert_exclude_inactive on identityiq.spt_certification (exclude_inactive);

    create index identityiq.spt_cert_auto_close_date on identityiq.spt_certification (automatic_closing_date);

    create index identityiq.spt_cert_group_id on identityiq.spt_certification (group_definition_id);

    create index identityiq.spt_cert_trigger_id on identityiq.spt_certification (trigger_id);

    create index identityiq.spt_cert_percent_complete on identityiq.spt_certification (percent_complete);

    create index identityiq.nxt_cert_req_scan on identityiq.spt_certification (next_cert_required_scan);

    create index identityiq.spt_certification_name on identityiq.spt_certification (name);

    create index identityiq.spt_cert_group_name on identityiq.spt_certification (group_definition_name);

    create index identityiq.spt_certification_short_name on identityiq.spt_certification (short_name);

    create index identityiq.spt_certification_signed on identityiq.spt_certification (signed);

    create index identityiq.spt_cert_cert_def_id on identityiq.spt_certification (certification_definition_id);

    create index identityiq.spt_cert_manager on identityiq.spt_certification (manager);

    create index identityiq.spt_cert_nextRemediationScan on identityiq.spt_certification (next_remediation_scan);

    alter table identityiq.spt_certification 
        add constraint FK4E6F1832486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK4E6F1832486634B7 on identityiq.spt_certification (assigned_scope);

    alter table identityiq.spt_certification 
        add constraint FK4E6F1832A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK4E6F1832A5FB1B1 on identityiq.spt_certification (owner);

    alter table identityiq.spt_certification 
        add constraint FK4E6F18323733F724 
        foreign key (parent) 
        references identityiq.spt_certification;

    create index identityiq.FK4E6F18323733F724 on identityiq.spt_certification (parent);

    create index identityiq.spt_item_ready_for_remed on identityiq.spt_certification_action (ready_for_remediation);

    alter table identityiq.spt_certification_action 
        add constraint FK198026E3486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK198026E3486634B7 on identityiq.spt_certification_action (assigned_scope);

    alter table identityiq.spt_certification_action 
        add constraint FK198026E310F4E42A 
        foreign key (source_action) 
        references identityiq.spt_certification_action;

    create index identityiq.FK198026E310F4E42A on identityiq.spt_certification_action (source_action);

    alter table identityiq.spt_certification_action 
        add constraint FK198026E3A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK198026E3A5FB1B1 on identityiq.spt_certification_action (owner);

    create index identityiq.spt_cert_archive_grp_id on identityiq.spt_certification_archive (certification_group_id);

    create index identityiq.spt_cert_archive_creator on identityiq.spt_certification_archive (creator);

    create index identityiq.spt_cert_archive_id on identityiq.spt_certification_archive (certification_id);

    alter table identityiq.spt_certification_archive 
        add constraint FK2F2D4DB5486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK2F2D4DB5486634B7 on identityiq.spt_certification_archive (assigned_scope);

    alter table identityiq.spt_certification_archive 
        add constraint FK2F2D4DB5A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK2F2D4DB5A5FB1B1 on identityiq.spt_certification_archive (owner);

    alter table identityiq.spt_certification_challenge 
        add constraint FKCFF77896486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FKCFF77896486634B7 on identityiq.spt_certification_challenge (assigned_scope);

    alter table identityiq.spt_certification_challenge 
        add constraint FKCFF77896A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FKCFF77896A5FB1B1 on identityiq.spt_certification_challenge (owner);

    alter table identityiq.spt_certification_def_tags 
        add constraint FK43135580E6181207 
        foreign key (elt) 
        references identityiq.spt_tag;

    create index identityiq.FK43135580E6181207 on identityiq.spt_certification_def_tags (elt);

    alter table identityiq.spt_certification_def_tags 
        add constraint FK4313558015CFE57D 
        foreign key (cert_def_id) 
        references identityiq.spt_certification_definition;

    create index identityiq.FK4313558015CFE57D on identityiq.spt_certification_def_tags (cert_def_id);

    alter table identityiq.spt_certification_definition 
        add constraint FKD2CBBF80486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FKD2CBBF80486634B7 on identityiq.spt_certification_definition (assigned_scope);

    alter table identityiq.spt_certification_definition 
        add constraint FKD2CBBF80A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FKD2CBBF80A5FB1B1 on identityiq.spt_certification_definition (owner);

    alter table identityiq.spt_certification_delegation 
        add constraint FK62173755486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK62173755486634B7 on identityiq.spt_certification_delegation (assigned_scope);

    alter table identityiq.spt_certification_delegation 
        add constraint FK62173755A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK62173755A5FB1B1 on identityiq.spt_certification_delegation (owner);

    create index identityiq.spt_certification_entity_state on identityiq.spt_certification_entity (continuous_state);

    create index identityiq.spt_certification_entity_ld on identityiq.spt_certification_entity (last_decision);

    create index identityiq.spt_certification_entity_tdn on identityiq.spt_certification_entity (target_display_name);

    create index identityiq.spt_certification_entity_tn on identityiq.spt_certification_entity (target_name);

    create index identityiq.spt_certification_entity_stat on identityiq.spt_certification_entity (summary_status);

    create index identityiq.spt_certification_entity_diffs on identityiq.spt_certification_entity (has_differences);

    create index identityiq.spt_certification_entity_nsc on identityiq.spt_certification_entity (next_continuous_state_change);

    create index identityiq.spt_certification_entity_due on identityiq.spt_certification_entity (overdue_date);

    create index identityiq.spt_cert_entity_cscore on identityiq.spt_certification_entity (composite_score);

    create index identityiq.spt_cert_entity_lastname on identityiq.spt_certification_entity (lastname);

    create index identityiq.spt_cert_entity_new_user on identityiq.spt_certification_entity (new_user);

    create index identityiq.spt_cert_entity_identity on identityiq.spt_certification_entity (identity_id);

    create index identityiq.spt_cert_entity_firstname on identityiq.spt_certification_entity (firstname);

    alter table identityiq.spt_certification_entity 
        add constraint FK641BE42D982FD46A20ee8c90 
        foreign key (delegation) 
        references identityiq.spt_certification_delegation;

    create index identityiq.FK641BE42D982FD46A20ee8c90 on identityiq.spt_certification_entity (delegation);

    alter table identityiq.spt_certification_entity 
        add constraint FK20EE8C90DB59193A 
        foreign key (certification_id) 
        references identityiq.spt_certification;

    create index identityiq.FK20EE8C90DB59193A on identityiq.spt_certification_entity (certification_id);

    alter table identityiq.spt_certification_entity 
        add constraint FK641BE42D486634B720ee8c90 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK641BE42D486634B720ee8c90 on identityiq.spt_certification_entity (assigned_scope);

    alter table identityiq.spt_certification_entity 
        add constraint FK641BE42DA5FB1B120ee8c90 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK641BE42DA5FB1B120ee8c90 on identityiq.spt_certification_entity (owner);

    alter table identityiq.spt_certification_entity 
        add constraint FK641BE42DCD1A938620ee8c90 
        foreign key (action) 
        references identityiq.spt_certification_action;

    create index identityiq.FK641BE42DCD1A938620ee8c90 on identityiq.spt_certification_entity (action);

    create index identityiq.spt_cert_grp_perc_comp on identityiq.spt_certification_group (percent_complete);

    create index identityiq.spt_cert_group_status on identityiq.spt_certification_group (status);

    create index identityiq.spt_cert_group_type on identityiq.spt_certification_group (type);

    alter table identityiq.spt_certification_group 
        add constraint FK11B2043263178D65 
        foreign key (certification_definition) 
        references identityiq.spt_certification_definition;

    create index identityiq.FK11B2043263178D65 on identityiq.spt_certification_group (certification_definition);

    alter table identityiq.spt_certification_group 
        add constraint FK11B20432486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK11B20432486634B7 on identityiq.spt_certification_group (assigned_scope);

    alter table identityiq.spt_certification_group 
        add constraint FK11B20432A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK11B20432A5FB1B1 on identityiq.spt_certification_group (owner);

    alter table identityiq.spt_certification_groups 
        add constraint FK248E8281F6578B00 
        foreign key (group_id) 
        references identityiq.spt_certification_group;

    create index identityiq.FK248E8281F6578B00 on identityiq.spt_certification_groups (group_id);

    alter table identityiq.spt_certification_groups 
        add constraint FK248E8281DB59193A 
        foreign key (certification_id) 
        references identityiq.spt_certification;

    create index identityiq.FK248E8281DB59193A on identityiq.spt_certification_groups (certification_id);

    create index identityiq.spt_certification_item_state on identityiq.spt_certification_item (continuous_state);

    create index identityiq.spt_certification_item_ld on identityiq.spt_certification_item (last_decision);

    create index identityiq.spt_certification_item_tdn on identityiq.spt_certification_item (target_display_name);

    create index identityiq.spt_certification_item_tn on identityiq.spt_certification_item (target_name);

    create index identityiq.spt_certification_item_stat on identityiq.spt_certification_item (summary_status);

    create index identityiq.spt_certification_item_diffs on identityiq.spt_certification_item (has_differences);

    create index identityiq.spt_certification_item_nsc on identityiq.spt_certification_item (next_continuous_state_change);

    create index identityiq.spt_certification_item_due on identityiq.spt_certification_item (overdue_date);

    create index identityiq.spt_cert_item_nxt_phs_tran on identityiq.spt_certification_item (next_phase_transition);

    create index identityiq.spt_cert_item_type on identityiq.spt_certification_item (type);

    create index identityiq.spt_cert_item_phase on identityiq.spt_certification_item (phase);

    create index identityiq.spt_cert_item_perm_target on identityiq.spt_certification_item (exception_permission_target);

    create index identityiq.spt_cert_item_exception_app on identityiq.spt_certification_item (exception_application);


    create index identityiq.spt_cert_item_perm_right on identityiq.spt_certification_item (exception_permission_right);

    create index identityiq.spt_cert_item_att_name on identityiq.spt_certification_item (exception_attribute_name);

    create index identityiq.spt_cert_item_bundle on identityiq.spt_certification_item (bundle);

    alter table identityiq.spt_certification_item 
        add constraint FKADFE6B008C97EA7 
        foreign key (exception_entitlements) 
        references identityiq.spt_entitlement_snapshot;

    create index identityiq.FKADFE6B008C97EA7 on identityiq.spt_certification_item (exception_entitlements);

    alter table identityiq.spt_certification_item 
        add constraint FKADFE6B00809C88AF 
        foreign key (certification_entity_id) 
        references identityiq.spt_certification_entity;

    create index identityiq.FKADFE6B00809C88AF on identityiq.spt_certification_item (certification_entity_id);

    alter table identityiq.spt_certification_item 
        add constraint FK641BE42D982FD46Aadfe6b00 
        foreign key (delegation) 
        references identityiq.spt_certification_delegation;

    create index identityiq.FK641BE42D982FD46Aadfe6b00 on identityiq.spt_certification_item (delegation);

    alter table identityiq.spt_certification_item 
        add constraint FK641BE42D486634B7adfe6b00 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK641BE42D486634B7adfe6b00 on identityiq.spt_certification_item (assigned_scope);

    alter table identityiq.spt_certification_item 
        add constraint FKADFE6B00B749D36C 
        foreign key (challenge) 
        references identityiq.spt_certification_challenge;

    create index identityiq.FKADFE6B00B749D36C on identityiq.spt_certification_item (challenge);

    alter table identityiq.spt_certification_item 
        add constraint FK641BE42DA5FB1B1adfe6b00 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK641BE42DA5FB1B1adfe6b00 on identityiq.spt_certification_item (owner);

    alter table identityiq.spt_certification_item 
        add constraint FK641BE42DCD1A9386adfe6b00 
        foreign key (action) 
        references identityiq.spt_certification_action;

    create index identityiq.FK641BE42DCD1A9386adfe6b00 on identityiq.spt_certification_item (action);

    alter table identityiq.spt_certification_tags 
        add constraint FKAE032406E6181207 
        foreign key (elt) 
        references identityiq.spt_tag;

    create index identityiq.FKAE032406E6181207 on identityiq.spt_certification_tags (elt);

    alter table identityiq.spt_certification_tags 
        add constraint FKAE032406DB59193A 
        foreign key (certification_id) 
        references identityiq.spt_certification;

    create index identityiq.FKAE032406DB59193A on identityiq.spt_certification_tags (certification_id);

    alter table identityiq.spt_certifiers 
        add constraint FK784C89A6DB59193A 
        foreign key (certification_id) 
        references identityiq.spt_certification;

    create index identityiq.FK784C89A6DB59193A on identityiq.spt_certifiers (certification_id);

    alter table identityiq.spt_child_certification_ids 
        add constraint FK2D614AC817639745 
        foreign key (certification_archive_id) 
        references identityiq.spt_certification_archive;

    create index identityiq.FK2D614AC817639745 on identityiq.spt_child_certification_ids (certification_archive_id);

    alter table identityiq.spt_configuration 
        add constraint FKE80D386E486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FKE80D386E486634B7 on identityiq.spt_configuration (assigned_scope);

    alter table identityiq.spt_configuration 
        add constraint FKE80D386EA5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FKE80D386EA5FB1B1 on identityiq.spt_configuration (owner);

    alter table identityiq.spt_correlation_config 
        add constraint FK3A3DBC27486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK3A3DBC27486634B7 on identityiq.spt_correlation_config (assigned_scope);

    alter table identityiq.spt_correlation_config 
        add constraint FK3A3DBC27A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK3A3DBC27A5FB1B1 on identityiq.spt_correlation_config (owner);


    alter table identityiq.spt_custom 
        add constraint FKFDFD3EF9486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FKFDFD3EF9486634B7 on identityiq.spt_custom (assigned_scope);

    alter table identityiq.spt_custom 
        add constraint FKFDFD3EF9A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FKFDFD3EF9A5FB1B1 on identityiq.spt_custom (owner);

    create index identityiq.spt_dashboard_content_task on identityiq.spt_dashboard_content (source_task_id);

    create index identityiq.spt_dashboard_type on identityiq.spt_dashboard_content (type);

    alter table identityiq.spt_dashboard_content 
        add constraint FKC4B33946486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FKC4B33946486634B7 on identityiq.spt_dashboard_content (assigned_scope);

    alter table identityiq.spt_dashboard_content 
        add constraint FKC4B33946A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FKC4B33946A5FB1B1 on identityiq.spt_dashboard_content (owner);

    alter table identityiq.spt_dashboard_content 
        add constraint FKC4B33946B513AA2F 
        foreign key (parent) 
        references identityiq.spt_dashboard_content;

    create index identityiq.FKC4B33946B513AA2F on identityiq.spt_dashboard_content (parent);

    alter table identityiq.spt_dashboard_content_rights 
        add constraint FK106D6AF0D91E26B1 
        foreign key (dashboard_content_id) 
        references identityiq.spt_dashboard_content;

    create index identityiq.FK106D6AF0D91E26B1 on identityiq.spt_dashboard_content_rights (dashboard_content_id);

    alter table identityiq.spt_dashboard_content_rights 
        add constraint FK106D6AF0D22635BD 
        foreign key (right_id) 
        references identityiq.spt_right;

    create index identityiq.FK106D6AF0D22635BD on identityiq.spt_dashboard_content_rights (right_id);

    alter table identityiq.spt_dashboard_layout 
        add constraint FK9914A8BD486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK9914A8BD486634B7 on identityiq.spt_dashboard_layout (assigned_scope);

    alter table identityiq.spt_dashboard_layout 
        add constraint FK9914A8BDA5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK9914A8BDA5FB1B1 on identityiq.spt_dashboard_layout (owner);

    alter table identityiq.spt_dashboard_reference 
        add constraint FK45E944D82D6026 
        foreign key (content_id) 
        references identityiq.spt_dashboard_content;

    create index identityiq.FK45E944D82D6026 on identityiq.spt_dashboard_reference (content_id);

    alter table identityiq.spt_dashboard_reference 
        add constraint FK45E944D8486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK45E944D8486634B7 on identityiq.spt_dashboard_reference (assigned_scope);

    alter table identityiq.spt_dashboard_reference 
        add constraint FK45E944D8A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK45E944D8A5FB1B1 on identityiq.spt_dashboard_reference (owner);

    alter table identityiq.spt_dashboard_reference 
        add constraint FK45E944D8878775BD 
        foreign key (identity_dashboard_id) 
        references identityiq.spt_identity_dashboard;

    create index identityiq.FK45E944D8878775BD on identityiq.spt_dashboard_reference (identity_dashboard_id);

    create index identityiq.spt_delObj_lastRefresh on identityiq.spt_deleted_object (last_refresh);




    alter table identityiq.spt_deleted_object 
        add constraint FKA08C7DAD39D71460 
        foreign key (application) 
        references identityiq.spt_application;

    create index identityiq.FKA08C7DAD39D71460 on identityiq.spt_deleted_object (application);

    alter table identityiq.spt_deleted_object 
        add constraint FKA08C7DAD486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FKA08C7DAD486634B7 on identityiq.spt_deleted_object (assigned_scope);

    alter table identityiq.spt_deleted_object 
        add constraint FKA08C7DADA5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FKA08C7DADA5FB1B1 on identityiq.spt_deleted_object (owner);

    alter table identityiq.spt_dictionary 
        add constraint FKA7F7201E486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FKA7F7201E486634B7 on identityiq.spt_dictionary (assigned_scope);

    alter table identityiq.spt_dictionary 
        add constraint FKA7F7201EA5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FKA7F7201EA5FB1B1 on identityiq.spt_dictionary (owner);

    alter table identityiq.spt_dictionary_term 
        add constraint FK8E1F3FED8598603A 
        foreign key (dictionary_id) 
        references identityiq.spt_dictionary;

    create index identityiq.FK8E1F3FED8598603A on identityiq.spt_dictionary_term (dictionary_id);

    alter table identityiq.spt_dictionary_term 
        add constraint FK8E1F3FED486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK8E1F3FED486634B7 on identityiq.spt_dictionary_term (assigned_scope);

    alter table identityiq.spt_dictionary_term 
        add constraint FK8E1F3FEDA5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK8E1F3FEDA5FB1B1 on identityiq.spt_dictionary_term (owner);

    alter table identityiq.spt_dynamic_scope 
        add constraint FKA73F59CC486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FKA73F59CC486634B7 on identityiq.spt_dynamic_scope (assigned_scope);

    alter table identityiq.spt_dynamic_scope 
        add constraint FKA73F59CCA5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FKA73F59CCA5FB1B1 on identityiq.spt_dynamic_scope (owner);

    alter table identityiq.spt_dynamic_scope_exclusions 
        add constraint FKFCBD20B856651F3A 
        foreign key (identity_id) 
        references identityiq.spt_identity;

    create index identityiq.FKFCBD20B856651F3A on identityiq.spt_dynamic_scope_exclusions (identity_id);

    alter table identityiq.spt_dynamic_scope_exclusions 
        add constraint FKFCBD20B86F1CB67B 
        foreign key (dynamic_scope_id) 
        references identityiq.spt_dynamic_scope;

    create index identityiq.FKFCBD20B86F1CB67B on identityiq.spt_dynamic_scope_exclusions (dynamic_scope_id);

    alter table identityiq.spt_dynamic_scope_inclusions 
        add constraint FK3368F2A56651F3A 
        foreign key (identity_id) 
        references identityiq.spt_identity;

    create index identityiq.FK3368F2A56651F3A on identityiq.spt_dynamic_scope_inclusions (identity_id);

    alter table identityiq.spt_dynamic_scope_inclusions 
        add constraint FK3368F2A6F1CB67B 
        foreign key (dynamic_scope_id) 
        references identityiq.spt_dynamic_scope;

    create index identityiq.FK3368F2A6F1CB67B on identityiq.spt_dynamic_scope_inclusions (dynamic_scope_id);

    alter table identityiq.spt_email_template 
        add constraint FK9261AD45486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK9261AD45486634B7 on identityiq.spt_email_template (assigned_scope);

    alter table identityiq.spt_email_template 
        add constraint FK9261AD45A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK9261AD45A5FB1B1 on identityiq.spt_email_template (owner);

    alter table identityiq.spt_email_template_properties 
        add constraint emailtemplateproperties 
        foreign key (id) 
        references identityiq.spt_email_template;

    create index identityiq.emailtemplateproperties on identityiq.spt_email_template_properties (id);

    alter table identityiq.spt_entitlement_group 
        add constraint FK13D2B86556651F3A 
        foreign key (identity_id) 
        references identityiq.spt_identity;

    create index identityiq.FK13D2B86556651F3A on identityiq.spt_entitlement_group (identity_id);

    alter table identityiq.spt_entitlement_group 
        add constraint FK13D2B86539D71460 
        foreign key (application) 
        references identityiq.spt_application;

    create index identityiq.FK13D2B86539D71460 on identityiq.spt_entitlement_group (application);

    alter table identityiq.spt_entitlement_group 
        add constraint FK13D2B865486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK13D2B865486634B7 on identityiq.spt_entitlement_group (assigned_scope);

    alter table identityiq.spt_entitlement_group 
        add constraint FK13D2B865A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK13D2B865A5FB1B1 on identityiq.spt_entitlement_group (owner);




    alter table identityiq.spt_entitlement_snapshot 
        add constraint FKC98E021EBCA86BEF 
        foreign key (certification_item_id) 
        references identityiq.spt_certification_item;

    create index identityiq.FKC98E021EBCA86BEF on identityiq.spt_entitlement_snapshot (certification_item_id);

    create index identityiq.file_bucketNumber on identityiq.spt_file_bucket (file_index);

    alter table identityiq.spt_file_bucket 
        add constraint FK7A22AF85486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK7A22AF85486634B7 on identityiq.spt_file_bucket (assigned_scope);

    alter table identityiq.spt_file_bucket 
        add constraint FK7A22AF85A620641F 
        foreign key (parent_id) 
        references identityiq.spt_persisted_file;

    create index identityiq.FK7A22AF85A620641F on identityiq.spt_file_bucket (parent_id);

    alter table identityiq.spt_file_bucket 
        add constraint FK7A22AF85A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK7A22AF85A5FB1B1 on identityiq.spt_file_bucket (owner);

    alter table identityiq.spt_form 
        add constraint FK9A3E024C486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK9A3E024C486634B7 on identityiq.spt_form (assigned_scope);

    alter table identityiq.spt_form 
        add constraint FK9A3E024CA5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK9A3E024CA5FB1B1 on identityiq.spt_form (owner);

    alter table identityiq.spt_generic_constraint 
        add constraint FK1A3C4CCD2E02D59E 
        foreign key (violation_owner_rule) 
        references identityiq.spt_rule;

    create index identityiq.FK1A3C4CCD2E02D59E on identityiq.spt_generic_constraint (violation_owner_rule);

    alter table identityiq.spt_generic_constraint 
        add constraint FK1A3C4CCD57FD28A4 
        foreign key (policy) 
        references identityiq.spt_policy;

    create index identityiq.FK1A3C4CCD57FD28A4 on identityiq.spt_generic_constraint (policy);

    alter table identityiq.spt_generic_constraint 
        add constraint FK1A3C4CCD486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK1A3C4CCD486634B7 on identityiq.spt_generic_constraint (assigned_scope);

    alter table identityiq.spt_generic_constraint 
        add constraint FK1A3C4CCDA5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK1A3C4CCDA5FB1B1 on identityiq.spt_generic_constraint (owner);

    alter table identityiq.spt_generic_constraint 
        add constraint FK1A3C4CCD16E8C617 
        foreign key (violation_owner) 
        references identityiq.spt_identity;

    create index identityiq.FK1A3C4CCD16E8C617 on identityiq.spt_generic_constraint (violation_owner);

    alter table identityiq.spt_group_definition 
        add constraint FK21F3C89BFA54B4D5 
        foreign key (factory) 
        references identityiq.spt_group_factory;

    create index identityiq.FK21F3C89BFA54B4D5 on identityiq.spt_group_definition (factory);

    alter table identityiq.spt_group_definition 
        add constraint FK21F3C89B486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK21F3C89B486634B7 on identityiq.spt_group_definition (assigned_scope);

    alter table identityiq.spt_group_definition 
        add constraint FK21F3C89B1CE09EE5 
        foreign key (group_index) 
        references identityiq.spt_group_index;

    create index identityiq.FK21F3C89B1CE09EE5 on identityiq.spt_group_definition (group_index);

    alter table identityiq.spt_group_definition 
        add constraint FK21F3C89BA5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK21F3C89BA5FB1B1 on identityiq.spt_group_definition (owner);

    alter table identityiq.spt_group_factory 
        add constraint FK36D2A2C252F9C404 
        foreign key (group_owner_rule) 
        references identityiq.spt_rule;

    create index identityiq.FK36D2A2C252F9C404 on identityiq.spt_group_factory (group_owner_rule);

    alter table identityiq.spt_group_factory 
        add constraint FK36D2A2C2486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK36D2A2C2486634B7 on identityiq.spt_group_factory (assigned_scope);

    alter table identityiq.spt_group_factory 
        add constraint FK36D2A2C2A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK36D2A2C2A5FB1B1 on identityiq.spt_group_factory (owner);

    create index identityiq.group_index_cscore on identityiq.spt_group_index (composite_score);

    alter table identityiq.spt_group_index 
        add constraint FK5E03A88AF7729445 
        foreign key (definition) 
        references identityiq.spt_group_definition;

    create index identityiq.FK5E03A88AF7729445 on identityiq.spt_group_index (definition);

    alter table identityiq.spt_group_index 
        add constraint FK5E03A88A486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK5E03A88A486634B7 on identityiq.spt_group_index (assigned_scope);

    alter table identityiq.spt_group_index 
        add constraint FK5E03A88AA5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK5E03A88AA5FB1B1 on identityiq.spt_group_index (owner);

    alter table identityiq.spt_group_permissions 
        add constraint FKB27ACA3CC60D993F 
        foreign key (entitlement_group_id) 
        references identityiq.spt_entitlement_group;

    create index identityiq.FKB27ACA3CC60D993F on identityiq.spt_group_permissions (entitlement_group_id);

    create index identityiq.spt_identity_correlated on identityiq.spt_identity (correlated);

    create index identityiq.spt_identity_isworkgroup on identityiq.spt_identity (workgroup);




    create index identityiq.spt_identity_lastRefresh on identityiq.spt_identity (last_refresh);


    create index identityiq.spt_identity_inactive on identityiq.spt_identity (inactive);




    create index identityiq.spt_identity_manager_status on identityiq.spt_identity (manager_status);



    alter table identityiq.spt_identity 
        add constraint FK4770624622315AAB 
        foreign key (extended_identity1) 
        references identityiq.spt_identity;

    create index identityiq.FK4770624622315AAB on identityiq.spt_identity (extended_identity1);

    alter table identityiq.spt_identity 
        add constraint FK4770624622315AAC 
        foreign key (extended_identity2) 
        references identityiq.spt_identity;

    create index identityiq.FK4770624622315AAC on identityiq.spt_identity (extended_identity2);

    alter table identityiq.spt_identity 
        add constraint FK47706246761EBB04 
        foreign key (scorecard) 
        references identityiq.spt_scorecard;

    create index identityiq.FK47706246761EBB04 on identityiq.spt_identity (scorecard);

    alter table identityiq.spt_identity 
        add constraint FK4770624622315AAD 
        foreign key (extended_identity3) 
        references identityiq.spt_identity;

    create index identityiq.FK4770624622315AAD on identityiq.spt_identity (extended_identity3);

    alter table identityiq.spt_identity 
        add constraint FK4770624646DBED88 
        foreign key (uipreferences) 
        references identityiq.spt_uipreferences;

    create index identityiq.FK4770624646DBED88 on identityiq.spt_identity (uipreferences);

    alter table identityiq.spt_identity 
        add constraint FK4770624635D4CEAB 
        foreign key (manager) 
        references identityiq.spt_identity;

    create index identityiq.FK4770624635D4CEAB on identityiq.spt_identity (manager);

    alter table identityiq.spt_identity 
        add constraint FK4770624622315AAF 
        foreign key (extended_identity5) 
        references identityiq.spt_identity;

    create index identityiq.FK4770624622315AAF on identityiq.spt_identity (extended_identity5);

    alter table identityiq.spt_identity 
        add constraint FK47706246486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK47706246486634B7 on identityiq.spt_identity (assigned_scope);

    alter table identityiq.spt_identity 
        add constraint FK4770624622315AAE 
        foreign key (extended_identity4) 
        references identityiq.spt_identity;

    create index identityiq.FK4770624622315AAE on identityiq.spt_identity (extended_identity4);

    alter table identityiq.spt_identity 
        add constraint FK47706246A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK47706246A5FB1B1 on identityiq.spt_identity (owner);

    create index identityiq.spt_identity_archive_source on identityiq.spt_identity_archive (source_id);

    alter table identityiq.spt_identity_archive 
        add constraint FKF49D43C9486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FKF49D43C9486634B7 on identityiq.spt_identity_archive (assigned_scope);

    alter table identityiq.spt_identity_archive 
        add constraint FKF49D43C9A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FKF49D43C9A5FB1B1 on identityiq.spt_identity_archive (owner);

    alter table identityiq.spt_identity_assigned_roles 
        add constraint FK559F642556651F3A 
        foreign key (identity_id) 
        references identityiq.spt_identity;

    create index identityiq.FK559F642556651F3A on identityiq.spt_identity_assigned_roles (identity_id);

    alter table identityiq.spt_identity_assigned_roles 
        add constraint FK559F642528E03F44 
        foreign key (bundle) 
        references identityiq.spt_bundle;

    create index identityiq.FK559F642528E03F44 on identityiq.spt_identity_assigned_roles (bundle);

    alter table identityiq.spt_identity_bundles 
        add constraint FK2F3B433856651F3A 
        foreign key (identity_id) 
        references identityiq.spt_identity;

    create index identityiq.FK2F3B433856651F3A on identityiq.spt_identity_bundles (identity_id);

    alter table identityiq.spt_identity_bundles 
        add constraint FK2F3B433828E03F44 
        foreign key (bundle) 
        references identityiq.spt_bundle;

    create index identityiq.FK2F3B433828E03F44 on identityiq.spt_identity_bundles (bundle);

    alter table identityiq.spt_identity_capabilities 
        add constraint FK2258790F56651F3A 
        foreign key (identity_id) 
        references identityiq.spt_identity;

    create index identityiq.FK2258790F56651F3A on identityiq.spt_identity_capabilities (identity_id);

    alter table identityiq.spt_identity_capabilities 
        add constraint FK2258790FA526F8FA 
        foreign key (capability_id) 
        references identityiq.spt_capability;

    create index identityiq.FK2258790FA526F8FA on identityiq.spt_identity_capabilities (capability_id);

    alter table identityiq.spt_identity_controlled_scopes 
        add constraint FK926D30B756651F3A 
        foreign key (identity_id) 
        references identityiq.spt_identity;

    create index identityiq.FK926D30B756651F3A on identityiq.spt_identity_controlled_scopes (identity_id);

    alter table identityiq.spt_identity_controlled_scopes 
        add constraint FK926D30B79D803AFA 
        foreign key (scope_id) 
        references identityiq.spt_scope;

    create index identityiq.FK926D30B79D803AFA on identityiq.spt_identity_controlled_scopes (scope_id);

    create index identityiq.spt_identity_dashboard_type on identityiq.spt_identity_dashboard (type);

    alter table identityiq.spt_identity_dashboard 
        add constraint FK6732A7DB56651F3A 
        foreign key (identity_id) 
        references identityiq.spt_identity;

    create index identityiq.FK6732A7DB56651F3A on identityiq.spt_identity_dashboard (identity_id);

    alter table identityiq.spt_identity_dashboard 
        add constraint FK6732A7DB68DCB7C8 
        foreign key (layout) 
        references identityiq.spt_dashboard_layout;

    create index identityiq.FK6732A7DB68DCB7C8 on identityiq.spt_identity_dashboard (layout);

    alter table identityiq.spt_identity_dashboard 
        add constraint FK6732A7DB486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK6732A7DB486634B7 on identityiq.spt_identity_dashboard (assigned_scope);

    alter table identityiq.spt_identity_dashboard 
        add constraint FK6732A7DBA5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK6732A7DBA5FB1B1 on identityiq.spt_identity_dashboard (owner);

    create index identityiq.spt_identity_ent_assgnid on identityiq.spt_identity_entitlement (assignment_id);


    create index identityiq.spt_identity_ent_ag_state on identityiq.spt_identity_entitlement (aggregation_state);

    create index identityiq.spt_identity_ent_role_granted on identityiq.spt_identity_entitlement (granted_by_role);

    create index identityiq.spt_identity_ent_assigned on identityiq.spt_identity_entitlement (assigned);

    create index identityiq.spt_identity_ent_allowed on identityiq.spt_identity_entitlement (allowed);





    create index identityiq.spt_identity_ent_type on identityiq.spt_identity_entitlement (type);

    alter table identityiq.spt_identity_entitlement 
        add constraint FK1134F4B456651F3A 
        foreign key (identity_id) 
        references identityiq.spt_identity;

    create index identityiq.FK1134F4B456651F3A on identityiq.spt_identity_entitlement (identity_id);

    alter table identityiq.spt_identity_entitlement 
        add constraint FK1134F4B439D71460 
        foreign key (application) 
        references identityiq.spt_application;

    create index identityiq.FK1134F4B439D71460 on identityiq.spt_identity_entitlement (application);

    alter table identityiq.spt_identity_entitlement 
        add constraint FK1134F4B47AEC327 
        foreign key (request_item) 
        references identityiq.spt_identity_request_item;

    create index identityiq.FK1134F4B47AEC327 on identityiq.spt_identity_entitlement (request_item);

    alter table identityiq.spt_identity_entitlement 
        add constraint FK1134F4B4D9C563CD 
        foreign key (pending_certification_item) 
        references identityiq.spt_certification_item;

    create index identityiq.FK1134F4B4D9C563CD on identityiq.spt_identity_entitlement (pending_certification_item);

    alter table identityiq.spt_identity_entitlement 
        add constraint FK1134F4B484ACD425 
        foreign key (certification_item) 
        references identityiq.spt_certification_item;

    create index identityiq.FK1134F4B484ACD425 on identityiq.spt_identity_entitlement (certification_item);

    alter table identityiq.spt_identity_entitlement 
        add constraint FK1134F4B4FFB630CF 
        foreign key (pending_request_item) 
        references identityiq.spt_identity_request_item;

    create index identityiq.FK1134F4B4FFB630CF on identityiq.spt_identity_entitlement (pending_request_item);

    alter table identityiq.spt_identity_entitlement 
        add constraint FK1134F4B4A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK1134F4B4A5FB1B1 on identityiq.spt_identity_entitlement (owner);

    create index identityiq.spt_id_hist_item_instance on identityiq.spt_identity_history_item (instance);

    create index identityiq.spt_id_hist_item_policy on identityiq.spt_identity_history_item (policy);


    create index identityiq.spt_id_hist_item_application on identityiq.spt_identity_history_item (application);

    create index identityiq.spt_id_hist_item_role on identityiq.spt_identity_history_item (role);


    create index identityiq.spt_id_hist_item_actor on identityiq.spt_identity_history_item (actor);


    create index identityiq.spt_id_hist_item_entry_date on identityiq.spt_identity_history_item (entry_date);

    create index identityiq.spt_id_hist_item_status on identityiq.spt_identity_history_item (status);


    create index identityiq.spt_id_hist_item_cert_type on identityiq.spt_identity_history_item (certification_type);

    alter table identityiq.spt_identity_history_item 
        add constraint FK60B753756651F3A 
        foreign key (identity_id) 
        references identityiq.spt_identity;

    create index identityiq.FK60B753756651F3A on identityiq.spt_identity_history_item (identity_id);

    alter table identityiq.spt_identity_history_item 
        add constraint FK60B7537A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK60B7537A5FB1B1 on identityiq.spt_identity_history_item (owner);

    create index identityiq.spt_idrequest_created on identityiq.spt_identity_request (created);

    create index identityiq.spt_idrequest_target_id on identityiq.spt_identity_request (target_id);


    create index identityiq.spt_idrequest_name on identityiq.spt_identity_request (name);

    create index identityiq.spt_idrequest_exec_status on identityiq.spt_identity_request (execution_status);

    create index identityiq.spt_idrequest_compl_status on identityiq.spt_identity_request (completion_status);

    create index identityiq.spt_idrequest_priority on identityiq.spt_identity_request (priority);

    create index identityiq.spt_idrequest_endDate on identityiq.spt_identity_request (end_date);

    create index identityiq.spt_idrequest_has_messages on identityiq.spt_identity_request (has_messages);

    create index identityiq.spt_idrequest_target on identityiq.spt_identity_request (target_display_name);

    create index identityiq.spt_idrequest_state on identityiq.spt_identity_request (state);

    create index identityiq.spt_idrequest_type on identityiq.spt_identity_request (type);

    create index identityiq.spt_idrequest_requestor on identityiq.spt_identity_request (requester_display_name);

    create index identityiq.spt_idrequest_verified on identityiq.spt_identity_request (verified);

    create index identityiq.spt_idrequest_requestor_id on identityiq.spt_identity_request (requester_id);

    alter table identityiq.spt_identity_request 
        add constraint FK62835596486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK62835596486634B7 on identityiq.spt_identity_request (assigned_scope);

    alter table identityiq.spt_identity_request 
        add constraint FK62835596A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK62835596A5FB1B1 on identityiq.spt_identity_request (owner);

    create index identityiq.spt_reqitem_comp_status on identityiq.spt_identity_request_item (compilation_status);



    create index identityiq.spt_reqitem_ownername on identityiq.spt_identity_request_item (owner_name);



    create index identityiq.spt_reqitem_exp_cause on identityiq.spt_identity_request_item (expansion_cause);

    create index identityiq.spt_reqitem_approval_state on identityiq.spt_identity_request_item (approval_state);

    create index identityiq.spt_reqitem_provisioning_state on identityiq.spt_identity_request_item (provisioning_state);

    create index identityiq.spt_reqitem_approvername on identityiq.spt_identity_request_item (approver_name);

    alter table identityiq.spt_identity_request_item 
        add constraint FKC8ACEC1C7733749D 
        foreign key (identity_request_id) 
        references identityiq.spt_identity_request;

    create index identityiq.FKC8ACEC1C7733749D on identityiq.spt_identity_request_item (identity_request_id);

    alter table identityiq.spt_identity_request_item 
        add constraint FKC8ACEC1CA5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FKC8ACEC1CA5FB1B1 on identityiq.spt_identity_request_item (owner);

    alter table identityiq.spt_identity_role_metadata 
        add constraint FK8DD1129F56651F3A 
        foreign key (identity_id) 
        references identityiq.spt_identity;

    create index identityiq.FK8DD1129F56651F3A on identityiq.spt_identity_role_metadata (identity_id);

    alter table identityiq.spt_identity_role_metadata 
        add constraint FK8DD1129F539509E7 
        foreign key (role_metadata_id) 
        references identityiq.spt_role_metadata;

    create index identityiq.FK8DD1129F539509E7 on identityiq.spt_identity_role_metadata (role_metadata_id);

    create index identityiq.spt_idsnap_id_name on identityiq.spt_identity_snapshot (identity_name);

    create index identityiq.spt_identity_id on identityiq.spt_identity_snapshot (identity_id);

    alter table identityiq.spt_identity_snapshot 
        add constraint FK1652D39D486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK1652D39D486634B7 on identityiq.spt_identity_snapshot (assigned_scope);

    alter table identityiq.spt_identity_snapshot 
        add constraint FK1652D39DA5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK1652D39DA5FB1B1 on identityiq.spt_identity_snapshot (owner);

    alter table identityiq.spt_identity_trigger 
        add constraint FKE207B8BF3908AE7A 
        foreign key (rule_id) 
        references identityiq.spt_rule;

    create index identityiq.FKE207B8BF3908AE7A on identityiq.spt_identity_trigger (rule_id);

    alter table identityiq.spt_identity_trigger 
        add constraint FKE207B8BF486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FKE207B8BF486634B7 on identityiq.spt_identity_trigger (assigned_scope);

    alter table identityiq.spt_identity_trigger 
        add constraint FKE207B8BFA5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FKE207B8BFA5FB1B1 on identityiq.spt_identity_trigger (owner);

    alter table identityiq.spt_identity_workgroups 
        add constraint FKFBDE3BBE56651F3A 
        foreign key (identity_id) 
        references identityiq.spt_identity;

    create index identityiq.FKFBDE3BBE56651F3A on identityiq.spt_identity_workgroups (identity_id);

    alter table identityiq.spt_identity_workgroups 
        add constraint FKFBDE3BBE457BB10C 
        foreign key (workgroup) 
        references identityiq.spt_identity;

    create index identityiq.FKFBDE3BBE457BB10C on identityiq.spt_identity_workgroups (workgroup);

    alter table identityiq.spt_integration_config 
        add constraint FK12CC3B95907AB97A 
        foreign key (application_id) 
        references identityiq.spt_application;

    create index identityiq.FK12CC3B95907AB97A on identityiq.spt_integration_config (application_id);

    alter table identityiq.spt_integration_config 
        add constraint FK12CC3B95AAEC2008 
        foreign key (plan_initializer) 
        references identityiq.spt_rule;

    create index identityiq.FK12CC3B95AAEC2008 on identityiq.spt_integration_config (plan_initializer);

    alter table identityiq.spt_integration_config 
        add constraint FK12CC3B95FAA8585B 
        foreign key (container_id) 
        references identityiq.spt_bundle;

    create index identityiq.FK12CC3B95FAA8585B on identityiq.spt_integration_config (container_id);

    alter table identityiq.spt_integration_config 
        add constraint FK12CC3B95486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK12CC3B95486634B7 on identityiq.spt_integration_config (assigned_scope);

    alter table identityiq.spt_integration_config 
        add constraint FK12CC3B95A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK12CC3B95A5FB1B1 on identityiq.spt_integration_config (owner);

    alter table identityiq.spt_jasper_files 
        add constraint FKE710B7C1AAD4575B 
        foreign key (result) 
        references identityiq.spt_jasper_result;

    create index identityiq.FKE710B7C1AAD4575B on identityiq.spt_jasper_files (result);

    alter table identityiq.spt_jasper_files 
        add constraint FKE710B7C12ABB3BFC 
        foreign key (elt) 
        references identityiq.spt_persisted_file;

    create index identityiq.FKE710B7C12ABB3BFC on identityiq.spt_jasper_files (elt);

    create index identityiq.handlerId on identityiq.spt_jasper_page_bucket (handler_id);

    create index identityiq.bucketNumber on identityiq.spt_jasper_page_bucket (bucket_number);

    alter table identityiq.spt_jasper_page_bucket 
        add constraint FKA6291364486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FKA6291364486634B7 on identityiq.spt_jasper_page_bucket (assigned_scope);

    alter table identityiq.spt_jasper_page_bucket 
        add constraint FKA6291364A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FKA6291364A5FB1B1 on identityiq.spt_jasper_page_bucket (owner);

    alter table identityiq.spt_jasper_result 
        add constraint FKF4B7413486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FKF4B7413486634B7 on identityiq.spt_jasper_result (assigned_scope);

    alter table identityiq.spt_jasper_result 
        add constraint FKF4B7413A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FKF4B7413A5FB1B1 on identityiq.spt_jasper_result (owner);

    alter table identityiq.spt_jasper_template 
        add constraint FK2F7D52F0486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK2F7D52F0486634B7 on identityiq.spt_jasper_template (assigned_scope);

    alter table identityiq.spt_jasper_template 
        add constraint FK2F7D52F0A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK2F7D52F0A5FB1B1 on identityiq.spt_jasper_template (owner);



    create index identityiq.spt_link_lastAggregation on identityiq.spt_link (last_target_aggregation);


    create index identityiq.spt_link_lastRefresh on identityiq.spt_link (last_refresh);


    create index identityiq.spt_link_entitlements on identityiq.spt_link (entitlements);

    alter table identityiq.spt_link 
        add constraint FK9A40A58239D71460 
        foreign key (application) 
        references identityiq.spt_application;

    create index identityiq.FK9A40A58239D71460 on identityiq.spt_link (application);

    alter table identityiq.spt_link 
        add constraint FK9A40A58256651F3A 
        foreign key (identity_id) 
        references identityiq.spt_identity;

    create index identityiq.FK9A40A58256651F3A on identityiq.spt_link (identity_id);

    alter table identityiq.spt_link 
        add constraint FK9A40A582486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK9A40A582486634B7 on identityiq.spt_link (assigned_scope);

    alter table identityiq.spt_link 
        add constraint FK9A40A582A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK9A40A582A5FB1B1 on identityiq.spt_link (owner);

    create index identityiq.spt_localized_attr_targetname on identityiq.spt_localized_attribute (target_name);

    create index identityiq.spt_localized_attr_attr on identityiq.spt_localized_attribute (attribute);

    create index identityiq.spt_localized_attr_name on identityiq.spt_localized_attribute (name);

    create index identityiq.spt_localized_attr_locale on identityiq.spt_localized_attribute (locale);

    create index identityiq.spt_localized_attr_targetid on identityiq.spt_localized_attribute (target_id);

    alter table identityiq.spt_localized_attribute 
        add constraint FK93ADD450A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK93ADD450A5FB1B1 on identityiq.spt_localized_attribute (owner);

    alter table identityiq.spt_managed_attr_inheritance 
        add constraint FK53B8B9A42C3CA9DA 
        foreign key (managedattribute) 
        references identityiq.spt_managed_attribute;

    create index identityiq.FK53B8B9A42C3CA9DA on identityiq.spt_managed_attr_inheritance (managedattribute);

    alter table identityiq.spt_managed_attr_inheritance 
        add constraint FK53B8B9A4C7A4B4AE 
        foreign key (inherits_from) 
        references identityiq.spt_managed_attribute;

    create index identityiq.FK53B8B9A4C7A4B4AE on identityiq.spt_managed_attr_inheritance (inherits_from);

    alter table identityiq.spt_managed_attr_perms 
        add constraint FKB7E473DD2C3CA9DA 
        foreign key (managedattribute) 
        references identityiq.spt_managed_attribute;

    create index identityiq.FKB7E473DD2C3CA9DA on identityiq.spt_managed_attr_perms (managedattribute);

    alter table identityiq.spt_managed_attr_target_perms 
        add constraint FK7839CDBB2C3CA9DA 
        foreign key (managedattribute) 
        references identityiq.spt_managed_attribute;

    create index identityiq.FK7839CDBB2C3CA9DA on identityiq.spt_managed_attr_target_perms (managedattribute);

    create index identityiq.spt_managed_attr_aggregated on identityiq.spt_managed_attribute (aggregated);

    create index identityiq.spt_managed_attr_purview on identityiq.spt_managed_attribute (purview);

    create index identityiq.spt_managed_attr_type on identityiq.spt_managed_attribute (type);

    create index identityiq.spt_managed_attr_requestable on identityiq.spt_managed_attribute (requestable);










    create index identityiq.spt_managed_attr_last_tgt_agg on identityiq.spt_managed_attribute (last_target_aggregation);



    alter table identityiq.spt_managed_attribute 
        add constraint FKF5F1417439D71460 
        foreign key (application) 
        references identityiq.spt_application;

    create index identityiq.FKF5F1417439D71460 on identityiq.spt_managed_attribute (application);

    alter table identityiq.spt_managed_attribute 
        add constraint FKF5F14174486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FKF5F14174486634B7 on identityiq.spt_managed_attribute (assigned_scope);

    alter table identityiq.spt_managed_attribute 
        add constraint FKF5F14174A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FKF5F14174A5FB1B1 on identityiq.spt_managed_attribute (owner);

    alter table identityiq.spt_message_template 
        add constraint FKD78FF3A486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FKD78FF3A486634B7 on identityiq.spt_message_template (assigned_scope);

    alter table identityiq.spt_message_template 
        add constraint FKD78FF3AA5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FKD78FF3AA5FB1B1 on identityiq.spt_message_template (owner);

    alter table identityiq.spt_mining_config 
        add constraint FK2894D189486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK2894D189486634B7 on identityiq.spt_mining_config (assigned_scope);

    alter table identityiq.spt_mining_config 
        add constraint FK2894D189A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK2894D189A5FB1B1 on identityiq.spt_mining_config (owner);

    create index identityiq.spt_mitigation_policy on identityiq.spt_mitigation_expiration (policy);



    create index identityiq.spt_mitigation_role on identityiq.spt_mitigation_expiration (role_name);

    create index identityiq.spt_mitigation_permission on identityiq.spt_mitigation_expiration (permission);


    create index identityiq.spt_mitigation_app on identityiq.spt_mitigation_expiration (application);

    create index identityiq.spt_mitigation_instance on identityiq.spt_mitigation_expiration (instance);

    alter table identityiq.spt_mitigation_expiration 
        add constraint FK6C20072756651F3A 
        foreign key (identity_id) 
        references identityiq.spt_identity;

    create index identityiq.FK6C20072756651F3A on identityiq.spt_mitigation_expiration (identity_id);

    alter table identityiq.spt_mitigation_expiration 
        add constraint FK6C200727486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK6C200727486634B7 on identityiq.spt_mitigation_expiration (assigned_scope);

    alter table identityiq.spt_mitigation_expiration 
        add constraint FK6C200727A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK6C200727A5FB1B1 on identityiq.spt_mitigation_expiration (owner);

    alter table identityiq.spt_mitigation_expiration 
        add constraint FK6C20072771E36ACA 
        foreign key (mitigator) 
        references identityiq.spt_identity;

    create index identityiq.FK6C20072771E36ACA on identityiq.spt_mitigation_expiration (mitigator);

    alter table identityiq.spt_object_config 
        add constraint FK92854BBA486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK92854BBA486634B7 on identityiq.spt_object_config (assigned_scope);

    alter table identityiq.spt_object_config 
        add constraint FK92854BBAA5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK92854BBAA5FB1B1 on identityiq.spt_object_config (owner);

    create index identityiq.spt_partition_status on identityiq.spt_partition_result (completion_status);

    alter table identityiq.spt_partition_result 
        add constraint FK9541609A3EE0F059 
        foreign key (task_result) 
        references identityiq.spt_task_result;

    create index identityiq.FK9541609A3EE0F059 on identityiq.spt_partition_result (task_result);

    alter table identityiq.spt_partition_result 
        add constraint FK9541609A486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK9541609A486634B7 on identityiq.spt_partition_result (assigned_scope);

    alter table identityiq.spt_partition_result 
        add constraint FK9541609AA5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK9541609AA5FB1B1 on identityiq.spt_partition_result (owner);

    alter table identityiq.spt_password_policy 
        add constraint FK479B98CEA5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK479B98CEA5FB1B1 on identityiq.spt_password_policy (owner);

    alter table identityiq.spt_password_policy_holder 
        add constraint FKA7124E3D39D71460 
        foreign key (application) 
        references identityiq.spt_application;

    create index identityiq.FKA7124E3D39D71460 on identityiq.spt_password_policy_holder (application);

    alter table identityiq.spt_password_policy_holder 
        add constraint FKA7124E3D25FBEF1F 
        foreign key (policy) 
        references identityiq.spt_password_policy;

    create index identityiq.FKA7124E3D25FBEF1F on identityiq.spt_password_policy_holder (policy);

    alter table identityiq.spt_password_policy_holder 
        add constraint FKA7124E3DA5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FKA7124E3DA5FB1B1 on identityiq.spt_password_policy_holder (owner);

    alter table identityiq.spt_persisted_file 
        add constraint FKCEBAA850486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FKCEBAA850486634B7 on identityiq.spt_persisted_file (assigned_scope);

    alter table identityiq.spt_persisted_file 
        add constraint FKCEBAA850A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FKCEBAA850A5FB1B1 on identityiq.spt_persisted_file (owner);

    alter table identityiq.spt_policy 
        add constraint FK13D458BA2E02D59E 
        foreign key (violation_owner_rule) 
        references identityiq.spt_rule;

    create index identityiq.FK13D458BA2E02D59E on identityiq.spt_policy (violation_owner_rule);

    alter table identityiq.spt_policy 
        add constraint FK13D458BA486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK13D458BA486634B7 on identityiq.spt_policy (assigned_scope);

    alter table identityiq.spt_policy 
        add constraint FK13D458BAA5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK13D458BAA5FB1B1 on identityiq.spt_policy (owner);

    alter table identityiq.spt_policy 
        add constraint FK13D458BA16E8C617 
        foreign key (violation_owner) 
        references identityiq.spt_identity;

    create index identityiq.FK13D458BA16E8C617 on identityiq.spt_policy (violation_owner);

    create index identityiq.spt_policy_violation_active on identityiq.spt_policy_violation (active);

    alter table identityiq.spt_policy_violation 
        add constraint FK6E4413E056651F3A 
        foreign key (identity_id) 
        references identityiq.spt_identity;

    create index identityiq.FK6E4413E056651F3A on identityiq.spt_policy_violation (identity_id);

    alter table identityiq.spt_policy_violation 
        add constraint FK6E4413E0BD5A5736 
        foreign key (pending_workflow) 
        references identityiq.spt_workflow_case;

    create index identityiq.FK6E4413E0BD5A5736 on identityiq.spt_policy_violation (pending_workflow);

    alter table identityiq.spt_policy_violation 
        add constraint FK6E4413E0486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK6E4413E0486634B7 on identityiq.spt_policy_violation (assigned_scope);

    alter table identityiq.spt_policy_violation 
        add constraint FK6E4413E0A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK6E4413E0A5FB1B1 on identityiq.spt_policy_violation (owner);

    alter table identityiq.spt_process 
        add constraint FK6BFCDBE7486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK6BFCDBE7486634B7 on identityiq.spt_process (assigned_scope);

    alter table identityiq.spt_process 
        add constraint FK6BFCDBE7A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK6BFCDBE7A5FB1B1 on identityiq.spt_process (owner);

    alter table identityiq.spt_process_application 
        add constraint FKD8579CF839D71460 
        foreign key (application) 
        references identityiq.spt_application;

    create index identityiq.FKD8579CF839D71460 on identityiq.spt_process_application (application);

    alter table identityiq.spt_process_application 
        add constraint FKD8579CF8B234269E 
        foreign key (process) 
        references identityiq.spt_process;

    create index identityiq.FKD8579CF8B234269E on identityiq.spt_process_application (process);

    alter table identityiq.spt_process_bundles 
        add constraint FK9F488BD97B02976F 
        foreign key (elt) 
        references identityiq.spt_bundle;

    create index identityiq.FK9F488BD97B02976F on identityiq.spt_process_bundles (elt);

    alter table identityiq.spt_process_bundles 
        add constraint FK9F488BD9B234269E 
        foreign key (process) 
        references identityiq.spt_process;

    create index identityiq.FK9F488BD9B234269E on identityiq.spt_process_bundles (process);

    create index identityiq.spt_process_log_approval_name on identityiq.spt_process_log (approval_name);

    create index identityiq.spt_process_log_process_name on identityiq.spt_process_log (process_name);

    create index identityiq.spt_process_log_owner_name on identityiq.spt_process_log (owner_name);

    create index identityiq.spt_process_log_step_name on identityiq.spt_process_log (step_name);

    create index identityiq.spt_process_log_case_id on identityiq.spt_process_log (case_id);

    create index identityiq.spt_process_log_case_status on identityiq.spt_process_log (case_status);

    create index identityiq.spt_process_log_wf_case_name on identityiq.spt_process_log (workflow_case_name);

    alter table identityiq.spt_process_log 
        add constraint FK28FB62EC486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK28FB62EC486634B7 on identityiq.spt_process_log (assigned_scope);

    alter table identityiq.spt_process_log 
        add constraint FK28FB62ECA5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK28FB62ECA5FB1B1 on identityiq.spt_process_log (owner);

    alter table identityiq.spt_profile 
        add constraint FK6BFE472139D71460 
        foreign key (application) 
        references identityiq.spt_application;

    create index identityiq.FK6BFE472139D71460 on identityiq.spt_profile (application);

    alter table identityiq.spt_profile 
        add constraint FK6BFE472122D068BA 
        foreign key (bundle_id) 
        references identityiq.spt_bundle;

    create index identityiq.FK6BFE472122D068BA on identityiq.spt_profile (bundle_id);

    alter table identityiq.spt_profile 
        add constraint FK6BFE4721486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK6BFE4721486634B7 on identityiq.spt_profile (assigned_scope);

    alter table identityiq.spt_profile 
        add constraint FK6BFE4721A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK6BFE4721A5FB1B1 on identityiq.spt_profile (owner);

    alter table identityiq.spt_profile_constraints 
        add constraint FKEFD7A218B236FD12 
        foreign key (profile) 
        references identityiq.spt_profile;

    create index identityiq.FKEFD7A218B236FD12 on identityiq.spt_profile_constraints (profile);

    alter table identityiq.spt_profile_permissions 
        add constraint FK932EF066B236FD12 
        foreign key (profile) 
        references identityiq.spt_profile;

    create index identityiq.FK932EF066B236FD12 on identityiq.spt_profile_permissions (profile);

    create index identityiq.spt_provreq_expiration on identityiq.spt_provisioning_request (expiration);

    alter table identityiq.spt_provisioning_request 
        add constraint FK604114C556651F3A 
        foreign key (identity_id) 
        references identityiq.spt_identity;

    create index identityiq.FK604114C556651F3A on identityiq.spt_provisioning_request (identity_id);

    alter table identityiq.spt_provisioning_request 
        add constraint FK604114C5486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK604114C5486634B7 on identityiq.spt_provisioning_request (assigned_scope);

    alter table identityiq.spt_provisioning_request 
        add constraint FK604114C5A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK604114C5A5FB1B1 on identityiq.spt_provisioning_request (owner);

    alter table identityiq.spt_quick_link 
        add constraint FKF16B9E94486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FKF16B9E94486634B7 on identityiq.spt_quick_link (assigned_scope);

    alter table identityiq.spt_quick_link 
        add constraint FKF16B9E94A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FKF16B9E94A5FB1B1 on identityiq.spt_quick_link (owner);

    alter table identityiq.spt_quick_link_dynamic_scopes 
        add constraint FK8D3289AAABBD9C75 
        foreign key (quick_link_id) 
        references identityiq.spt_quick_link;

    create index identityiq.FK8D3289AAABBD9C75 on identityiq.spt_quick_link_dynamic_scopes (quick_link_id);

    alter table identityiq.spt_quick_link_dynamic_scopes 
        add constraint FK8D3289AA6F1CB67B 
        foreign key (dynamic_scope_id) 
        references identityiq.spt_dynamic_scope;

    create index identityiq.FK8D3289AA6F1CB67B on identityiq.spt_quick_link_dynamic_scopes (dynamic_scope_id);

    alter table identityiq.spt_remediation_item 
        add constraint FK53608075FCF09A9D 
        foreign key (work_item_id) 
        references identityiq.spt_work_item;

    create index identityiq.FK53608075FCF09A9D on identityiq.spt_remediation_item (work_item_id);

    alter table identityiq.spt_remediation_item 
        add constraint FK53608075EDFFCCCD 
        foreign key (assignee) 
        references identityiq.spt_identity;

    create index identityiq.FK53608075EDFFCCCD on identityiq.spt_remediation_item (assignee);

    alter table identityiq.spt_remediation_item 
        add constraint FK53608075486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK53608075486634B7 on identityiq.spt_remediation_item (assigned_scope);

    alter table identityiq.spt_remediation_item 
        add constraint FK53608075A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK53608075A5FB1B1 on identityiq.spt_remediation_item (owner);

    create index identityiq.spt_remote_login_expiration on identityiq.spt_remote_login_token (expiration);

    alter table identityiq.spt_remote_login_token 
        add constraint FK45BCDEB2486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK45BCDEB2486634B7 on identityiq.spt_remote_login_token (assigned_scope);

    alter table identityiq.spt_remote_login_token 
        add constraint FK45BCDEB2A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK45BCDEB2A5FB1B1 on identityiq.spt_remote_login_token (owner);

    create index identityiq.spt_request_name on identityiq.spt_request (name);

    create index identityiq.spt_request_expiration on identityiq.spt_request (expiration);

    create index identityiq.spt_request_compl_status on identityiq.spt_request (completion_status);

    create index identityiq.spt_request_phase on identityiq.spt_request (phase);

    create index identityiq.spt_request_nextLaunch on identityiq.spt_request (next_launch);

    create index identityiq.spt_request_depPhase on identityiq.spt_request (dependent_phase);

    alter table identityiq.spt_request 
        add constraint FKBFBEB0073EE0F059 
        foreign key (task_result) 
        references identityiq.spt_task_result;

    create index identityiq.FKBFBEB0073EE0F059 on identityiq.spt_request (task_result);

    alter table identityiq.spt_request 
        add constraint FKBFBEB007307D4C55 
        foreign key (definition) 
        references identityiq.spt_request_definition;

    create index identityiq.FKBFBEB007307D4C55 on identityiq.spt_request (definition);

    alter table identityiq.spt_request 
        add constraint FKBFBEB007486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FKBFBEB007486634B7 on identityiq.spt_request (assigned_scope);

    alter table identityiq.spt_request 
        add constraint FKBFBEB007A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FKBFBEB007A5FB1B1 on identityiq.spt_request (owner);

    alter table identityiq.spt_request_arguments 
        add constraint FK2551071EACF1AFBA 
        foreign key (signature) 
        references identityiq.spt_request_definition;

    create index identityiq.FK2551071EACF1AFBA on identityiq.spt_request_arguments (signature);

    alter table identityiq.spt_request_definition 
        add constraint FKF976608B486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FKF976608B486634B7 on identityiq.spt_request_definition (assigned_scope);

    alter table identityiq.spt_request_definition 
        add constraint FKF976608BA5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FKF976608BA5FB1B1 on identityiq.spt_request_definition (owner);

    alter table identityiq.spt_request_definition 
        add constraint FKF976608B319F1FAC 
        foreign key (parent) 
        references identityiq.spt_request_definition;

    create index identityiq.FKF976608B319F1FAC on identityiq.spt_request_definition (parent);

    alter table identityiq.spt_request_definition_rights 
        add constraint FKD7D17C0B77278CD9 
        foreign key (request_definition_id) 
        references identityiq.spt_request_definition;

    create index identityiq.FKD7D17C0B77278CD9 on identityiq.spt_request_definition_rights (request_definition_id);

    alter table identityiq.spt_request_definition_rights 
        add constraint FKD7D17C0BD22635BD 
        foreign key (right_id) 
        references identityiq.spt_right;

    create index identityiq.FKD7D17C0BD22635BD on identityiq.spt_request_definition_rights (right_id);

    alter table identityiq.spt_request_returns 
        add constraint FK9F6C90BACF1AFBA 
        foreign key (signature) 
        references identityiq.spt_request_definition;

    create index identityiq.FK9F6C90BACF1AFBA on identityiq.spt_request_returns (signature);

    alter table identityiq.spt_resource_event 
        add constraint FK37A182B139D71460 
        foreign key (application) 
        references identityiq.spt_application;

    create index identityiq.FK37A182B139D71460 on identityiq.spt_resource_event (application);

    alter table identityiq.spt_right 
        add constraint FKAE287D94486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FKAE287D94486634B7 on identityiq.spt_right (assigned_scope);

    alter table identityiq.spt_right 
        add constraint FKAE287D94A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FKAE287D94A5FB1B1 on identityiq.spt_right (owner);

    alter table identityiq.spt_right_config 
        add constraint FKE69E544D486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FKE69E544D486634B7 on identityiq.spt_right_config (assigned_scope);

    alter table identityiq.spt_right_config 
        add constraint FKE69E544DA5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FKE69E544DA5FB1B1 on identityiq.spt_right_config (owner);

    create index identityiq.role_index_cscore on identityiq.spt_role_index (composite_score);

    alter table identityiq.spt_role_index 
        add constraint FKF99E0B5128E03F44 
        foreign key (bundle) 
        references identityiq.spt_bundle;

    create index identityiq.FKF99E0B5128E03F44 on identityiq.spt_role_index (bundle);

    alter table identityiq.spt_role_index 
        add constraint FKF99E0B51486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FKF99E0B51486634B7 on identityiq.spt_role_index (assigned_scope);

    alter table identityiq.spt_role_index 
        add constraint FKF99E0B51A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FKF99E0B51A5FB1B1 on identityiq.spt_role_index (owner);

    alter table identityiq.spt_role_metadata 
        add constraint FK1D4114507B368F38 
        foreign key (role) 
        references identityiq.spt_bundle;

    create index identityiq.FK1D4114507B368F38 on identityiq.spt_role_metadata (role);

    alter table identityiq.spt_role_metadata 
        add constraint FK1D411450486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK1D411450486634B7 on identityiq.spt_role_metadata (assigned_scope);

    alter table identityiq.spt_role_metadata 
        add constraint FK1D411450A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK1D411450A5FB1B1 on identityiq.spt_role_metadata (owner);

    alter table identityiq.spt_role_mining_result 
        add constraint FKF65D466B486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FKF65D466B486634B7 on identityiq.spt_role_mining_result (assigned_scope);

    alter table identityiq.spt_role_mining_result 
        add constraint FKF65D466BA5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FKF65D466BA5FB1B1 on identityiq.spt_role_mining_result (owner);

    alter table identityiq.spt_role_scorecard 
        add constraint FK494BABA1CD12A446 
        foreign key (role_id) 
        references identityiq.spt_bundle;

    create index identityiq.FK494BABA1CD12A446 on identityiq.spt_role_scorecard (role_id);

    alter table identityiq.spt_role_scorecard 
        add constraint FK494BABA1486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK494BABA1486634B7 on identityiq.spt_role_scorecard (assigned_scope);

    alter table identityiq.spt_role_scorecard 
        add constraint FK494BABA1A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK494BABA1A5FB1B1 on identityiq.spt_role_scorecard (owner);

    alter table identityiq.spt_rule 
        add constraint FK9A438C84486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK9A438C84486634B7 on identityiq.spt_rule (assigned_scope);

    alter table identityiq.spt_rule 
        add constraint FK9A438C84A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK9A438C84A5FB1B1 on identityiq.spt_rule (owner);

    alter table identityiq.spt_rule_dependencies 
        add constraint FKCBE25104DB28D887 
        foreign key (dependency) 
        references identityiq.spt_rule;

    create index identityiq.FKCBE25104DB28D887 on identityiq.spt_rule_dependencies (dependency);

    alter table identityiq.spt_rule_dependencies 
        add constraint FKCBE251043908AE7A 
        foreign key (rule_id) 
        references identityiq.spt_rule;

    create index identityiq.FKCBE251043908AE7A on identityiq.spt_rule_dependencies (rule_id);

    alter table identityiq.spt_rule_registry 
        add constraint FK3D19A998486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK3D19A998486634B7 on identityiq.spt_rule_registry (assigned_scope);

    alter table identityiq.spt_rule_registry 
        add constraint FK3D19A998A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK3D19A998A5FB1B1 on identityiq.spt_rule_registry (owner);

    alter table identityiq.spt_rule_registry_callouts 
        add constraint FKF177290A3908AE7A 
        foreign key (rule_id) 
        references identityiq.spt_rule;

    create index identityiq.FKF177290A3908AE7A on identityiq.spt_rule_registry_callouts (rule_id);

    alter table identityiq.spt_rule_registry_callouts 
        add constraint FKF177290AB7A3F533 
        foreign key (rule_registry_id) 
        references identityiq.spt_rule_registry;

    create index identityiq.FKF177290AB7A3F533 on identityiq.spt_rule_registry_callouts (rule_registry_id);

    alter table identityiq.spt_rule_signature_arguments 
        add constraint FK192036541CB79DF4 
        foreign key (signature) 
        references identityiq.spt_rule;

    create index identityiq.FK192036541CB79DF4 on identityiq.spt_rule_signature_arguments (signature);

    alter table identityiq.spt_rule_signature_returns 
        add constraint FKCF144DC11CB79DF4 
        foreign key (signature) 
        references identityiq.spt_rule;

    create index identityiq.FKCF144DC11CB79DF4 on identityiq.spt_rule_signature_returns (signature);

    create index identityiq.spt_app_attr_mod on identityiq.spt_schema_attributes (remed_mod_type);

    alter table identityiq.spt_schema_attributes 
        add constraint FK95BF22DB9A312D2 
        foreign key (applicationschema) 
        references identityiq.spt_application_schema;

    create index identityiq.FK95BF22DB9A312D2 on identityiq.spt_schema_attributes (applicationschema);


    create index identityiq.scope_dirty on identityiq.spt_scope (dirty);


    create index identityiq.scope_path on identityiq.spt_scope (path);

    alter table identityiq.spt_scope 
        add constraint FKAE33F9CC486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FKAE33F9CC486634B7 on identityiq.spt_scope (assigned_scope);

    alter table identityiq.spt_scope 
        add constraint FKAE33F9CC35F348E4 
        foreign key (parent_id) 
        references identityiq.spt_scope;

    create index identityiq.FKAE33F9CC35F348E4 on identityiq.spt_scope (parent_id);

    alter table identityiq.spt_scope 
        add constraint FKAE33F9CCA5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FKAE33F9CCA5FB1B1 on identityiq.spt_scope (owner);

    alter table identityiq.spt_score_config 
        add constraint FKC7BA0717B37A9D03 
        foreign key (right_config) 
        references identityiq.spt_right_config;

    create index identityiq.FKC7BA0717B37A9D03 on identityiq.spt_score_config (right_config);

    alter table identityiq.spt_score_config 
        add constraint FKC7BA0717486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FKC7BA0717486634B7 on identityiq.spt_score_config (assigned_scope);

    alter table identityiq.spt_score_config 
        add constraint FKC7BA0717A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FKC7BA0717A5FB1B1 on identityiq.spt_score_config (owner);

    create index identityiq.identity_scorecard_cscore on identityiq.spt_scorecard (composite_score);

    alter table identityiq.spt_scorecard 
        add constraint FK2062601A56651F3A 
        foreign key (identity_id) 
        references identityiq.spt_identity;

    create index identityiq.FK2062601A56651F3A on identityiq.spt_scorecard (identity_id);

    alter table identityiq.spt_scorecard 
        add constraint FK2062601A486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK2062601A486634B7 on identityiq.spt_scorecard (assigned_scope);

    alter table identityiq.spt_scorecard 
        add constraint FK2062601AA5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK2062601AA5FB1B1 on identityiq.spt_scorecard (owner);

    alter table identityiq.spt_service_status 
        add constraint FKB5E2AC44426BA8FB 
        foreign key (definition) 
        references identityiq.spt_service_definition;

    create index identityiq.FKB5E2AC44426BA8FB on identityiq.spt_service_status (definition);

    create index identityiq.sign_off_history_signer_id on identityiq.spt_sign_off_history (signer_id);

    create index identityiq.spt_sign_off_history_esig on identityiq.spt_sign_off_history (electronic_sign);

    alter table identityiq.spt_sign_off_history 
        add constraint FK2BDCCBCADB59193A 
        foreign key (certification_id) 
        references identityiq.spt_certification;

    create index identityiq.FK2BDCCBCADB59193A on identityiq.spt_sign_off_history (certification_id);

    alter table identityiq.spt_sign_off_history 
        add constraint FK2BDCCBCA486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK2BDCCBCA486634B7 on identityiq.spt_sign_off_history (assigned_scope);

    alter table identityiq.spt_sign_off_history 
        add constraint FK2BDCCBCAA5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK2BDCCBCAA5FB1B1 on identityiq.spt_sign_off_history (owner);

    alter table identityiq.spt_snapshot_permissions 
        add constraint FK74F58811356B4995 
        foreign key (snapshot) 
        references identityiq.spt_entitlement_snapshot;

    create index identityiq.FK74F58811356B4995 on identityiq.spt_snapshot_permissions (snapshot);

    alter table identityiq.spt_sodconstraint 
        add constraint FKDB94CDD2E02D59E 
        foreign key (violation_owner_rule) 
        references identityiq.spt_rule;

    create index identityiq.FKDB94CDD2E02D59E on identityiq.spt_sodconstraint (violation_owner_rule);

    alter table identityiq.spt_sodconstraint 
        add constraint FKDB94CDD57FD28A4 
        foreign key (policy) 
        references identityiq.spt_policy;

    create index identityiq.FKDB94CDD57FD28A4 on identityiq.spt_sodconstraint (policy);

    alter table identityiq.spt_sodconstraint 
        add constraint FKDB94CDD486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FKDB94CDD486634B7 on identityiq.spt_sodconstraint (assigned_scope);

    alter table identityiq.spt_sodconstraint 
        add constraint FKDB94CDDA5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FKDB94CDDA5FB1B1 on identityiq.spt_sodconstraint (owner);

    alter table identityiq.spt_sodconstraint 
        add constraint FKDB94CDD16E8C617 
        foreign key (violation_owner) 
        references identityiq.spt_identity;

    create index identityiq.FKDB94CDD16E8C617 on identityiq.spt_sodconstraint (violation_owner);

    alter table identityiq.spt_sodconstraint_left 
        add constraint FKCCC28E29AEB984AA 
        foreign key (sodconstraint) 
        references identityiq.spt_sodconstraint;

    create index identityiq.FKCCC28E29AEB984AA on identityiq.spt_sodconstraint_left (sodconstraint);

    alter table identityiq.spt_sodconstraint_left 
        add constraint FKCCC28E2952F56EF8 
        foreign key (businessrole) 
        references identityiq.spt_bundle;

    create index identityiq.FKCCC28E2952F56EF8 on identityiq.spt_sodconstraint_left (businessrole);

    alter table identityiq.spt_sodconstraint_right 
        add constraint FKCBE5983AAEB984AA 
        foreign key (sodconstraint) 
        references identityiq.spt_sodconstraint;

    create index identityiq.FKCBE5983AAEB984AA on identityiq.spt_sodconstraint_right (sodconstraint);

    alter table identityiq.spt_sodconstraint_right 
        add constraint FKCBE5983A52F56EF8 
        foreign key (businessrole) 
        references identityiq.spt_bundle;

    create index identityiq.FKCBE5983A52F56EF8 on identityiq.spt_sodconstraint_right (businessrole);

    alter table identityiq.spt_sync_roles 
        add constraint FK1F091BA1719E7338 
        foreign key (config) 
        references identityiq.spt_integration_config;

    create index identityiq.FK1F091BA1719E7338 on identityiq.spt_sync_roles (config);

    alter table identityiq.spt_sync_roles 
        add constraint FK1F091BA128E03F44 
        foreign key (bundle) 
        references identityiq.spt_bundle;

    create index identityiq.FK1F091BA128E03F44 on identityiq.spt_sync_roles (bundle);

    create index identityiq.spt_syslog_event_level on identityiq.spt_syslog_event (event_level);

    create index identityiq.spt_syslog_classname on identityiq.spt_syslog_event (classname);

    create index identityiq.spt_syslog_quickKey on identityiq.spt_syslog_event (quick_key);

    create index identityiq.spt_syslog_message on identityiq.spt_syslog_event (message);

    create index identityiq.spt_syslog_username on identityiq.spt_syslog_event (username);

    create index identityiq.spt_syslog_server on identityiq.spt_syslog_event (server);

    alter table identityiq.spt_tag 
        add constraint FK891AF912486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK891AF912486634B7 on identityiq.spt_tag (assigned_scope);

    alter table identityiq.spt_tag 
        add constraint FK891AF912A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK891AF912A5FB1B1 on identityiq.spt_tag (owner);

    alter table identityiq.spt_target 
        add constraint FK19E5251939D71460 
        foreign key (application) 
        references identityiq.spt_application;

    create index identityiq.FK19E5251939D71460 on identityiq.spt_target (application);

    alter table identityiq.spt_target 
        add constraint FK19E525192F001D5 
        foreign key (target_source) 
        references identityiq.spt_target_source;

    create index identityiq.FK19E525192F001D5 on identityiq.spt_target (target_source);

    alter table identityiq.spt_target 
        add constraint FK19E52519486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK19E52519486634B7 on identityiq.spt_target (assigned_scope);

    alter table identityiq.spt_target 
        add constraint FK19E52519A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK19E52519A5FB1B1 on identityiq.spt_target (owner);

    create index identityiq.spt_target_assoc_id on identityiq.spt_target_association (object_id);

    alter table identityiq.spt_target_association 
        add constraint FK7AD6825B486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK7AD6825B486634B7 on identityiq.spt_target_association (assigned_scope);

    alter table identityiq.spt_target_association 
        add constraint FK7AD6825B68039A5A 
        foreign key (target_id) 
        references identityiq.spt_target;

    create index identityiq.FK7AD6825B68039A5A on identityiq.spt_target_association (target_id);

    alter table identityiq.spt_target_association 
        add constraint FK7AD6825BA5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK7AD6825BA5FB1B1 on identityiq.spt_target_association (owner);

    alter table identityiq.spt_target_source 
        add constraint FK6F502014FE65998 
        foreign key (creation_rule) 
        references identityiq.spt_rule;

    create index identityiq.FK6F502014FE65998 on identityiq.spt_target_source (creation_rule);

    alter table identityiq.spt_target_source 
        add constraint FK6F50201B854BFAE 
        foreign key (transformation_rule) 
        references identityiq.spt_rule;

    create index identityiq.FK6F50201B854BFAE on identityiq.spt_target_source (transformation_rule);

    alter table identityiq.spt_target_source 
        add constraint FK6F50201BE1EE0D5 
        foreign key (correlation_rule) 
        references identityiq.spt_rule;

    create index identityiq.FK6F50201BE1EE0D5 on identityiq.spt_target_source (correlation_rule);

    alter table identityiq.spt_target_source 
        add constraint FK6F50201486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK6F50201486634B7 on identityiq.spt_target_source (assigned_scope);

    alter table identityiq.spt_target_source 
        add constraint FK6F50201A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK6F50201A5FB1B1 on identityiq.spt_target_source (owner);

    alter table identityiq.spt_target_sources 
        add constraint FKD7AB3E9239D71460 
        foreign key (application) 
        references identityiq.spt_application;

    create index identityiq.FKD7AB3E9239D71460 on identityiq.spt_target_sources (application);

    alter table identityiq.spt_target_sources 
        add constraint FKD7AB3E9270D64BF9 
        foreign key (elt) 
        references identityiq.spt_target_source;

    create index identityiq.FKD7AB3E9270D64BF9 on identityiq.spt_target_sources (elt);

    create index identityiq.spt_task_deprecated on identityiq.spt_task_definition (deprecated);

    alter table identityiq.spt_task_definition 
        add constraint FK526FE5C57A31ADF5 
        foreign key (signoff_config) 
        references identityiq.spt_work_item_config;

    create index identityiq.FK526FE5C57A31ADF5 on identityiq.spt_task_definition (signoff_config);

    alter table identityiq.spt_task_definition 
        add constraint FK526FE5C5486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK526FE5C5486634B7 on identityiq.spt_task_definition (assigned_scope);

    alter table identityiq.spt_task_definition 
        add constraint FK526FE5C5A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK526FE5C5A5FB1B1 on identityiq.spt_task_definition (owner);

    alter table identityiq.spt_task_definition 
        add constraint FK526FE5C5ED0E8BA2 
        foreign key (parent) 
        references identityiq.spt_task_definition;

    create index identityiq.FK526FE5C5ED0E8BA2 on identityiq.spt_task_definition (parent);

    alter table identityiq.spt_task_definition_rights 
        add constraint FKAA0C8191D22635BD 
        foreign key (right_id) 
        references identityiq.spt_right;

    create index identityiq.FKAA0C8191D22635BD on identityiq.spt_task_definition_rights (right_id);

    alter table identityiq.spt_task_definition_rights 
        add constraint FKAA0C81913B7AD545 
        foreign key (task_definition_id) 
        references identityiq.spt_task_definition;

    create index identityiq.FKAA0C81913B7AD545 on identityiq.spt_task_definition_rights (task_definition_id);

    create index identityiq.spt_task_event_phase on identityiq.spt_task_event (phase);

    alter table identityiq.spt_task_event 
        add constraint FKDACBC2E83EE0F059 
        foreign key (task_result) 
        references identityiq.spt_task_result;

    create index identityiq.FKDACBC2E83EE0F059 on identityiq.spt_task_event (task_result);

    alter table identityiq.spt_task_event 
        add constraint FKDACBC2E83908AE7A 
        foreign key (rule_id) 
        references identityiq.spt_rule;

    create index identityiq.FKDACBC2E83908AE7A on identityiq.spt_task_event (rule_id);

    alter table identityiq.spt_task_event 
        add constraint FKDACBC2E8486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FKDACBC2E8486634B7 on identityiq.spt_task_event (assigned_scope);

    alter table identityiq.spt_task_event 
        add constraint FKDACBC2E8A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FKDACBC2E8A5FB1B1 on identityiq.spt_task_event (owner);

    create index identityiq.spt_task_compl_status on identityiq.spt_task_result (completion_status);

    create index identityiq.spt_taskresult_target on identityiq.spt_task_result (target_id);

    create index identityiq.spt_taskres_verified on identityiq.spt_task_result (verified);

    create index identityiq.spt_taskres_expiration on identityiq.spt_task_result (expiration);


    alter table identityiq.spt_task_result 
        add constraint FK93F2818FEBECB84B 
        foreign key (definition) 
        references identityiq.spt_task_definition;

    create index identityiq.FK93F2818FEBECB84B on identityiq.spt_task_result (definition);

    alter table identityiq.spt_task_result 
        add constraint FK93F2818F486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK93F2818F486634B7 on identityiq.spt_task_result (assigned_scope);

    alter table identityiq.spt_task_result 
        add constraint FK93F2818FAAD2E472 
        foreign key (report) 
        references identityiq.spt_jasper_result;

    create index identityiq.FK93F2818FAAD2E472 on identityiq.spt_task_result (report);

    alter table identityiq.spt_task_result 
        add constraint FK93F2818FA5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK93F2818FA5FB1B1 on identityiq.spt_task_result (owner);

    alter table identityiq.spt_task_signature_arguments 
        add constraint FK3E81365D68611BB0 
        foreign key (signature) 
        references identityiq.spt_task_definition;

    create index identityiq.FK3E81365D68611BB0 on identityiq.spt_task_signature_arguments (signature);

    alter table identityiq.spt_task_signature_returns 
        add constraint FK797BC0A68611BB0 
        foreign key (signature) 
        references identityiq.spt_task_definition;

    create index identityiq.FK797BC0A68611BB0 on identityiq.spt_task_signature_returns (signature);

    alter table identityiq.spt_time_period 
        add constraint FK49F210EB486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK49F210EB486634B7 on identityiq.spt_time_period (assigned_scope);

    alter table identityiq.spt_time_period 
        add constraint FK49F210EBA5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK49F210EBA5FB1B1 on identityiq.spt_time_period (owner);

    alter table identityiq.spt_uiconfig 
        add constraint FK2B1F445E486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK2B1F445E486634B7 on identityiq.spt_uiconfig (assigned_scope);

    alter table identityiq.spt_uiconfig 
        add constraint FK2B1F445EA5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK2B1F445EA5FB1B1 on identityiq.spt_uiconfig (owner);

    alter table identityiq.spt_uipreferences 
        add constraint FK15336F5CA5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK15336F5CA5FB1B1 on identityiq.spt_uipreferences (owner);

    create index identityiq.spt_work_item_type on identityiq.spt_work_item (type);

    create index identityiq.spt_work_item_target on identityiq.spt_work_item (target_id);

    create index identityiq.spt_work_item_name on identityiq.spt_work_item (name);

    create index identityiq.spt_work_item_ident_req_id on identityiq.spt_work_item (identity_request_id);

    alter table identityiq.spt_work_item 
        add constraint FKE2716EF95D5F3DE6 
        foreign key (certification_ref_id) 
        references identityiq.spt_certification;

    create index identityiq.FKE2716EF95D5F3DE6 on identityiq.spt_work_item (certification_ref_id);

    alter table identityiq.spt_work_item 
        add constraint FKE2716EF9EDFFCCCD 
        foreign key (assignee) 
        references identityiq.spt_identity;

    create index identityiq.FKE2716EF9EDFFCCCD on identityiq.spt_work_item (assignee);

    alter table identityiq.spt_work_item 
        add constraint FKE2716EF93257597F 
        foreign key (workflow_case) 
        references identityiq.spt_workflow_case;

    create index identityiq.FKE2716EF93257597F on identityiq.spt_work_item (workflow_case);

    alter table identityiq.spt_work_item 
        add constraint FKE2716EF9486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FKE2716EF9486634B7 on identityiq.spt_work_item (assigned_scope);

    alter table identityiq.spt_work_item 
        add constraint FKE2716EF92D68567A 
        foreign key (requester) 
        references identityiq.spt_identity;

    create index identityiq.FKE2716EF92D68567A on identityiq.spt_work_item (requester);

    alter table identityiq.spt_work_item 
        add constraint FKE2716EF9A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FKE2716EF9A5FB1B1 on identityiq.spt_work_item (owner);

    create index identityiq.spt_item_archive_severity on identityiq.spt_work_item_archive (severity);

    create index identityiq.spt_item_archive_name on identityiq.spt_work_item_archive (name);


    create index identityiq.spt_item_archive_type on identityiq.spt_work_item_archive (type);

    create index identityiq.spt_item_archive_completer on identityiq.spt_work_item_archive (completer);


    create index identityiq.spt_item_archive_workItemId on identityiq.spt_work_item_archive (work_item_id);


    create index identityiq.spt_item_archive_target on identityiq.spt_work_item_archive (target_id);

    create index identityiq.spt_item_archive_ident_req on identityiq.spt_work_item_archive (identity_request_id);

    alter table identityiq.spt_work_item_archive 
        add constraint FKDFABED7C486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FKDFABED7C486634B7 on identityiq.spt_work_item_archive (assigned_scope);

    alter table identityiq.spt_work_item_archive 
        add constraint FKDFABED7CA5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FKDFABED7CA5FB1B1 on identityiq.spt_work_item_archive (owner);

    alter table identityiq.spt_work_item_comments 
        add constraint FK5836687A4F2D4385 
        foreign key (work_item) 
        references identityiq.spt_work_item;

    create index identityiq.FK5836687A4F2D4385 on identityiq.spt_work_item_comments (work_item);

    alter table identityiq.spt_work_item_config 
        add constraint FKC86AF748F36F8B85 
        foreign key (reminder_email) 
        references identityiq.spt_email_template;

    create index identityiq.FKC86AF748F36F8B85 on identityiq.spt_work_item_config (reminder_email);

    alter table identityiq.spt_work_item_config 
        add constraint FKC86AF748C98DBFA2 
        foreign key (escalation_rule) 
        references identityiq.spt_rule;

    create index identityiq.FKC86AF748C98DBFA2 on identityiq.spt_work_item_config (escalation_rule);

    alter table identityiq.spt_work_item_config 
        add constraint FKC86AF748FDF11A44 
        foreign key (owner_rule) 
        references identityiq.spt_rule;

    create index identityiq.FKC86AF748FDF11A44 on identityiq.spt_work_item_config (owner_rule);

    alter table identityiq.spt_work_item_config 
        add constraint FKC86AF7487EAF553E 
        foreign key (notification_email) 
        references identityiq.spt_email_template;

    create index identityiq.FKC86AF7487EAF553E on identityiq.spt_work_item_config (notification_email);

    alter table identityiq.spt_work_item_config 
        add constraint FKC86AF74884EC4F68 
        foreign key (escalation_email) 
        references identityiq.spt_email_template;

    create index identityiq.FKC86AF74884EC4F68 on identityiq.spt_work_item_config (escalation_email);

    alter table identityiq.spt_work_item_config 
        add constraint FKC86AF748486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FKC86AF748486634B7 on identityiq.spt_work_item_config (assigned_scope);

    alter table identityiq.spt_work_item_config 
        add constraint FKC86AF748A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FKC86AF748A5FB1B1 on identityiq.spt_work_item_config (owner);

    alter table identityiq.spt_work_item_config 
        add constraint FKC86AF7482E3B7910 
        foreign key (parent) 
        references identityiq.spt_work_item_config;

    create index identityiq.FKC86AF7482E3B7910 on identityiq.spt_work_item_config (parent);

    alter table identityiq.spt_work_item_owners 
        add constraint FKDD55D82640D47AB 
        foreign key (elt) 
        references identityiq.spt_identity;

    create index identityiq.FKDD55D82640D47AB on identityiq.spt_work_item_owners (elt);

    alter table identityiq.spt_work_item_owners 
        add constraint FKDD55D82618CFF3A8 
        foreign key (config) 
        references identityiq.spt_work_item_config;

    create index identityiq.FKDD55D82618CFF3A8 on identityiq.spt_work_item_owners (config);

    alter table identityiq.spt_workflow 
        add constraint FK51A3C947486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK51A3C947486634B7 on identityiq.spt_workflow (assigned_scope);

    alter table identityiq.spt_workflow 
        add constraint FK51A3C947A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK51A3C947A5FB1B1 on identityiq.spt_workflow (owner);

    create index identityiq.spt_workflowcase_target on identityiq.spt_workflow_case (target_id);

    alter table identityiq.spt_workflow_case 
        add constraint FKB8E31F28486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FKB8E31F28486634B7 on identityiq.spt_workflow_case (assigned_scope);

    alter table identityiq.spt_workflow_case 
        add constraint FKB8E31F28A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FKB8E31F28A5FB1B1 on identityiq.spt_workflow_case (owner);

    alter table identityiq.spt_workflow_registry 
        add constraint FK1C2E1835486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK1C2E1835486634B7 on identityiq.spt_workflow_registry (assigned_scope);

    alter table identityiq.spt_workflow_registry 
        add constraint FK1C2E1835A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK1C2E1835A5FB1B1 on identityiq.spt_workflow_registry (owner);

    alter table identityiq.spt_workflow_rule_libraries 
        add constraint FKAE96C70EDB28D887 
        foreign key (dependency) 
        references identityiq.spt_rule;

    create index identityiq.FKAE96C70EDB28D887 on identityiq.spt_workflow_rule_libraries (dependency);

    alter table identityiq.spt_workflow_rule_libraries 
        add constraint FKAE96C70E6A8DCF3D 
        foreign key (rule_id) 
        references identityiq.spt_workflow;

    create index identityiq.FKAE96C70E6A8DCF3D on identityiq.spt_workflow_rule_libraries (rule_id);

    alter table identityiq.spt_workflow_target 
        add constraint FK2999F789486634B7 
        foreign key (assigned_scope) 
        references identityiq.spt_scope;

    create index identityiq.FK2999F789486634B7 on identityiq.spt_workflow_target (assigned_scope);

    alter table identityiq.spt_workflow_target 
        add constraint FK2999F789A5FB1B1 
        foreign key (owner) 
        references identityiq.spt_identity;

    create index identityiq.FK2999F789A5FB1B1 on identityiq.spt_workflow_target (owner);

    alter table identityiq.spt_workflow_target 
        add constraint FK2999F7896B5435D9 
        foreign key (workflow_case_id) 
        references identityiq.spt_workflow_case;

    create index identityiq.FK2999F7896B5435D9 on identityiq.spt_workflow_target (workflow_case_id);

    create index identityiq.spt_identity_modified on identityiq.spt_identity (modified);

    create index identityiq.spt_identity_created on identityiq.spt_identity (created);

    create index identityiq.spt_identity_entitlement_comp on identityiq.spt_identity_entitlement (identity_id, application, native_identity, instance);

    create index identityiq.spt_uuidcompositedelobj on identityiq.spt_deleted_object (application, uuid_ci);

    create index identityiq.spt_appidcompositedelobj on identityiq.spt_deleted_object (application, native_identity_ci);

    create index identityiq.spt_certification_certifiers on identityiq.spt_certifiers (certifier);

    create index identityiq.spt_request_completed on identityiq.spt_request (completed);

    create index identityiq.spt_request_id_composite on identityiq.spt_request (id, completed, next_launch, launched);

    create index identityiq.spt_request_launched on identityiq.spt_request (launched);

    create index identityiq.spt_workitem_owner_type on identityiq.spt_work_item (owner, type);

    create index identityiq.spt_cert_item_apps_name on identityiq.spt_cert_item_applications (application_name);

    create index identityiq.spt_bundle_modified on identityiq.spt_bundle (modified);

    create index identityiq.spt_bundle_created on identityiq.spt_bundle (created);

    create index identityiq.spt_task_result_created on identityiq.spt_task_result (created);

    create index identityiq.spt_task_result_launcher on identityiq.spt_task_result (launcher);

    create index identityiq.spt_managed_created on identityiq.spt_managed_attribute (created);

    create index identityiq.spt_managed_comp on identityiq.spt_managed_attribute (application, type, attribute, value);

    create index identityiq.spt_managed_modified on identityiq.spt_managed_attribute (modified);

    create index identityiq.SPT_IDXE5D0EE5E14FE3C13 on identityiq.spt_certification_archive (created);

    create index identityiq.spt_uuidcomposite on identityiq.spt_link (application, uuid_ci);

    create index identityiq.spt_appidcomposite on identityiq.spt_link (application, native_identity_ci);

    create index identityiq.spt_arch_cert_item_apps_name on identityiq.spt_arch_cert_item_apps (application_name);

    create index identityiq.spt_audit_event_created on identityiq.spt_audit_event (created);

    create index identityiq.spt_identity_snapshot_created on identityiq.spt_identity_snapshot (created);

    create index identityiq.spt_role_change_event_created on identityiq.spt_role_change_event (created);

    create index identityiq.spt_externaloidnamecomposite on identityiq.spt_link_external_attr (object_id, attribute_name_ci);

    create index identityiq.SPT_IDX5B44307D406AC829 on identityiq.spt_identity_external_attr (object_id, attribute_name_ci);

    create index identityiq.spt_externalnamevalcomposite on identityiq.spt_link_external_attr (attribute_name_ci, value_ci);

    create index identityiq.SPT_IDX6810487C4D36E028 on identityiq.spt_identity_external_attr (attribute_name_ci, value_ci);

    create index identityiq.spt_externalobjectid on identityiq.spt_link_external_attr (object_id);

    create index identityiq.SPT_IDX1CE9A5A52103D51 on identityiq.spt_identity_external_attr (object_id);

    create index identityiq.spt_target_assignedscopepath on identityiq.spt_target (assigned_scope_path);

    create index identityiq.spt_workflow_assignedscopepath on identityiq.spt_workflow (assigned_scope_path);

    create index identityiq.spt_uiconfig_assignedscopepath on identityiq.spt_uiconfig (assigned_scope_path);

    create index identityiq.SPT_IDX719553AD788A55AE on identityiq.spt_target_source (assigned_scope_path);

    create index identityiq.SPT_IDX7590C4E191BEDD16 on identityiq.spt_workflow_registry (assigned_scope_path);

    create index identityiq.SPT_IDXE2B6FD83726D2C4 on identityiq.spt_process_log (assigned_scope_path);

    create index identityiq.SPT_IDXECB4C9F64AB87280 on identityiq.spt_group_index (assigned_scope_path);

    create index identityiq.spt_identity_assignedscopepath on identityiq.spt_identity (assigned_scope_path);

    create index identityiq.SPT_IDX377FCC029A032198 on identityiq.spt_identity_request (assigned_scope_path);

    create index identityiq.SPT_IDX7F55103C9C96248C on identityiq.spt_role_metadata (assigned_scope_path);

    create index identityiq.SPT_IDXAEACA8FDA84AB44E on identityiq.spt_role_index (assigned_scope_path);

    create index identityiq.SPT_IDXECBE5C8C4B5A312C on identityiq.spt_capability (assigned_scope_path);

    create index identityiq.SPT_IDX133BD716174D236 on identityiq.spt_provisioning_request (assigned_scope_path);

    create index identityiq.SPT_IDX8CEA0D6E33EF6770 on identityiq.spt_batch_request (assigned_scope_path);

    create index identityiq.SPT_IDX7EDDBC591F6A3A06 on identityiq.spt_deleted_object (assigned_scope_path);

    create index identityiq.SPT_IDX2AE3D4A6385CD3E0 on identityiq.spt_message_template (assigned_scope_path);

    create index identityiq.SPT_IDX99FA48D474C60BBC on identityiq.spt_task_event (assigned_scope_path);

    create index identityiq.SPT_IDXCA5C5C012C739356 on identityiq.spt_certification_delegation (assigned_scope_path);

    create index identityiq.spt_form_assignedscopepath on identityiq.spt_form (assigned_scope_path);

    create index identityiq.SPT_IDX1DB04E7170203436 on identityiq.spt_task_definition (assigned_scope_path);

    create index identityiq.SPT_IDX321B16EB1422CFAA on identityiq.spt_identity_trigger (assigned_scope_path);

    create index identityiq.SPT_IDX59D4F6CD8690EEC on identityiq.spt_certification_definition (assigned_scope_path);

    create index identityiq.SPT_IDX5DA4B31DDBDDDB6 on identityiq.spt_activity_constraint (assigned_scope_path);

    create index identityiq.SPT_IDXBAF33EB59EE05DBE on identityiq.spt_archived_cert_entity (assigned_scope_path);

    create index identityiq.SPT_IDX352BB37529C8F73E on identityiq.spt_identity_archive (assigned_scope_path);

    create index identityiq.SPT_IDX90929F9EDF01B7D0 on identityiq.spt_certification (assigned_scope_path);

    create index identityiq.spt_request_assignedscopepath on identityiq.spt_request (assigned_scope_path);

    create index identityiq.SPT_IDXA6D194B42059DB7C on identityiq.spt_application (assigned_scope_path);

    create index identityiq.SPT_IDXBB0D4BCC29515FAC on identityiq.spt_policy_violation (assigned_scope_path);

    create index identityiq.SPT_IDXFF9A9E0694DBFEA0 on identityiq.spt_partition_result (assigned_scope_path);

    create index identityiq.SPT_IDX45D72A5E6CEE19E on identityiq.spt_work_item (assigned_scope_path);

    create index identityiq.SPT_IDX6BA77F433361865A on identityiq.spt_score_config (assigned_scope_path);

    create index identityiq.SPT_IDXDE774369778BEC26 on identityiq.spt_dashboard_layout (assigned_scope_path);

    create index identityiq.SPT_IDXD6F31180C85EB014 on identityiq.spt_quick_link (assigned_scope_path);

    create index identityiq.SPT_IDXBED7A8DAA6E4E148 on identityiq.spt_configuration (assigned_scope_path);

    create index identityiq.SPT_IDX8DFD31878D3B3E2 on identityiq.spt_target_association (assigned_scope_path);

    create index identityiq.SPT_IDXEA8F35F17CF0E336 on identityiq.spt_email_template (assigned_scope_path);

    create index identityiq.SPT_IDXDCCC1AEC8ACA85EC on identityiq.spt_certification_item (assigned_scope_path);

    create index identityiq.SPT_IDX54AF7352EE4EEBE on identityiq.spt_workflow_target (assigned_scope_path);

    create index identityiq.SPT_IDX608761A1BFB4BC8 on identityiq.spt_audit_config (assigned_scope_path);

    create index identityiq.spt_process_assignedscopepath on identityiq.spt_process (assigned_scope_path);

    create index identityiq.SPT_IDXA6919D21F9F21D96 on identityiq.spt_remediation_item (assigned_scope_path);

    create index identityiq.SPT_IDX11035135399822BE on identityiq.spt_mining_config (assigned_scope_path);

    create index identityiq.SPT_IDX9D89C40FB709EAF2 on identityiq.spt_certification_action (assigned_scope_path);

    create index identityiq.SPT_IDXDD339B534953A27A on identityiq.spt_mitigation_expiration (assigned_scope_path);

    create index identityiq.SPT_IDX6F2601261AB4CE0 on identityiq.spt_object_config (assigned_scope_path);

    create index identityiq.spt_bundle_assignedscopepath on identityiq.spt_bundle (assigned_scope_path);

    create index identityiq.SPT_IDX34534BBBC845CD4A on identityiq.spt_task_result (assigned_scope_path);

    create index identityiq.SPT_IDX6200CF1CF3199A4C on identityiq.spt_batch_request_item (assigned_scope_path);

    create index identityiq.spt_profile_assignedscopepath on identityiq.spt_profile (assigned_scope_path);

    create index identityiq.SPT_IDX1E683C17685A4D02 on identityiq.spt_time_period (assigned_scope_path);

    create index identityiq.SPT_IDX8F4ABD86AFAD1DA0 on identityiq.spt_scorecard (assigned_scope_path);

    create index identityiq.SPT_IDX6B29BC60611AFDD4 on identityiq.spt_managed_attribute (assigned_scope_path);

    create index identityiq.SPT_IDXC8BAE6DCF83839CC on identityiq.spt_jasper_template (assigned_scope_path);

    create index identityiq.SPT_IDXCB6BC61E1128A4D0 on identityiq.spt_remote_login_token (assigned_scope_path);

    create index identityiq.SPT_IDX593FB9116D127176 on identityiq.spt_entitlement_group (assigned_scope_path);

    create index identityiq.SPT_IDX660B15141EEE343C on identityiq.spt_workflow_case (assigned_scope_path);

    create index identityiq.SPT_IDX823D9A61B16AE816 on identityiq.spt_certification_archive (assigned_scope_path);

    create index identityiq.SPT_IDX892D67C7AB213062 on identityiq.spt_group_definition (assigned_scope_path);

    create index identityiq.SPT_IDXFB512F02CB48A798 on identityiq.spt_certification_challenge (assigned_scope_path);

    create index identityiq.SPT_IDXBAE32AF9A1817F46 on identityiq.spt_right_config (assigned_scope_path);

    create index identityiq.SPT_IDXCE071F89DBC06C66 on identityiq.spt_sodconstraint (assigned_scope_path);

    create index identityiq.SPT_IDXD9728B9EEB248FD0 on identityiq.spt_certification_group (assigned_scope_path);

    create index identityiq.SPT_IDX5BFDE38499178D1C on identityiq.spt_rule_registry (assigned_scope_path);

    create index identityiq.spt_scope_assignedscopepath on identityiq.spt_scope (assigned_scope_path);

    create index identityiq.spt_link_assignedscopepath on identityiq.spt_link (assigned_scope_path);

    create index identityiq.SPT_IDX836C2831FD8ED7B6 on identityiq.spt_file_bucket (assigned_scope_path);

    create index identityiq.SPT_IDXA5EE253FB5399952 on identityiq.spt_jasper_result (assigned_scope_path);

    create index identityiq.SPT_IDX2D52EC448BE739C on identityiq.spt_dashboard_reference (assigned_scope_path);

    create index identityiq.SPT_IDXC71C52111BEFE376 on identityiq.spt_account_group (assigned_scope_path);

    create index identityiq.SPT_IDX686990949D3B0B3C on identityiq.spt_activity_data_source (assigned_scope_path);

    create index identityiq.SPT_IDXD9D9048A81D024A8 on identityiq.spt_dictionary (assigned_scope_path);

    create index identityiq.spt_category_assignedscopepath on identityiq.spt_category (assigned_scope_path);

    create index identityiq.SPT_IDX52403791F605046 on identityiq.spt_generic_constraint (assigned_scope_path);

    create index identityiq.SPT_IDXC439D3638206900 on identityiq.spt_sign_off_history (assigned_scope_path);

    create index identityiq.spt_policy_assignedscopepath on identityiq.spt_policy (assigned_scope_path);

    create index identityiq.spt_right_assignedscopepath on identityiq.spt_right (assigned_scope_path);

    create index identityiq.SPT_IDXE4B09B655AF1E31E on identityiq.spt_archived_cert_item (assigned_scope_path);

    create index identityiq.SPT_IDXABF0D041BEBD0BD6 on identityiq.spt_integration_config (assigned_scope_path);

    create index identityiq.SPT_IDX5165831AA4CEA5C8 on identityiq.spt_audit_event (assigned_scope_path);

    create index identityiq.SPT_IDXB999253482041C7C on identityiq.spt_work_item_config (assigned_scope_path);

    create index identityiq.SPT_IDX85C023B24A735CF8 on identityiq.spt_dashboard_content (assigned_scope_path);

    create index identityiq.SPT_IDX9393E3B78D0A4442 on identityiq.spt_request_definition (assigned_scope_path);

    create index identityiq.SPT_IDXB1547649C7A749E6 on identityiq.spt_identity_snapshot (assigned_scope_path);

    create index identityiq.SPT_IDX95FDCE46C5917DC on identityiq.spt_application_schema (assigned_scope_path);

    create index identityiq.spt_rule_assignedscopepath on identityiq.spt_rule (assigned_scope_path);

    create index identityiq.SPT_IDXCEBEA62E59148F0 on identityiq.spt_group_factory (assigned_scope_path);

    create index identityiq.SPT_IDXB52E1053EF6BCC7A on identityiq.spt_correlation_config (assigned_scope_path);

    create index identityiq.spt_custom_assignedscopepath on identityiq.spt_custom (assigned_scope_path);

    create index identityiq.SPT_IDXA367F317D4A97B02 on identityiq.spt_application_scorecard (assigned_scope_path);

    create index identityiq.SPT_IDX749C6E992BBAE86 on identityiq.spt_dictionary_term (assigned_scope_path);

    create index identityiq.SPT_IDXF70D54D58BC80EE on identityiq.spt_role_scorecard (assigned_scope_path);

    create index identityiq.SPT_IDXA511A43C73CC4C8C on identityiq.spt_persisted_file (assigned_scope_path);

    create index identityiq.SPT_IDX50B36EB8F7F2C884 on identityiq.spt_dynamic_scope (assigned_scope_path);

    create index identityiq.SPT_IDX52AF250AB5405B4 on identityiq.spt_jasper_page_bucket (assigned_scope_path);

    create index identityiq.SPT_IDX4875A7F12BD64736 on identityiq.spt_authentication_question (assigned_scope_path);

    create index identityiq.SPT_IDX9542C8399A0989C6 on identityiq.spt_bundle_archive (assigned_scope_path);

    create index identityiq.SPT_IDX1647668E11063E4 on identityiq.spt_work_item_archive (assigned_scope_path);

    create index identityiq.spt_tag_assignedscopepath on identityiq.spt_tag (assigned_scope_path);

    create index identityiq.SPT_IDX10AAF70777DD9EE2 on identityiq.spt_identity_dashboard (assigned_scope_path);

    create index identityiq.SPT_IDX1A2CF87C3B1B850C on identityiq.spt_certification_entity (assigned_scope_path);

    create index identityiq.SPT_IDXC1811197B7DE5802 on identityiq.spt_role_mining_result (assigned_scope_path);

    create index identityiq.spt_actgroup_key4_ci on identityiq.spt_account_group (key4_ci);

    create index identityiq.spt_actgroup_name on identityiq.spt_account_group (name);

    create index identityiq.spt_actgroup_name_csi on identityiq.spt_account_group (name_ci);

    create index identityiq.spt_actgroup_key2_ci on identityiq.spt_account_group (key2_ci);

    create index identityiq.spt_actgroup_key3_ci on identityiq.spt_account_group (key3_ci);

    create index identityiq.spt_actgroup_key1_ci on identityiq.spt_account_group (key1_ci);

    create index identityiq.spt_actgroup_native_ci on identityiq.spt_account_group (native_identity_ci);

    create index identityiq.spt_app_extended1_ci on identityiq.spt_application (extended1_ci);

    create index identityiq.spt_arch_entity_identity on identityiq.spt_archived_cert_entity (identity_name);

    create index identityiq.spt_arch_entity_identity_csi on identityiq.spt_archived_cert_entity (identity_name_ci);

    create index identityiq.spt_arch_entity_tgt_name on identityiq.spt_archived_cert_entity (target_name);

    create index identityiq.spt_arch_entity_tgt_name_csi on identityiq.spt_archived_cert_entity (target_name_ci);

    create index identityiq.spt_arch_entity_acct_grp on identityiq.spt_archived_cert_entity (account_group);

    create index identityiq.spt_arch_entity_acct_grp_csi on identityiq.spt_archived_cert_entity (account_group_ci);

    create index identityiq.spt_audit_action_ci on identityiq.spt_audit_event (action_ci);

    create index identityiq.spt_audit_trackingid_ci on identityiq.spt_audit_event (tracking_id_ci);

    create index identityiq.spt_audit_accountname_ci on identityiq.spt_audit_event (account_name_ci);

    create index identityiq.spt_audit_attr_ci on identityiq.spt_audit_event (attribute_name_ci);

    create index identityiq.spt_audit_attrVal_ci on identityiq.spt_audit_event (attribute_value_ci);

    create index identityiq.spt_audit_target_ci on identityiq.spt_audit_event (target_ci);

    create index identityiq.spt_audit_source_ci on identityiq.spt_audit_event (source_ci);

    create index identityiq.spt_audit_application_ci on identityiq.spt_audit_event (application_ci);

    create index identityiq.spt_audit_instance_ci on identityiq.spt_audit_event (instance_ci);

    create index identityiq.spt_audit_interface_ci on identityiq.spt_audit_event (interface_ci);

    create index identityiq.spt_bundle_extended1_ci on identityiq.spt_bundle (extended1_ci);

    create index identityiq.spt_certitem_extended1_ci on identityiq.spt_certification_item (extended1_ci);

    create index identityiq.spt_custom_name on identityiq.spt_custom (name);

    create index identityiq.spt_custom_name_csi on identityiq.spt_custom (name_ci);

    create index identityiq.spt_delObj_nativeIdentity_ci on identityiq.spt_deleted_object (native_identity_ci);

    create index identityiq.spt_delObj_objectType_ci on identityiq.spt_deleted_object (object_type_ci);

    create index identityiq.spt_delObj_name_ci on identityiq.spt_deleted_object (name_ci);

    create index identityiq.spt_ent_snap_displayName_ci on identityiq.spt_entitlement_snapshot (display_name_ci);

    create index identityiq.spt_ent_snap_application_ci on identityiq.spt_entitlement_snapshot (application_ci);

    create index identityiq.spt_ent_snap_nativeIdentity_ci on identityiq.spt_entitlement_snapshot (native_identity_ci);

    create index identityiq.spt_identity_extended5_ci on identityiq.spt_identity (extended5_ci);

    create index identityiq.spt_identity_extended3_ci on identityiq.spt_identity (extended3_ci);

    create index identityiq.spt_identity_extended4_ci on identityiq.spt_identity (extended4_ci);

    create index identityiq.spt_identity_displayName_ci on identityiq.spt_identity (display_name_ci);

    create index identityiq.spt_identity_firstname_ci on identityiq.spt_identity (firstname_ci);

    create index identityiq.spt_identity_extended1_ci on identityiq.spt_identity (extended1_ci);

    create index identityiq.spt_identity_email_ci on identityiq.spt_identity (email_ci);

    create index identityiq.spt_identity_extended2_ci on identityiq.spt_identity (extended2_ci);

    create index identityiq.spt_identity_lastname_ci on identityiq.spt_identity (lastname_ci);

    create index identityiq.spt_identity_ent_source_ci on identityiq.spt_identity_entitlement (source_ci);

    create index identityiq.spt_identity_ent_value_ci on identityiq.spt_identity_entitlement (value_ci);

    create index identityiq.spt_identity_ent_nativeid_ci on identityiq.spt_identity_entitlement (native_identity_ci);

    create index identityiq.spt_identity_ent_name_ci on identityiq.spt_identity_entitlement (name_ci);

    create index identityiq.spt_identity_ent_instance_ci on identityiq.spt_identity_entitlement (instance_ci);

    create index identityiq.spt_id_hist_item_ntv_id_ci on identityiq.spt_identity_history_item (native_identity_ci);

    create index identityiq.spt_id_hist_item_value_ci on identityiq.spt_identity_history_item (value_ci);

    create index identityiq.spt_id_hist_item_account_ci on identityiq.spt_identity_history_item (account_ci);

    create index identityiq.spt_id_hist_item_attribute_ci on identityiq.spt_identity_history_item (attribute_ci);

    create index identityiq.spt_idrequest_ext_ticket_ci on identityiq.spt_identity_request (external_ticket_id_ci);

    create index identityiq.spt_reqitem_instance_ci on identityiq.spt_identity_request_item (instance_ci);

    create index identityiq.spt_reqitem_nativeid_ci on identityiq.spt_identity_request_item (native_identity_ci);

    create index identityiq.spt_reqitem_value_ci on identityiq.spt_identity_request_item (value_ci);

    create index identityiq.spt_reqitem_name_ci on identityiq.spt_identity_request_item (name_ci);

    create index identityiq.spt_link_dispname_ci on identityiq.spt_link (display_name_ci);

    create index identityiq.spt_link_extended1_ci on identityiq.spt_link (extended1_ci);

    create index identityiq.spt_link_nativeIdentity_ci on identityiq.spt_link (native_identity_ci);

    create index identityiq.spt_link_key1_ci on identityiq.spt_link (key1_ci);

    create index identityiq.spt_managed_attr_extended1_ci on identityiq.spt_managed_attribute (extended1_ci);

    create index identityiq.spt_managed_attr_dispname_ci on identityiq.spt_managed_attribute (displayable_name_ci);

    create index identityiq.spt_managed_attr_extended2_ci on identityiq.spt_managed_attribute (extended2_ci);

    create index identityiq.spt_managed_attr_value_ci on identityiq.spt_managed_attribute (value_ci);

    create index identityiq.spt_ma_key2_ci on identityiq.spt_managed_attribute (key2_ci);

    create index identityiq.spt_ma_key1_ci on identityiq.spt_managed_attribute (key1_ci);

    create index identityiq.spt_ma_key3_ci on identityiq.spt_managed_attribute (key3_ci);

    create index identityiq.spt_managed_attr_extended3_ci on identityiq.spt_managed_attribute (extended3_ci);

    create index identityiq.spt_managed_attr_uuid_ci on identityiq.spt_managed_attribute (uuid_ci);

    create index identityiq.spt_ma_key4_ci on identityiq.spt_managed_attribute (key4_ci);

    create index identityiq.spt_managed_attr_attr_ci on identityiq.spt_managed_attribute (attribute_ci);

    create index identityiq.spt_mitigation_account_ci on identityiq.spt_mitigation_expiration (native_identity_ci);

    create index identityiq.spt_mitigation_attr_val_ci on identityiq.spt_mitigation_expiration (attribute_value_ci);

    create index identityiq.spt_mitigation_attr_name_ci on identityiq.spt_mitigation_expiration (attribute_name_ci);

    create index identityiq.scope_disp_name_ci on identityiq.spt_scope (display_name_ci);

    create index identityiq.scope_name_ci on identityiq.spt_scope (name_ci);

    create index identityiq.spt_taskresult_targetname_ci on identityiq.spt_task_result (target_name_ci);

    create index identityiq.spt_item_archive_assignee_ci on identityiq.spt_work_item_archive (assignee_ci);

    create index identityiq.spt_item_archive_requester_ci on identityiq.spt_work_item_archive (requester_ci);

    create index identityiq.spt_item_archive_owner_ci on identityiq.spt_work_item_archive (owner_name_ci);

    create index identityiq.spt_application_name on identityiq.spt_application (name_ci);

    create index identityiq.spt_audit_config_name on identityiq.spt_audit_config (name_ci);

    create index identityiq.spt_bundle_name on identityiq.spt_bundle (name_ci);

    create index identityiq.spt_capability_name on identityiq.spt_capability (name_ci);

    create index identityiq.spt_category_name on identityiq.spt_category (name_ci);

    create index identityiq.spt_certification_definition_n on identityiq.spt_certification_definition (name_ci);

    create index identityiq.spt_configuration_name on identityiq.spt_configuration (name_ci);

    create index identityiq.spt_correlation_config_name on identityiq.spt_correlation_config (name_ci);

    create index identityiq.spt_dashboard_content_name on identityiq.spt_dashboard_content (name_ci);

    create index identityiq.spt_dashboard_layout_name on identityiq.spt_dashboard_layout (name_ci);

    create index identityiq.spt_dictionary_term_value on identityiq.spt_dictionary_term (value_ci);

    create index identityiq.spt_dynamic_scope_name on identityiq.spt_dynamic_scope (name_ci);

    create index identityiq.spt_email_template_name on identityiq.spt_email_template (name_ci);

    create index identityiq.spt_form_name on identityiq.spt_form (name_ci);

    create index identityiq.spt_full_text_index_name on identityiq.spt_full_text_index (name_ci);

    create index identityiq.spt_identity_name on identityiq.spt_identity (name_ci);

    create index identityiq.spt_integration_config_name on identityiq.spt_integration_config (name_ci);

    create index identityiq.spt_jasper_template_name on identityiq.spt_jasper_template (name_ci);

    create index identityiq.spt_message_template_name on identityiq.spt_message_template (name_ci);

    create index identityiq.spt_mining_config_name on identityiq.spt_mining_config (name_ci);

    create index identityiq.spt_object_config_name on identityiq.spt_object_config (name_ci);

    create index identityiq.spt_partition_result_name on identityiq.spt_partition_result (name_ci);

    create index identityiq.spt_password_policy_name on identityiq.spt_password_policy (name_ci);

    create index identityiq.spt_policy_name on identityiq.spt_policy (name_ci);

    create index identityiq.spt_process_name on identityiq.spt_process (name_ci);

    create index identityiq.spt_quick_link_name on identityiq.spt_quick_link (name_ci);

    create index identityiq.spt_request_definition_name on identityiq.spt_request_definition (name_ci);

    create index identityiq.spt_right_name on identityiq.spt_right (name_ci);

    create index identityiq.spt_right_config_name on identityiq.spt_right_config (name_ci);

    create index identityiq.spt_rule_name on identityiq.spt_rule (name_ci);

    create index identityiq.spt_rule_registry_name on identityiq.spt_rule_registry (name_ci);

    create index identityiq.spt_score_config_name on identityiq.spt_score_config (name_ci);

    create index identityiq.spt_server_name on identityiq.spt_server (name_ci);

    create index identityiq.spt_service_definition_name on identityiq.spt_service_definition (name_ci);

    create index identityiq.spt_service_status_name on identityiq.spt_service_status (name_ci);

    create index identityiq.spt_tag_name on identityiq.spt_tag (name_ci);

    create index identityiq.spt_task_definition_name on identityiq.spt_task_definition (name_ci);

    create index identityiq.spt_task_result_name on identityiq.spt_task_result (name_ci);

    create index identityiq.spt_uiconfig_name on identityiq.spt_uiconfig (name_ci);

    create index identityiq.spt_workflow_name on identityiq.spt_workflow (name_ci);

    create index identityiq.spt_workflow_registry_name on identityiq.spt_workflow_registry (name_ci);

    create index identityiq.spt_workflow_test_suite_name on identityiq.spt_workflow_test_suite (name_ci);

    create sequence identityiq.spt_syslog_event_sequence start with 1 increment by 1 nocache order;

    create sequence identityiq.spt_identity_request_sequence start with 1 increment by 1 nocache order;

    create sequence identityiq.spt_work_item_sequence start with 1 increment by 1 nocache order;
