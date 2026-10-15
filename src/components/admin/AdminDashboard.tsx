"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/format";
import { CATEGORIES, categoryLabel } from "@/lib/constants";
import type { Product } from "@/lib/types";
import StockBadge from "@/components/product/StockBadge";

/**
 * Admin product manager.
 *  - Drag & drop (or browse) image upload -> Supabase Storage via API
 *  - Create products, adjust stock, mark sold, delete sold-out items
 */

const MAX_IMAGES = 6;
const MAX_BYTES = 4 * 1024 * 1024;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

function resolveImg(url: string): string {
  if (url.startsWith("http")) return url;
  if (url.startsWith("/storage/")) return `${SUPABASE_URL}${url}`;
  return url;
}

type Notice = { kind: "ok" | "err"; text: string } | null;

const emptyForm = {
  name: "",
  description: "",
  price: "",
  category: "phones",
  stock: "1",
  is_featured: false,
};

export default function AdminDashboard({
  initialProducts,
}: {
  initialProducts: Product[];
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const soldOut = products.filter((p) => p.stock === 0);
  const inStockCount = products.length - soldOut.length;
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 3).length;
  const filtered = products.filter((p) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      categoryLabel(p.category).toLowerCase().includes(q)
    );
  });

  function set<K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addFiles(list: FileList | File[] | null) {
    if (!list) return;
    const incoming = Array.from(list);
    setFiles((prev) => {
      const next = [...prev];
      for (const file of incoming) {
        if (next.length >= MAX_IMAGES) break;
        if (!file.type.startsWith("image/")) continue;
        if (file.size > MAX_BYTES) {
          setNotice({ kind: "err", text: `"${file.name}" is over 4MB — resize it and retry.` });
          continue;
        }
        if (next.some((f) => f.name === file.name && f.size === file.size)) continue;
        next.push(file);
      }
      return next;
    });
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function resetForm() {
    setForm(emptyForm);
    setFiles([]);
  }

  async function submitForm(event: React.FormEvent) {
    event.preventDefault();
    setBusy("create");
    setNotice(null);
    try {
      const data = new FormData();
      data.set("name", form.name);
      data.set("description", form.description);
      data.set("price_ngn", form.price);
      data.set("category", form.category);
      data.set("stock", form.stock);
      data.set("is_featured", String(form.is_featured));
      for (const file of files) data.append("images", file);

      const res = await fetch("/api/admin/products", { method: "POST", body: data });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Could not create the product.");

      const created = json.product as Product;
      setProducts((prev) => [created, ...prev]);
      resetForm();
      setShowForm(false);
      setNotice({ kind: "ok", text: `“${created.name}” added to the catalogue.` });
    } catch (err) {
      setNotice({
        kind: "err",
        text: err instanceof Error ? err.message : "Could not create the product.",
      });
    } finally {
      setBusy(null);
    }
  }

  async function patchProduct(id: string, patch: { stock?: number }) {
    const res = await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error ?? "Update failed.");
  }

  async function changeStock(product: Product, stock: number) {
    const next = Math.max(0, Math.min(100_000, stock));
    if (next === product.stock) return;
    setBusy(`stock:${product.id}`);
    setNotice(null);
    try {
      await patchProduct(product.id, { stock: next });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, stock: next } : p)),
      );
      setNotice({
        kind: "ok",
        text:
          next === 0
            ? `“${product.name}” marked as sold out.`
            : `Stock for “${product.name}” set to ${next}.`,
      });
    } catch (err) {
      setNotice({ kind: "err", text: err instanceof Error ? err.message : "Update failed." });
    } finally {
      setBusy(null);
    }
  }

  async function deleteProduct(product: Product) {
    if (!window.confirm(`Delete “${product.name}” permanently? This cannot be undone.`)) {
      return;
    }
    setBusy(`delete:${product.id}`);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/products?id=${encodeURIComponent(product.id)}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Delete failed.");
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      setNotice({ kind: "ok", text: `“${product.name}” removed from the catalogue.` });
    } catch (err) {
      setNotice({ kind: "err", text: err instanceof Error ? err.message : "Delete failed." });
    } finally {
      setBusy(null);
    }
  }

  async function removeSoldOut() {
    if (soldOut.length === 0) return;
    if (
      !window.confirm(
        `Delete all ${soldOut.length} sold-out item${soldOut.length === 1 ? "" : "s"} permanently?`,
      )
    ) {
      return;
    }
    setBusy("bulk");
    setNotice(null);
    let removed = 0;
    try {
      for (const product of soldOut) {
        const res = await fetch(`/api/admin/products?id=${encodeURIComponent(product.id)}`, {
          method: "DELETE",
        });
        if (res.ok) {
          removed += 1;
          setProducts((prev) => prev.filter((p) => p.id !== product.id));
        }
      }
      setNotice({
        kind: "ok",
        text: `${removed} sold-out item${removed === 1 ? "" : "s"} removed.`,
      });
    } finally {
      setBusy(null);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

  return (
    <div className="space-y-6">
      {/* Page header — blue + white brand */}
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <div className="bg-gradient-to-r from-navy via-accent to-[#4d86ff] px-6 py-5 text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                DPC Gadget Hub · Admin
              </p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight">Product manager</h1>
              <p className="mt-1 text-sm text-white/85">
                Drag in photos, publish in seconds, clear out what&apos;s sold.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {soldOut.length > 0 && (
                <button
                  type="button"
                  onClick={removeSoldOut}
                  disabled={busy === "bulk"}
                  className="rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/40 backdrop-blur transition hover:bg-white/25 disabled:opacity-50"
                >
                  {busy === "bulk" ? "Removing…" : `🧹 Remove sold-out (${soldOut.length})`}
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowForm((v) => !v)}
                className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-navy shadow transition hover:bg-accent-soft"
              >
                {showForm ? "✕ Close" : "+ Add product"}
              </button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white/12 px-4 py-3 ring-1 ring-white/25 backdrop-blur">
              <p className="text-2xl font-extrabold tabular-nums">{products.length}</p>
              <p className="text-xs font-medium uppercase tracking-wider text-white/75">Total</p>
            </div>
            <div className="rounded-xl bg-white/12 px-4 py-3 ring-1 ring-white/25 backdrop-blur">
              <p className="text-2xl font-extrabold tabular-nums">{inStockCount}</p>
              <p className="text-xs font-medium uppercase tracking-wider text-white/75">
                In stock{lowStock > 0 ? ` · ${lowStock} low` : ""}
              </p>
            </div>
            <div className="rounded-xl bg-white/12 px-4 py-3 ring-1 ring-white/25 backdrop-blur">
              <p className="text-2xl font-extrabold tabular-nums">{soldOut.length}</p>
              <p className="text-xs font-medium uppercase tracking-wider text-white/75">Sold out</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 px-6 py-3">
          <div className="relative min-w-52 flex-1">
            <span aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
              ⌕
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products or categories…"
              className="w-full rounded-xl border border-line bg-base py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <p className="text-xs text-muted">
            Showing {filtered.length} of {products.length}
          </p>
        </div>
      </div>

      {notice && (
        <p
          role="status"
          className={cn(
            "rounded-xl border px-4 py-3 text-sm font-medium",
            notice.kind === "ok"
              ? "border-accent/40 bg-accent-soft text-navy"
              : "border-danger/40 bg-danger/10 text-danger",
          )}
        >
          {notice.kind === "ok" ? "✓ " : "⚠ "}
          {notice.text}
        </p>
      )}

      {/* Create form with drag & drop upload */}
      {showForm && (
        <form
          onSubmit={submitForm}
          className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-gradient-to-r from-accent-soft via-white to-white px-6 py-4">
            <div>
              <h2 className="text-base font-extrabold text-navy">New product</h2>
              <p className="text-xs text-muted">Step 1 — drop photos · Step 2 — details · Step 3 — publish</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-accent ring-1 ring-accent/30">
              {files.length}/{MAX_IMAGES} photos
            </span>
          </div>
          <div className="grid gap-6 p-6 lg:grid-cols-[1.05fr_1fr]">
            {/* Dropzone — drag & drop target */}
            <div>
              <p className="mb-1.5 block text-sm font-bold text-navy">
                Photos <span className="font-normal text-muted">(drag & drop or browse · max {MAX_IMAGES})</span>
              </p>
              <div
                role="button"
                tabIndex={0}
                aria-label="Upload photos — drag files here or press Enter to browse"
                onClick={() => fileInput.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInput.current?.click();
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  addFiles(e.dataTransfer.files);
                }}
                className={cn(
                  "flex min-h-56 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all",
                  dragging
                    ? "scale-[1.01] border-accent bg-accent-soft shadow-lg shadow-accent/20"
                    : "border-accent/40 bg-gradient-to-b from-accent-soft/60 to-white hover:border-accent hover:shadow-md",
                )}
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-navy text-2xl text-white shadow-md shadow-accent/30" aria-hidden="true">
                  ⤓
                </span>
                <p className="text-base font-extrabold text-navy">
                  {dragging ? "Drop to attach ✓" : "Drag photos here"}
                </p>
                <p className="max-w-60 text-xs leading-relaxed text-muted">
                  Drag from Explorer/Finder straight onto this box — or click anywhere to browse.
                  PNG, JPG or WebP · up to 4MB each.
                </p>
                <span className="mt-1 rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-accent-hover">
                  Browse files
                </span>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </div>
              {files.length > 0 ? (
                <ul className="mt-3 grid grid-cols-3 gap-2.5">
                  {files.map((file, i) => (
                    <li key={`${file.name}-${i}`} className="group relative overflow-hidden rounded-xl border border-line bg-base">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="aspect-square w-full object-cover"
                      />
                      <span className="block truncate px-2 py-1.5 text-[11px] font-medium text-muted">
                        {(file.size / 1024).toFixed(0)}KB · {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(i);
                        }}
                        aria-label={`Remove ${file.name}`}
                        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-navy/85 text-sm font-bold text-white shadow transition hover:bg-danger"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 rounded-xl border border-dashed border-line bg-base px-4 py-3 text-center text-xs text-muted">
                  No photos yet — products with photos sell faster. You can publish without and add later.
                </p>
              )}
              <button
                type="button"
                disabled={files.length === 0}
                onClick={() => setFiles([])}
                className="mt-2 text-xs font-semibold text-muted underline-offset-2 hover:text-danger hover:underline disabled:opacity-40"
              >
                Clear all photos
              </button>
            </div>

            {/* Fields */}
            <div className="space-y-4">
              <div>
                <label htmlFor="admin-name" className="mb-1.5 block text-sm font-medium">
                  Name
                </label>
                <input
                  id="admin-name"
                  required
                  minLength={3}
                  maxLength={120}
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. Samsung Galaxy A55 5G 8/256GB"
                  className={inputClass}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="admin-price" className="mb-1.5 block text-sm font-medium">
                    Price (₦)
                  </label>
                  <input
                    id="admin-price"
                    required
                    type="number"
                    min={0}
                    step={1000}
                    value={form.price}
                    onChange={(e) => set("price", e.target.value)}
                    placeholder="e.g. 480000"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="admin-stock" className="mb-1.5 block text-sm font-medium">
                    Stock
                  </label>
                  <input
                    id="admin-stock"
                    required
                    type="number"
                    min={0}
                    value={form.stock}
                    onChange={(e) => set("stock", e.target.value)}
                    placeholder="e.g. 10"
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="admin-category" className="mb-1.5 block text-sm font-medium">
                  Category
                </label>
                <select
                  id="admin-category"
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                  className={inputClass}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="admin-description" className="mb-1.5 block text-sm font-medium">
                  Description
                </label>
                <textarea
                  id="admin-description"
                  rows={4}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Key specs, condition, what's in the box…"
                  className={inputClass}
                />
              </div>
              <label className="flex items-center gap-2.5 rounded-xl border border-line bg-base px-4 py-3 text-sm font-medium text-navy">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) => set("is_featured", e.target.checked)}
                  className="h-4 w-4 accent-blue-600"
                />
                ⭐ Feature on the home page
              </label>
              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  type="submit"
                  disabled={busy === "create"}
                  className="rounded-xl bg-gradient-to-r from-accent to-navy px-6 py-3 text-sm font-bold text-white shadow-md shadow-accent/25 transition hover:brightness-110 disabled:opacity-50"
                >
                  {busy === "create" ? "Uploading…" : `Publish product${files.length > 0 ? ` · ${files.length} photo${files.length === 1 ? "" : "s"}` : ""}`}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="rounded-xl border border-line px-6 py-3 text-sm font-semibold transition-colors hover:border-accent hover:text-accent"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Product table — remove sold items here */}
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-base/60 px-5 py-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-navy">
            Catalogue {soldOut.length > 0 && <span className="ml-2 rounded-full bg-danger/10 px-2.5 py-0.5 text-[11px] font-bold text-danger ring-1 ring-danger/30">{soldOut.length} sold out</span>}
          </h2>
          {soldOut.length > 0 && (
            <button
              type="button"
              onClick={removeSoldOut}
              disabled={busy === "bulk"}
              className="rounded-lg bg-danger px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:brightness-110 disabled:opacity-50"
            >
              {busy === "bulk" ? "Removing…" : `Remove all sold (${soldOut.length})`}
            </button>
          )}
        </div>
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-xl">📦</p>
            <p className="mt-3 text-sm font-bold text-navy">
              {products.length === 0 ? "No products yet" : `No matches for “${query}”`}
            </p>
            <p className="mx-auto mt-1 max-w-72 text-xs text-muted">
              {products.length === 0
                ? "Use “+ Add product” above — drag photos in, fill details, publish."
                : "Try a different search, or clear it to see everything."}
            </p>
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="mt-3 rounded-xl border border-line px-4 py-2 text-xs font-bold text-accent hover:border-accent"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-navy/[0.03] text-left text-xs uppercase tracking-wider text-muted">
                <th className="px-4 py-3 font-bold">Product</th>
                <th className="px-4 py-3 font-bold">Price</th>
                <th className="px-4 py-3 font-bold">Stock</th>
                <th className="px-4 py-3 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const thumb = resolveImg(p.image_urls[0] ?? "/products/placeholder.svg");
                const stockBusy = busy === `stock:${p.id}`;
                const deleteBusy = busy === `delete:${p.id}`;
                return (
                  <tr key={p.id} className={cn("border-b border-line transition-colors last:border-0 hover:bg-accent-soft/30", p.stock === 0 && "bg-danger/[0.04]")}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Image
                          src={thumb}
                          alt=""
                          width={48}
                          height={48}
                          unoptimized
                          className="h-12 w-12 shrink-0 rounded-xl border border-line bg-base object-cover shadow-sm"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-bold text-navy">{p.name}</p>
                          <p className="text-xs text-muted">
                            <span className="font-semibold text-accent">{categoryLabel(p.category)}</span>
                            {p.is_featured && " · ⭐ featured"}
                            {p.stock === 0 && " · SOLD OUT"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-extrabold text-navy">
                      {formatNaira(p.price_ngn)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <StockBadge stock={p.stock} />
                        <span
                          className={cn(
                            "tabular-nums text-xs text-muted",
                            stockBusy && "animate-pulse",
                          )}
                        >
                          {stockBusy ? "…" : `(${p.stock})`}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <button
                          type="button"
                          disabled={stockBusy || p.stock === 0}
                          onClick={() => changeStock(p, p.stock - 1)}
                          aria-label={`Decrease stock of ${p.name}`}
                          title="Sell one / decrease stock"
                          className="h-8 w-8 rounded-lg border border-line bg-white font-bold text-navy transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
                        >
                          −
                        </button>
                        <button
                          type="button"
                          disabled={stockBusy}
                          onClick={() => changeStock(p, p.stock + 1)}
                          aria-label={`Increase stock of ${p.name}`}
                          title="Restock +1"
                          className="h-8 w-8 rounded-lg border border-line bg-white font-bold text-navy transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          disabled={stockBusy || p.stock === 0}
                          onClick={() => changeStock(p, 0)}
                          title="Set stock to 0 — item shows as sold out in the shop"
                          className="rounded-lg bg-warning/15 px-3 py-1.5 text-xs font-bold text-[#92600a] ring-1 ring-warning/40 transition hover:bg-warning/25 disabled:opacity-40"
                        >
                          Mark sold
                        </button>
                        <button
                          type="button"
                          disabled={deleteBusy}
                          onClick={() => deleteProduct(p)}
                          title="Permanently remove this product and its photos"
                          className="rounded-lg bg-danger/10 px-3 py-1.5 text-xs font-bold text-danger ring-1 ring-danger/30 transition hover:bg-danger hover:text-white disabled:opacity-40"
                        >
                          {deleteBusy ? "Deleting…" : p.stock === 0 ? "Remove sold" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* How-to — drag & drop + sold cleanup */}
      <div className="grid gap-4 rounded-2xl border border-accent/25 bg-gradient-to-br from-white via-accent-soft/40 to-white p-6 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-extrabold text-navy">⬆ How to upload (drag & drop)</h3>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-[13px] leading-relaxed text-ink/80">
            <li>Click <strong>+ Add product</strong> above.</li>
            <li>Drag photos from Explorer/Finder onto the big blue box — or click it to browse. Up to 6, 4MB each, JPG/PNG/WebP.</li>
            <li>Thumbnails appear instantly — hover × to remove one, or “Clear all photos” to restart.</li>
            <li>Fill name, price ₦, stock, category → <strong>Publish product</strong>. Photos upload to Supabase Storage automatically.</li>
          </ol>
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-navy">🧹 How to remove sold items</h3>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-[13px] leading-relaxed text-ink/80">
            <li>Sold out = stock 0 (pale red row). Click <strong>Mark sold</strong> on a row to set stock to 0.</li>
            <li>Click <strong>Remove sold</strong> on that row to delete it permanently (photos cleaned up too).</li>
            <li>Or click <strong>🧹 Remove sold-out / Remove all sold</strong> in the blue header to bulk-delete everything sold.</li>
            <li>Use − / + to adjust stock after a sale or restock without deleting.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
