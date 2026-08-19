import { createCipheriv, createDecipheriv, randomBytes, randomInt } from "node:crypto";
import { db } from "./queue.ts";
import { log } from "./log.ts";

/**
 * Reversible encryption for ATS account passwords.
 *
 * A hash will not do here, however much the instinct says otherwise. Hashing is
 * right when you only ever need to CHECK a password. The worker has to TYPE
 * one into someone else's login form, which means it must get the original
 * back — so this is encryption, and the honest response to that is to make the
 * key hard to reach rather than to pretend the problem away.
 *
 * AES-256-GCM rather than CBC: GCM authenticates as well as encrypts, so a
 * tampered row fails to decrypt instead of quietly producing rubbish that then
 * gets typed into a live login form and locks the candidate out.
 *
 * The key lives in env, never in the database. A database compromise on its own
 * therefore yields ciphertext. See supabase/migrations/20260819120000_ats_accounts.sql.
 */

let cachedKey: Buffer | null = null;

/**
 * Read lazily, not at boot.
 *
 * config.ts fails loudly at startup for things every run needs. This is not one
 * of them: a worker handling only Greenhouse and Lever never touches a stored
 * credential, and refusing to start over a key it will not use would take the
 * whole queue down for a feature it is not running.
 */
function key(): Buffer {
  if (cachedKey) return cachedKey;

  const raw = process.env.ATS_CRED_KEY;
  if (!raw) {
    throw new Error(
      "ATS_CRED_KEY is not set. Generate one with " +
        '`node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"` ' +
        "and set it in Railway. Losing it makes every stored password unrecoverable.",
    );
  }

  const buf = Buffer.from(raw, "base64");
  // Checked rather than assumed: a truncated key would still "work" for a
  // while and produce ciphertext nothing could ever read back.
  if (buf.length !== 32) {
    throw new Error(
      `ATS_CRED_KEY must decode to 32 bytes for AES-256; got ${buf.length}. ` +
        "It should be base64 of 32 random bytes.",
    );
  }

  cachedKey = buf;
  return buf;
}

/** base64(iv).base64(tag).base64(ciphertext) */
export function encryptSecret(plaintext: string): string {
  // 12 bytes is the GCM standard: shorter weakens it, longer is re-hashed
  // internally and buys nothing.
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), body].map((b) => b.toString("base64")).join(".");
}

export function decryptSecret(stored: string): string {
  // Structure, not truthiness. `!body` also rejects the empty string, which is
  // a perfectly valid ciphertext — encrypting "" yields an empty body, and the
  // first version of this threw on its own output.
  const parts = stored.split(".");
  if (parts.length !== 3) throw new Error("stored credential is malformed");
  const [iv, tag, body] = parts as [string, string, string];

  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  // Throws if the tag does not verify — wrong key, or a tampered row.
  return decipher.update(Buffer.from(body, "base64")).toString("utf8") + decipher.final("utf8");
}

/**
 * A password for an account the candidate will rarely type by hand.
 *
 * Built to satisfy the usual ATS rules — upper, lower, digit, symbol — because
 * a generated password rejected by the signup form is a dead end the worker
 * cannot reason its way out of. The symbol set is deliberately small and
 * boring: quotes, backslashes and angle brackets have a habit of breaking
 * somebody's validation regex.
 *
 * randomInt, never Math.random: this is a credential.
 */
export function generatePassword(): string {
  const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I or O
  const LOWER = "abcdefghijkmnopqrstuvwxyz"; // no l
  const DIGIT = "23456789"; // no 0 or 1
  const SYMBOL = "!@#$%*-_=+";
  const ALL = UPPER + LOWER + DIGIT + SYMBOL;

  const pick = (set: string) => set[randomInt(set.length)]!;
  // One of each class first, so the result cannot fail a rule by chance.
  const chars = [pick(UPPER), pick(LOWER), pick(DIGIT), pick(SYMBOL)];
  while (chars.length < 20) chars.push(pick(ALL));

  // Fisher-Yates, so the guaranteed four are not always in positions 0-3.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }
  return chars.join("");
}

export interface AtsAccount {
  id: string;
  loginEmail: string;
  password: string;
  /** False when this row was just created, so the adapter knows to register. */
  existing: boolean;
}

/**
 * The account for this candidate on this tenant, creating one if there is none.
 *
 * Returns the password in plaintext — it has to, since the caller types it into
 * a form. It is never logged, and never returned to the browser by this path.
 */
export async function accountFor(
  userId: string,
  provider: string,
  tenant: string,
  loginEmail: string,
): Promise<AtsAccount | null> {
  const { data: found, error } = await db
    .from("ats_accounts")
    .select("id, login_email, password_cipher")
    .eq("user_id", userId)
    .eq("provider", provider)
    .eq("tenant", tenant)
    .maybeSingle();

  if (error) {
    log.error("ats account lookup failed", { provider, tenant, error: error.message });
    return null;
  }

  if (found) {
    try {
      return {
        id: found.id as string,
        loginEmail: found.login_email as string,
        password: decryptSecret(found.password_cipher as string),
        existing: true,
      };
    } catch (err) {
      // A row we cannot decrypt is worse than no row: the account exists on the
      // tenant, so registering again will fail, and we have lost the only copy
      // of the password. Park it for a human rather than looping.
      log.error("stored credential could not be decrypted", {
        provider,
        tenant,
        error: err instanceof Error ? err.message : String(err),
      });
      return null;
    }
  }

  const password = generatePassword();
  const { data: created, error: insertError } = await db
    .from("ats_accounts")
    .insert({
      user_id: userId,
      provider,
      tenant,
      login_email: loginEmail,
      password_cipher: encryptSecret(password),
    })
    .select("id")
    .single();

  if (insertError) {
    log.error("ats account insert failed", { provider, tenant, error: insertError.message });
    return null;
  }

  // Stored BEFORE the tenant signup is attempted, on purpose. If the row were
  // written afterwards, a crash between "account created on Workday" and "row
  // saved" would leave an account we can never sign into and can never
  // re-register. An unused row costs nothing; an orphaned account is permanent.
  return {
    id: created.id as string,
    loginEmail,
    password,
    existing: false,
  };
}

/** Note the outcome of a sign-in so a broken account stops being retried. */
export async function recordAccountUse(id: string, error: string | null): Promise<void> {
  const { error: writeError } = await db
    .from("ats_accounts")
    .update({ last_used_at: new Date().toISOString(), last_error: error })
    .eq("id", id);
  if (writeError) log.warn("ats account write failed", { id, error: writeError.message });
}
