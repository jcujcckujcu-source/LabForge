export interface User {
  id: string;
  api_token: string;
  telegram: string | null;
  vk: string | null;
  generations_left: number;
  referral_code: string;
  referred_by: string | null;
  created_at: string;
}

export async function getUserByToken(db: D1Database, apiToken: string): Promise<User | null> {
  return db.prepare("SELECT * FROM users WHERE api_token = ? LIMIT 1")
    .bind(apiToken)
    .first<User>();
}

export async function getUserById(db: D1Database, id: string): Promise<User | null> {
  return db.prepare("SELECT * FROM users WHERE id = ? LIMIT 1")
    .bind(id)
    .first<User>();
}

export async function getUserByReferralCode(db: D1Database, code: string): Promise<User | null> {
  return db.prepare("SELECT * FROM users WHERE referral_code = ? LIMIT 1")
    .bind(code)
    .first<User>();
}

export async function createUser(
  db: D1Database, 
  data: { username: string; apiToken: string; telegramId?: string; telegram?: string; vk?: string; referralCode?: string }
): Promise<User | null> {
  const id = crypto.randomUUID();
  const referralCode = Math.random().toString(36).substring(2, 10);
  
  let referrerId: string | null = null;
  if (data.referralCode) {
    const referrer = await getUserByReferralCode(db, data.referralCode);
    if (referrer) {
      referrerId = referrer.id;
      // Даем бонус пригласившему
      await db.prepare("UPDATE users SET generations_left = generations_left + 2 WHERE id = ?")
        .bind(referrerId)
        .run();
    }
  }

  const result = await db.prepare(
    "INSERT INTO users (id, username, api_token, telegram_id, telegram, vk, generations_left, referral_code, referred_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *"
  ).bind(
    id, 
    data.username,
    data.apiToken, 
    data.telegramId || null,
    data.telegram || null, 
    data.vk || null, 
    5,
    referralCode,
    referrerId
  ).first<User>();
  
  return result;
}
