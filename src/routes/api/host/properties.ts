import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

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

async function getHostProfile(userId: string) {
  const admin = getAdminClient();
  const { data } = await admin
    .from("host_profiles")
    .select("id, subscription_status")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

const PropertySchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase letters, numbers, and hyphens"),
  property_name: z.string().min(1).max(200),
  wifi_network: z.string().max(100).default(""),
  wifi_password: z.string().max(100).default(""),
  check_in_time: z.string().max(20).default("4:00 PM"),
  checkout_time: z.string().max(20).default("10:00 AM"),
  parking: z.string().max(500).optional().nullable(),
  trash: z.string().max(500).optional().nullable(),
  emergency_contact: z.string().max(100).default(""),
  notes: z.array(z.string().max(500)).default([]),
  guide_slug: z.string().max(80).optional().nullable(),
  is_active: z.boolean().default(true),
});

export const Route = createFileRoute("/api/host/properties")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getAuthUser(request);
        if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const host = await getHostProfile(user.id);
        if (!host) return Response.json({ error: "Host profile not found" }, { status: 404 });

        const admin = getAdminClient();
        const { data, error } = await admin
          .from("host_properties")
          .select("*")
          .eq("host_id", host.id)
          .order("created_at", { ascending: true });

        if (error) return Response.json({ error: "DB error" }, { status: 500 });
        return Response.json({ properties: data });
      },

      POST: async ({ request }) => {
        const user = await getAuthUser(request);
        if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const host = await getHostProfile(user.id);
        if (!host) return Response.json({ error: "Host profile not found" }, { status: 404 });

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const parsed = PropertySchema.safeParse(body);
        if (!parsed.success)
          return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });

        const admin = getAdminClient();
        const { data, error } = await admin
          .from("host_properties")
          .insert({ ...parsed.data, host_id: host.id })
          .select()
          .single();

        if (error) {
          if (error.code === "23505") return Response.json({ error: "That slug is already taken" }, { status: 409 });
          return Response.json({ error: "DB error" }, { status: 500 });
        }
        return Response.json({ property: data }, { status: 201 });
      },

      PUT: async ({ request }) => {
        const user = await getAuthUser(request);
        if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const host = await getHostProfile(user.id);
        if (!host) return Response.json({ error: "Host profile not found" }, { status: 404 });

        const url = new URL(request.url);
        const id = url.searchParams.get("id");
        if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const parsed = PropertySchema.safeParse(body);
        if (!parsed.success)
          return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });

        const admin = getAdminClient();
        const { data, error } = await admin
          .from("host_properties")
          .update(parsed.data)
          .eq("id", id)
          .eq("host_id", host.id)
          .select()
          .single();

        if (error) {
          if (error.code === "23505") return Response.json({ error: "That slug is already taken" }, { status: 409 });
          return Response.json({ error: "DB error" }, { status: 500 });
        }
        if (!data) return Response.json({ error: "Property not found" }, { status: 404 });
        return Response.json({ property: data });
      },

      DELETE: async ({ request }) => {
        const user = await getAuthUser(request);
        if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const host = await getHostProfile(user.id);
        if (!host) return Response.json({ error: "Host profile not found" }, { status: 404 });

        const url = new URL(request.url);
        const id = url.searchParams.get("id");
        if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

        const admin = getAdminClient();
        const { error } = await admin
          .from("host_properties")
          .delete()
          .eq("id", id)
          .eq("host_id", host.id);

        if (error) return Response.json({ error: "DB error" }, { status: 500 });
        return Response.json({ ok: true });
      },
    },
  },
});
