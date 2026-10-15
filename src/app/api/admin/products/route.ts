import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Admin product management API.
 *  - POST   /api/admin/products  create a product (multipart form + images)
 *  - PATCH  /api/admin/products  update stock / featured flag
 *  - DELETE /api/admin/products  remove a product (and its storage objects)
 *
 * Every handler re-checks the session and the ADMIN_EMAILS allow-list;
 * writes then go through the service-role client (RLS bypass by design,
 * but only ever reached for verified admins).
 */

const BUCKET = "product-images";
const MAX_IMAGES = 6;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4MB per image

const CATEGORY_VALUES = ["phones", "laptops", "audio", "accessories"] as const;

const createSchema = z.object({
  name: z.string().trim().min(3, "Name is too short").max(120),
  description: z.string().trim().max(2000).default(""),
  price_ngn: z.coerce.number().int().min(0).max(100_000_000),
  category: z.enum(CATEGORY_VALUES),
  stock: z.coerce.number().int().min(0).max(100_000),
  is_featured: z.coerce.boolean().default(false),
});

const patchSchema = z.object({
  id: z.string().uuid(),
  stock: z.coerce.number().int().min(0).max(100_000).optional(),
  is_featured: z.boolean().optional(),
});

const deleteSchema = z.object({
  id: z.string().uuid(),
});

async function requireAdmin() {
  const auth = await getAuthContext();
  if (!auth || !auth.isAdmin) return null;
  return auth;
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return badRequest("Expected multipart form data.");
  }

  const parsed = createSchema.safeParse({
    name: form.get("name"),
    description: form.get("description") ?? "",
    price_ngn: form.get("price_ngn"),
    category: form.get("category"),
    stock: form.get("stock") ?? "0",
    is_featured: form.get("is_featured") === "true",
  });
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid product data.");
  }

  const files = form
    .getAll("images")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_IMAGES) {
    return badRequest(`At most ${MAX_IMAGES} images per product.`);
  }
  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      return badRequest(`"${file.name}" is not an image.`);
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return badRequest(`"${file.name}" is larger than 4MB. Resize it and retry.`);
    }
  }

  const supabase = createServiceClient();
  const imageUrls: string[] = [];
  for (const file of files) {
    const ext = (file.name.split(".").pop() ?? "jpg")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    const path = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext || "jpg"}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type, cacheControl: "31536000" });
    if (error) {
      return NextResponse.json(
        { error: `Image upload failed: ${error.message}` },
        { status: 500 },
      );
    }
    imageUrls.push(`/storage/v1/object/public/${BUCKET}/${path}`);
  }

  const { name, description, price_ngn, category, stock, is_featured } = parsed.data;
  const slugBase = slugify(name) || "product";
  const slug = `${slugBase}-${randomUUID().slice(0, 6)}`;

  const { data, error } = await supabase
    .from("products")
    .insert({
      name,
      slug,
      description,
      price_ngn,
      category,
      image_urls: imageUrls,
      stock,
      is_featured,
    })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ product: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (!auth) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Expected a JSON body.");
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid update.");
  }
  const { id, ...patch } = parsed.data;
  if (patch.stock === undefined && patch.is_featured === undefined) {
    return badRequest("Nothing to update.");
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("products").update(patch).eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (!auth) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const url = new URL(request.url);
  let id = url.searchParams.get("id");
  if (!id) {
    try {
      const body = await request.json();
      id = deleteSchema.safeParse(body).data?.id ?? null;
    } catch {
      id = null;
    }
  }
  if (!id) {
    return badRequest("Missing product id.");
  }

  const supabase = createServiceClient();
  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("image_urls")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Best-effort cleanup of storage objects (product row is already gone).
  const paths = (product?.image_urls ?? [])
    .map((u: string) => {
      const marker = `/storage/v1/object/public/${BUCKET}/`;
      const i = u.indexOf(marker);
      return i === -1 ? null : u.slice(i + marker.length);
    })
    .filter((p: string | null): p is string => Boolean(p));
  if (paths.length > 0) {
    await supabase.storage.from(BUCKET).remove(paths);
  }

  return NextResponse.json({ ok: true });
}
