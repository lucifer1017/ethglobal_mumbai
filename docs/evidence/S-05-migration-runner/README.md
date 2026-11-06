# S-05: isolated migration runner component

Checked locally on 2026-11-07 (Asia/Kolkata), Node 24.22.2. This integration
publishes only the transaction/lock/checksum runner and synthetic SQL tests.
S-05 and the application schema migration remain incomplete.

Verification A: fresh locked install, typecheck and all 41 minimal backend tests
passed, including four real PostgreSQL runner tests. Two concurrent calls apply
each migration once; later calls are no-ops. Production audit found zero
vulnerabilities. Prior locked package versions are unchanged.

Verification B: failed SQL rolls back DDL and history; changed checksums and
removed applied files fail; invalid or duplicate sequence filenames fail.

Local database evidence used a unique disposable database in the newly created
local PostgreSQL 16 service, with credentials read only in memory and the database
dropped in a finally block. The application's database was not used. Output
paths are normalized to `<checkout>` and no credentials appear in logs.

An initial separate-container attempt stalled in Docker Created state during
host-port publication. After the engine recovered, the actual launcher passed
all 41 tests against its own disposable PostgreSQL 16 container and removed it;
this successful run is in tests.log. Launcher commands have a 60-second timeout
and hide command arguments on failure. CI supplies its own disposable PostgreSQL
16 service and runs the full suite with DB tests enabled. No legacy SQL, application tables, pool, API or deployment is imported.
