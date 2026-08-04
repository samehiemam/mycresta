<?php
/**
 * Editing the people in the system, and their telephone numbers.
 *
 * Two kinds of record describe a person: a `users` row once they have an
 * account, and a `leads` row from the moment anyone writes their name down.
 * Most prospects only ever have the second. The rules for editing them are the
 * same shape but not the same:
 *
 *   users  — an account. Only a Founder edits one, because an account carries
 *            a role, a status and the address it signs in with.
 *   leads  — a contact. Staff edit any; an ambassador edits the ones they own
 *            and no others, which is the same first-to-register ownership the
 *            commission depends on.
 *
 * That single rule lives in can_edit_contact() and every write goes through it,
 * so there is one place to read and one place to get wrong.
 */

declare(strict_types=1);

const CONTACT_PHONE_LABELS = ['mobile', 'whatsapp', 'office', 'home', 'other'];

/**
 * May this person edit that record?
 *
 * Returns false rather than throwing so a caller can use it to decide what to
 * show; require_edit_contact() is the version that refuses.
 */
function can_edit_contact(array $actor, string $type, string $id): bool
{
    if ($type === 'user') {
        // An account edit can change a role or an email address, which is the
        // whole of someone's access. Founder only.
        return ($actor['role'] ?? '') === 'admin';
    }

    if ($type !== 'lead') {
        return false;
    }

    $lead = db_one('SELECT ambassador_id FROM leads WHERE id = ?', [$id]);
    if (!$lead) {
        return false;
    }
    if (can_see_all($actor, 'pipeline')) {
        return true;                       // Founder and staff
    }
    // An ambassador's own contacts, and nobody else's — including house leads,
    // which belong to Cresta rather than to whoever opens the page.
    return ($lead['ambassador_id'] ?? null) === ($actor['id'] ?? null);
}

/** The refusing form, for anything that writes. */
function require_edit_contact(array $actor, string $type, string $id): void
{
    if (!can_edit_contact($actor, $type, $id)) {
        fail('You cannot edit that contact.', 403);
    }
}

/** Every extra number held against one person, primary excluded. */
function contact_phones(string $type, string $id): array
{
    return db_all(
        'SELECT id, label, phone, note FROM contact_phones
          WHERE owner_type = ? AND owner_id = ?
       ORDER BY FIELD(label, ' . "'mobile','whatsapp','office','home','other'" . '), created_at',
        [$type, $id]
    );
}

/**
 * Adds a number.
 *
 * Normalised before the duplicate check, so "+20 100 777 0000" and
 * "+201007770000" are recognised as the same line rather than stored twice.
 */
function contact_phone_add(
    array $actor,
    string $type,
    string $id,
    string $phone,
    string $label = 'mobile',
    ?string $note = null
): array {
    require_edit_contact($actor, $type, $id);

    $normalised = normalise_phone($phone);
    if ($normalised === '') {
        fail('Enter a telephone number.', 422);
    }
    if (!in_array($label, CONTACT_PHONE_LABELS, true)) {
        $label = 'other';
    }

    $existing = db_one(
        'SELECT id FROM contact_phones WHERE owner_type = ? AND owner_id = ? AND phone = ?',
        [$type, $id, $normalised]
    );
    if ($existing) {
        fail('That number is already on this contact.', 409);
    }

    $phoneId = new_id();
    db_run(
        'INSERT INTO contact_phones (id, owner_type, owner_id, label, phone, note, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [$phoneId, $type, $id, $label, $normalised,
         $note !== null && trim($note) !== '' ? mb_substr(trim($note), 0, 120) : null,
         $actor['id'], now()]
    );

    audit($actor['id'], 'contact_phone_added', $type, $id, ['label' => $label]);
    return contact_phones($type, $id);
}

/** Removes one. The owner is read from the row, never trusted from the caller. */
function contact_phone_remove(array $actor, string $phoneId): array
{
    $row = db_one('SELECT * FROM contact_phones WHERE id = ?', [$phoneId]);
    if (!$row) {
        fail('That number no longer exists.', 404);
    }

    require_edit_contact($actor, $row['owner_type'], $row['owner_id']);
    db_run('DELETE FROM contact_phones WHERE id = ?', [$phoneId]);

    audit($actor['id'], 'contact_phone_removed', $row['owner_type'], $row['owner_id']);
    return contact_phones($row['owner_type'], $row['owner_id']);
}

/**
 * Edits a lead's own details.
 *
 * Deliberately narrow: the name and the ways to reach them. Stage, ownership
 * and the deal value each have their own action with their own rules — moving
 * a lead through the pipeline is not the same act as correcting a typo in an
 * email address, and letting one form do both is how a stage gets changed by
 * accident.
 */
function lead_update_contact(array $actor, string $id, array $input): array
{
    require_edit_contact($actor, 'lead', $id);

    $lead = db_one('SELECT * FROM leads WHERE id = ?', [$id]);
    if (!$lead) {
        fail('That lead does not exist.', 404);
    }

    $name = field($input, 'fullName');
    if ($name === '') {
        fail('A name is required.', 422);
    }

    $email = field($input, 'email') !== '' ? normalise_email(field($input, 'email')) : null;
    $phone = field($input, 'phone', 64) !== '' ? normalise_phone(field($input, 'phone', 64)) : null;
    if ($email === null && $phone === null) {
        fail('An email address or a telephone number is required.', 422);
    }

    db_run(
        'UPDATE leads SET full_name = ?, email = ?, phone = ?, updated_at = ? WHERE id = ?',
        [$name, $email, $phone, now(), $id]
    );

    audit($actor['id'], 'lead_contact_updated', 'lead', $id);
    return db_one('SELECT * FROM leads WHERE id = ?', [$id]);
}
