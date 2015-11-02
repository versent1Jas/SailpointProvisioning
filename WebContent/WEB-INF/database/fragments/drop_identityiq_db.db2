DROP TABLESPACE identityiq_ts;
DROP BUFFERPOOL identityiq_bp;
DROP SCHEMA identityiq RESTRICT;
COMMIT;

Disconnect iiq;

DROP DATABASE iiq;


