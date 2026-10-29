-- REVIEW ONLY. Do not execute before approval, backup and target recheck.
-- Initial migration for empty application tables; not an upgrade of existing tables.
BEGIN;
SET LOCAL search_path = public, pg_catalog;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relname IN
    ('users','regions','data_sources','redevelopment_zones','project_stages','zone_stage_events','property_listings','favorite_regions','notifications','data_sync_runs','favorite_zones','notification_preferences'))
  THEN RAISE EXCEPTION 'APP_SCHEMA_NOT_EMPTY_REVIEW_REQUIRED'; END IF;
END $$;
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('REDEVELOPMENT', 'RECONSTRUCTION', 'OTHER');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('SALE', 'JEONSE', 'MONTHLY_RENT');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('ACTIVE', 'CLOSED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_LISTING', 'PRICE_CHANGED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "supabaseAuthId" UUID,
    "avatarUrl" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regions" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" UUID,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_sources" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "referenceUrl" TEXT NOT NULL,
    "licenseNote" TEXT,

    CONSTRAINT "data_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redevelopment_zones" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "projectType" "ProjectType" NOT NULL,
    "regionId" UUID NOT NULL,
    "address" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "areaM2" DECIMAL(16,2),
    "currentStageId" UUID,
    "sourceId" UUID NOT NULL,
    "externalId" TEXT NOT NULL,
    "sourceUpdatedAt" TIMESTAMPTZ(3),
    "lastSeenAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "redevelopment_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_stages" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "project_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zone_stage_events" (
    "id" UUID NOT NULL,
    "zoneId" UUID NOT NULL,
    "stageId" UUID NOT NULL,
    "sourceId" UUID NOT NULL,
    "externalId" TEXT NOT NULL,
    "sourceLabel" TEXT,
    "noticeNumber" TEXT,
    "referenceUrl" TEXT,
    "effectiveDate" DATE,
    "sourceUpdatedAt" TIMESTAMPTZ(3),
    "lastSeenAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "zone_stage_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_listings" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "propertyType" TEXT NOT NULL,
    "transactionType" "TransactionType" NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "regionId" UUID NOT NULL,
    "zoneId" UUID,
    "address" TEXT,
    "exclusiveAreaM2" DECIMAL(12,2),
    "salePriceWon" DECIMAL(20,0),
    "depositWon" DECIMAL(20,0),
    "monthlyRentWon" DECIMAL(20,0),
    "sourceId" UUID NOT NULL,
    "externalId" TEXT NOT NULL,
    "referenceUrl" TEXT,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "sourceUpdatedAt" TIMESTAMPTZ(3),
    "lastSeenAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "property_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorite_regions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "regionId" UUID NOT NULL,
    "includeDescendants" BOOLEAN NOT NULL DEFAULT true,
    "alertsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "favoriteRegionId" UUID,
    "listingId" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "listingRevision" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "readAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_sync_runs" (
    "id" UUID NOT NULL,
    "sourceId" UUID NOT NULL,
    "status" "SyncStatus" NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMPTZ(3),
    "fetchedCount" INTEGER NOT NULL DEFAULT 0,
    "upsertedCount" INTEGER NOT NULL DEFAULT 0,
    "errorCode" TEXT,

    CONSTRAINT "data_sync_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorite_zones" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "zoneId" UUID NOT NULL,
    "alertsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "favorite_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "userId" UUID NOT NULL,
    "saleEnabled" BOOLEAN NOT NULL DEFAULT false,
    "auctionEnabled" BOOLEAN NOT NULL DEFAULT false,
    "priceEnabled" BOOLEAN NOT NULL DEFAULT false,
    "stageEnabled" BOOLEAN NOT NULL DEFAULT false,
    "appEnabled" BOOLEAN NOT NULL DEFAULT true,
    "kakaoRequested" BOOLEAN NOT NULL DEFAULT false,
    "frequency" TEXT NOT NULL DEFAULT 'daily',
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_supabaseAuthId_key" ON "users"("supabaseAuthId");

-- CreateIndex
CREATE UNIQUE INDEX "regions_code_key" ON "regions"("code");

-- CreateIndex
CREATE INDEX "regions_parentId_idx" ON "regions"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "data_sources_code_key" ON "data_sources"("code");

-- CreateIndex
CREATE INDEX "redevelopment_zones_regionId_projectType_idx" ON "redevelopment_zones"("regionId", "projectType");

-- CreateIndex
CREATE INDEX "redevelopment_zones_currentStageId_idx" ON "redevelopment_zones"("currentStageId");

-- CreateIndex
CREATE UNIQUE INDEX "redevelopment_zones_sourceId_externalId_key" ON "redevelopment_zones"("sourceId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "project_stages_code_key" ON "project_stages"("code");

-- CreateIndex
CREATE INDEX "zone_stage_events_zoneId_effectiveDate_idx" ON "zone_stage_events"("zoneId", "effectiveDate");

-- CreateIndex
CREATE INDEX "zone_stage_events_stageId_idx" ON "zone_stage_events"("stageId");

-- CreateIndex
CREATE UNIQUE INDEX "zone_stage_events_sourceId_externalId_key" ON "zone_stage_events"("sourceId", "externalId");

-- CreateIndex
CREATE INDEX "property_listings_regionId_status_createdAt_idx" ON "property_listings"("regionId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "property_listings_zoneId_status_idx" ON "property_listings"("zoneId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "property_listings_sourceId_externalId_key" ON "property_listings"("sourceId", "externalId");

-- CreateIndex
CREATE INDEX "favorite_regions_regionId_alertsEnabled_idx" ON "favorite_regions"("regionId", "alertsEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_regions_userId_regionId_key" ON "favorite_regions"("userId", "regionId");

-- CreateIndex
CREATE INDEX "notifications_userId_readAt_createdAt_idx" ON "notifications"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_favoriteRegionId_idx" ON "notifications"("favoriteRegionId");

-- CreateIndex
CREATE INDEX "notifications_listingId_idx" ON "notifications"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_userId_listingId_type_listingRevision_key" ON "notifications"("userId", "listingId", "type", "listingRevision");

-- CreateIndex
CREATE INDEX "data_sync_runs_sourceId_startedAt_idx" ON "data_sync_runs"("sourceId", "startedAt");

-- CreateIndex
CREATE INDEX "favorite_zones_zoneId_alertsEnabled_idx" ON "favorite_zones"("zoneId", "alertsEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_zones_userId_zoneId_key" ON "favorite_zones"("userId", "zoneId");

-- AddForeignKey
ALTER TABLE "regions" ADD CONSTRAINT "regions_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redevelopment_zones" ADD CONSTRAINT "redevelopment_zones_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redevelopment_zones" ADD CONSTRAINT "redevelopment_zones_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "data_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redevelopment_zones" ADD CONSTRAINT "redevelopment_zones_currentStageId_fkey" FOREIGN KEY ("currentStageId") REFERENCES "project_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zone_stage_events" ADD CONSTRAINT "zone_stage_events_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "redevelopment_zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zone_stage_events" ADD CONSTRAINT "zone_stage_events_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "project_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zone_stage_events" ADD CONSTRAINT "zone_stage_events_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "data_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_listings" ADD CONSTRAINT "property_listings_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_listings" ADD CONSTRAINT "property_listings_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "redevelopment_zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_listings" ADD CONSTRAINT "property_listings_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "data_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_regions" ADD CONSTRAINT "favorite_regions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_regions" ADD CONSTRAINT "favorite_regions_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_favoriteRegionId_fkey" FOREIGN KEY ("favoriteRegionId") REFERENCES "favorite_regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "property_listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_sync_runs" ADD CONSTRAINT "data_sync_runs_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "data_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_zones" ADD CONSTRAINT "favorite_zones_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_zones" ADD CONSTRAINT "favorite_zones_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "redevelopment_zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "redevelopment_zones" ADD CONSTRAINT "zone_area_nonnegative" CHECK ("areaM2" IS NULL OR "areaM2" >= 0);
ALTER TABLE "redevelopment_zones" ADD CONSTRAINT "zone_coordinates_valid" CHECK (("latitude" IS NULL OR "latitude" BETWEEN -90 AND 90) AND ("longitude" IS NULL OR "longitude" BETWEEN -180 AND 180));
ALTER TABLE "property_listings" ADD CONSTRAINT "listing_values_nonnegative" CHECK (("exclusiveAreaM2" IS NULL OR "exclusiveAreaM2" >= 0) AND ("salePriceWon" IS NULL OR "salePriceWon" >= 0) AND ("depositWon" IS NULL OR "depositWon" >= 0) AND ("monthlyRentWon" IS NULL OR "monthlyRentWon" >= 0));
ALTER TABLE "property_listings" ADD CONSTRAINT "listing_required_amounts" CHECK (("transactionType" = 'SALE' AND "salePriceWon" IS NOT NULL) OR ("transactionType" = 'JEONSE' AND "depositWon" IS NOT NULL) OR ("transactionType" = 'MONTHLY_RENT' AND "depositWon" IS NOT NULL AND "monthlyRentWon" IS NOT NULL));
ALTER TABLE "property_listings" ADD CONSTRAINT "listing_revision_positive" CHECK ("revision" >= 1);
ALTER TABLE "notifications" ADD CONSTRAINT "notification_revision_positive" CHECK ("listingRevision" >= 1);
ALTER TABLE "data_sync_runs" ADD CONSTRAINT "sync_counts_nonnegative" CHECK ("fetchedCount" >= 0 AND "upsertedCount" >= 0);
ALTER TABLE "data_sync_runs" ADD CONSTRAINT "sync_times_ordered" CHECK ("finishedAt" IS NULL OR "finishedAt" >= "startedAt");


-- Deny unauthenticated Data API access; grant only explicit member capabilities.
ALTER TABLE public."users" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."users" FROM PUBLIC, anon, authenticated;
ALTER TABLE public."regions" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."regions" FROM PUBLIC, anon, authenticated;
ALTER TABLE public."data_sources" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."data_sources" FROM PUBLIC, anon, authenticated;
ALTER TABLE public."redevelopment_zones" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."redevelopment_zones" FROM PUBLIC, anon, authenticated;
ALTER TABLE public."project_stages" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."project_stages" FROM PUBLIC, anon, authenticated;
ALTER TABLE public."zone_stage_events" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."zone_stage_events" FROM PUBLIC, anon, authenticated;
ALTER TABLE public."property_listings" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."property_listings" FROM PUBLIC, anon, authenticated;
ALTER TABLE public."favorite_regions" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."favorite_regions" FROM PUBLIC, anon, authenticated;
ALTER TABLE public."notifications" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."notifications" FROM PUBLIC, anon, authenticated;
ALTER TABLE public."data_sync_runs" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."data_sync_runs" FROM PUBLIC, anon, authenticated;
ALTER TABLE public."favorite_zones" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."favorite_zones" FROM PUBLIC, anon, authenticated;
ALTER TABLE public."notification_preferences" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."notification_preferences" FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE public.users TO authenticated;
GRANT UPDATE ("name", "avatarUrl") ON public.users TO authenticated;
CREATE POLICY users_select_own ON public.users FOR SELECT TO authenticated
  USING ("supabaseAuthId" = (SELECT auth.uid()));
CREATE POLICY users_update_own ON public.users FOR UPDATE TO authenticated
  USING ("supabaseAuthId" = (SELECT auth.uid()))
  WITH CHECK ("supabaseAuthId" = (SELECT auth.uid()));
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."favorite_regions" TO authenticated;
CREATE POLICY favorite_regions_select_own ON public."favorite_regions" FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = "favorite_regions"."userId" AND u."supabaseAuthId" = (SELECT auth.uid())));
CREATE POLICY favorite_regions_insert_own ON public."favorite_regions" FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = "favorite_regions"."userId" AND u."supabaseAuthId" = (SELECT auth.uid())));
CREATE POLICY favorite_regions_update_own ON public."favorite_regions" FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = "favorite_regions"."userId" AND u."supabaseAuthId" = (SELECT auth.uid()))) WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = "favorite_regions"."userId" AND u."supabaseAuthId" = (SELECT auth.uid())));
CREATE POLICY favorite_regions_delete_own ON public."favorite_regions" FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = "favorite_regions"."userId" AND u."supabaseAuthId" = (SELECT auth.uid())));
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."favorite_zones" TO authenticated;
CREATE POLICY favorite_zones_select_own ON public."favorite_zones" FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = "favorite_zones"."userId" AND u."supabaseAuthId" = (SELECT auth.uid())));
CREATE POLICY favorite_zones_insert_own ON public."favorite_zones" FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = "favorite_zones"."userId" AND u."supabaseAuthId" = (SELECT auth.uid())));
CREATE POLICY favorite_zones_update_own ON public."favorite_zones" FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = "favorite_zones"."userId" AND u."supabaseAuthId" = (SELECT auth.uid()))) WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = "favorite_zones"."userId" AND u."supabaseAuthId" = (SELECT auth.uid())));
CREATE POLICY favorite_zones_delete_own ON public."favorite_zones" FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = "favorite_zones"."userId" AND u."supabaseAuthId" = (SELECT auth.uid())));
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."notification_preferences" TO authenticated;
CREATE POLICY notification_preferences_select_own ON public."notification_preferences" FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = "notification_preferences"."userId" AND u."supabaseAuthId" = (SELECT auth.uid())));
CREATE POLICY notification_preferences_insert_own ON public."notification_preferences" FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = "notification_preferences"."userId" AND u."supabaseAuthId" = (SELECT auth.uid())));
CREATE POLICY notification_preferences_update_own ON public."notification_preferences" FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = "notification_preferences"."userId" AND u."supabaseAuthId" = (SELECT auth.uid()))) WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = "notification_preferences"."userId" AND u."supabaseAuthId" = (SELECT auth.uid())));
CREATE POLICY notification_preferences_delete_own ON public."notification_preferences" FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = "notification_preferences"."userId" AND u."supabaseAuthId" = (SELECT auth.uid())));

GRANT SELECT ON TABLE public.notifications TO authenticated;
GRANT UPDATE ("readAt") ON public.notifications TO authenticated;
CREATE POLICY notifications_select_own ON public.notifications FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = notifications."userId" AND u."supabaseAuthId" = (SELECT auth.uid())));
CREATE POLICY notifications_mark_read_own ON public.notifications FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = notifications."userId" AND u."supabaseAuthId" = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = notifications."userId" AND u."supabaseAuthId" = (SELECT auth.uid())));
ALTER TABLE public.notification_preferences ADD CONSTRAINT notification_frequency_allowed CHECK (frequency IN ('instant','daily','weekly'));
-- No client profile creation/linking, notification creation, business-source writes or admin grants.
-- BYPASSRLS roles still bypass policies. Server verified identity and ownership checks remain mandatory.
COMMIT;
