# Security release runbook — production hardening

The Git history of all published branches was rewritten with `git-filter-repo` on 2026-11-06, and a clean clone was verified. This branch does **not** deploy, rotate server credentials, purge GitHub's internal pull-request references/caches, or migrate existing encrypted rows.

## Required operator actions (before merge/deploy)

1. **Back up the uploads and SQL files** in encrypted, access-controlled storage and verify restoration. The tracked runtime files and their reachable history have been removed from published branch refs. **Old clones, local mirror backups, pull-request refs, caches, and downloaded copies may still retain them.** Keep backups secured offline; contact GitHub Support for sensitive-data cleanup and ensure no old clone pushes rewritten-away commits.
2. **Rotate all real credentials** previously committed or reused (database passwords, JWT signing keys, payment provider tokens/secrets, email/API keys, initial admin passwords). Check GitHub Actions secrets, Docker Compose environment, Cloudflare Tunnel and live deployments. A Git commit cannot rotate remote credentials.
3. Configure `ConnectionStrings__DefaultConnection` and `Jwt__SecretKey` using a protected secret store or environment variables. The committed development config no longer provides passwords or signing secrets.
4. Generate an **independent** encryption key (32 cryptographically random bytes, Base64), supply as `Security__CredentialEncryptionKey`. Keep it backed up in a separate secret manager. Never commit it.
5. **Key migration:** existing ciphertext without the `v2:` prefix is decrypted with the legacy JWT-derived key. Before changing the JWT secret, load existing Mercado Pago / Resend / BV credentials and re-save them via the SuperAdmin configuration UI to encrypt them as `v2:`. Verify every stored record uses `v2:` before rotating the JWT secret. Retain old JWT secret in an offline protected vault until migration is complete. Do not remove legacy decryption until all records are migrated.
6. **Proxy hardening:** the login rate limiter now uses the transport IP instead of trusting arbitrary `CF-Connecting-IP`. If deployed behind Cloudflare Tunnel, configure and test trusted forwarded-header middleware and restrict origin access; otherwise multiple users may share one rate-limit bucket. Do not trust client-supplied forwarded headers from the public Internet.
7. **Webhook testing:** synthetic Mercado Pago test notifications now require normal signature verification; unsigned test requests receive 401. Validate real signed test notifications in sandbox, duplicates, parallel delivery, subscription transitions and recovery after failure.
8. **Uploads:** vehicle photos and vehicle/company documents now check file length and magic bytes. Add malware scanning, image decoding, MIME normalization, per-request aggregate limits, branding-image validation and file lifecycle cleanup before declaring upload security complete.
9. **Multi-tenancy:** buyer portal link resolution intentionally bypasses filters only to resolve the opaque link token, then scopes subsequent queries to its validated tenant. Run integration tests with at least two tenants, expired/revoked links, vehicle/document access, superadmin actions, signup, billing and background workers.
10. **Production tests:** execute `dotnet test`, `dotnet build`, frontend lint/build, migration dry run against a restored copy of the database, and test restore of the uploads volume. Do not claim CI green until actual GitHub Actions results are inspected.

## Known limitations

- No server-side secret rotation has been performed.
- Published branch history has been scrubbed and locally verified, but GitHub internal pull-request references/caches and external clones have not been confirmed purged.
- Stored credentials are **not automatically re-encrypted**; migration is required.
- Signature sniffing is not complete content validation or malware detection.
- Proxy trust and network access control must be configured in the actual deployment.
- This branch has not been tested against the running production infrastructure.

## CI status after history rewrite

- GitHub Actions workflow run `42220087955` for rewritten head `2236f316fbec476273f1c9b90967689e36a741f6` completed successfully: `.NET build and tests` and `Frontend build and lint`.
- This verifies the configured CI jobs only, not production readiness, migrations, live webhooks, Cloudflare routing, or secret migration.
- **Release gate:** do not deploy with a newly generated JWT key until legacy encrypted integration credentials have been migrated, and do not assume changing `POSTGRES_PASSWORD` in `.env` rotates the password inside an existing PostgreSQL volume.
- The clean checkout does not include `.env`. Restore required runtime configuration securely from the existing deployment, never commit it, and validate `docker compose config --quiet` before any deployment.
