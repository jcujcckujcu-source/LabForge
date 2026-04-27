export interface User {
  id: string;
  api_token: string;
  telegram: string | null;
  vk: string | null;
  generations_left: number;
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

export async function createUser(
  db: D1Database, 
  data: { apiToken: string; telegram?: string; vk?: string }
): Promise<User | null> {
  const id = crypto.randomUUID();
  const result = await db.prepare(
    "INSERT INTO users (id, api_token, telegram, vk, generations_left) VALUES (?, ?, ?, ?, ?) RETURNING *"
  ).bind(
    id, 
    data.apiToken, 
    data.telegram || null, 
    data.vk || null, 
    5
  ).first<User>();
  
  return result;
}
