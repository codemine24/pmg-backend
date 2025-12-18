CREATE TYPE "public"."asset_status" AS ENUM('AVAILABLE', 'BOOKED', 'OUT', 'IN_MAINTENANCE');--> statement-breakpoint
CREATE TYPE "public"."condition" AS ENUM('GREEN', 'ORANGE', 'RED');--> statement-breakpoint
CREATE TYPE "public"."discrepancy_reason" AS ENUM('BROKEN', 'LOST', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."financial_status" AS ENUM('PENDING_QUOTE', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'PENDING_INVOICE', 'INVOICED', 'PAID');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('QUEUED', 'SENT', 'FAILED', 'RETRYING');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('DRAFT', 'SUBMITTED', 'PRICING_REVIEW', 'PENDING_APPROVAL', 'QUOTED', 'DECLINED', 'CONFIRMED', 'IN_PREPARATION', 'READY_FOR_DELIVERY', 'IN_TRANSIT', 'DELIVERED', 'IN_USE', 'AWAITING_RETURN', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."scan_type" AS ENUM('OUTBOUND', 'INBOUND');--> statement-breakpoint
CREATE TYPE "public"."tracking_method" AS ENUM('INDIVIDUAL', 'BATCH');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'LOGISTICS', 'CLIENT');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset" uuid NOT NULL,
	"order" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"blocked_from" timestamp NOT NULL,
	"blocked_until" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_condition_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" uuid NOT NULL,
	"asset" uuid NOT NULL,
	"condition" "condition" NOT NULL,
	"notes" text,
	"photos" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"updated_by" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" uuid NOT NULL,
	"company" uuid NOT NULL,
	"brand" uuid,
	"warehouse" uuid NOT NULL,
	"zone" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100) NOT NULL,
	"images" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"tracking_method" "tracking_method" NOT NULL,
	"total_quantity" integer DEFAULT 1 NOT NULL,
	"qr_code" varchar(255) NOT NULL,
	"packaging" varchar(255),
	"weight" numeric(10, 2) NOT NULL,
	"dimension_length" numeric(10, 2) NOT NULL,
	"dimension_width" numeric(10, 2) NOT NULL,
	"dimension_height" numeric(10, 2) NOT NULL,
	"volume" numeric(10, 3) NOT NULL,
	"condition" "condition" DEFAULT 'GREEN' NOT NULL,
	"status" "asset_status" DEFAULT 'AVAILABLE' NOT NULL,
	"refurb_days_estimate" integer,
	"handling_tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"last_scanned_at" timestamp,
	"last_scanned_by" text,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "assets_qr_code_unique" UNIQUE("qr_code")
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" uuid NOT NULL,
	"company" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"logo_url" varchar(500),
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "brands_company_name_unique" UNIQUE("company","name")
);
--> statement-breakpoint
CREATE TABLE "collection_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collection" uuid NOT NULL,
	"asset" uuid NOT NULL,
	"default_quantity" integer DEFAULT 1 NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "collection_items_unique" UNIQUE("collection","asset")
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" uuid NOT NULL,
	"company" uuid NOT NULL,
	"brand" uuid,
	"name" varchar(255) NOT NULL,
	"description" text,
	"images" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"category" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"domain" varchar(50) NOT NULL,
	"description" text,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"contact_email" varchar(255),
	"contact_phone" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"archived_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "companies_platform_domain_unique" UNIQUE("platform","domain")
);
--> statement-breakpoint
CREATE TABLE "company_domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" uuid NOT NULL,
	"company" uuid NOT NULL,
	"hostname" text NOT NULL,
	"type" varchar(30) NOT NULL,
	"is_verified" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "company_domains_hostname_unique" UNIQUE("hostname")
);
--> statement-breakpoint
CREATE TABLE "notification_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" uuid NOT NULL,
	"order" uuid NOT NULL,
	"notification_type" varchar(100) NOT NULL,
	"recipients" text NOT NULL,
	"status" "notification_status" DEFAULT 'QUEUED' NOT NULL,
	"attempts" integer DEFAULT 1 NOT NULL,
	"last_attempt_at" timestamp DEFAULT now() NOT NULL,
	"sent_at" timestamp,
	"message_id" varchar(255),
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" uuid NOT NULL,
	"order" uuid NOT NULL,
	"asset" uuid NOT NULL,
	"asset_name" varchar(255) NOT NULL,
	"quantity" integer NOT NULL,
	"volume" numeric(10, 3) NOT NULL,
	"weight" numeric(10, 2) NOT NULL,
	"total_volume" numeric(10, 3) NOT NULL,
	"total_weight" numeric(10, 2) NOT NULL,
	"condition" "condition" NOT NULL,
	"handling_tags" text[] DEFAULT ARRAY[]::text[],
	"from_collection" uuid,
	"from_collection_name" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" uuid NOT NULL,
	"order" uuid NOT NULL,
	"status" "order_status" NOT NULL,
	"notes" text,
	"updated_by" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" uuid NOT NULL,
	"order_id" varchar(50) NOT NULL,
	"company" uuid NOT NULL,
	"brand" uuid,
	"user_id" text NOT NULL,
	"contact_name" varchar(255),
	"contact_email" varchar(255),
	"contact_phone" varchar(50),
	"event_start_date" timestamp,
	"event_end_date" timestamp,
	"venue_name" varchar(255),
	"venue_country" varchar(100),
	"venue_city" varchar(100),
	"venue_address" text,
	"venue_access_notes" text,
	"special_instructions" text,
	"calculated_volume" numeric(10, 3) DEFAULT '0',
	"calculated_weight" numeric(10, 2) DEFAULT '0',
	"pricing_tier" uuid,
	"logistics_pricing" jsonb,
	"platform_pricing" jsonb,
	"final_pricing" jsonb,
	"invoice_number" varchar(100),
	"invoice_generated_at" timestamp,
	"invoice_pdf_url" varchar(500),
	"invoice_paid_at" timestamp,
	"delivery_window_start" timestamp,
	"delivery_window_end" timestamp,
	"pickup_window_start" timestamp,
	"pickup_window_end" timestamp,
	"truck_photos" text[] DEFAULT ARRAY[]::text[],
	"job_number" varchar(100),
	"status" "order_status" DEFAULT 'DRAFT' NOT NULL,
	"financial_status" "financial_status" DEFAULT 'PENDING_QUOTE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "orders_platform_id_unique" UNIQUE("platform","order_id")
);
--> statement-breakpoint
CREATE TABLE "platforms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"domain" varchar(100) NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"features" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "platforms_domain_unique" UNIQUE("domain")
);
--> statement-breakpoint
CREATE TABLE "pricing_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" uuid NOT NULL,
	"country" varchar(100) NOT NULL,
	"city" varchar(100) NOT NULL,
	"volume_min" numeric(10, 3) NOT NULL,
	"volume_max" numeric(10, 3) NOT NULL,
	"base_price" numeric(10, 2) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scan_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order" uuid NOT NULL,
	"asset" uuid NOT NULL,
	"scan_type" "scan_type" NOT NULL,
	"quantity" integer NOT NULL,
	"condition" "condition" NOT NULL,
	"notes" text,
	"photos" text[] DEFAULT ARRAY[]::text[],
	"discrepancy_reason" "discrepancy_reason",
	"scanned_by" text NOT NULL,
	"scanned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"platform" uuid NOT NULL,
	"company" uuid,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" "user_role" DEFAULT 'CLIENT' NOT NULL,
	"permissions" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp,
	"deleted_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "warehouses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"country" varchar(100) NOT NULL,
	"city" varchar(100) NOT NULL,
	"address" text NOT NULL,
	"archived_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "warehouses_platform_name_unique" UNIQUE("platform","name")
);
--> statement-breakpoint
CREATE TABLE "zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" uuid NOT NULL,
	"warehouse" uuid NOT NULL,
	"company" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "zones_warehouse_company_name_unique" UNIQUE("warehouse","company","name")
);
--> statement-breakpoint
DROP TABLE "users" CASCADE;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_bookings" ADD CONSTRAINT "asset_bookings_asset_assets_id_fk" FOREIGN KEY ("asset") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_bookings" ADD CONSTRAINT "asset_bookings_order_orders_id_fk" FOREIGN KEY ("order") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_condition_history" ADD CONSTRAINT "asset_condition_history_platform_platforms_id_fk" FOREIGN KEY ("platform") REFERENCES "public"."platforms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_condition_history" ADD CONSTRAINT "asset_condition_history_asset_assets_id_fk" FOREIGN KEY ("asset") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_condition_history" ADD CONSTRAINT "asset_condition_history_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_platform_platforms_id_fk" FOREIGN KEY ("platform") REFERENCES "public"."platforms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_company_companies_id_fk" FOREIGN KEY ("company") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_brand_brands_id_fk" FOREIGN KEY ("brand") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_warehouse_warehouses_id_fk" FOREIGN KEY ("warehouse") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_zone_zones_id_fk" FOREIGN KEY ("zone") REFERENCES "public"."zones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_last_scanned_by_user_id_fk" FOREIGN KEY ("last_scanned_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brands" ADD CONSTRAINT "brands_platform_platforms_id_fk" FOREIGN KEY ("platform") REFERENCES "public"."platforms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brands" ADD CONSTRAINT "brands_company_companies_id_fk" FOREIGN KEY ("company") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_collection_collections_id_fk" FOREIGN KEY ("collection") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_asset_assets_id_fk" FOREIGN KEY ("asset") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_platform_platforms_id_fk" FOREIGN KEY ("platform") REFERENCES "public"."platforms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_company_companies_id_fk" FOREIGN KEY ("company") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_brand_brands_id_fk" FOREIGN KEY ("brand") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_platform_platforms_id_fk" FOREIGN KEY ("platform") REFERENCES "public"."platforms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_domains" ADD CONSTRAINT "company_domains_platform_platforms_id_fk" FOREIGN KEY ("platform") REFERENCES "public"."platforms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_domains" ADD CONSTRAINT "company_domains_company_companies_id_fk" FOREIGN KEY ("company") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_platform_platforms_id_fk" FOREIGN KEY ("platform") REFERENCES "public"."platforms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_order_orders_id_fk" FOREIGN KEY ("order") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_platform_platforms_id_fk" FOREIGN KEY ("platform") REFERENCES "public"."platforms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_orders_id_fk" FOREIGN KEY ("order") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_asset_assets_id_fk" FOREIGN KEY ("asset") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_from_collection_collections_id_fk" FOREIGN KEY ("from_collection") REFERENCES "public"."collections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_platform_platforms_id_fk" FOREIGN KEY ("platform") REFERENCES "public"."platforms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_orders_id_fk" FOREIGN KEY ("order") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_platform_platforms_id_fk" FOREIGN KEY ("platform") REFERENCES "public"."platforms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_company_companies_id_fk" FOREIGN KEY ("company") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_brand_brands_id_fk" FOREIGN KEY ("brand") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_pricing_tier_pricing_tiers_id_fk" FOREIGN KEY ("pricing_tier") REFERENCES "public"."pricing_tiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_tiers" ADD CONSTRAINT "pricing_tiers_platform_platforms_id_fk" FOREIGN KEY ("platform") REFERENCES "public"."platforms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_events" ADD CONSTRAINT "scan_events_order_orders_id_fk" FOREIGN KEY ("order") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_events" ADD CONSTRAINT "scan_events_asset_assets_id_fk" FOREIGN KEY ("asset") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_events" ADD CONSTRAINT "scan_events_scanned_by_user_id_fk" FOREIGN KEY ("scanned_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_platform_platforms_id_fk" FOREIGN KEY ("platform") REFERENCES "public"."platforms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_company_companies_id_fk" FOREIGN KEY ("company") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_platform_platforms_id_fk" FOREIGN KEY ("platform") REFERENCES "public"."platforms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zones" ADD CONSTRAINT "zones_platform_platforms_id_fk" FOREIGN KEY ("platform") REFERENCES "public"."platforms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zones" ADD CONSTRAINT "zones_warehouse_warehouses_id_fk" FOREIGN KEY ("warehouse") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zones" ADD CONSTRAINT "zones_company_companies_id_fk" FOREIGN KEY ("company") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "asset_bookings_dates_idx" ON "asset_bookings" USING btree ("blocked_from","blocked_until");--> statement-breakpoint
CREATE INDEX "asset_condition_history_asset_idx" ON "asset_condition_history" USING btree ("asset");--> statement-breakpoint
CREATE INDEX "asset_condition_history_platform_idx" ON "asset_condition_history" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "assets_platform_idx" ON "assets" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "assets_company_idx" ON "assets" USING btree ("company");--> statement-breakpoint
CREATE INDEX "assets_qr_code_idx" ON "assets" USING btree ("qr_code");--> statement-breakpoint
CREATE INDEX "collections_company_idx" ON "collections" USING btree ("company");--> statement-breakpoint
CREATE INDEX "companies_platform_idx" ON "companies" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "company_domains_hostname_idx" ON "company_domains" USING btree ("hostname");--> statement-breakpoint
CREATE INDEX "notification_logs_order_idx" ON "notification_logs" USING btree ("order");--> statement-breakpoint
CREATE INDEX "notification_logs_status_idx" ON "notification_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "order_status_history_order_idx" ON "order_status_history" USING btree ("order");--> statement-breakpoint
CREATE INDEX "orders_platform_company_idx" ON "orders" USING btree ("platform","company");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "platforms_domain_idx" ON "platforms" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "pricing_tiers_platform_location_idx" ON "pricing_tiers" USING btree ("platform","country","city");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_platform_idx" ON "user" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "user_company_idx" ON "user" USING btree ("company");--> statement-breakpoint
CREATE UNIQUE INDEX "user_platform_email_unique" ON "user" USING btree ("platform","email");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");