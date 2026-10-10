import { getDb } from "./connection";

export async function findUserByUnionId(unionId: string) {
  const db = getDb();
  const { data } = await db
    .from("users")
    .select("*")
    .eq("unionId", unionId)
    .single();
  return data ?? undefined;
}

export async function upsertUser(data: { unionId: string; name?: string | null; avatar?: string | null; lastSignInAt?: Date }) {
  const db = getDb();
  const values = {
    unionId: data.unionId,
    name: data.name ?? null,
    avatar: data.avatar ?? null,
    lastSignInAt: data.lastSignInAt ? data.lastSignInAt.toISOString() : new Date().toISOString(),
  };

  const { data: existing } = await db
    .from("users")
    .select("id")
    .eq("unionId", values.unionId)
    .single();

  if (existing) {
    await db.from("users").update(values as any).eq("unionId", values.unionId);
  } else {
    await db.from("users").insert(values as any);
  }
}
