# Security release runbook — production hardening

This branch does **not** deploy, rotate server credentials, purge Git history, or migrate existing encrypted rows.

## Required operator actions (before merge/deploy)

1. **Back up the uploads and SQL files** in encrypted, access-controlled storage and verify restoration. This branch removes tracked runtime files only from the current Git tree; **historical commits still contain them**. Coordinate history rewriting with all collaborators, forks and deployment mirrors; do not force-push without a separately approved migration plan.
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
- The Git commit history has not been scrubbed; data is still accessible in old commits.
- Stored credentials are **not automatically re-encrypted**; migration is required.
- Signature sniffing is not complete content validation or malware detection.
- Proxy trust and network access control must be configured in the actual deployment.
- This branch has not been tested against the running production infrastructure.
