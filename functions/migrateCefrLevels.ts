import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const cefrToNumeric = { 'A1': '1', 'A2': '2', 'B1': '3', 'B2': '4', 'C1': '5', 'C2': '6' };
const levelFields = ['reading_level', 'listening_level', 'speaking_level', 'writing_level', 'target_level'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await base44.asServiceRole.entities.User.list();
    let migrated = 0;

    for (const u of users) {
      // Only migrate YKI users (numeric_1_6 scale)
      if (u.target_test && u.target_test !== 'YKI') continue;

      const updates = {};
      for (const field of levelFields) {
        if (u[field] && cefrToNumeric[u[field]]) {
          updates[field] = cefrToNumeric[u[field]];
        }
      }

      if (Object.keys(updates).length > 0) {
        await base44.asServiceRole.entities.User.update(u.id, updates);
        migrated++;
        console.log(`Migrated ${u.email}: ${JSON.stringify(updates)}`);
      }
    }

    return Response.json({ success: true, migrated, total: users.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});