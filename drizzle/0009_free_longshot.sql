ALTER TABLE "invoices" RENAME COLUMN "platform" TO "platform_id";--> statement-breakpoint
ALTER TABLE "invoices" RENAME COLUMN "order" TO "order_id";--> statement-breakpoint
ALTER TABLE "invoices" DROP CONSTRAINT "platform_invoice_id_unique";--> statement-breakpoint
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_platform_platforms_id_fk";
--> statement-breakpoint
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_order_orders_id_fk";
--> statement-breakpoint
DROP INDEX "invoices_order_idx";--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "generated_by" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invoices_order_idx" ON "invoices" USING btree ("order_id");--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "platform_invoice_id_unique" UNIQUE("platform_id","invoice_id");