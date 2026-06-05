import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bgollemualqrwfrxrmwx.supabase.co";

function getAdminClient() {
  return createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

async function getAuthUser(request: Request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const admin = getAdminClient();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export const Route = createFileRoute("/api/host/profile")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getAuthUser(request);
        if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const admin = getAdminClient();
        const { data } = await admin
          .from("host_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        return Response.json({ profile: data });
      },

      POST: async ({ request }) => {
        const user = await getAuthUser(request);
        if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

        let body: { full_name?: string } = {};
        try {
          body = await request.json();
        } catch {
          // body optional
        }

        const admin = getAdminClient();

        // Check if already exists
        const { data: existing } = await admin
          .from("host_profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (existing) return Response.json({ profile: existing });

        const { data, error } = await admin
          .from("host_profiles")
          .insert({
            user_id: user.id,
            email: user.email ?? "",
            full_name: body.full_name ?? null,
            subscription_status: "trialing",
            trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .select()
          .single();

        if (error) return Response.json({ error: "Failed to create profile" }, { status: 500 });
        return Response.json({ profile: data }, { status: 201 });
      },
    },
  },
});
