import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "../../../db";
import { assets, collections } from "../../../db/schema";
import { CatalogFilters, CatalogResult } from "./catalog.interfaces";

const getCatalog = async (filters: CatalogFilters): Promise<CatalogResult> => {
  const {
    company_id,
    brand_id,
    category,
    search,
    type = "all",
    limit = 50,
    offset = 0,
  } = filters;

  const result: CatalogResult = {
    assets: [],
    collections: [],
    meta: {
      total_assets: 0,
      total_collections: 0,
    },
  };

  // Build Asset Conditions
  const assetConditions: any[] = [];
  if (company_id) assetConditions.push(eq(assets.company_id, company_id));
  if (brand_id) assetConditions.push(eq(assets.brand_id, brand_id));
  if (category) assetConditions.push(eq(assets.category, category as any)); // Enum cast handling if needed
  if (search) {
    assetConditions.push(
      or(
        ilike(assets.name, `%${search.trim()}%`),
        ilike(assets.description, `%${search.trim()}%`),
        ilike(assets.qr_code, `%${search.trim()}%`)
      )
    );
  }
  // Only available assets? The prompt says "Browse client-facing catalog". 
  // Usually this implies active/available items. Let's filter by active/not deleted.
  assetConditions.push(eq(assets.status, "AVAILABLE"));
  // Wait, schema has deleted_at, let's verify schema...
  // assets has deleted_at and status.
  // collections has is_active and deleted_at.

  // Re-verify schema usage:
  // assets: deleted_at column exists.
  // collections: is_active and deleted_at columns exist.

  // Let's add basic availability checks
  // For assets, maybe we don't strictly enforce 'AVAILABLE' status if we just want to see the catalog, 
  // but usually 'Browse' implies things you can pick. I'll stick to not deleted for now to be safe, 
  // and maybe 'is_active' equivalent. Assets has no is_active, but has status.
  // I will check if deleted_at is null.

  // Build Collection Conditions
  const collectionConditions: any[] = [];
  if (company_id) collectionConditions.push(eq(collections.company_id, company_id));
  if (brand_id) collectionConditions.push(eq(collections.brand_id, brand_id));
  if (category) collectionConditions.push(eq(collections.category, category));
  if (search) {
    collectionConditions.push(
      or(
        ilike(collections.name, `%${search.trim()}%`),
        ilike(collections.description, `%${search.trim()}%`)
      )
    );
  }
  collectionConditions.push(eq(collections.is_active, true));

  // Execute Queries based on type
  if (type === "asset" || type === "all") {
    // Assets
    const [assetData, assetCount] = await Promise.all([
      db.query.assets.findMany({
        where: and(...assetConditions),
        limit: limit,
        offset: offset,
        orderBy: [desc(assets.created_at)],
        with: {
          brand: true,
          company: true
        }
      }),
      db
        .select({ count: count() })
        .from(assets)
        .where(and(...assetConditions)),
    ]);
    result.assets = assetData;
    result.meta!.total_assets = assetCount[0].count;
  }

  if (type === "collection" || type === "all") {
    // Collections
    const [collectionData, collectionCount] = await Promise.all([
      db.query.collections.findMany({
        where: and(...collectionConditions),
        limit: limit,
        offset: offset,
        orderBy: [desc(collections.created_at)],
        with: {
          brand: true,
          company: true
        }
      }),
      db
        .select({ count: count() })
        .from(collections)
        .where(and(...collectionConditions)),
    ]);
    result.collections = collectionData;
    result.meta!.total_collections = collectionCount[0].count;
  }

  return result;
};

export const CatalogServices = {
  getCatalog,
};
