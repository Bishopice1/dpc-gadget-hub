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

  const soldOut = products.filter((p) => p.stock === 0);

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
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Product manager</h1>
          <p className="mt-1 text-sm text-muted">
            {products.length} product{products.length === 1 ? "" : "s"} in the catalogue
            {soldOut.length > 0 && ` · ${soldOut.length} sold out`}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {soldOut.length > 0 && (
            <button
              type="button"
              onClick={removeSoldOut}
              disabled={busy === "bulk"}
              className="rounded-xl border border-danger/40 bg-danger/10 px-5 py-2.5 text-sm font-semibold text-danger transition-colors hover:bg-danger/20 disabled:opacity-50"
            >
              {busy === "bulk" ? "Removing…" : `Remove sold-out (${soldOut.length})`}
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            {showForm ? "Close" : "Add product"}
          </button>
        </div>
      </div>

      {notice && (
        <p
          role="status"
          className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            notice.kind === "ok"
              ? "border-accent/40 bg-accent/10 text-accent"
              : "border-danger/40 bg-danger/10 text-danger",
          )}
        >
          {notice.text}
        </p>
      )}

      {/* Create form with drag & drop upload */}
      {showForm && (
        <form
          onSubmit={submitForm}
          className="rounded-2xl border border-line bg-surface p-6 shadow-sm"
        >
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Dropzone */}
            <div>
              <p className="mb-1.5 block text-sm font-medium">
                Photos <span className="font-normal text-muted">(optional, max {MAX_IMAGES})</span>
              </p>
              <div
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
                  "flex min-h-44 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors",
                  dragging
                    ? "border-accent bg-accent/10"
                    : "border-line bg-base hover:border-accent/50",
                )}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8 text-accent" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V4.5m0 0L7.5 9M12 4.5 16.5 9M4.5 16.5v1.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-1.5" />
                </svg>
                <p className="text-sm font-medium">Drag photos here</p>
                <p className="text-xs text-muted">PNG, JPG or WebP · up to 4MB each</p>
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="mt-1 rounded-lg border border-line bg-surface px-4 py-2 text-sm font-semibold transition-colors hover:border-accent hover:text-accent"
                >
                  Browse files
                </button>
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
              {files.length > 0 && (
                <ul className="mt-3 grid grid-cols-4 gap-2">
                  {files.map((file, i) => (
                    <li key={`${file.name}-${i}`} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="aspect-square w-full rounded-lg border border-line object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        aria-label={`Remove ${file.name}`}
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-xs font-bold text-white shadow"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
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
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) => set("is_featured", e.target.checked)}
                  className="h-4 w-4 accent-blue-600"
                />
                Feature on the home page
              </label>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={busy === "create"}
                  className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
                >
                  {busy === "create" ? "Uploading…" : "Publish product"}
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

      {/* Product table */}
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        {products.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-muted">
            No products yet — use “Add product” to create the first one.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-2 text-left text-xs uppercase tracking-wider text-muted">
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const thumb = resolveImg(p.image_urls[0] ?? "/products/placeholder.svg");
                const stockBusy = busy === `stock:${p.id}`;
                const deleteBusy = busy === `delete:${p.id}`;
                return (
                  <tr key={p.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Image
                          src={thumb}
                          alt=""
                          width={44}
                          height={44}
                          unoptimized
                          className="h-11 w-11 shrink-0 rounded-lg border border-line bg-base object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{p.name}</p>
                          <p className="text-xs text-muted">
                            {categoryLabel(p.category)}
                            {p.is_featured && " · featured"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold">
                      {formatNaira(p.price_ngn)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <StockBadge stock={p.stock} />
                        <span
                          className={cn(
                            "tabular-nums text-muted",
                            stockBusy && "animate-pulse",
                          )}
                        >
                          {stockBusy ? "…" : `(${p.stock})`}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={stockBusy || p.stock === 0}
                          onClick={() => changeStock(p, p.stock - 1)}
                          aria-label={`Decrease stock of ${p.name}`}
                          className="h-8 w-8 rounded-lg border border-line font-bold transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
                        >
                          −
                        </button>
                        <button
                          type="button"
                          disabled={stockBusy}
                          onClick={() => changeStock(p, p.stock + 1)}
                          aria-label={`Increase stock of ${p.name}`}
                          className="h-8 w-8 rounded-lg border border-line font-bold transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          disabled={stockBusy || p.stock === 0}
                          onClick={() => changeStock(p, 0)}
                          className="rounded-lg border border-warning/50 bg-warning/10 px-3 py-1.5 text-xs font-semibold text-warning transition-colors hover:bg-warning/20 disabled:opacity-40"
                        >
                          Mark sold
                        </button>
                        <button
                          type="button"
                          disabled={deleteBusy}
                          onClick={() => deleteProduct(p)}
                          className="rounded-lg border border-danger/50 bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger transition-colors hover:bg-danger/20 disabled:opacity-40"
                        >
                          {deleteBusy ? "Deleting…" : "Delete"}
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
    </div>
  );
}
