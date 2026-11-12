# `mobimatch-admin` — Admin Android App

## Purpose

Separate Android application for authorized administrators to manage MobiMatch catalog, compatibility, users and reports. It is not a web admin panel.

## Access

- Google sign-in.
- Backend verifies Google identity and current admin allowlist membership.
- Any person may install the app, but unauthorized accounts see an access-denied screen and cannot call admin APIs.
- Multiple equal-permission administrators.
- Allowlist changes are server-side and immediately effective.
- Do not ship a hidden default admin login or hard-coded admin credential.

## Required screens

1. Splash/loading.
2. Google sign-in.
3. Access denied (not on allowlist).
4. Admin home/navigation.
5. Brand list/create/edit/deactivate/reactivate.
6. Model list/create/edit/deactivate/reactivate.
7. Category list/create/edit/deactivate/reactivate.
8. Compatibility group list/detail/manual edit.
9. Bulk compatibility text input.
10. Parser preview and conflict resolution.
11. Publish confirmation.
12. User list/detail/deactivate/reactivate.
13. Issue report list/detail/status update.
14. Missing-model request list/detail/approve/reject.
15. Admin allowlist list/add/remove.
16. Update-required / optional-update prompt.
17. Connection and maintenance states.

## Compatibility editor

- Admin first selects a category.
- Admin can manually edit groups or paste multiline `model = model = model` text.
- Each line is one group.
- Preview is read-only and must show matched, missing, ambiguous, duplicate and conflicting entries.
- Admin confirms creation of missing brands/models.
- Conflicts require explicit merge or cancel.
- Publish is one transaction; partial publish forbidden.
- Show success only after backend confirms commit.
- Confirmation dialog before publish and deactivation actions.

## Soft deactivation

Use “Deactivate” rather than “Delete” for brands, models and categories. Explain that existing relationships are preserved and the record is hidden from user search. Allow reactivation.

## User/report management

Admins can list/view/deactivate/reactivate users, review reports and update status, and approve/reject missing model requests. User-request approval does not automatically create a model; admin confirms the creation.

## Admin allowlist

Admins can add/remove email entries. Normalize email case/whitespace. Prevent accidental removal of the last admin. Confirm before removing an admin. Backend must re-check allowlist on every protected request.

## Update flow

The app checks `GET /app-config` for latest and minimum supported version. Optional update shows a dismissible prompt and download link. Mandatory update blocks admin operations and opens the configured distribution URL. Installation follows the chosen legitimate Android distribution route.

## Visual requirements

Simple light theme, phone-first, English-only MVP, no tablet-specific layout. Prioritize usable forms and safe confirmation dialogs.

## Distribution warning

A direct APK download/sideload may trigger Android's “install unknown apps” warning and Play Protect scan. Do not attempt to hide or bypass these warnings. If warning-free installation is a hard requirement, the client must choose Play-managed distribution. See `release/google-play.md`.
