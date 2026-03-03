--
-- PostgreSQL database dump
--

\restrict ASKrcx22eDBoRMQK5wdHM8BPEp9ojHpao2VxM30NnEehMygVpnDaPaWkDkiuD9P

-- Dumped from database version 16.12 (0341c33)
-- Dumped by pg_dump version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: neon_auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA neon_auth;


--
-- Name: InterventionPriority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."InterventionPriority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);


--
-- Name: InterventionStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."InterventionStatus" AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'PENDING_PARTS',
    'CLOSED',
    'CANCELLED'
);


--
-- Name: InterventionType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."InterventionType" AS ENUM (
    'PREVENTIVE',
    'CORRECTIVE',
    'PREDICTIVE',
    'INSPECTION'
);


--
-- Name: MachineStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MachineStatus" AS ENUM (
    'OPERATIONAL',
    'UNDER_MAINTENANCE',
    'DECOMMISSIONED'
);


--
-- Name: ModuleName; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ModuleName" AS ENUM (
    'GMAO',
    'STOCK_MANAGEMENT',
    'AI_ASSISTANT',
    'ADVANCED_REPORTS',
    'INTER_SITE_TRANSFERS'
);


--
-- Name: MovementType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MovementType" AS ENUM (
    'IN',
    'OUT',
    'TRANSFER_IN',
    'TRANSFER_OUT',
    'ADJUSTMENT'
);


--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."NotificationType" AS ENUM (
    'INTERVENTION_ASSIGNED',
    'INTERVENTION_OVERDUE',
    'STOCK_LOW',
    'PREVENTIVE_DUE',
    'TRANSFER_PENDING',
    'TRANSFER_RESOLVED'
);


--
-- Name: PurchaseOrderStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PurchaseOrderStatus" AS ENUM (
    'DRAFT',
    'ORDERED',
    'RECEIVED',
    'CANCELLED'
);


--
-- Name: RecurrenceType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."RecurrenceType" AS ENUM (
    'WEEKLY',
    'BIWEEKLY',
    'MONTHLY',
    'QUARTERLY',
    'SEMIANNUAL',
    'ANNUAL',
    'CUSTOM'
);


--
-- Name: StockInventoryStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."StockInventoryStatus" AS ENUM (
    'OPEN',
    'CLOSED'
);


--
-- Name: TransferStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TransferStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'COMPLETED'
);


--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UserRole" AS ENUM (
    'super_admin',
    'client_admin',
    'workshop_manager',
    'technician',
    'reader'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.account (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "accountId" text NOT NULL,
    "providerId" text NOT NULL,
    "userId" uuid NOT NULL,
    "accessToken" text,
    "refreshToken" text,
    "idToken" text,
    "accessTokenExpiresAt" timestamp with time zone,
    "refreshTokenExpiresAt" timestamp with time zone,
    scope text,
    password text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: invitation; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.invitation (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "organizationId" uuid NOT NULL,
    email text NOT NULL,
    role text,
    status text NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "inviterId" uuid NOT NULL
);


--
-- Name: jwks; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.jwks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "publicKey" text NOT NULL,
    "privateKey" text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "expiresAt" timestamp with time zone
);


--
-- Name: member; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.member (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "organizationId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    role text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL
);


--
-- Name: organization; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.organization (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    logo text,
    "createdAt" timestamp with time zone NOT NULL,
    metadata text
);


--
-- Name: project_config; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.project_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    endpoint_id text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    trusted_origins jsonb NOT NULL,
    social_providers jsonb NOT NULL,
    email_provider jsonb,
    email_and_password jsonb,
    allow_localhost boolean NOT NULL,
    plugin_configs jsonb,
    webhook_config jsonb
);


--
-- Name: session; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.session (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    token text NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "userId" uuid NOT NULL,
    "impersonatedBy" text,
    "activeOrganizationId" text
);


--
-- Name: user; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth."user" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    "emailVerified" boolean NOT NULL,
    image text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    role text,
    banned boolean,
    "banReason" text,
    "banExpires" timestamp with time zone
);


--
-- Name: verification; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.verification (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    identifier text NOT NULL,
    value text NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: account; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account (
    id text NOT NULL,
    "accountId" text NOT NULL,
    "providerId" text NOT NULL,
    "userId" text NOT NULL,
    "accessToken" text,
    "refreshToken" text,
    "idToken" text,
    "accessTokenExpiresAt" timestamp(3) without time zone,
    "refreshTokenExpiresAt" timestamp(3) without time zone,
    scope text,
    password text,
    "createdAt" timestamp(3) without time zone NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "userId" text NOT NULL,
    action text NOT NULL,
    "entityType" text NOT NULL,
    "entityId" text NOT NULL,
    "entityLabel" text NOT NULL,
    changes jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY public.audit_logs FORCE ROW LEVEL SECURITY;


--
-- Name: checklist_template_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.checklist_template_items (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "templateId" text NOT NULL,
    label text NOT NULL,
    "isRequired" boolean DEFAULT false NOT NULL,
    "position" integer DEFAULT 0 NOT NULL
);

ALTER TABLE ONLY public.checklist_template_items FORCE ROW LEVEL SECURITY;


--
-- Name: checklist_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.checklist_templates (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

ALTER TABLE ONLY public.checklist_templates FORCE ROW LEVEL SECURITY;


--
-- Name: custom_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.custom_reports (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "createdBy" text NOT NULL,
    name text NOT NULL,
    columns text[],
    filters jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: intervention_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.intervention_attachments (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "interventionId" text NOT NULL,
    "fileName" text NOT NULL,
    "storedName" text NOT NULL,
    "mimeType" text NOT NULL,
    "sizeBytes" integer NOT NULL,
    "uploadedBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY public.intervention_attachments FORCE ROW LEVEL SECURITY;


--
-- Name: intervention_checklist_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.intervention_checklist_items (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "checklistId" text NOT NULL,
    label text NOT NULL,
    "isRequired" boolean DEFAULT false NOT NULL,
    "isChecked" boolean DEFAULT false NOT NULL,
    "checkedAt" timestamp(3) without time zone,
    "checkedBy" text,
    "position" integer DEFAULT 0 NOT NULL
);

ALTER TABLE ONLY public.intervention_checklist_items FORCE ROW LEVEL SECURITY;


--
-- Name: intervention_checklists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.intervention_checklists (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "interventionId" text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY public.intervention_checklists FORCE ROW LEVEL SECURITY;


--
-- Name: intervention_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.intervention_notes (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "interventionId" text NOT NULL,
    "authorUserId" text NOT NULL,
    content text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY public.intervention_notes FORCE ROW LEVEL SECURITY;


--
-- Name: intervention_parts_used; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.intervention_parts_used (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "interventionId" text NOT NULL,
    "stockItemId" text NOT NULL,
    quantity integer NOT NULL,
    "usedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY public.intervention_parts_used FORCE ROW LEVEL SECURITY;


--
-- Name: intervention_planned_materials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.intervention_planned_materials (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "interventionId" text NOT NULL,
    "stockItemId" text NOT NULL,
    "quantityPlanned" integer DEFAULT 1 NOT NULL,
    note text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY public.intervention_planned_materials FORCE ROW LEVEL SECURITY;


--
-- Name: intervention_template_checklist_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.intervention_template_checklist_items (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "templateId" text NOT NULL,
    label text NOT NULL,
    "isRequired" boolean DEFAULT false NOT NULL,
    "position" integer DEFAULT 0 NOT NULL
);


--
-- Name: intervention_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.intervention_templates (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    description text,
    type public."InterventionType" DEFAULT 'PREVENTIVE'::public."InterventionType" NOT NULL,
    priority public."InterventionPriority" DEFAULT 'MEDIUM'::public."InterventionPriority" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: intervention_time_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.intervention_time_entries (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "interventionId" text NOT NULL,
    "userId" text NOT NULL,
    "startedAt" timestamp(3) without time zone NOT NULL,
    "endedAt" timestamp(3) without time zone,
    "durationMinutes" integer,
    note text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

ALTER TABLE ONLY public.intervention_time_entries FORCE ROW LEVEL SECURITY;


--
-- Name: interventions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.interventions (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "siteId" text NOT NULL,
    "machineId" text,
    "assignedUserId" text,
    title text NOT NULL,
    description text,
    type public."InterventionType" NOT NULL,
    priority public."InterventionPriority" DEFAULT 'MEDIUM'::public."InterventionPriority" NOT NULL,
    status public."InterventionStatus" DEFAULT 'OPEN'::public."InterventionStatus" NOT NULL,
    "scheduledAt" timestamp(3) without time zone,
    "startedAt" timestamp(3) without time zone,
    "closedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "recurrenceType" public."RecurrenceType",
    "recurrenceIntervalDays" integer,
    "parentInterventionId" text,
    "actualDurationMinutes" integer,
    "closingDiagnosis" text,
    "recurrenceEndsAt" timestamp(3) without time zone
);

ALTER TABLE ONLY public.interventions FORCE ROW LEVEL SECURITY;


--
-- Name: licenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.licenses (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "maxSites" integer DEFAULT 1 NOT NULL,
    "maxUsers" integer DEFAULT 5 NOT NULL,
    "billingPeriod" text DEFAULT 'monthly'::text NOT NULL,
    "renewsAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: machine_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.machine_attachments (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "machineId" text NOT NULL,
    "fileName" text NOT NULL,
    "storedName" text NOT NULL,
    "mimeType" text NOT NULL,
    "sizeBytes" integer NOT NULL,
    "uploadedBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY public.machine_attachments FORCE ROW LEVEL SECURITY;


--
-- Name: machine_components; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.machine_components (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "machineId" text NOT NULL,
    "parentId" text,
    name text NOT NULL,
    description text,
    quantity integer DEFAULT 1 NOT NULL,
    "stockItemId" text,
    "position" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

ALTER TABLE ONLY public.machine_components FORCE ROW LEVEL SECURITY;


--
-- Name: machine_counter_readings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.machine_counter_readings (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "counterId" text NOT NULL,
    value double precision NOT NULL,
    "recordedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "recordedBy" text NOT NULL,
    note text
);

ALTER TABLE ONLY public.machine_counter_readings FORCE ROW LEVEL SECURITY;


--
-- Name: machine_counters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.machine_counters (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "machineId" text NOT NULL,
    name text NOT NULL,
    unit text NOT NULL,
    "currentValue" double precision DEFAULT 0 NOT NULL,
    "thresholdValue" double precision,
    "thresholdInterval" double precision,
    "triggerTitle" text,
    "triggerDescription" text,
    "triggerPriority" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

ALTER TABLE ONLY public.machine_counters FORCE ROW LEVEL SECURITY;


--
-- Name: machines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.machines (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "siteId" text NOT NULL,
    name text NOT NULL,
    "serialNumber" text,
    category text,
    manufacturer text,
    model text,
    status public."MachineStatus" DEFAULT 'OPERATIONAL'::public."MachineStatus" NOT NULL,
    "qrCodeSlug" text NOT NULL,
    "installedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    notes text
);

ALTER TABLE ONLY public.machines FORCE ROW LEVEL SECURITY;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "userId" text NOT NULL,
    type public."NotificationType" NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    link text,
    "readAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY public.notifications FORCE ROW LEVEL SECURITY;


--
-- Name: purchase_order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_order_items (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "purchaseOrderId" text NOT NULL,
    "stockItemId" text NOT NULL,
    "quantityOrdered" integer NOT NULL,
    "unitPriceCents" integer DEFAULT 0 NOT NULL,
    "quantityReceived" integer DEFAULT 0 NOT NULL
);

ALTER TABLE ONLY public.purchase_order_items FORCE ROW LEVEL SECURITY;


--
-- Name: purchase_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_orders (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "siteId" text NOT NULL,
    "supplierId" text NOT NULL,
    status public."PurchaseOrderStatus" DEFAULT 'DRAFT'::public."PurchaseOrderStatus" NOT NULL,
    "expectedDeliveryDate" timestamp(3) without time zone,
    notes text,
    "createdBy" text NOT NULL,
    "approvedBy" text,
    "approvedAt" timestamp(3) without time zone,
    "receivedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

ALTER TABLE ONLY public.purchase_orders FORCE ROW LEVEL SECURITY;


--
-- Name: session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session (
    id text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    token text NOT NULL,
    "createdAt" timestamp(3) without time zone NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "userId" text NOT NULL
);


--
-- Name: sites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sites (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    address text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "floorPlanImage" text,
    "machinePins" jsonb
);

ALTER TABLE ONLY public.sites FORCE ROW LEVEL SECURITY;


--
-- Name: stock_inventory_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_inventory_items (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "sessionId" text NOT NULL,
    "stockItemId" text NOT NULL,
    "systemQuantity" integer NOT NULL,
    "countedQuantity" integer,
    note text
);

ALTER TABLE ONLY public.stock_inventory_items FORCE ROW LEVEL SECURITY;


--
-- Name: stock_inventory_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_inventory_sessions (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "siteId" text NOT NULL,
    status public."StockInventoryStatus" DEFAULT 'OPEN'::public."StockInventoryStatus" NOT NULL,
    "createdBy" text NOT NULL,
    "closedAt" timestamp(3) without time zone,
    "closedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY public.stock_inventory_sessions FORCE ROW LEVEL SECURITY;


--
-- Name: stock_item_suppliers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_item_suppliers (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "stockItemId" text NOT NULL,
    "supplierId" text NOT NULL,
    "supplierReference" text,
    "purchasePriceCents" integer DEFAULT 0 NOT NULL,
    "leadTimeDays" integer
);

ALTER TABLE ONLY public.stock_item_suppliers FORCE ROW LEVEL SECURITY;


--
-- Name: stock_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_items (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "siteId" text NOT NULL,
    reference text NOT NULL,
    name text NOT NULL,
    unit text DEFAULT 'pièce'::text NOT NULL,
    "quantityOnHand" integer DEFAULT 0 NOT NULL,
    "minimumLevel" integer DEFAULT 0 NOT NULL,
    "unitCostCents" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "machineId" text
);

ALTER TABLE ONLY public.stock_items FORCE ROW LEVEL SECURITY;


--
-- Name: stock_movements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_movements (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "stockItemId" text NOT NULL,
    type public."MovementType" NOT NULL,
    quantity integer NOT NULL,
    reason text,
    "operatorId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "cancelledAt" timestamp(3) without time zone,
    "cancelledBy" text,
    "cancelReason" text
);

ALTER TABLE ONLY public.stock_movements FORCE ROW LEVEL SECURITY;


--
-- Name: stock_transfer_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_transfer_requests (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "fromSiteId" text NOT NULL,
    "toSiteId" text NOT NULL,
    "stockItemId" text NOT NULL,
    quantity integer NOT NULL,
    status public."TransferStatus" DEFAULT 'PENDING'::public."TransferStatus" NOT NULL,
    "requestedById" text NOT NULL,
    "approvedById" text,
    reason text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "resolvedAt" timestamp(3) without time zone
);

ALTER TABLE ONLY public.stock_transfer_requests FORCE ROW LEVEL SECURITY;


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suppliers (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    email text,
    phone text
);

ALTER TABLE ONLY public.suppliers FORCE ROW LEVEL SECURITY;


--
-- Name: tenant_modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_modules (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    module public."ModuleName" NOT NULL,
    "isActive" boolean DEFAULT false NOT NULL,
    "activatedAt" timestamp(3) without time zone
);


--
-- Name: tenant_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_roles (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    permissions text[],
    "isSystem" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

ALTER TABLE ONLY public.tenant_roles FORCE ROW LEVEL SECURITY;


--
-- Name: tenant_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_users (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "authUserId" text NOT NULL,
    role public."UserRole" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "tenantRoleId" text,
    "jobTitle" text,
    "managerId" text
);

ALTER TABLE ONLY public.tenant_users FORCE ROW LEVEL SECURITY;


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenants (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."user" (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    "emailVerified" boolean NOT NULL,
    image text,
    "createdAt" timestamp(3) without time zone NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "tenantId" text,
    "mustChangePassword" boolean DEFAULT false NOT NULL
);


--
-- Name: user_sites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_sites (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "tenantUserId" text NOT NULL,
    "siteId" text NOT NULL,
    "assignedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY public.user_sites FORCE ROW LEVEL SECURITY;


--
-- Name: verification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verification (
    id text NOT NULL,
    identifier text NOT NULL,
    value text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone,
    "updatedAt" timestamp(3) without time zone
);


--
-- Data for Name: account; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.account (id, "accountId", "providerId", "userId", "accessToken", "refreshToken", "idToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", scope, password, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: invitation; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.invitation (id, "organizationId", email, role, status, "expiresAt", "createdAt", "inviterId") FROM stdin;
\.


--
-- Data for Name: jwks; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.jwks (id, "publicKey", "privateKey", "createdAt", "expiresAt") FROM stdin;
\.


--
-- Data for Name: member; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.member (id, "organizationId", "userId", role, "createdAt") FROM stdin;
\.


--
-- Data for Name: organization; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.organization (id, name, slug, logo, "createdAt", metadata) FROM stdin;
\.


--
-- Data for Name: project_config; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.project_config (id, name, endpoint_id, created_at, updated_at, trusted_origins, social_providers, email_provider, email_and_password, allow_localhost, plugin_configs, webhook_config) FROM stdin;
cd8d0bfa-d17a-4fa0-bfef-9248c92180a3	gmao-saas	ep-young-thunder-aloyemd5	2026-02-25 16:37:33.683+00	2026-02-25 16:37:33.683+00	[]	[{"id": "google", "isShared": true}]	{"type": "shared"}	{"enabled": true, "disableSignUp": false, "emailVerificationMethod": "otp", "requireEmailVerification": false, "autoSignInAfterVerification": true, "sendVerificationEmailOnSignIn": false, "sendVerificationEmailOnSignUp": false}	t	{"organization": {"config": {"creatorRole": "owner", "organizationLimit": 1, "allowUserToCreateOrganization": true}, "enabled": true}}	{"enabled": false, "enabledEvents": [], "timeoutSeconds": 5}
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.session (id, "expiresAt", token, "createdAt", "updatedAt", "ipAddress", "userAgent", "userId", "impersonatedBy", "activeOrganizationId") FROM stdin;
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth."user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt", role, banned, "banReason", "banExpires") FROM stdin;
\.


--
-- Data for Name: verification; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.verification (id, identifier, value, "expiresAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
d6a4c07e-4cb3-456c-98dd-601886f8008e	98ce7dd8b8a64ea994ca6a54030c7735c64f1c0ce49593685cbf4b35d24cb951	2026-02-25 16:41:40.450823+00	20260225164139_init	\N	\N	2026-02-25 16:41:39.202083+00	1
9917653a-0bc4-4d1a-9ae2-940a43bf9023	d0eccc8ffaac7512533044f90b42ed2d96e0a9a7c66361ace471425707361144	2026-02-25 17:50:14.560072+00	20260225175014_add_better_auth_tables	\N	\N	2026-02-25 17:50:14.299024+00	1
4f9d39d9-c6a9-48d4-9faf-25d479b68dd9	2138dafc69a131b94539ae46f4ae1cf2a831a646ed2206c9ebac0c50dd579250	2026-03-01 19:51:53.229186+00	20260301195152_add_intervention_attachments_timelog_checklists	\N	\N	2026-03-01 19:51:52.784632+00	1
d70938a4-6654-4486-97c6-35d05cce7dc0	57afc5ace54b7cbe2cabe27a2b127f15e043cd402b84cfd03cbee6c490289408	2026-02-25 20:27:36.302095+00	20260225202735_add_tenant_roles_must_change_password	\N	\N	2026-02-25 20:27:36.059718+00	1
60cc76a9-cacd-4522-bd56-3446c6876c9f	bda70880fea1d64573e08f2c800a080c0e8e6bc24f3f62b52265284e227afea3	2026-02-26 15:56:11.255534+00	20260226155610_add_planned_materials_machine_parts_hierarchy	\N	\N	2026-02-26 15:56:10.991241+00	1
880ea6e4-1140-42a9-97b2-f98fc7142d12	93f477c384b14f38eb6cb4dbe5dc9ef61533afc9a2917328b25d66a181c41b79	2026-02-26 19:50:50.363317+00	20260226195050_add_notifications	\N	\N	2026-02-26 19:50:50.196564+00	1
837dc714-ce6d-491e-b178-c491790543ae	561a89422867c7a1e05391de94ccf1f0d83f7352f6bd453763b0bdb70206ca73	2026-03-01 21:06:16.240346+00	20260301210000_add_intervention_templates	\N	\N	2026-03-01 21:06:15.295531+00	1
aa9788ac-ca07-4064-8a2f-f7ceac1a4e98	217392d7e666798f50ceb96a839de3731b359b4e4fd860c1d6de90f1037d39ae	2026-02-26 20:05:37.524622+00	20260226200537_add_transfer_relations	\N	\N	2026-02-26 20:05:37.375894+00	1
82d48d88-f3ce-4ecf-b0ea-936c6eaf9686	6492b8a81260ca1660b35805b95cf55fdcff5de98be5e312e0a062fc3c9f5aea	2026-02-26 20:27:27.961501+00	20260226202727_add_audit_log	\N	\N	2026-02-26 20:27:27.793253+00	1
dd20f8a3-6206-4035-9378-6d7f716cf331	40c2f7e7e2715372a166896aff545a17a425081f20ac0517150bafea9c845813	2026-02-26 20:30:44.968462+00	20260226203044_add_closing_fields	\N	\N	2026-02-26 20:30:44.874531+00	1
c14e43e9-49c3-4e63-8744-9d6c047c74d6	50050cddeb20830969be6f436e79774c74cb542e262c4a1ac7f8b9683edf8c28	2026-03-01 21:48:15.031829+00	20260302000000_add_suppliers	\N	\N	2026-03-01 21:48:14.863555+00	1
3b69b91d-1b56-47e3-b5f6-f9dee1aea004	c7c8b270399d035489ab8ab250f3fca4f074d21cced6cb34f2a100cba118b7d6	2026-02-26 21:08:39.310514+00	20260226210839_add_recurrence_ends_at	\N	\N	2026-02-26 21:08:39.21206+00	1
43f870cc-2ce6-4dbc-9ee4-c27cc3ff9a48	18d3285bd98f1e56c28d458ad6fbec9fff568e67ba3f8d7db21da4c7eca4173f	2026-03-01 19:10:24.08549+00	20260301191023_add_machine_notes	\N	\N	2026-03-01 19:10:23.987731+00	1
737addb6-f705-4eb9-8c34-e0d73d9521ab	5bc64520da9b18934f739275e7b2ab66be9cc4716e7c0e8159425ea755ef585c	2026-03-01 19:21:54.383087+00	20260301192154_add_machine_attachments	\N	\N	2026-03-01 19:21:54.230733+00	1
33f8b06f-757d-4dc1-b671-0fbd26d77b83	79d32484a386c0fdc9e018cb0bab59983f57f110052fd2d4406b6c43048074b5	2026-03-01 21:48:15.19499+00	20260302100000_add_stock_inventory	\N	\N	2026-03-01 21:48:15.0467+00	1
194c52b4-0c66-45de-afd6-f3c3941e2048	982c76db94428c43c1a3ae28ed2f61f883fe5a250c62c7fcf9f1324eb47686a3	2026-03-01 19:30:06.117075+00	20260301193005_add_machine_counters	\N	\N	2026-03-01 19:30:05.891322+00	1
796a5d5f-4b7b-4cb1-bb27-c398138a3647	8b6d476ddc39bfa98e81dfd293982f66cd2ef722be1d9463400326e7117438d5	2026-03-01 19:41:31.334923+00	20260301194131_add_machine_components	\N	\N	2026-03-01 19:41:31.112988+00	1
85e9b581-3f4a-457f-bcb6-1142c5563573	339d938632134d755fc3a0af41616a5ffd8fd83112a776670a158093adb03dc6	2026-03-01 21:48:15.262857+00	20260302110000_add_movement_cancellation	\N	\N	2026-03-01 21:48:15.209838+00	1
65bf7afb-dd94-46c4-9a8e-4328dbcde2f9	a490c7df2e320c9350d334d9a0e391892fef3ddcfe2a55700339c5c59765e133	2026-03-01 22:20:43.811227+00	20260302200000_add_purchase_orders	\N	\N	2026-03-01 22:20:43.663964+00	1
e1ac29d3-1e95-4c4e-a9f0-7ab4236d8e97	8a6652650f9d39204cee8ced2bdb647ff625870303af8c268642aa6be6cbde5a	2026-03-01 22:40:39.109587+00	20260302300000_add_custom_reports	\N	\N	2026-03-01 22:40:39.020948+00	1
fcdae291-b075-48e0-a309-b0b832729956	806b444381629fef99183b0cca12dcf965aff1d9988a64a6784570441251bd4b	2026-03-02 16:13:42.999839+00	20260302161342_add_site_floor_plan	\N	\N	2026-03-02 16:13:42.884553+00	1
\.


--
-- Data for Name: account; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.account (id, "accountId", "providerId", "userId", "accessToken", "refreshToken", "idToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", scope, password, "createdAt", "updatedAt") FROM stdin;
WQpJ4BdkC14E8PCzfLDvOw2VX4h7WXRq	m9GPASkivF4pLVqBkJwn1Imze6w8f7aw	credential	m9GPASkivF4pLVqBkJwn1Imze6w8f7aw	\N	\N	\N	\N	\N	\N	28cd2b2c22e09547bcd57ed9ba4c9733:05a301309804a7748705c654497feb6de2d0dce67c2b582111d961f335466e6aa36f037cf75e00a68f2a35b0d05b8b9387c82e76bf3790d76973729a7d8c417a	2026-02-25 17:57:01.511	2026-02-25 17:57:01.511
znU1IInGJq5KufFbLBiy2LFlG8vXg16v	oigEDBSRaRUSScAcdrTRktVoWDJSXk8G	credential	oigEDBSRaRUSScAcdrTRktVoWDJSXk8G	\N	\N	\N	\N	\N	\N	d4309f0e8b953618a7d582ef04395260:ec9a413944d64a49171898375805dea3190624137cbabe3f7dda47e1f89ade016bc3410d874878986541a92ad447b183345020e677ac27961c3eacf84bb8f722	2026-02-25 20:12:38.288	2026-02-25 20:12:38.288
aOnF80FHLDuLhznYiJHv0RMRw8wskheN	4uIzbcv0rXIIJbjQW7E60vu2mZQgPdIN	credential	4uIzbcv0rXIIJbjQW7E60vu2mZQgPdIN	\N	\N	\N	\N	\N	\N	0fbabed82a3c7c78807e70d705135998:e1534cb0d44e9f29346decf47d8738521412e46e151ab59fbc042b7fb54daeb9ced74f34be7e36e66973e40134f06efcbe606660bd17128aa66e9aae1c13579d	2026-02-25 20:44:28.725	2026-02-25 20:45:45.366
7T3UVbB4AThZ08GB3jwTTo36rnyHPNsX	ORbxIiqUaJxxrNPpFBOWVeB3ovc17lb6	credential	ORbxIiqUaJxxrNPpFBOWVeB3ovc17lb6	\N	\N	\N	\N	\N	\N	80b16ea6ddfa38550c9af706b3ea1cf4:800027ce63edb657ee4daa0dfbb4b0482e785a0292ebb82eff2dcc7e96de09ad93fe041688fbf59d84d5bcff19af65f7ebc6ae4735a353ed771297c62c7cb9aa	2026-02-28 14:48:28.934	2026-02-28 14:48:28.934
Lp4E8Jn8Ev50GIREVETOXHNt90ngTbAk	3u91OIZmLtz0O5rD2b6BUwQW5XISptsm	credential	3u91OIZmLtz0O5rD2b6BUwQW5XISptsm	\N	\N	\N	\N	\N	\N	a75b60a75c6e5212bc58a44762409814:2a75d68ec36d5278ecb3d6134661159f32a6bfcdc5b4480ef95c7f09dc47429abe0f72dac168784bed60c5707abd01f05f45400827cd4f1b2bff3488d72a1c28	2026-03-02 16:36:25.702	2026-03-02 16:36:25.702
hmoJHAyDf7FHYRxcEzF2vQfVssh1FMah	V24wMy55vpIIcAhPh9i7Uwc4v2vQBqsc	credential	V24wMy55vpIIcAhPh9i7Uwc4v2vQBqsc	\N	\N	\N	\N	\N	\N	c4b915fa05aeb432bb10d51a225a9a8e:2053096be2b7e684d8b006bc837206f624fa20e0b618e32bdd67b77c51c8610c2d81a977d1eba7339ed3eeed40a3b22358413424208cbf75ac16500463afd68b	2026-03-02 16:36:27.603	2026-03-02 16:36:27.603
9Zjx4LIBfaKp5WFpava4ehFvweUkE23Z	O9VyiUjeIVzV4eUpwONZ47gX7QlD2Esl	credential	O9VyiUjeIVzV4eUpwONZ47gX7QlD2Esl	\N	\N	\N	\N	\N	\N	3f7f2c9b82ce1005608581f191fb3c75:33ad244eeb2e91850b33d6a0d987db661bea2d3c24b11e17de2f5b43924e41233b4d497d8f65378699cff6756a0e2409ab41a1ead3fa2e968cb774dd90b1d41e	2026-03-02 16:36:29.485	2026-03-02 16:36:29.485
mbLt7i9uaQxst8X9cjqsltfOEPSgUyt0	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	credential	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	\N	\N	\N	\N	\N	\N	8e6053a7b2e651f35071c8b624ecb60b:44fcb87188a7b1c8246fc690e950e975657ca02731e249bcf7c822499b1e16c143aa3c4faae49144396c0e0e4a016ffd505a660b530cf3c19db2c8bb91bf0d7d	2026-03-02 16:36:31.348	2026-03-02 16:36:31.348
G6lWSmHi8cVyNrv7jgKZXWmX6XhWwSk2	VRC1ECVA7MOwxjlQfjMYsuyzuWWmIc90	credential	VRC1ECVA7MOwxjlQfjMYsuyzuWWmIc90	\N	\N	\N	\N	\N	\N	06bb2e167e3d50e02f546248796e1316:11058781ab8f8c34297f22696f21c735fa5865753279da85193999064f2ecc31b605c793c2b72b13bc3853c689ae48a4d41cb6cb901bb3078c48a31fe28cc8d4	2026-03-02 16:36:33.209	2026-03-02 16:36:33.209
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, "tenantId", "userId", action, "entityType", "entityId", "entityLabel", changes, "createdAt") FROM stdin;
cmm8aggax0002dojxknwullft	cmm2h12430000m0vt2y472aho	oigEDBSRaRUSScAcdrTRktVoWDJSXk8G	machine.created	machine	cmm8aggan0000dojxtfogg95u	Presse	\N	2026-03-01 21:55:14.697
\.


--
-- Data for Name: checklist_template_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.checklist_template_items (id, "tenantId", "templateId", label, "isRequired", "position") FROM stdin;
cmm8b5six000bdojxbdk3crlt	cmm2h12430000m0vt2y472aho	cmm8b5sip000adojx20sby6n6	saleté	t	0
cmm8b5six000cdojx7z8jpsz8	cmm2h12430000m0vt2y472aho	cmm8b5sip000adojx20sby6n6	jsp	f	1
\.


--
-- Data for Name: checklist_templates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.checklist_templates (id, "tenantId", name, "createdAt", "updatedAt") FROM stdin;
cmm8b5sip000adojx20sby6n6	cmm2h12430000m0vt2y472aho	Nettoyage presse	2026-03-01 22:14:56.929	2026-03-01 22:14:56.929
\.


--
-- Data for Name: custom_reports; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.custom_reports (id, "tenantId", "createdBy", name, columns, filters, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: intervention_attachments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.intervention_attachments (id, "tenantId", "interventionId", "fileName", "storedName", "mimeType", "sizeBytes", "uploadedBy", "createdAt") FROM stdin;
cmm8b72y6000hdojx1o3axg9r	cmm2h12430000m0vt2y472aho	cmm3rv8bt0007u8vtcjckg7u5	grass.jpg	5d4995c3-0804-4974-a9c9-b187dad8b6a5.jpg	image/jpeg	41901	oigEDBSRaRUSScAcdrTRktVoWDJSXk8G	2026-03-01 22:15:57.102
\.


--
-- Data for Name: intervention_checklist_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.intervention_checklist_items (id, "tenantId", "checklistId", label, "isRequired", "isChecked", "checkedAt", "checkedBy", "position") FROM stdin;
cmm8b664q000fdojxs1resas2	cmm2h12430000m0vt2y472aho	cmm8b664h000ddojx329yyapw	jsp	f	f	\N	\N	1
cmm8b664q000edojxsut9e7w4	cmm2h12430000m0vt2y472aho	cmm8b664h000ddojx329yyapw	saleté	t	t	2026-03-01 22:15:20.057	oigEDBSRaRUSScAcdrTRktVoWDJSXk8G	0
\.


--
-- Data for Name: intervention_checklists; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.intervention_checklists (id, "tenantId", "interventionId", name, "createdAt") FROM stdin;
cmm8b664h000ddojx329yyapw	cmm2h12430000m0vt2y472aho	cmm3rv8bt0007u8vtcjckg7u5	Nettoyage presse	2026-03-01 22:15:14.561
\.


--
-- Data for Name: intervention_notes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.intervention_notes (id, "tenantId", "interventionId", "authorUserId", content, "createdAt") FROM stdin;
cmm8b7iwx000idojxvnjm54l3	cmm2h12430000m0vt2y472aho	cmm3rv8bt0007u8vtcjckg7u5	oigEDBSRaRUSScAcdrTRktVoWDJSXk8G	erreverv	2026-03-01 22:16:17.793
cmm8b7ksv000jdojxwlexsypl	cmm2h12430000m0vt2y472aho	cmm3rv8bt0007u8vtcjckg7u5	oigEDBSRaRUSScAcdrTRktVoWDJSXk8G	gergerger	2026-03-01 22:16:20.239
cmm9eiiex002de0vtm74e6rfi	cmm9ei9dm0000e0vt0xumg96e	int-demo-prev-001	O9VyiUjeIVzV4eUpwONZ47gX7QlD2Esl	Intervention réalisée dans les temps. Aucune fuite détectée sur les raccords.	2025-12-07 16:36:35.366
cmm9eiiex002ee0vtxvwuzlxe	cmm9ei9dm0000e0vt0xumg96e	int-demo-prev-001	V24wMy55vpIIcAhPh9i7Uwc4v2vQBqsc	Bon travail. Penser à commander de l'huile pour le prochain mois.	2025-12-08 16:36:35.366
cmm9eiijh002ge0vtvcrdw803	cmm9ei9dm0000e0vt0xumg96e	int-demo-prev-002	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	Jeu axe Z mesuré à 0.08mm (normal < 0.05mm). Signalé à la supervision.	2025-12-10 16:36:35.529
cmm9eiiqm002je0vte8q10wgo	cmm9ei9dm0000e0vt0xumg96e	int-demo-prev-004	O9VyiUjeIVzV4eUpwONZ47gX7QlD2Esl	Cache-courroie fissuré côté moteur. Remplacement immédiat effectué.	2026-01-01 16:36:35.786
cmm9eiiqm002ke0vtf7fcf7dq	cmm9ei9dm0000e0vt0xumg96e	int-demo-prev-004	3u91OIZmLtz0O5rD2b6BUwQW5XISptsm	Rapport de conformité archivé. Prochaine inspection dans 6 mois.	2026-01-02 16:36:35.786
cmm9eij1m002oe0vt38d735pa	cmm9ei9dm0000e0vt0xumg96e	int-demo-prev-008	O9VyiUjeIVzV4eUpwONZ47gX7QlD2Esl	Particules métalliques détectées dans l'huile ancienne. Possible début d'usure interne. Échantillon envoyé pour analyse lab.	2026-02-05 16:36:36.182
cmm9eij1m002pe0vt0s88qyiw	cmm9ei9dm0000e0vt0xumg96e	int-demo-prev-008	V24wMy55vpIIcAhPh9i7Uwc4v2vQBqsc	Analyse commandée. Maintien surveillance hebdomadaire pression circuit.	2026-02-06 16:36:36.182
cmm9eij5y002se0vtobqf6ge9	cmm9ei9dm0000e0vt0xumg96e	int-demo-corr-001	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	Démontage guide linéaire : roulement côté moteur éclaté. Roulement côté opposé présentait des piqûres. Remplacement des 2.	2025-12-22 16:36:36.339
cmm9eij5y002te0vt9bz21geu	cmm9ei9dm0000e0vt0xumg96e	int-demo-corr-001	V24wMy55vpIIcAhPh9i7Uwc4v2vQBqsc	Machine remise en service après test 30mn. Bruit disparu. Consigner l'événement dans le registre maintenance.	2025-12-23 16:36:36.339
cmm9eijae002ve0vtgpvwakz4	cmm9ei9dm0000e0vt0xumg96e	int-demo-corr-002	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	Joint plat d'origine durci et fissuré (âge > 5 ans). Remplacement complet des joints carter.	2026-01-16 16:36:36.499
cmm9eijeu002xe0vtsmhta1hl	cmm9ei9dm0000e0vt0xumg96e	int-demo-corr-003	O9VyiUjeIVzV4eUpwONZ47gX7QlD2Esl	Rupture franche — surcharge possible. Vérifier charge transportée avec le responsable atelier.	2026-01-23 16:36:36.66
cmm9eijeu002ye0vtje166s2j	cmm9ei9dm0000e0vt0xumg96e	int-demo-corr-003	3u91OIZmLtz0O5rD2b6BUwQW5XISptsm	Enquête en cours sur la cause de surcharge. Convoyeur OK pour production. Surveiller tendeur.	2026-01-24 16:36:36.66
cmm9eijjb0030e0vt45lpgs5z	cmm9ei9dm0000e0vt0xumg96e	int-demo-corr-004	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	Galet presseur plat — usure normale après 2 ans. Pièce commandée en stock de sécurité.	2026-01-31 16:36:36.819
cmm9eijm00031e0vtywxeydmn	cmm9ei9dm0000e0vt0xumg96e	int-demo-corr-005	O9VyiUjeIVzV4eUpwONZ47gX7QlD2Esl	Diagnostic initial : roulements de broche suspects. Démontage broche en cours. Pièces de remplacement en commande (BC-2024-002).	2026-02-25 16:36:36.918
cmm9eijm00032e0vtzjdxb6d0	cmm9ei9dm0000e0vt0xumg96e	int-demo-corr-005	V24wMy55vpIIcAhPh9i7Uwc4v2vQBqsc	BC envoyée chez Festo. Délai estimé 14 jours. Machine hors service pendant ce temps.	2026-02-26 16:36:36.918
cmm9eijs60033e0vtnm2n01jd	cmm9ei9dm0000e0vt0xumg96e	int-demo-corr-006	3u91OIZmLtz0O5rD2b6BUwQW5XISptsm	Alarme survenue à 08h42. Compresseur arrêté automatiquement. Ventilation vérifiée — filtre air à regarder. Technicien à assigner.	2026-03-01 16:36:37.139
cmm9eijv40034e0vthjneovg1	cmm9ei9dm0000e0vt0xumg96e	int-demo-corr-007	O9VyiUjeIVzV4eUpwONZ47gX7QlD2Esl	Roulement de rouleau de tête à remplacer. Stock insuffisant — 0 roulements 6205 en stock. BC en préparation.	2026-02-27 16:36:37.244
cmm9eijv40035e0vt54c4g6jh	cmm9ei9dm0000e0vt0xumg96e	int-demo-corr-007	O9VyiUjeIVzV4eUpwONZ47gX7QlD2Esl	BC-003 créée. En attente livraison (5 jours délai).	2026-02-28 16:36:37.244
\.


--
-- Data for Name: intervention_parts_used; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.intervention_parts_used (id, "tenantId", "interventionId", "stockItemId", quantity, "usedAt") FROM stdin;
cmm3p2y410000u8vtnbs0wm56	cmm2h12430000m0vt2y472aho	cmm2ih1y40004wkvtxwrbvu7e	cmm2ie5090002wkvtuh8rjhu1	2	2026-02-26 16:45:47.953
cmm9eiigm002fe0vt61gn1nz8	cmm9ei9dm0000e0vt0xumg96e	int-demo-prev-001	cmm9eih7j000ye0vto0xwxxec	15	2025-12-07 16:36:35.319
cmm9eiil2002he0vt7j52182r	cmm9ei9dm0000e0vt0xumg96e	int-demo-prev-002	cmm9eihap0012e0vtp8uorfo6	1	2025-12-10 16:36:35.487
cmm9eiint002ie0vtyieo66l4	cmm9ei9dm0000e0vt0xumg96e	int-demo-prev-003	cmm9eih7j000xe0vt8wwdlu2a	1	2025-12-17 16:36:35.645
cmm9eiitd002le0vtwv63z45h	cmm9ei9dm0000e0vt0xumg96e	int-demo-prev-005	cmm9eih7j000ye0vto0xwxxec	10	2026-01-06 16:36:35.845
cmm9eiiw4002me0vt9uxbc2jv	cmm9ei9dm0000e0vt0xumg96e	int-demo-prev-006	cmm9eih7k000ze0vttb44edyq	2	2026-01-11 16:36:35.944
cmm9eiiyv002ne0vtujcpfjb9	cmm9ei9dm0000e0vt0xumg96e	int-demo-prev-007	cmm9eihap0012e0vtp8uorfo6	1	2026-01-09 16:36:36.044
cmm9eij37002qe0vtejgwz8ks	cmm9ei9dm0000e0vt0xumg96e	int-demo-prev-008	cmm9eih7j000ye0vto0xwxxec	15	2026-02-05 16:36:36.142
cmm9eij37002re0vto1r4rqke	cmm9ei9dm0000e0vt0xumg96e	int-demo-prev-008	cmm9eih7j000we0vth07m7mdx	3	2026-02-05 16:36:36.142
cmm9eij7j002ue0vtehqg99m3	cmm9ei9dm0000e0vt0xumg96e	int-demo-corr-001	cmm9eih7i000ve0vtn3c07qdq	2	2025-12-23 16:36:36.298
cmm9eijc1002we0vt5zb5j92h	cmm9ei9dm0000e0vt0xumg96e	int-demo-corr-002	cmm9eih7j000we0vth07m7mdx	5	2026-01-16 16:36:36.455
cmm9eijgf002ze0vt7356s5tl	cmm9ei9dm0000e0vt0xumg96e	int-demo-corr-003	cmm9eih7i000te0vtvlpxdjba	2	2026-01-23 16:36:36.617
\.


--
-- Data for Name: intervention_planned_materials; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.intervention_planned_materials (id, "tenantId", "interventionId", "stockItemId", "quantityPlanned", note, "createdAt") FROM stdin;
cmm3rtx610006u8vt5wal4x3m	cmm2h12430000m0vt2y472aho	cmm2ih1y40004wkvtxwrbvu7e	cmm3rtjc00003u8vtegkq15an	3	\N	2026-02-26 18:02:45.673
\.


--
-- Data for Name: intervention_template_checklist_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.intervention_template_checklist_items (id, "tenantId", "templateId", label, "isRequired", "position") FROM stdin;
\.


--
-- Data for Name: intervention_templates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.intervention_templates (id, "tenantId", name, description, type, priority, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: intervention_time_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.intervention_time_entries (id, "tenantId", "interventionId", "userId", "startedAt", "endedAt", "durationMinutes", note, "createdAt", "updatedAt") FROM stdin;
cmm8b6kuy000gdojx6au77thd	cmm2h12430000m0vt2y472aho	cmm3rv8bt0007u8vtcjckg7u5	oigEDBSRaRUSScAcdrTRktVoWDJSXk8G	2026-03-01 22:15:33.658	2026-03-01 22:15:48.703	0	\N	2026-03-01 22:15:33.658	2026-03-01 22:15:48.703
\.


--
-- Data for Name: interventions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.interventions (id, "tenantId", "siteId", "machineId", "assignedUserId", title, description, type, priority, status, "scheduledAt", "startedAt", "closedAt", "createdAt", "updatedAt", "recurrenceType", "recurrenceIntervalDays", "parentInterventionId", "actualDurationMinutes", "closingDiagnosis", "recurrenceEndsAt") FROM stdin;
cmm2ih1y40004wkvtxwrbvu7e	cmm2h12430000m0vt2y472aho	cmm2h12780007m0vt4nfhqp6j	\N	4uIzbcv0rXIIJbjQW7E60vu2mZQgPdIN	Graissage vibreur	graisser les vibreurs lors qu'ils sont à l'arret	PREVENTIVE	HIGH	CLOSED	2026-02-22 23:00:00	2026-02-26 16:36:22.292	2026-02-26 18:03:46.766	2026-02-25 20:53:02.62	2026-02-26 18:03:46.768	WEEKLY	\N	\N	\N	\N	\N
cmm3rv8bt0007u8vtcjckg7u5	cmm2h12430000m0vt2y472aho	cmm2h12780007m0vt4nfhqp6j	\N	4uIzbcv0rXIIJbjQW7E60vu2mZQgPdIN	Graissage vibreur	graisser les vibreurs lors qu'ils sont à l'arret	PREVENTIVE	HIGH	OPEN	2026-03-01 23:00:00	\N	\N	2026-02-26 18:03:46.793	2026-02-26 18:03:46.793	WEEKLY	\N	cmm2ih1y40004wkvtxwrbvu7e	\N	\N	\N
cmm3u21hz0000lsvt9ogdrgsp	cmm2h12430000m0vt2y472aho	cmm2h12780007m0vt4nfhqp6j	\N	4uIzbcv0rXIIJbjQW7E60vu2mZQgPdIN	regerer	gergrerge	PREVENTIVE	MEDIUM	OPEN	2026-02-26 19:04:00	\N	\N	2026-02-26 19:05:03.767	2026-03-01 22:16:31.818	WEEKLY	\N	\N	\N	\N	\N
int-demo-prev-001	cmm9ei9dm0000e0vt0xumg96e	site-demo-a	cmm9eigvr000le0vtkc6q6lx0	O9VyiUjeIVzV4eUpwONZ47gX7QlD2Esl	Vidange hydraulique — PH-100 (mensuelle)	Vidange complète du circuit hydraulique, remplacement huile ISO VG 46. Vérifier niveau huile, pression, fuites.	PREVENTIVE	MEDIUM	CLOSED	2025-12-07 16:36:35.319	2025-12-07 16:36:35.319	2025-12-07 16:36:35.319	2025-12-02 16:36:35.319	2025-12-07 16:36:35.319	MONTHLY	\N	\N	90	Vidange effectuée sans anomalie. Huile ancienne en bon état. Niveau remis à neuf.	2026-12-31 00:00:00
int-demo-prev-002	cmm9ei9dm0000e0vt0xumg96e	site-demo-a	cmm9eigzo000pe0vtq7k7y7wv	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	Graissage et vérification tour CNC (mensuel)	Graissage points de lubrification, vérification fixations, contrôle jeu sur axes X/Y/Z.	PREVENTIVE	MEDIUM	CLOSED	2025-12-10 16:36:35.487	2025-12-10 16:36:35.487	2025-12-10 16:36:35.487	2025-12-07 16:36:35.487	2025-12-10 16:36:35.487	MONTHLY	\N	\N	45	Graissage complet. Jeu axe Z légèrement augmenté — à surveiller au prochain entretien.	\N
int-demo-prev-003	cmm9ei9dm0000e0vt0xumg96e	site-demo-a	cmm9eigzk000me0vtgs9sjizj	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	Remplacement filtre à air CA-75	Remplacement filtre air compresseur Atlas Copco GA75. Nettoyage séparateur d'huile.	PREVENTIVE	LOW	CLOSED	2025-12-17 16:36:35.645	2025-12-17 16:36:35.645	2025-12-17 16:36:35.645	2025-12-14 16:36:35.645	2025-12-17 16:36:35.645	QUARTERLY	\N	\N	30	Filtre remplacé. Pression de service stable à 8 bars. Pas de fuite détectée.	\N
int-demo-prev-004	cmm9ei9dm0000e0vt0xumg96e	site-demo-a	cmm9eigvr000le0vtkc6q6lx0	O9VyiUjeIVzV4eUpwONZ47gX7QlD2Esl	Inspection sécurité presse PH-100	Vérification arrêt d'urgence, protecteurs, carters, circuit hydraulique visible. Test pression nominale.	INSPECTION	HIGH	CLOSED	2026-01-01 16:36:35.743	2026-01-01 16:36:35.743	2026-01-01 16:36:35.743	2025-12-27 16:36:35.743	2026-01-01 16:36:35.743	\N	\N	\N	120	Inspection conforme. Un cache-courroie présente une fissure — remplacé à titre préventif. Rapport de conformité établi.	\N
int-demo-prev-005	cmm9ei9dm0000e0vt0xumg96e	site-demo-a	cmm9eigvr000le0vtkc6q6lx0	O9VyiUjeIVzV4eUpwONZ47gX7QlD2Esl	Vidange hydraulique — PH-100 (mensuelle)	Vidange complète du circuit hydraulique, remplacement huile ISO VG 46.	PREVENTIVE	MEDIUM	CLOSED	2026-01-06 16:36:35.845	2026-01-06 16:36:35.845	2026-01-06 16:36:35.845	2026-01-03 16:36:35.845	2026-01-06 16:36:35.845	MONTHLY	\N	int-demo-prev-001	85	Vidange OK. Légère coloration de l'huile ancienne — normale pour machine en production.	2026-12-31 00:00:00
int-demo-prev-006	cmm9ei9dm0000e0vt0xumg96e	site-demo-a	cmm9eih08000qe0vt4cszrweh	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	Vérification tension courroies et bande convoyeur	Contrôle tension bande transporteuse, vérification rouleaux, graissage paliers.	PREVENTIVE	MEDIUM	CLOSED	2026-01-11 16:36:35.944	2026-01-11 16:36:35.944	2026-01-11 16:36:35.944	2026-01-09 16:36:35.944	2026-01-11 16:36:35.944	MONTHLY	\N	\N	60	Tension OK. 2 roulements de reprise remplacés (signes d'usure). Bande en bon état.	\N
int-demo-prev-007	cmm9ei9dm0000e0vt0xumg96e	site-demo-a	cmm9eigzo000pe0vtq7k7y7wv	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	Graissage et vérification tour CNC (mensuel)	Graissage points de lubrification, vérification fixations, contrôle jeu axes.	PREVENTIVE	MEDIUM	CLOSED	2026-01-09 16:36:36.043	2026-01-09 16:36:36.044	2026-01-09 16:36:36.044	2026-01-07 16:36:36.044	2026-01-09 16:36:36.044	MONTHLY	\N	int-demo-prev-002	50	Graissage complet. Jeu axe Z stable par rapport au dernier contrôle. RAS.	\N
int-demo-prev-008	cmm9ei9dm0000e0vt0xumg96e	site-demo-a	cmm9eigvr000le0vtkc6q6lx0	O9VyiUjeIVzV4eUpwONZ47gX7QlD2Esl	Vidange hydraulique — PH-100 (mensuelle)	Vidange complète du circuit hydraulique, remplacement huile ISO VG 46.	PREVENTIVE	MEDIUM	CLOSED	2026-02-05 16:36:36.142	2026-02-05 16:36:36.142	2026-02-05 16:36:36.142	2026-02-02 16:36:36.142	2026-02-05 16:36:36.142	MONTHLY	\N	int-demo-prev-005	90	Vidange effectuée. Huile ancienne présentait des particules métalliques — prélevé échantillon pour analyse.	2026-12-31 00:00:00
int-demo-corr-001	cmm9ei9dm0000e0vt0xumg96e	site-demo-a	cmm9eigzo000pe0vtq7k7y7wv	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	Panne — Bruit anormal axe X tour CNC	Opérateur signale bruit métallique lors des déplacements rapides axe X. Machine arrêtée par sécurité.	CORRECTIVE	HIGH	CLOSED	\N	2025-12-22 16:36:36.298	2025-12-23 16:36:36.298	2025-12-22 16:36:36.298	2025-12-23 16:36:36.298	\N	\N	\N	210	Roulement de guidage axe X HS. Remplacement effectué (2 roulements 6306-2Z). Test cycle complet conforme.	\N
int-demo-corr-002	cmm9ei9dm0000e0vt0xumg96e	site-demo-a	cmm9eigzk000me0vtgs9sjizj	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	Fuite huile — compresseur CA-75	Fuite huile visible au niveau du joint de carter inférieur. Nappe d'huile au sol constatée lors de la ronde du matin.	CORRECTIVE	MEDIUM	CLOSED	\N	2026-01-16 16:36:36.455	2026-01-16 16:36:36.455	2026-01-16 16:36:36.455	2026-01-16 16:36:36.455	\N	\N	\N	75	Joint de carter inférieur remplacé (réf JOI-PLAT-NBR-20). Nettoyage zone. Compresseur reparti sans fuite.	\N
int-demo-corr-003	cmm9ei9dm0000e0vt0xumg96e	site-demo-a	cmm9eih08000qe0vt4cszrweh	O9VyiUjeIVzV4eUpwONZ47gX7QlD2Esl	Arrêt convoyeur — courroie de transmission cassée	Arrêt production suite à rupture courroie transmission moteur-réducteur convoyeur CB-12.	CORRECTIVE	CRITICAL	CLOSED	\N	2026-01-23 16:36:36.617	2026-01-23 16:36:36.617	2026-01-23 16:36:36.617	2026-01-23 16:36:36.617	\N	\N	\N	40	Courroie SPA-1500 remplacée. Vérification tendeur — ressort affaibli mais acceptable. Convoyeur remis en service. Arrêt production 1h.	\N
int-demo-corr-004	cmm9ei9dm0000e0vt0xumg96e	site-demo-b	cmm9eigzk000ne0vt8wrziabs	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	Dysfonctionnement bobine soudure — SW-500	Fil de soudure ne déroule plus correctement. Patinage du dévidoir détecté par l'opérateur.	CORRECTIVE	MEDIUM	CLOSED	\N	2026-01-31 16:36:36.775	2026-01-31 16:36:36.775	2026-01-31 16:36:36.775	2026-01-31 16:36:36.775	\N	\N	\N	25	Galet presseur dévidoir usé. Remplacement galet (pièce standard). Réglage pression dévidoir. Test soudure OK.	\N
int-demo-corr-005	cmm9ei9dm0000e0vt0xumg96e	site-demo-a	cmm9eih0c000se0vtkv9f3mr5	O9VyiUjeIVzV4eUpwONZ47gX7QlD2Esl	Panne broche fraiseuse DMU 50 — vibrations anormales	Vibrations importantes lors de l'usinage. Qualité surface dégradée. Machine arrêtée par l'opérateur.	CORRECTIVE	HIGH	IN_PROGRESS	\N	2026-02-25 16:36:36.878	\N	2026-02-24 16:36:36.878	2026-02-25 16:36:36.878	\N	\N	\N	\N	\N	\N
int-demo-prev-009	cmm9ei9dm0000e0vt0xumg96e	site-demo-a	cmm9eigvr000le0vtkc6q6lx0	O9VyiUjeIVzV4eUpwONZ47gX7QlD2Esl	Vidange hydraulique — PH-100 (mensuelle)	Vidange complète du circuit hydraulique, remplacement huile ISO VG 46. Attention aux particules signalées mois dernier.	PREVENTIVE	MEDIUM	OPEN	2026-03-05 16:36:36.975	\N	\N	2026-02-28 16:36:36.975	2026-02-28 16:36:36.975	MONTHLY	\N	int-demo-prev-008	\N	\N	2026-12-31 00:00:00
int-demo-prev-010	cmm9ei9dm0000e0vt0xumg96e	site-demo-a	cmm9eigzo000pe0vtq7k7y7wv	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	Graissage et vérification tour CNC (mensuel)	Graissage points de lubrification, vérification fixations, contrôle jeu axes.	PREVENTIVE	MEDIUM	OPEN	2026-03-07 16:36:37.017	\N	\N	2026-03-01 16:36:37.017	2026-03-01 16:36:37.017	MONTHLY	\N	int-demo-prev-007	\N	\N	\N
int-demo-insp-001	cmm9ei9dm0000e0vt0xumg96e	site-demo-b	cmm9eigzl000oe0vt6u17mv4r	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	Inspection annuelle perceuse PC-32	Vérification fixation colonne, mandrin, sécurités, vitesses. Nettoyage copeaux intérieur carter.	INSPECTION	LOW	OPEN	2026-03-12 16:36:37.058	\N	\N	2026-02-27 16:36:37.058	2026-02-27 16:36:37.058	\N	\N	\N	\N	\N	\N
int-demo-corr-006	cmm9ei9dm0000e0vt0xumg96e	site-demo-a	cmm9eigzk000me0vtgs9sjizj	\N	Alarme température huile compresseur CA-75	Alarme température déclenchée ce matin (TH > 95°C). Compresseur s'est mis en sécurité. Cause à identifier.	CORRECTIVE	HIGH	OPEN	\N	\N	\N	2026-03-01 16:36:37.099	2026-03-01 16:36:37.099	\N	\N	\N	\N	\N	\N
int-demo-corr-007	cmm9ei9dm0000e0vt0xumg96e	site-demo-a	cmm9eih08000qe0vt4cszrweh	O9VyiUjeIVzV4eUpwONZ47gX7QlD2Esl	Bruit rouleau de tête convoyeur CB-12	Bruit de claquement intermittent sur le rouleau de tête. Signalé par l'opérateur en fin de shift.	CORRECTIVE	MEDIUM	PENDING_PARTS	\N	2026-02-27 16:36:37.197	\N	2026-02-27 16:36:37.197	2026-02-27 16:36:37.197	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: licenses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.licenses (id, "tenantId", "maxSites", "maxUsers", "billingPeriod", "renewsAt", "createdAt", "updatedAt") FROM stdin;
cmm2h124q0001m0vtkat5egxv	cmm2h12430000m0vt2y472aho	3	5	monthly	2026-03-01 00:00:00	2026-02-25 20:12:36.702	2026-02-25 20:12:36.702
cmm6frs4w00010klon9lrmgv4	cmm6frs4i00000klo3by7tb97	1	5	monthly	2026-03-30 14:48:28.974	2026-02-28 14:48:28.976	2026-02-28 14:48:28.976
cmm9ei9e80001e0vt32rfg3qc	cmm9ei9dm0000e0vt0xumg96e	5	50	yearly	2027-12-31 00:00:00	2026-03-02 16:36:23.095	2026-03-02 16:36:23.095
\.


--
-- Data for Name: machine_attachments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.machine_attachments (id, "tenantId", "machineId", "fileName", "storedName", "mimeType", "sizeBytes", "uploadedBy", "createdAt") FROM stdin;
\.


--
-- Data for Name: machine_components; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.machine_components (id, "tenantId", "machineId", "parentId", name, description, quantity, "stockItemId", "position", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: machine_counter_readings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.machine_counter_readings (id, "tenantId", "counterId", value, "recordedAt", "recordedBy", note) FROM stdin;
\.


--
-- Data for Name: machine_counters; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.machine_counters (id, "tenantId", "machineId", name, unit, "currentValue", "thresholdValue", "thresholdInterval", "triggerTitle", "triggerDescription", "triggerPriority", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: machines; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.machines (id, "tenantId", "siteId", name, "serialNumber", category, manufacturer, model, status, "qrCodeSlug", "installedAt", "createdAt", "updatedAt", notes) FROM stdin;
cmm8aggan0000dojxtfogg95u	cmm2h12430000m0vt2y472aho	cmm2h12780007m0vt4nfhqp6j	Presse	123	Presse béton	Allemand	jsp	OPERATIONAL	cmm8aggan0001dojxcaxdwt8c	2026-03-06 00:00:00	2026-03-01 21:55:14.687	2026-03-01 21:55:14.687	dazdzadazd
cmm9eigvr000le0vtkc6q6lx0	cmm9ei9dm0000e0vt0xumg96e	site-demo-a	Presse hydraulique PH-100	PH-2020-001	Presse hydraulique	HACO	HACC 100T	OPERATIONAL	demo-presse-p1	2020-04-10 00:00:00	2026-03-02 16:36:33.352	2026-03-02 16:36:33.352	Machine principale de l'atelier A. Révision annuelle prévue en Q3.
cmm9eigzl000oe0vt6u17mv4r	cmm9ei9dm0000e0vt0xumg96e	site-demo-b	Perceuse à colonne PC-32	PC-2017-015	Perceuse	Bernardo	DP 32-1050V	OPERATIONAL	demo-perceuse-pe1	2017-03-22 00:00:00	2026-03-02 16:36:33.354	2026-03-02 16:36:33.354	\N
cmm9eigzk000ne0vt8wrziabs	cmm9ei9dm0000e0vt0xumg96e	site-demo-b	Poste de soudure MIG/MAG SW-500	SW-2021-004	Soudure	Lincoln Electric	Power Wave S500	OPERATIONAL	demo-soudure-s1	2021-05-12 00:00:00	2026-03-02 16:36:33.354	2026-03-02 16:36:33.354	\N
cmm9eigzk000me0vtgs9sjizj	cmm9ei9dm0000e0vt0xumg96e	site-demo-a	Compresseur à vis CA-75	CA-2018-003	Compresseur	Atlas Copco	GA75	OPERATIONAL	demo-compresseur-c1	2018-07-20 00:00:00	2026-03-02 16:36:33.354	2026-03-02 16:36:33.354	\N
cmm9eigzo000pe0vtq7k7y7wv	cmm9ei9dm0000e0vt0xumg96e	site-demo-a	Tour CNC T-450	CNC-2019-007	Tour CNC	Mazak	QUICK TURN 450	OPERATIONAL	demo-tour-cnc-t1	2019-11-15 00:00:00	2026-03-02 16:36:33.352	2026-03-02 16:36:33.352	Tour de précision. Calibration bi-annuelle obligatoire.
cmm9eih0a000re0vtt2i925dt	cmm9ei9dm0000e0vt0xumg96e	site-demo-b	Ponceuse à bande PB-60	PB-2020-009	Ponceuse	Metabo	BAS 318	OPERATIONAL	demo-ponceuse-p2	2020-08-05 00:00:00	2026-03-02 16:36:33.354	2026-03-02 16:36:33.354	\N
cmm9eih08000qe0vt4cszrweh	cmm9ei9dm0000e0vt0xumg96e	site-demo-a	Convoyeur à bande CB-12	CB-2022-001	Convoyeur	Flexlink	XH-12	OPERATIONAL	demo-convoyeur-cv1	2022-01-10 00:00:00	2026-03-02 16:36:33.354	2026-03-02 16:36:33.354	\N
cmm9eih0c000se0vtkv9f3mr5	cmm9ei9dm0000e0vt0xumg96e	site-demo-a	Fraiseuse 3 axes F-250	FR-2021-012	Fraiseuse	DMG Mori	DMU 50	UNDER_MAINTENANCE	demo-fraiseuse-f1	2021-02-28 00:00:00	2026-03-02 16:36:33.353	2026-03-02 16:36:33.353	En cours de remplacement de broche.
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, "tenantId", "userId", type, title, body, link, "readAt", "createdAt") FROM stdin;
cmm8b2g450007dojxntmherf0	cmm2h12430000m0vt2y472aho	oigEDBSRaRUSScAcdrTRktVoWDJSXk8G	TRANSFER_RESOLVED	Transfert approuvé	10 × Nettoyant frein → Usine de wittenheim	/stock/transfers/cmm8b23330003dojxviep7c4n	2026-03-01 22:14:19.505	2026-03-01 22:12:20.885
cmm8b7tqs000kdojxjik3yd6l	cmm2h12430000m0vt2y472aho	4uIzbcv0rXIIJbjQW7E60vu2mZQgPdIN	INTERVENTION_ASSIGNED	Intervention assignée	Vous avez été assigné(e) à : regerer	/interventions/cmm3u21hz0000lsvt9ogdrgsp	\N	2026-03-01 22:16:31.828
\.


--
-- Data for Name: purchase_order_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.purchase_order_items (id, "tenantId", "purchaseOrderId", "stockItemId", "quantityOrdered", "unitPriceCents", "quantityReceived") FROM stdin;
cmm9eii370028e0vtrgdnjcph	cmm9ei9dm0000e0vt0xumg96e	po-demo-001	cmm9eih7k000ze0vttb44edyq	20	750	20
cmm9eii370029e0vtv0e39goo	cmm9ei9dm0000e0vt0xumg96e	po-demo-001	cmm9eih7i000ve0vtn3c07qdq	12	1050	12
cmm9eii37002ae0vt39m7rq3f	cmm9ei9dm0000e0vt0xumg96e	po-demo-001	cmm9eih7i000te0vtvlpxdjba	8	3000	8
cmm9eii7n002be0vt507zpdl2	cmm9ei9dm0000e0vt0xumg96e	po-demo-002	cmm9eih7m0010e0vt1x5pcc39	2	19500	0
cmm9eiic0002ce0vtzzrptezb	cmm9ei9dm0000e0vt0xumg96e	po-demo-003	cmm9eih7i000ue0vtcgfirb14	3	7800	0
\.


--
-- Data for Name: purchase_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.purchase_orders (id, "tenantId", "siteId", "supplierId", status, "expectedDeliveryDate", notes, "createdBy", "approvedBy", "approvedAt", "receivedAt", "createdAt", "updatedAt") FROM stdin;
po-demo-001	cmm9ei9dm0000e0vt0xumg96e	site-demo-a	sup-demo-roulements	RECEIVED	2026-01-02 16:36:34.84	Commande roulements et courroies — réapprovisionnement trimestriel	3u91OIZmLtz0O5rD2b6BUwQW5XISptsm	3u91OIZmLtz0O5rD2b6BUwQW5XISptsm	2025-12-30 16:36:34.84	2026-01-03 16:36:34.84	2025-12-27 16:36:34.84	2026-01-03 16:36:34.84
po-demo-002	cmm9ei9dm0000e0vt0xumg96e	site-demo-a	sup-demo-pneumatique	ORDERED	2026-03-07 16:36:35.005	Remplacement vérin fraiseuse + stock tampon	V24wMy55vpIIcAhPh9i7Uwc4v2vQBqsc	3u91OIZmLtz0O5rD2b6BUwQW5XISptsm	2026-02-22 16:36:35.005	\N	2026-02-20 16:36:35.005	2026-02-22 16:36:35.005
po-demo-003	cmm9ei9dm0000e0vt0xumg96e	site-demo-a	sup-demo-elec	DRAFT	\N	Réapprovisionnement contacteurs + fusibles	V24wMy55vpIIcAhPh9i7Uwc4v2vQBqsc	\N	\N	\N	2026-03-01 16:36:35.163	2026-03-01 16:36:35.163
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.session (id, "expiresAt", token, "createdAt", "updatedAt", "ipAddress", "userAgent", "userId") FROM stdin;
xOkbBZvIr8hptge9McnDSOrtPCVkc82k	2026-03-04 17:57:01.54	x2WA0Ani9fIsaxFOyLox8UAfClDNkLLP	2026-02-25 17:57:01.541	2026-02-25 17:57:01.541			m9GPASkivF4pLVqBkJwn1Imze6w8f7aw
WYnxUWQOJt8xkRJ5umxFQhbQV3nsmM3k	2026-03-04 18:07:50.28	wrTXGB7BdnDdcEaiyama2z4fn2FlJmLU	2026-02-25 18:07:50.28	2026-02-25 18:07:50.28	0000:0000:0000:0000:0000:0000:0000:0000	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	m9GPASkivF4pLVqBkJwn1Imze6w8f7aw
YeCiQkcCa7jok9lBY8ITgJPRbGQaObLi	2026-03-04 18:39:15.51	T23vNj4OXYjBCicmOii4zkHMddmtoCsf	2026-02-25 18:39:15.51	2026-02-25 18:39:15.51	0000:0000:0000:0000:0000:0000:0000:0000	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	m9GPASkivF4pLVqBkJwn1Imze6w8f7aw
8obs1RL61Qtvoki3w5DgLX9SHKPS49Ru	2026-03-04 18:42:54.876	QVsfKZLJPRVp0pCnt3xptMshMrvdKtGt	2026-02-25 18:42:54.876	2026-02-25 18:42:54.876	0000:0000:0000:0000:0000:0000:0000:0000	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	m9GPASkivF4pLVqBkJwn1Imze6w8f7aw
XXNMD5cXjuwAlQ1WhbdiJ9jmEPJwrgU6	2026-03-04 20:44:01.424	oFjse5WhjkaH3sNHHWxxeU78te1bYk1W	2026-02-25 20:44:01.425	2026-02-25 20:44:01.425	0000:0000:0000:0000:0000:0000:0000:0000	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	m9GPASkivF4pLVqBkJwn1Imze6w8f7aw
hFk8oVffgbS8YL4OJBBk4X1HXdoLDlMn	2026-03-04 20:44:28.75	5oLrn1fXuwXzZUB5ny2Ck74G07Zb84f4	2026-02-25 20:44:28.75	2026-02-25 20:44:28.75			4uIzbcv0rXIIJbjQW7E60vu2mZQgPdIN
RikzvyM8GOp2qNWoFzoCDL6AoPfRo47T	2026-03-04 20:46:34.275	6g2BDGDdGWsxJAw31ZsJVL0ykVraMRGZ	2026-02-25 20:46:34.276	2026-02-25 20:46:34.276	0000:0000:0000:0000:0000:0000:0000:0000	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	m9GPASkivF4pLVqBkJwn1Imze6w8f7aw
mOGkRgkCM2ikfvUV8P3HSwdkhkGMILFr	2026-03-04 21:04:15.544	IzIloi5mV4pGHiv1uqDIqSQH65lCCwP8	2026-02-25 21:04:15.545	2026-02-25 21:04:15.545	0000:0000:0000:0000:0000:0000:0000:0000	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	4uIzbcv0rXIIJbjQW7E60vu2mZQgPdIN
ESMZ0ZVQ0o0lemmn6qx4HXxGPUik41bf	2026-03-05 18:51:00.624	IDdpeLKmsygT5M6SNc3Awt1WXx5HBW3S	2026-02-26 18:51:00.625	2026-02-26 18:51:00.625	0000:0000:0000:0000:0000:0000:0000:0000	Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36	m9GPASkivF4pLVqBkJwn1Imze6w8f7aw
8eA1c3u5RQlgxzCQa1g37BKa9v9mbHLX	2026-03-06 18:32:51.47	A0lMDCT3iLh1tuMI2Z1ARQ9fEX6s4ufC	2026-02-27 18:32:51.47	2026-02-27 18:32:51.47	0000:0000:0000:0000:0000:0000:0000:0000	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	m9GPASkivF4pLVqBkJwn1Imze6w8f7aw
R2zx7baMvYakehTGMhcphcIkQuIZ3X3t	2026-03-08 17:23:26.695	tbPVNSLqR3uIeSNeRJRoX1deJLNad22u	2026-03-01 17:23:26.695	2026-03-01 17:23:26.695	0000:0000:0000:0000:0000:0000:0000:0000	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	m9GPASkivF4pLVqBkJwn1Imze6w8f7aw
7UxQ5rDcAyLfd5B1gBi8BGi78eXzzt2x	2026-03-09 16:36:27.623	rEFJkG1HOXwFHVPE656kPJjUV2cPp5Y9	2026-03-02 16:36:27.623	2026-03-02 16:36:27.623			V24wMy55vpIIcAhPh9i7Uwc4v2vQBqsc
5hcUFM095Onutskku5c6ZgftXsNGCatC	2026-03-09 16:36:29.506	GNzAI7oM28cmIVsvTQWhTOi0HgebtXeG	2026-03-02 16:36:29.506	2026-03-02 16:36:29.506			O9VyiUjeIVzV4eUpwONZ47gX7QlD2Esl
eqySywFniohjiMAgoyzOAZb2DUBUQfjO	2026-03-09 16:36:31.368	gCECGX5tdG1KpA7IYBgDJBXOpJ5cgSnH	2026-03-02 16:36:31.368	2026-03-02 16:36:31.368			izNZVjghSGTDAWYuA2ryfazaWSBqWHsd
xKOYWb8E6T6pbzmqjRPpZiuQKThAJYDO	2026-03-09 16:36:33.229	vRJYDkmQesSJHdMTTNvE8BU1cXcheUNV	2026-03-02 16:36:33.229	2026-03-02 16:36:33.229			VRC1ECVA7MOwxjlQfjMYsuyzuWWmIc90
HzjxzkNfkfYFM2VG3AWsdPANhrS8h6d6	2026-03-09 17:02:29.035	m3q7g0cGY5HFdqGLgacYyC4lroz6Iz6P	2026-03-02 17:02:29.035	2026-03-02 17:02:29.035	91.168.179.135	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	oigEDBSRaRUSScAcdrTRktVoWDJSXk8G
\.


--
-- Data for Name: sites; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sites (id, "tenantId", name, address, "isActive", "createdAt", "updatedAt", "floorPlanImage", "machinePins") FROM stdin;
cmm2h12780007m0vt4nfhqp6j	cmm2h12430000m0vt2y472aho	Usine de Krautergersheim	\N	t	2026-02-25 20:12:36.835	2026-02-25 20:12:36.835	\N	\N
cmm2hc30f0009m0vtdwflzz6x	cmm2h12430000m0vt2y472aho	Usine de Steinbourg	Steinbourg	t	2026-02-25 20:21:11.103	2026-02-25 20:21:11.103	\N	\N
cmm2hcm9z000am0vtqzixhsb7	cmm2h12430000m0vt2y472aho	Usine de wittenheim	wittenheim	t	2026-02-25 20:21:36.071	2026-02-25 20:21:36.071	\N	\N
site-demo-a	cmm9ei9dm0000e0vt0xumg96e	Atelier A — Production	12 rue de l'Industrie, 69100 Villeurbanne	t	2026-03-02 16:36:23.788	2026-03-02 16:36:23.788	\N	\N
site-demo-b	cmm9ei9dm0000e0vt0xumg96e	Atelier B — Maintenance	45 avenue des Ateliers, 69200 Vénissieux	t	2026-03-02 16:36:23.887	2026-03-02 16:36:23.887	\N	\N
\.


--
-- Data for Name: stock_inventory_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stock_inventory_items (id, "tenantId", "sessionId", "stockItemId", "systemQuantity", "countedQuantity", note) FROM stdin;
\.


--
-- Data for Name: stock_inventory_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stock_inventory_sessions (id, "tenantId", "siteId", status, "createdBy", "closedAt", "closedBy", "createdAt") FROM stdin;
\.


--
-- Data for Name: stock_item_suppliers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stock_item_suppliers (id, "tenantId", "stockItemId", "supplierId", "supplierReference", "purchasePriceCents", "leadTimeDays") FROM stdin;
cmm8b3cl60009dojx9sm755jz	cmm2h12430000m0vt2y472aho	cmm2ie5090002wkvtuh8rjhu1	cmm8b3cir0008dojx5almtm7q	dzadazd	5	1
cmm9eihfm0017e0vtul5n8w3c	cmm9ei9dm0000e0vt0xumg96e	cmm9eih7k000ze0vttb44edyq	sup-demo-roulements	SKF-6205-2RS	750	5
cmm9eihfm0018e0vtwo6hy8fe	cmm9ei9dm0000e0vt0xumg96e	cmm9eih7i000ve0vtn3c07qdq	sup-demo-roulements	SKF-6306-2Z	1050	5
cmm9eihfm0019e0vtlqkrilp5	cmm9ei9dm0000e0vt0xumg96e	cmm9eih7j000ye0vto0xwxxec	sup-demo-fluides	TOTAL-HV46-20L	420	3
cmm9eihfm001ae0vtkxeixbj8	cmm9ei9dm0000e0vt0xumg96e	cmm9eih7i000ue0vtcgfirb14	sup-demo-elec	SCH-LC1D32	7800	7
cmm9eihfm001be0vt3fsdgzhi	cmm9ei9dm0000e0vt0xumg96e	cmm9eih7m0010e0vt1x5pcc39	sup-demo-pneumatique	FESTO-DNC-63-200	19500	14
cmm9eihfm001ce0vthjdgigw3	cmm9ei9dm0000e0vt0xumg96e	cmm9eihdg0016e0vtohgkpxtd	sup-demo-roulements	SKF-6205-2RS	750	5
\.


--
-- Data for Name: stock_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stock_items (id, "tenantId", "siteId", reference, name, unit, "quantityOnHand", "minimumLevel", "unitCostCents", "createdAt", "updatedAt", "machineId") FROM stdin;
cmm3rtjc00003u8vtegkq15an	cmm2h12430000m0vt2y472aho	cmm2h12780007m0vt4nfhqp6j	dhtterdrt	Multi spray	pièce	6	3	1	2026-02-26 18:02:27.743	2026-03-01 21:55:41.407	cmm8aggan0000dojxtfogg95u
cmm8b2g3b0005dojxn5unyzse	cmm2h12430000m0vt2y472aho	cmm2hcm9z000am0vtqzixhsb7	129681651	Nettoyant frein	pièce	10	12	25	2026-03-01 22:12:20.855	2026-03-01 22:12:20.855	\N
cmm2ie5090002wkvtuh8rjhu1	cmm2h12430000m0vt2y472aho	cmm2h12780007m0vt4nfhqp6j	129681651	Nettoyant frein	pièce	10	12	25	2026-02-25 20:50:46.617	2026-03-01 22:13:40.118	cmm8aggan0000dojxtfogg95u
cmm9eih7i000te0vtvlpxdjba	cmm9ei9dm0000e0vt0xumg96e	site-demo-a	CRR-SPA-1500	Courroie trapézoïdale SPA-1500	pièce	4	2	3200	2026-03-02 16:36:33.779	2026-03-02 16:36:33.779	\N
cmm9eih7j000xe0vt8wwdlu2a	cmm9ei9dm0000e0vt0xumg96e	site-demo-a	FLT-AIR-G3-4	Filtre à air G3/4 (compresseur)	pièce	3	2	2800	2026-03-02 16:36:33.779	2026-03-02 16:36:33.779	cmm9eigzk000me0vtgs9sjizj
cmm9eih7i000ve0vtn3c07qdq	cmm9ei9dm0000e0vt0xumg96e	site-demo-a	RLT-6306-2Z	Roulement à billes 6306-2Z	pièce	6	3	1200	2026-03-02 16:36:33.778	2026-03-02 16:36:33.778	cmm9eigzo000pe0vtq7k7y7wv
cmm9eih7j000we0vth07m7mdx	cmm9ei9dm0000e0vt0xumg96e	site-demo-a	JOI-PLAT-NBR-20	Joint plat NBR Ø20mm	pièce	25	10	180	2026-03-02 16:36:33.779	2026-03-02 16:36:33.779	\N
cmm9eih7i000ue0vtcgfirb14	cmm9ei9dm0000e0vt0xumg96e	site-demo-a	ELC-CONT-3P-32A	Contacteur tripolaire 32A (Schneider)	pièce	2	1	8500	2026-03-02 16:36:33.779	2026-03-02 16:36:33.779	\N
cmm9eih7j000ye0vto0xwxxec	cmm9ei9dm0000e0vt0xumg96e	site-demo-a	HUI-HYD-46-20L	Huile hydraulique ISO VG 46 (20L)	litre	60	20	480	2026-03-02 16:36:33.779	2026-03-02 16:36:33.779	\N
cmm9eih7k000ze0vttb44edyq	cmm9ei9dm0000e0vt0xumg96e	site-demo-a	RLT-6205-2RS	Roulement à billes 6205-2RS	pièce	8	4	850	2026-03-02 16:36:33.778	2026-03-02 16:36:33.778	cmm9eigvr000le0vtkc6q6lx0
cmm9eih7m0010e0vt1x5pcc39	cmm9ei9dm0000e0vt0xumg96e	site-demo-a	PNE-VERIN-63-200	Vérin pneumatique Ø63 course 200mm (Festo)	pièce	1	1	22000	2026-03-02 16:36:33.78	2026-03-02 16:36:33.78	\N
cmm9eihai0011e0vt1yuof0z4	cmm9ei9dm0000e0vt0xumg96e	site-demo-a	CRR-CONV-B-3000	Bande convoyeur 3000x300mm	pièce	2	1	18500	2026-03-02 16:36:33.78	2026-03-02 16:36:33.78	cmm9eih08000qe0vt4cszrweh
cmm9eihap0012e0vtp8uorfo6	cmm9ei9dm0000e0vt0xumg96e	site-demo-a	LUB-GRAISSE-500G	Graisse lithium NLGI 2 (pot 500g)	pièce	5	3	1600	2026-03-02 16:36:33.78	2026-03-02 16:36:33.78	\N
cmm9eihdd0013e0vt1rxomfhz	cmm9ei9dm0000e0vt0xumg96e	site-demo-b	SOD-FIL-MIG-1.0	Fil de soudure MIG 1.0mm (15kg)	bobine	4	2	6500	2026-03-02 16:36:33.997	2026-03-02 16:36:33.997	cmm9eigzk000ne0vt8wrziabs
cmm9eihdf0014e0vtsne8mkbe	cmm9ei9dm0000e0vt0xumg96e	site-demo-b	ABR-DISQ-115-A24	Disque abrasif Ø115mm grain A24	pièce	40	20	280	2026-03-02 16:36:33.997	2026-03-02 16:36:33.997	\N
cmm9eihdg0015e0vt0rd5mpdg	cmm9ei9dm0000e0vt0xumg96e	site-demo-b	HUI-HYD-46-20L	Huile hydraulique ISO VG 46 (20L)	litre	20	10	480	2026-03-02 16:36:33.997	2026-03-02 16:36:33.997	\N
cmm9eihdg0016e0vtohgkpxtd	cmm9ei9dm0000e0vt0xumg96e	site-demo-b	RLT-6205-2RS	Roulement à billes 6205-2RS	pièce	3	2	850	2026-03-02 16:36:33.997	2026-03-02 16:36:33.997	\N
\.


--
-- Data for Name: stock_movements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stock_movements (id, "tenantId", "stockItemId", type, quantity, reason, "operatorId", "createdAt", "cancelledAt", "cancelledBy", "cancelReason") FROM stdin;
cmm2iezke0003wkvtddscaq1z	cmm2h12430000m0vt2y472aho	cmm2ie5090002wkvtuh8rjhu1	ADJUSTMENT	16	je sais pas	oigEDBSRaRUSScAcdrTRktVoWDJSXk8G	2026-02-25 20:51:26.222	\N	\N	\N
cmm3p2y5f0001u8vt1j5dkclt	cmm2h12430000m0vt2y472aho	cmm2ie5090002wkvtuh8rjhu1	OUT	2	Consommation préventive — intervention #cmm2ih1y40004wkvtxwrbvu7e	oigEDBSRaRUSScAcdrTRktVoWDJSXk8G	2026-02-26 16:45:48.003	\N	\N	\N
cmm8b2g2b0004dojxncnt4mt2	cmm2h12430000m0vt2y472aho	cmm2ie5090002wkvtuh8rjhu1	TRANSFER_OUT	10	Transfert vers Usine de wittenheim	oigEDBSRaRUSScAcdrTRktVoWDJSXk8G	2026-03-01 22:12:20.819	\N	\N	\N
cmm8b2g3k0006dojxzrp6w3gp	cmm2h12430000m0vt2y472aho	cmm8b2g3b0005dojxn5unyzse	TRANSFER_IN	10	Transfert depuis Usine de Krautergersheim	oigEDBSRaRUSScAcdrTRktVoWDJSXk8G	2026-03-01 22:12:20.864	\N	\N	\N
cmm9eihgu001de0vtw3vj25p5	cmm9ei9dm0000e0vt0xumg96e	cmm9eih7k000ze0vttb44edyq	IN	20	Stock initial — réception fournisseur	3u91OIZmLtz0O5rD2b6BUwQW5XISptsm	2025-12-02 16:36:34.157	\N	\N	\N
cmm9eihhk001ee0vt50639fq4	cmm9ei9dm0000e0vt0xumg96e	cmm9eih7i000ve0vtn3c07qdq	IN	12	Stock initial — réception fournisseur	3u91OIZmLtz0O5rD2b6BUwQW5XISptsm	2025-12-02 16:36:34.157	\N	\N	\N
cmm9eihi7001fe0vtyt426g9i	cmm9ei9dm0000e0vt0xumg96e	cmm9eih7j000ye0vto0xwxxec	IN	100	Stock initial — réception fournisseur	3u91OIZmLtz0O5rD2b6BUwQW5XISptsm	2025-12-02 16:36:34.157	\N	\N	\N
cmm9eihit001ge0vta9waiwoc	cmm9ei9dm0000e0vt0xumg96e	cmm9eih7i000te0vtvlpxdjba	IN	8	Stock initial — réception fournisseur	3u91OIZmLtz0O5rD2b6BUwQW5XISptsm	2025-12-03 16:36:34.157	\N	\N	\N
cmm9eihjh001he0vtl6yjx6ss	cmm9ei9dm0000e0vt0xumg96e	cmm9eih7j000xe0vt8wwdlu2a	IN	6	Stock initial	3u91OIZmLtz0O5rD2b6BUwQW5XISptsm	2025-12-03 16:36:34.157	\N	\N	\N
cmm9eihk4001ie0vtt6nl48a8	cmm9ei9dm0000e0vt0xumg96e	cmm9eih7j000we0vth07m7mdx	IN	50	Stock initial	3u91OIZmLtz0O5rD2b6BUwQW5XISptsm	2025-12-03 16:36:34.157	\N	\N	\N
cmm9eihkr001je0vtc84qzy70	cmm9ei9dm0000e0vt0xumg96e	cmm9eih7i000ue0vtcgfirb14	IN	3	Stock initial	3u91OIZmLtz0O5rD2b6BUwQW5XISptsm	2025-12-04 16:36:34.157	\N	\N	\N
cmm9eihle001ke0vti1qvha2a	cmm9ei9dm0000e0vt0xumg96e	cmm9eih7m0010e0vt1x5pcc39	IN	2	Stock initial	3u91OIZmLtz0O5rD2b6BUwQW5XISptsm	2025-12-04 16:36:34.157	\N	\N	\N
cmm9eihm0001le0vt5eo3pyln	cmm9ei9dm0000e0vt0xumg96e	cmm9eihap0012e0vtp8uorfo6	IN	10	Stock initial	3u91OIZmLtz0O5rD2b6BUwQW5XISptsm	2025-12-04 16:36:34.157	\N	\N	\N
cmm9eihmm001me0vtnf7jbrt1	cmm9ei9dm0000e0vt0xumg96e	cmm9eihai0011e0vt1yuof0z4	IN	3	Stock initial	3u91OIZmLtz0O5rD2b6BUwQW5XISptsm	2025-12-05 16:36:34.157	\N	\N	\N
cmm9eihn6001ne0vtk2f6vwnx	cmm9ei9dm0000e0vt0xumg96e	cmm9eihdg0016e0vtohgkpxtd	IN	8	Stock initial — site B	3u91OIZmLtz0O5rD2b6BUwQW5XISptsm	2025-12-02 16:36:34.157	\N	\N	\N
cmm9eihnq001oe0vtgsplb2nf	cmm9ei9dm0000e0vt0xumg96e	cmm9eihdd0013e0vt1rxomfhz	IN	8	Stock initial — site B	3u91OIZmLtz0O5rD2b6BUwQW5XISptsm	2025-12-02 16:36:34.157	\N	\N	\N
cmm9eihob001pe0vtxcjaf9um	cmm9ei9dm0000e0vt0xumg96e	cmm9eihdf0014e0vtsne8mkbe	IN	80	Stock initial — site B	3u91OIZmLtz0O5rD2b6BUwQW5XISptsm	2025-12-02 16:36:34.157	\N	\N	\N
cmm9eihov001qe0vtahfggo0d	cmm9ei9dm0000e0vt0xumg96e	cmm9eihdg0015e0vt0rd5mpdg	IN	40	Stock initial — site B	3u91OIZmLtz0O5rD2b6BUwQW5XISptsm	2025-12-03 16:36:34.157	\N	\N	\N
cmm9eihpg001re0vt8vs5tj8w	cmm9ei9dm0000e0vt0xumg96e	cmm9eih7k000ze0vttb44edyq	OUT	-2	Remplacement roulements presse PH-100	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	2025-12-17 16:36:34.467	\N	\N	\N
cmm9eihq0001se0vtqe5674ri	cmm9ei9dm0000e0vt0xumg96e	cmm9eih7j000ye0vto0xwxxec	OUT	-15	Vidange huile hydraulique — PH-100	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	2025-12-22 16:36:34.488	\N	\N	\N
cmm9eihqm001te0vtmp8nzp8f	cmm9ei9dm0000e0vt0xumg96e	cmm9eih7j000we0vth07m7mdx	OUT	-8	Remplacement joints — circuit hydraulique	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	2025-12-27 16:36:34.509	\N	\N	\N
cmm9eihr8001ue0vtpq6aq19m	cmm9ei9dm0000e0vt0xumg96e	cmm9eihap0012e0vtp8uorfo6	OUT	-2	Graissage tour CNC T-450	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	2026-01-01 16:36:34.531	\N	\N	\N
cmm9eihru001ve0vtghrbgbje	cmm9ei9dm0000e0vt0xumg96e	cmm9eih7i000ve0vtn3c07qdq	OUT	-2	Remplacement roulements tour CNC	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	2026-01-06 16:36:34.553	\N	\N	\N
cmm9eihsi001we0vtnxt5tx90	cmm9ei9dm0000e0vt0xumg96e	cmm9eih7j000xe0vt8wwdlu2a	OUT	-1	Remplacement filtre air compresseur	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	2026-01-11 16:36:34.577	\N	\N	\N
cmm9eiht5001xe0vtkb2hlnwp	cmm9ei9dm0000e0vt0xumg96e	cmm9eih7j000ye0vto0xwxxec	OUT	-10	Appoint huile hydraulique fraiseuse	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	2026-01-16 16:36:34.6	\N	\N	\N
cmm9eihtq001ye0vtgarjc96z	cmm9ei9dm0000e0vt0xumg96e	cmm9eih7i000te0vtvlpxdjba	OUT	-2	Remplacement courroie convoyeur	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	2026-01-21 16:36:34.622	\N	\N	\N
cmm9eihuc001ze0vtci9e5mbk	cmm9ei9dm0000e0vt0xumg96e	cmm9eih7k000ze0vttb44edyq	OUT	-2	Remplacement roulements convoyeur CB-12	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	2026-01-26 16:36:34.643	\N	\N	\N
cmm9eihuz0020e0vtdty56oli	cmm9ei9dm0000e0vt0xumg96e	cmm9eih7j000we0vth07m7mdx	OUT	-5	Maintenance préventive — joints divers	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	2026-01-31 16:36:34.666	\N	\N	\N
cmm9eihvm0021e0vtq58jkia8	cmm9ei9dm0000e0vt0xumg96e	cmm9eihap0012e0vtp8uorfo6	OUT	-1	Graissage presse mensuel	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	2026-02-05 16:36:34.689	\N	\N	\N
cmm9eihw80022e0vthvpb4rw3	cmm9ei9dm0000e0vt0xumg96e	cmm9eihdf0014e0vtsne8mkbe	OUT	-20	Consommation abrasifs — atelier B	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	2026-01-16 16:36:34.711	\N	\N	\N
cmm9eihwu0023e0vtuhpbctyt	cmm9ei9dm0000e0vt0xumg96e	cmm9eihdd0013e0vt1rxomfhz	OUT	-2	Soudure réparation pièce	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	2026-01-23 16:36:34.733	\N	\N	\N
cmm9eihxh0024e0vtxlyph7kk	cmm9ei9dm0000e0vt0xumg96e	cmm9eihdf0014e0vtsne8mkbe	OUT	-20	Consommation abrasifs — atelier B	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	2026-02-08 16:36:34.756	\N	\N	\N
cmm9eihy20025e0vthcvwe1ik	cmm9ei9dm0000e0vt0xumg96e	cmm9eihdg0016e0vtohgkpxtd	OUT	-2	Remplacement roulements perceuse	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	2026-02-12 16:36:34.778	\N	\N	\N
cmm9eihyn0026e0vt3sb50e88	cmm9ei9dm0000e0vt0xumg96e	cmm9eih7k000ze0vttb44edyq	IN	10	Réception BC-2024-009	3u91OIZmLtz0O5rD2b6BUwQW5XISptsm	2026-02-15 16:36:34.799	\N	\N	\N
cmm9eihz70027e0vtc0hikx4b	cmm9ei9dm0000e0vt0xumg96e	cmm9eih7j000xe0vt8wwdlu2a	IN	3	Réception BC-2024-009	3u91OIZmLtz0O5rD2b6BUwQW5XISptsm	2026-02-15 16:36:34.819	\N	\N	\N
cmm9emj3c00068ovt995a2dse	cmm9ei9dm0000e0vt0xumg96e	cmm9eih7k000ze0vttb44edyq	IN	20	Stock initial — réception fournisseur	3u91OIZmLtz0O5rD2b6BUwQW5XISptsm	2025-12-02 16:39:42.887	\N	\N	\N
cmm9emj3x00078ovtktzzylh0	cmm9ei9dm0000e0vt0xumg96e	cmm9eih7i000ve0vtn3c07qdq	IN	12	Stock initial — réception fournisseur	3u91OIZmLtz0O5rD2b6BUwQW5XISptsm	2025-12-02 16:39:42.887	\N	\N	\N
cmm9emj4i00088ovtgmtz0pp4	cmm9ei9dm0000e0vt0xumg96e	cmm9eih7j000ye0vto0xwxxec	IN	100	Stock initial — réception fournisseur	3u91OIZmLtz0O5rD2b6BUwQW5XISptsm	2025-12-02 16:39:42.887	\N	\N	\N
cmm9emj5100098ovtw90qwn8l	cmm9ei9dm0000e0vt0xumg96e	cmm9eih7i000te0vtvlpxdjba	IN	8	Stock initial — réception fournisseur	3u91OIZmLtz0O5rD2b6BUwQW5XISptsm	2025-12-03 16:39:42.887	\N	\N	\N
cmm9emj5l000a8ovt48nq4w5z	cmm9ei9dm0000e0vt0xumg96e	cmm9eih7j000xe0vt8wwdlu2a	IN	6	Stock initial	3u91OIZmLtz0O5rD2b6BUwQW5XISptsm	2025-12-03 16:39:42.887	\N	\N	\N
cmm9emj65000b8ovtg01z3euz	cmm9ei9dm0000e0vt0xumg96e	cmm9eih7j000we0vth07m7mdx	IN	50	Stock initial	3u91OIZmLtz0O5rD2b6BUwQW5XISptsm	2025-12-03 16:39:42.887	\N	\N	\N
cmm9emj6s000c8ovt0ubab1ah	cmm9ei9dm0000e0vt0xumg96e	cmm9eih7i000ue0vtcgfirb14	IN	3	Stock initial	3u91OIZmLtz0O5rD2b6BUwQW5XISptsm	2025-12-04 16:39:42.887	\N	\N	\N
cmm9emj7e000d8ovtlcphin6w	cmm9ei9dm0000e0vt0xumg96e	cmm9eih7m0010e0vt1x5pcc39	IN	2	Stock initial	3u91OIZmLtz0O5rD2b6BUwQW5XISptsm	2025-12-04 16:39:42.887	\N	\N	\N
cmm9emj80000e8ovtbqyix13j	cmm9ei9dm0000e0vt0xumg96e	cmm9eihap0012e0vtp8uorfo6	IN	10	Stock initial	3u91OIZmLtz0O5rD2b6BUwQW5XISptsm	2025-12-04 16:39:42.887	\N	\N	\N
cmm9emj8m000f8ovtpasbyowa	cmm9ei9dm0000e0vt0xumg96e	cmm9eihai0011e0vt1yuof0z4	IN	3	Stock initial	3u91OIZmLtz0O5rD2b6BUwQW5XISptsm	2025-12-05 16:39:42.887	\N	\N	\N
cmm9emj97000g8ovt2yg2anug	cmm9ei9dm0000e0vt0xumg96e	cmm9eihdg0016e0vtohgkpxtd	IN	8	Stock initial — site B	3u91OIZmLtz0O5rD2b6BUwQW5XISptsm	2025-12-02 16:39:42.887	\N	\N	\N
cmm9emj9u000h8ovtsr7hrlhl	cmm9ei9dm0000e0vt0xumg96e	cmm9eihdd0013e0vt1rxomfhz	IN	8	Stock initial — site B	3u91OIZmLtz0O5rD2b6BUwQW5XISptsm	2025-12-02 16:39:42.887	\N	\N	\N
cmm9emjag000i8ovtnaz6lvaw	cmm9ei9dm0000e0vt0xumg96e	cmm9eihdf0014e0vtsne8mkbe	IN	80	Stock initial — site B	3u91OIZmLtz0O5rD2b6BUwQW5XISptsm	2025-12-02 16:39:42.887	\N	\N	\N
cmm9emjb3000j8ovtsflmxgfi	cmm9ei9dm0000e0vt0xumg96e	cmm9eihdg0015e0vt0rd5mpdg	IN	40	Stock initial — site B	3u91OIZmLtz0O5rD2b6BUwQW5XISptsm	2025-12-03 16:39:42.887	\N	\N	\N
cmm9emjbr000k8ovt8pmlvhty	cmm9ei9dm0000e0vt0xumg96e	cmm9eih7k000ze0vttb44edyq	OUT	-2	Remplacement roulements presse PH-100	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	2025-12-17 16:39:43.188	\N	\N	\N
cmm9emjcc000l8ovtty1rjy67	cmm9ei9dm0000e0vt0xumg96e	cmm9eih7j000ye0vto0xwxxec	OUT	-15	Vidange huile hydraulique — PH-100	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	2025-12-22 16:39:43.212	\N	\N	\N
cmm9emjcw000m8ovtpcn8d2s2	cmm9ei9dm0000e0vt0xumg96e	cmm9eih7j000we0vth07m7mdx	OUT	-8	Remplacement joints — circuit hydraulique	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	2025-12-27 16:39:43.232	\N	\N	\N
cmm9emjdg000n8ovtzu8g6tb2	cmm9ei9dm0000e0vt0xumg96e	cmm9eihap0012e0vtp8uorfo6	OUT	-2	Graissage tour CNC T-450	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	2026-01-01 16:39:43.252	\N	\N	\N
cmm9emje0000o8ovtm5aq9rjt	cmm9ei9dm0000e0vt0xumg96e	cmm9eih7i000ve0vtn3c07qdq	OUT	-2	Remplacement roulements tour CNC	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	2026-01-06 16:39:43.272	\N	\N	\N
cmm9emjek000p8ovtlkyo6mli	cmm9ei9dm0000e0vt0xumg96e	cmm9eih7j000xe0vt8wwdlu2a	OUT	-1	Remplacement filtre air compresseur	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	2026-01-11 16:39:43.292	\N	\N	\N
cmm9emjf4000q8ovtcg20b288	cmm9ei9dm0000e0vt0xumg96e	cmm9eih7j000ye0vto0xwxxec	OUT	-10	Appoint huile hydraulique fraiseuse	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	2026-01-16 16:39:43.312	\N	\N	\N
cmm9emjfp000r8ovtrue4vofd	cmm9ei9dm0000e0vt0xumg96e	cmm9eih7i000te0vtvlpxdjba	OUT	-2	Remplacement courroie convoyeur	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	2026-01-21 16:39:43.333	\N	\N	\N
cmm9emjgb000s8ovtkqkn4e3x	cmm9ei9dm0000e0vt0xumg96e	cmm9eih7k000ze0vttb44edyq	OUT	-2	Remplacement roulements convoyeur CB-12	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	2026-01-26 16:39:43.354	\N	\N	\N
cmm9emjgw000t8ovtsqrqvz3j	cmm9ei9dm0000e0vt0xumg96e	cmm9eih7j000we0vth07m7mdx	OUT	-5	Maintenance préventive — joints divers	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	2026-01-31 16:39:43.376	\N	\N	\N
cmm9emjhg000u8ovtnw7cqfcz	cmm9ei9dm0000e0vt0xumg96e	cmm9eihap0012e0vtp8uorfo6	OUT	-1	Graissage presse mensuel	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	2026-02-05 16:39:43.396	\N	\N	\N
cmm9emji1000v8ovt9qyy5ymn	cmm9ei9dm0000e0vt0xumg96e	cmm9eihdf0014e0vtsne8mkbe	OUT	-20	Consommation abrasifs — atelier B	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	2026-01-16 16:39:43.416	\N	\N	\N
cmm9emjil000w8ovt5fkr7ub8	cmm9ei9dm0000e0vt0xumg96e	cmm9eihdd0013e0vt1rxomfhz	OUT	-2	Soudure réparation pièce	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	2026-01-23 16:39:43.437	\N	\N	\N
cmm9emjj8000x8ovtfzpp2k4d	cmm9ei9dm0000e0vt0xumg96e	cmm9eihdf0014e0vtsne8mkbe	OUT	-20	Consommation abrasifs — atelier B	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	2026-02-08 16:39:43.459	\N	\N	\N
cmm9emjju000y8ovtyckh08um	cmm9ei9dm0000e0vt0xumg96e	cmm9eihdg0016e0vtohgkpxtd	OUT	-2	Remplacement roulements perceuse	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	2026-02-12 16:39:43.481	\N	\N	\N
cmm9emjkg000z8ovtuqeeweky	cmm9ei9dm0000e0vt0xumg96e	cmm9eih7k000ze0vttb44edyq	IN	10	Réception BC-2024-009	3u91OIZmLtz0O5rD2b6BUwQW5XISptsm	2026-02-15 16:39:43.503	\N	\N	\N
cmm9emjl300108ovt1fe9nteq	cmm9ei9dm0000e0vt0xumg96e	cmm9eih7j000xe0vt8wwdlu2a	IN	3	Réception BC-2024-009	3u91OIZmLtz0O5rD2b6BUwQW5XISptsm	2026-02-15 16:39:43.526	\N	\N	\N
\.


--
-- Data for Name: stock_transfer_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stock_transfer_requests (id, "tenantId", "fromSiteId", "toSiteId", "stockItemId", quantity, status, "requestedById", "approvedById", reason, "createdAt", "resolvedAt") FROM stdin;
cmm8b23330003dojxviep7c4n	cmm2h12430000m0vt2y472aho	cmm2h12780007m0vt4nfhqp6j	cmm2hcm9z000am0vtqzixhsb7	cmm2ie5090002wkvtuh8rjhu1	10	COMPLETED	oigEDBSRaRUSScAcdrTRktVoWDJSXk8G	oigEDBSRaRUSScAcdrTRktVoWDJSXk8G	besoin urgent	2026-03-01 22:12:03.999	2026-03-01 22:12:20.876
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.suppliers (id, "tenantId", name, email, phone) FROM stdin;
cmm8b3cir0008dojx5almtm7q	cmm2h12430000m0vt2y472aho	Wurth	\N	\N
sup-demo-pneumatique	cmm9ei9dm0000e0vt0xumg96e	Festo France SAS	commandes@festo.fr	01 60 13 60 13
sup-demo-roulements	cmm9ei9dm0000e0vt0xumg96e	Roulements & Transmissions SARL	contact@rt-sarl.fr	04 72 11 22 33
sup-demo-elec	cmm9ei9dm0000e0vt0xumg96e	Electro-Distribution Pro	pro@edpro.fr	04 78 90 12 34
sup-demo-fluides	cmm9ei9dm0000e0vt0xumg96e	TotalEnergies Lubrifiants	lubrifiants@totalenergies.fr	01 47 44 45 46
\.


--
-- Data for Name: tenant_modules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenant_modules (id, "tenantId", module, "isActive", "activatedAt") FROM stdin;
cmm2h125d0002m0vtcl02ew8v	cmm2h12430000m0vt2y472aho	GMAO	t	2026-02-25 20:12:36.684
cmm6frs5700020kloh2jn2vae	cmm6frs4i00000klo3by7tb97	GMAO	t	2026-02-28 14:48:28.986
cmm2h125d0003m0vtzmcnlpu5	cmm2h12430000m0vt2y472aho	STOCK_MANAGEMENT	t	2026-03-01 21:49:36.764
cmm2h125d0004m0vt32epke5i	cmm2h12430000m0vt2y472aho	AI_ASSISTANT	t	2026-03-01 21:49:37.174
cmm2h125d0005m0vtb581f23z	cmm2h12430000m0vt2y472aho	ADVANCED_REPORTS	t	2026-03-01 21:49:37.584
cmm2h125d0006m0vtvtq51vpm	cmm2h12430000m0vt2y472aho	INTER_SITE_TRANSFERS	t	2026-03-01 21:49:37.973
cmm9ei9ew0002e0vttjlwmd2i	cmm9ei9dm0000e0vt0xumg96e	GMAO	t	2025-12-02 16:36:22.942
cmm9ei9ew0003e0vtt5q423ty	cmm9ei9dm0000e0vt0xumg96e	STOCK_MANAGEMENT	t	2025-12-02 16:36:22.943
cmm9ei9ew0004e0vtal1mqi9e	cmm9ei9dm0000e0vt0xumg96e	ADVANCED_REPORTS	t	2026-01-01 16:36:22.943
cmm9ei9ew0005e0vtd80hy1eb	cmm9ei9dm0000e0vt0xumg96e	INTER_SITE_TRANSFERS	t	2026-01-01 16:36:22.943
cmm9ei9ew0006e0vtsc0z1z6x	cmm9ei9dm0000e0vt0xumg96e	AI_ASSISTANT	f	\N
\.


--
-- Data for Name: tenant_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenant_roles (id, "tenantId", name, permissions, "isSystem", "createdAt", "updatedAt") FROM stdin;
cmm2ibx750001wkvtver6fikz	cmm2h12430000m0vt2y472aho	tqt	{machine:read,machine:archive,machine:update,machine:create,intervention:update,intervention:create,intervention:assign,intervention:cancel,stock:create,stock:update,stock:transfer:create,user:invite,user:deactivate,user:update-role,user:read}	f	2026-02-25 20:49:03.184	2026-02-25 20:49:03.184
\.


--
-- Data for Name: tenant_users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenant_users (id, "tenantId", "authUserId", role, "isActive", "joinedAt", "updatedAt", "tenantRoleId", "jobTitle", "managerId") FROM stdin;
cmm2h13d00008m0vtn416ndnl	cmm2h12430000m0vt2y472aho	oigEDBSRaRUSScAcdrTRktVoWDJSXk8G	client_admin	t	2026-02-25 20:12:38.34	2026-02-25 20:12:38.34	\N	\N	\N
cmm2i61hc0000wkvthnms8zy6	cmm2h12430000m0vt2y472aho	4uIzbcv0rXIIJbjQW7E60vu2mZQgPdIN	technician	t	2026-02-25 20:44:28.8	2026-02-25 20:44:28.8	\N	\N	\N
cmm6frs5o00030klo3iqyuq3v	cmm6frs4i00000klo3by7tb97	ORbxIiqUaJxxrNPpFBOWVeB3ovc17lb6	client_admin	t	2026-02-28 14:48:29.004	2026-02-28 14:48:29.004	\N	\N	\N
cmm9eiazz0007e0vtcd5cmsyj	cmm9ei9dm0000e0vt0xumg96e	3u91OIZmLtz0O5rD2b6BUwQW5XISptsm	client_admin	t	2026-03-02 16:36:25.775	2026-03-02 16:36:25.775	\N	Responsable Maintenance	\N
cmm9eicgi000ae0vtrkqoros9	cmm9ei9dm0000e0vt0xumg96e	V24wMy55vpIIcAhPh9i7Uwc4v2vQBqsc	workshop_manager	t	2026-03-02 16:36:27.665	2026-03-02 16:36:27.665	\N	Chef d'atelier	\N
cmm9eidwr000de0vtbwwkc00f	cmm9ei9dm0000e0vt0xumg96e	O9VyiUjeIVzV4eUpwONZ47gX7QlD2Esl	technician	t	2026-03-02 16:36:29.547	2026-03-02 16:36:29.547	\N	Technicienne hydraulique	\N
cmm9eifch000fe0vtbu119epk	cmm9ei9dm0000e0vt0xumg96e	izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	technician	t	2026-03-02 16:36:31.409	2026-03-02 16:36:31.409	\N	Technicien électromécanique	\N
cmm9eigs6000ie0vtizur86xa	cmm9ei9dm0000e0vt0xumg96e	VRC1ECVA7MOwxjlQfjMYsuyzuWWmIc90	reader	t	2026-03-02 16:36:33.27	2026-03-02 16:36:33.27	\N	Directrice de site	\N
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenants (id, name, slug, "isActive", "createdAt", "updatedAt") FROM stdin;
cmm2h12430000m0vt2y472aho	Heinrich&bock	heinrich-bock	t	2026-02-25 20:12:36.702	2026-02-25 20:12:36.702
cmm6frs4i00000klo3by7tb97	Schiller	schiller-1772290108960	t	2026-02-28 14:48:28.961	2026-02-28 14:48:28.961
cmm9ei9dm0000e0vt0xumg96e	MekaSuite Demo	mekasuite-demo	t	2026-03-02 16:36:23.095	2026-03-02 16:36:23.095
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt", "tenantId", "mustChangePassword") FROM stdin;
m9GPASkivF4pLVqBkJwn1Imze6w8f7aw	Akgul	admin@example.com	f	\N	2026-02-25 17:57:01.479	2026-02-25 17:57:01.479	\N	f
oigEDBSRaRUSScAcdrTRktVoWDJSXk8G	Mathias	admin-krauter@hotmail.com	f	\N	2026-02-25 20:12:38.265	2026-02-25 20:12:38.265	\N	f
4uIzbcv0rXIIJbjQW7E60vu2mZQgPdIN	adrien akgul	adrienakgul@hotmail.com	f	\N	2026-02-25 20:44:28.7	2026-02-25 20:44:28.7	\N	f
ORbxIiqUaJxxrNPpFBOWVeB3ovc17lb6	Antoine	test@email.com	f	\N	2026-02-28 14:48:28.916	2026-02-28 14:48:28.916	\N	f
3u91OIZmLtz0O5rD2b6BUwQW5XISptsm	Alice Martin	admin@demo.mekasuite.fr	f	\N	2026-03-02 16:36:25.678	2026-03-02 16:36:25.678	\N	f
V24wMy55vpIIcAhPh9i7Uwc4v2vQBqsc	Bernard Dupont	chef@demo.mekasuite.fr	f	\N	2026-03-02 16:36:27.582	2026-03-02 16:36:27.582	\N	f
O9VyiUjeIVzV4eUpwONZ47gX7QlD2Esl	Carla Fernandez	tech1@demo.mekasuite.fr	f	\N	2026-03-02 16:36:29.464	2026-03-02 16:36:29.464	\N	f
izNZVjghSGTDAWYuA2ryfazaWSBqWHsd	David Nguyen	tech2@demo.mekasuite.fr	f	\N	2026-03-02 16:36:31.327	2026-03-02 16:36:31.327	\N	f
VRC1ECVA7MOwxjlQfjMYsuyzuWWmIc90	Emma Rousseau	lecture@demo.mekasuite.fr	f	\N	2026-03-02 16:36:33.187	2026-03-02 16:36:33.187	\N	f
\.


--
-- Data for Name: user_sites; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_sites (id, "tenantId", "tenantUserId", "siteId", "assignedAt") FROM stdin;
cmm9eib170008e0vt3401u7d5	cmm9ei9dm0000e0vt0xumg96e	cmm9eiazz0007e0vtcd5cmsyj	site-demo-a	2026-03-02 16:36:25.801
cmm9eib170009e0vtw7kayeyq	cmm9ei9dm0000e0vt0xumg96e	cmm9eiazz0007e0vtcd5cmsyj	site-demo-b	2026-03-02 16:36:25.801
cmm9eichl000be0vtfoixh3io	cmm9ei9dm0000e0vt0xumg96e	cmm9eicgi000ae0vtrkqoros9	site-demo-a	2026-03-02 16:36:27.686
cmm9eichl000ce0vtq8brwxxc	cmm9ei9dm0000e0vt0xumg96e	cmm9eicgi000ae0vtrkqoros9	site-demo-b	2026-03-02 16:36:27.686
cmm9eidxx000ee0vtfs90nzro	cmm9ei9dm0000e0vt0xumg96e	cmm9eidwr000de0vtbwwkc00f	site-demo-a	2026-03-02 16:36:29.569
cmm9eifdl000ge0vta0mqo51o	cmm9ei9dm0000e0vt0xumg96e	cmm9eifch000fe0vtbu119epk	site-demo-a	2026-03-02 16:36:31.429
cmm9eifdl000he0vtbcbce4cr	cmm9ei9dm0000e0vt0xumg96e	cmm9eifch000fe0vtbu119epk	site-demo-b	2026-03-02 16:36:31.429
cmm9eigtb000je0vtfmmyrqmb	cmm9ei9dm0000e0vt0xumg96e	cmm9eigs6000ie0vtizur86xa	site-demo-a	2026-03-02 16:36:33.291
cmm9eigtb000ke0vtg93xzkpj	cmm9ei9dm0000e0vt0xumg96e	cmm9eigs6000ie0vtizur86xa	site-demo-b	2026-03-02 16:36:33.291
\.


--
-- Data for Name: verification; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.verification (id, identifier, value, "expiresAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Name: account account_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.account
    ADD CONSTRAINT account_pkey PRIMARY KEY (id);


--
-- Name: invitation invitation_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.invitation
    ADD CONSTRAINT invitation_pkey PRIMARY KEY (id);


--
-- Name: jwks jwks_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.jwks
    ADD CONSTRAINT jwks_pkey PRIMARY KEY (id);


--
-- Name: member member_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.member
    ADD CONSTRAINT member_pkey PRIMARY KEY (id);


--
-- Name: organization organization_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.organization
    ADD CONSTRAINT organization_pkey PRIMARY KEY (id);


--
-- Name: organization organization_slug_key; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.organization
    ADD CONSTRAINT organization_slug_key UNIQUE (slug);


--
-- Name: project_config project_config_endpoint_id_key; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.project_config
    ADD CONSTRAINT project_config_endpoint_id_key UNIQUE (endpoint_id);


--
-- Name: project_config project_config_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.project_config
    ADD CONSTRAINT project_config_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (id);


--
-- Name: session session_token_key; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.session
    ADD CONSTRAINT session_token_key UNIQUE (token);


--
-- Name: user user_email_key; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth."user"
    ADD CONSTRAINT user_email_key UNIQUE (email);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: verification verification_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.verification
    ADD CONSTRAINT verification_pkey PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: account account_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: checklist_template_items checklist_template_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checklist_template_items
    ADD CONSTRAINT checklist_template_items_pkey PRIMARY KEY (id);


--
-- Name: checklist_templates checklist_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checklist_templates
    ADD CONSTRAINT checklist_templates_pkey PRIMARY KEY (id);


--
-- Name: custom_reports custom_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_reports
    ADD CONSTRAINT custom_reports_pkey PRIMARY KEY (id);


--
-- Name: intervention_attachments intervention_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intervention_attachments
    ADD CONSTRAINT intervention_attachments_pkey PRIMARY KEY (id);


--
-- Name: intervention_checklist_items intervention_checklist_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intervention_checklist_items
    ADD CONSTRAINT intervention_checklist_items_pkey PRIMARY KEY (id);


--
-- Name: intervention_checklists intervention_checklists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intervention_checklists
    ADD CONSTRAINT intervention_checklists_pkey PRIMARY KEY (id);


--
-- Name: intervention_notes intervention_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intervention_notes
    ADD CONSTRAINT intervention_notes_pkey PRIMARY KEY (id);


--
-- Name: intervention_parts_used intervention_parts_used_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intervention_parts_used
    ADD CONSTRAINT intervention_parts_used_pkey PRIMARY KEY (id);


--
-- Name: intervention_planned_materials intervention_planned_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intervention_planned_materials
    ADD CONSTRAINT intervention_planned_materials_pkey PRIMARY KEY (id);


--
-- Name: intervention_template_checklist_items intervention_template_checklist_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intervention_template_checklist_items
    ADD CONSTRAINT intervention_template_checklist_items_pkey PRIMARY KEY (id);


--
-- Name: intervention_templates intervention_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intervention_templates
    ADD CONSTRAINT intervention_templates_pkey PRIMARY KEY (id);


--
-- Name: intervention_time_entries intervention_time_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intervention_time_entries
    ADD CONSTRAINT intervention_time_entries_pkey PRIMARY KEY (id);


--
-- Name: interventions interventions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interventions
    ADD CONSTRAINT interventions_pkey PRIMARY KEY (id);


--
-- Name: licenses licenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licenses
    ADD CONSTRAINT licenses_pkey PRIMARY KEY (id);


--
-- Name: machine_attachments machine_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.machine_attachments
    ADD CONSTRAINT machine_attachments_pkey PRIMARY KEY (id);


--
-- Name: machine_components machine_components_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.machine_components
    ADD CONSTRAINT machine_components_pkey PRIMARY KEY (id);


--
-- Name: machine_counter_readings machine_counter_readings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.machine_counter_readings
    ADD CONSTRAINT machine_counter_readings_pkey PRIMARY KEY (id);


--
-- Name: machine_counters machine_counters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.machine_counters
    ADD CONSTRAINT machine_counters_pkey PRIMARY KEY (id);


--
-- Name: machines machines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.machines
    ADD CONSTRAINT machines_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: purchase_order_items purchase_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_pkey PRIMARY KEY (id);


--
-- Name: purchase_orders purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (id);


--
-- Name: sites sites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sites
    ADD CONSTRAINT sites_pkey PRIMARY KEY (id);


--
-- Name: stock_inventory_items stock_inventory_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_inventory_items
    ADD CONSTRAINT stock_inventory_items_pkey PRIMARY KEY (id);


--
-- Name: stock_inventory_sessions stock_inventory_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_inventory_sessions
    ADD CONSTRAINT stock_inventory_sessions_pkey PRIMARY KEY (id);


--
-- Name: stock_item_suppliers stock_item_suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_item_suppliers
    ADD CONSTRAINT stock_item_suppliers_pkey PRIMARY KEY (id);


--
-- Name: stock_items stock_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_items
    ADD CONSTRAINT stock_items_pkey PRIMARY KEY (id);


--
-- Name: stock_movements stock_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_pkey PRIMARY KEY (id);


--
-- Name: stock_transfer_requests stock_transfer_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transfer_requests
    ADD CONSTRAINT stock_transfer_requests_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: tenant_modules tenant_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_modules
    ADD CONSTRAINT tenant_modules_pkey PRIMARY KEY (id);


--
-- Name: tenant_roles tenant_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_roles
    ADD CONSTRAINT tenant_roles_pkey PRIMARY KEY (id);


--
-- Name: tenant_users tenant_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_users
    ADD CONSTRAINT tenant_users_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: user_sites user_sites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sites
    ADD CONSTRAINT user_sites_pkey PRIMARY KEY (id);


--
-- Name: verification verification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification
    ADD CONSTRAINT verification_pkey PRIMARY KEY (id);


--
-- Name: account_userId_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX "account_userId_idx" ON neon_auth.account USING btree ("userId");


--
-- Name: invitation_email_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX invitation_email_idx ON neon_auth.invitation USING btree (email);


--
-- Name: invitation_organizationId_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX "invitation_organizationId_idx" ON neon_auth.invitation USING btree ("organizationId");


--
-- Name: member_organizationId_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX "member_organizationId_idx" ON neon_auth.member USING btree ("organizationId");


--
-- Name: member_userId_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX "member_userId_idx" ON neon_auth.member USING btree ("userId");


--
-- Name: organization_slug_uidx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE UNIQUE INDEX organization_slug_uidx ON neon_auth.organization USING btree (slug);


--
-- Name: session_userId_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX "session_userId_idx" ON neon_auth.session USING btree ("userId");


--
-- Name: verification_identifier_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX verification_identifier_idx ON neon_auth.verification USING btree (identifier);


--
-- Name: audit_logs_tenantId_entityType_entityId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "audit_logs_tenantId_entityType_entityId_idx" ON public.audit_logs USING btree ("tenantId", "entityType", "entityId");


--
-- Name: audit_logs_tenantId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "audit_logs_tenantId_idx" ON public.audit_logs USING btree ("tenantId");


--
-- Name: audit_logs_tenantId_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "audit_logs_tenantId_userId_idx" ON public.audit_logs USING btree ("tenantId", "userId");


--
-- Name: checklist_template_items_tenantId_templateId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "checklist_template_items_tenantId_templateId_idx" ON public.checklist_template_items USING btree ("tenantId", "templateId");


--
-- Name: checklist_templates_tenantId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "checklist_templates_tenantId_idx" ON public.checklist_templates USING btree ("tenantId");


--
-- Name: custom_reports_tenantId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "custom_reports_tenantId_idx" ON public.custom_reports USING btree ("tenantId");


--
-- Name: intervention_attachments_tenantId_interventionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "intervention_attachments_tenantId_interventionId_idx" ON public.intervention_attachments USING btree ("tenantId", "interventionId");


--
-- Name: intervention_checklist_items_tenantId_checklistId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "intervention_checklist_items_tenantId_checklistId_idx" ON public.intervention_checklist_items USING btree ("tenantId", "checklistId");


--
-- Name: intervention_checklists_tenantId_interventionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "intervention_checklists_tenantId_interventionId_idx" ON public.intervention_checklists USING btree ("tenantId", "interventionId");


--
-- Name: intervention_notes_tenantId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "intervention_notes_tenantId_idx" ON public.intervention_notes USING btree ("tenantId");


--
-- Name: intervention_parts_used_tenantId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "intervention_parts_used_tenantId_idx" ON public.intervention_parts_used USING btree ("tenantId");


--
-- Name: intervention_planned_materials_interventionId_stockItemId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "intervention_planned_materials_interventionId_stockItemId_key" ON public.intervention_planned_materials USING btree ("interventionId", "stockItemId");


--
-- Name: intervention_planned_materials_tenantId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "intervention_planned_materials_tenantId_idx" ON public.intervention_planned_materials USING btree ("tenantId");


--
-- Name: intervention_template_checklist_items_tenantId_templateId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "intervention_template_checklist_items_tenantId_templateId_idx" ON public.intervention_template_checklist_items USING btree ("tenantId", "templateId");


--
-- Name: intervention_templates_tenantId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "intervention_templates_tenantId_idx" ON public.intervention_templates USING btree ("tenantId");


--
-- Name: intervention_time_entries_tenantId_interventionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "intervention_time_entries_tenantId_interventionId_idx" ON public.intervention_time_entries USING btree ("tenantId", "interventionId");


--
-- Name: interventions_tenantId_assignedUserId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "interventions_tenantId_assignedUserId_idx" ON public.interventions USING btree ("tenantId", "assignedUserId");


--
-- Name: interventions_tenantId_siteId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "interventions_tenantId_siteId_idx" ON public.interventions USING btree ("tenantId", "siteId");


--
-- Name: interventions_tenantId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "interventions_tenantId_status_idx" ON public.interventions USING btree ("tenantId", status);


--
-- Name: licenses_tenantId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "licenses_tenantId_key" ON public.licenses USING btree ("tenantId");


--
-- Name: machine_attachments_tenantId_machineId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "machine_attachments_tenantId_machineId_idx" ON public.machine_attachments USING btree ("tenantId", "machineId");


--
-- Name: machine_components_parentId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "machine_components_parentId_idx" ON public.machine_components USING btree ("parentId");


--
-- Name: machine_components_tenantId_machineId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "machine_components_tenantId_machineId_idx" ON public.machine_components USING btree ("tenantId", "machineId");


--
-- Name: machine_counter_readings_tenantId_counterId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "machine_counter_readings_tenantId_counterId_idx" ON public.machine_counter_readings USING btree ("tenantId", "counterId");


--
-- Name: machine_counters_tenantId_machineId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "machine_counters_tenantId_machineId_idx" ON public.machine_counters USING btree ("tenantId", "machineId");


--
-- Name: machines_qrCodeSlug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "machines_qrCodeSlug_key" ON public.machines USING btree ("qrCodeSlug");


--
-- Name: machines_tenantId_siteId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "machines_tenantId_siteId_idx" ON public.machines USING btree ("tenantId", "siteId");


--
-- Name: notifications_tenantId_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "notifications_tenantId_userId_idx" ON public.notifications USING btree ("tenantId", "userId");


--
-- Name: notifications_tenantId_userId_readAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "notifications_tenantId_userId_readAt_idx" ON public.notifications USING btree ("tenantId", "userId", "readAt");


--
-- Name: purchase_order_items_purchaseOrderId_stockItemId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "purchase_order_items_purchaseOrderId_stockItemId_key" ON public.purchase_order_items USING btree ("purchaseOrderId", "stockItemId");


--
-- Name: purchase_order_items_tenantId_purchaseOrderId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "purchase_order_items_tenantId_purchaseOrderId_idx" ON public.purchase_order_items USING btree ("tenantId", "purchaseOrderId");


--
-- Name: purchase_orders_tenantId_siteId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "purchase_orders_tenantId_siteId_idx" ON public.purchase_orders USING btree ("tenantId", "siteId");


--
-- Name: session_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX session_token_key ON public.session USING btree (token);


--
-- Name: sites_tenantId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "sites_tenantId_idx" ON public.sites USING btree ("tenantId");


--
-- Name: stock_inventory_items_sessionId_stockItemId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "stock_inventory_items_sessionId_stockItemId_key" ON public.stock_inventory_items USING btree ("sessionId", "stockItemId");


--
-- Name: stock_inventory_items_tenantId_sessionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "stock_inventory_items_tenantId_sessionId_idx" ON public.stock_inventory_items USING btree ("tenantId", "sessionId");


--
-- Name: stock_inventory_sessions_tenantId_siteId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "stock_inventory_sessions_tenantId_siteId_idx" ON public.stock_inventory_sessions USING btree ("tenantId", "siteId");


--
-- Name: stock_item_suppliers_stockItemId_supplierId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "stock_item_suppliers_stockItemId_supplierId_key" ON public.stock_item_suppliers USING btree ("stockItemId", "supplierId");


--
-- Name: stock_item_suppliers_tenantId_stockItemId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "stock_item_suppliers_tenantId_stockItemId_idx" ON public.stock_item_suppliers USING btree ("tenantId", "stockItemId");


--
-- Name: stock_items_tenantId_siteId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "stock_items_tenantId_siteId_idx" ON public.stock_items USING btree ("tenantId", "siteId");


--
-- Name: stock_items_tenantId_siteId_reference_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "stock_items_tenantId_siteId_reference_key" ON public.stock_items USING btree ("tenantId", "siteId", reference);


--
-- Name: stock_movements_tenantId_stockItemId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "stock_movements_tenantId_stockItemId_idx" ON public.stock_movements USING btree ("tenantId", "stockItemId");


--
-- Name: stock_transfer_requests_tenantId_fromSiteId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "stock_transfer_requests_tenantId_fromSiteId_idx" ON public.stock_transfer_requests USING btree ("tenantId", "fromSiteId");


--
-- Name: stock_transfer_requests_tenantId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "stock_transfer_requests_tenantId_idx" ON public.stock_transfer_requests USING btree ("tenantId");


--
-- Name: suppliers_tenantId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "suppliers_tenantId_idx" ON public.suppliers USING btree ("tenantId");


--
-- Name: tenant_modules_tenantId_module_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "tenant_modules_tenantId_module_key" ON public.tenant_modules USING btree ("tenantId", module);


--
-- Name: tenant_roles_tenantId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "tenant_roles_tenantId_idx" ON public.tenant_roles USING btree ("tenantId");


--
-- Name: tenant_roles_tenantId_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "tenant_roles_tenantId_name_key" ON public.tenant_roles USING btree ("tenantId", name);


--
-- Name: tenant_users_authUserId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "tenant_users_authUserId_key" ON public.tenant_users USING btree ("authUserId");


--
-- Name: tenant_users_tenantId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "tenant_users_tenantId_idx" ON public.tenant_users USING btree ("tenantId");


--
-- Name: tenants_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tenants_slug_key ON public.tenants USING btree (slug);


--
-- Name: user_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX user_email_key ON public."user" USING btree (email);


--
-- Name: user_sites_tenantId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "user_sites_tenantId_idx" ON public.user_sites USING btree ("tenantId");


--
-- Name: user_sites_tenantUserId_siteId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "user_sites_tenantUserId_siteId_key" ON public.user_sites USING btree ("tenantUserId", "siteId");


--
-- Name: account account_userId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.account
    ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: invitation invitation_inviterId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.invitation
    ADD CONSTRAINT "invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: invitation invitation_organizationId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.invitation
    ADD CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES neon_auth.organization(id) ON DELETE CASCADE;


--
-- Name: member member_organizationId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.member
    ADD CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES neon_auth.organization(id) ON DELETE CASCADE;


--
-- Name: member member_userId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.member
    ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: session session_userId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.session
    ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: account account_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."user"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: checklist_template_items checklist_template_items_templateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checklist_template_items
    ADD CONSTRAINT "checklist_template_items_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES public.checklist_templates(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: intervention_attachments intervention_attachments_interventionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intervention_attachments
    ADD CONSTRAINT "intervention_attachments_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES public.interventions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: intervention_checklist_items intervention_checklist_items_checklistId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intervention_checklist_items
    ADD CONSTRAINT "intervention_checklist_items_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES public.intervention_checklists(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: intervention_checklists intervention_checklists_interventionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intervention_checklists
    ADD CONSTRAINT "intervention_checklists_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES public.interventions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: intervention_notes intervention_notes_interventionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intervention_notes
    ADD CONSTRAINT "intervention_notes_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES public.interventions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: intervention_parts_used intervention_parts_used_interventionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intervention_parts_used
    ADD CONSTRAINT "intervention_parts_used_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES public.interventions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: intervention_parts_used intervention_parts_used_stockItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intervention_parts_used
    ADD CONSTRAINT "intervention_parts_used_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES public.stock_items(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: intervention_planned_materials intervention_planned_materials_interventionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intervention_planned_materials
    ADD CONSTRAINT "intervention_planned_materials_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES public.interventions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: intervention_planned_materials intervention_planned_materials_stockItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intervention_planned_materials
    ADD CONSTRAINT "intervention_planned_materials_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES public.stock_items(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: intervention_template_checklist_items intervention_template_checklist_items_templateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intervention_template_checklist_items
    ADD CONSTRAINT "intervention_template_checklist_items_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES public.intervention_templates(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: intervention_time_entries intervention_time_entries_interventionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intervention_time_entries
    ADD CONSTRAINT "intervention_time_entries_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES public.interventions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: interventions interventions_machineId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interventions
    ADD CONSTRAINT "interventions_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES public.machines(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: interventions interventions_siteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interventions
    ADD CONSTRAINT "interventions_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES public.sites(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: licenses licenses_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licenses
    ADD CONSTRAINT "licenses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: machine_attachments machine_attachments_machineId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.machine_attachments
    ADD CONSTRAINT "machine_attachments_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES public.machines(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: machine_components machine_components_machineId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.machine_components
    ADD CONSTRAINT "machine_components_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES public.machines(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: machine_components machine_components_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.machine_components
    ADD CONSTRAINT "machine_components_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.machine_components(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: machine_components machine_components_stockItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.machine_components
    ADD CONSTRAINT "machine_components_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES public.stock_items(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: machine_counter_readings machine_counter_readings_counterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.machine_counter_readings
    ADD CONSTRAINT "machine_counter_readings_counterId_fkey" FOREIGN KEY ("counterId") REFERENCES public.machine_counters(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: machine_counters machine_counters_machineId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.machine_counters
    ADD CONSTRAINT "machine_counters_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES public.machines(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: machines machines_siteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.machines
    ADD CONSTRAINT "machines_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES public.sites(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: purchase_order_items purchase_order_items_purchaseOrderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT "purchase_order_items_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES public.purchase_orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: purchase_order_items purchase_order_items_stockItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT "purchase_order_items_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES public.stock_items(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: purchase_orders purchase_orders_siteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT "purchase_orders_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES public.sites(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: purchase_orders purchase_orders_supplierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT "purchase_orders_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES public.suppliers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: session session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."user"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sites sites_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sites
    ADD CONSTRAINT "sites_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stock_inventory_items stock_inventory_items_sessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_inventory_items
    ADD CONSTRAINT "stock_inventory_items_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public.stock_inventory_sessions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stock_inventory_items stock_inventory_items_stockItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_inventory_items
    ADD CONSTRAINT "stock_inventory_items_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES public.stock_items(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stock_inventory_sessions stock_inventory_sessions_siteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_inventory_sessions
    ADD CONSTRAINT "stock_inventory_sessions_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES public.sites(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stock_item_suppliers stock_item_suppliers_stockItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_item_suppliers
    ADD CONSTRAINT "stock_item_suppliers_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES public.stock_items(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stock_item_suppliers stock_item_suppliers_supplierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_item_suppliers
    ADD CONSTRAINT "stock_item_suppliers_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES public.suppliers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stock_items stock_items_machineId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_items
    ADD CONSTRAINT "stock_items_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES public.machines(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: stock_items stock_items_siteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_items
    ADD CONSTRAINT "stock_items_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES public.sites(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stock_movements stock_movements_stockItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT "stock_movements_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES public.stock_items(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: stock_transfer_requests stock_transfer_requests_fromSiteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transfer_requests
    ADD CONSTRAINT "stock_transfer_requests_fromSiteId_fkey" FOREIGN KEY ("fromSiteId") REFERENCES public.sites(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: stock_transfer_requests stock_transfer_requests_stockItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transfer_requests
    ADD CONSTRAINT "stock_transfer_requests_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES public.stock_items(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: stock_transfer_requests stock_transfer_requests_toSiteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transfer_requests
    ADD CONSTRAINT "stock_transfer_requests_toSiteId_fkey" FOREIGN KEY ("toSiteId") REFERENCES public.sites(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tenant_modules tenant_modules_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_modules
    ADD CONSTRAINT "tenant_modules_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tenant_roles tenant_roles_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_roles
    ADD CONSTRAINT "tenant_roles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tenant_users tenant_users_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_users
    ADD CONSTRAINT "tenant_users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tenant_users tenant_users_tenantRoleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_users
    ADD CONSTRAINT "tenant_users_tenantRoleId_fkey" FOREIGN KEY ("tenantRoleId") REFERENCES public.tenant_roles(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: user_sites user_sites_siteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sites
    ADD CONSTRAINT "user_sites_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES public.sites(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_sites user_sites_tenantUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sites
    ADD CONSTRAINT "user_sites_tenantUserId_fkey" FOREIGN KEY ("tenantUserId") REFERENCES public.tenant_users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: checklist_template_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.checklist_template_items ENABLE ROW LEVEL SECURITY;

--
-- Name: checklist_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: custom_reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.custom_reports ENABLE ROW LEVEL SECURITY;

--
-- Name: intervention_attachments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.intervention_attachments ENABLE ROW LEVEL SECURITY;

--
-- Name: intervention_checklist_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.intervention_checklist_items ENABLE ROW LEVEL SECURITY;

--
-- Name: intervention_checklists; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.intervention_checklists ENABLE ROW LEVEL SECURITY;

--
-- Name: intervention_notes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.intervention_notes ENABLE ROW LEVEL SECURITY;

--
-- Name: intervention_parts_used; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.intervention_parts_used ENABLE ROW LEVEL SECURITY;

--
-- Name: intervention_planned_materials; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.intervention_planned_materials ENABLE ROW LEVEL SECURITY;

--
-- Name: intervention_template_checklist_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.intervention_template_checklist_items ENABLE ROW LEVEL SECURITY;

--
-- Name: intervention_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.intervention_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: intervention_time_entries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.intervention_time_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: interventions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;

--
-- Name: machine_attachments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.machine_attachments ENABLE ROW LEVEL SECURITY;

--
-- Name: machine_components; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.machine_components ENABLE ROW LEVEL SECURITY;

--
-- Name: machine_counter_readings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.machine_counter_readings ENABLE ROW LEVEL SECURITY;

--
-- Name: machine_counters; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.machine_counters ENABLE ROW LEVEL SECURITY;

--
-- Name: machines; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: purchase_order_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

--
-- Name: purchase_orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

--
-- Name: sites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

--
-- Name: stock_inventory_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stock_inventory_items ENABLE ROW LEVEL SECURITY;

--
-- Name: stock_inventory_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stock_inventory_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: stock_item_suppliers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stock_item_suppliers ENABLE ROW LEVEL SECURITY;

--
-- Name: stock_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;

--
-- Name: stock_movements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

--
-- Name: stock_transfer_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stock_transfer_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: suppliers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

--
-- Name: custom_reports tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation ON public.custom_reports USING (("tenantId" = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: intervention_template_checklist_items tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation ON public.intervention_template_checklist_items USING (("tenantId" = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: intervention_templates tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation ON public.intervention_templates USING (("tenantId" = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: purchase_order_items tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation ON public.purchase_order_items USING (("tenantId" = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: purchase_orders tenant_isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation ON public.purchase_orders USING (("tenantId" = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: audit_logs tenant_isolation_audit_logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_audit_logs ON public.audit_logs USING (("tenantId" = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: checklist_template_items tenant_isolation_checklist_template_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_checklist_template_items ON public.checklist_template_items USING (("tenantId" = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: checklist_templates tenant_isolation_checklist_templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_checklist_templates ON public.checklist_templates USING (("tenantId" = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: intervention_attachments tenant_isolation_intervention_attachments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_intervention_attachments ON public.intervention_attachments USING (("tenantId" = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: intervention_checklist_items tenant_isolation_intervention_checklist_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_intervention_checklist_items ON public.intervention_checklist_items USING (("tenantId" = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: intervention_checklists tenant_isolation_intervention_checklists; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_intervention_checklists ON public.intervention_checklists USING (("tenantId" = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: intervention_notes tenant_isolation_intervention_notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_intervention_notes ON public.intervention_notes USING (("tenantId" = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: intervention_parts_used tenant_isolation_intervention_parts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_intervention_parts ON public.intervention_parts_used USING (("tenantId" = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: intervention_time_entries tenant_isolation_intervention_time_entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_intervention_time_entries ON public.intervention_time_entries USING (("tenantId" = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: interventions tenant_isolation_interventions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_interventions ON public.interventions USING (("tenantId" = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: machine_attachments tenant_isolation_machine_attachments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_machine_attachments ON public.machine_attachments USING (("tenantId" = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: machine_components tenant_isolation_machine_components; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_machine_components ON public.machine_components USING (("tenantId" = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: machine_counter_readings tenant_isolation_machine_counter_readings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_machine_counter_readings ON public.machine_counter_readings USING (("tenantId" = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: machine_counters tenant_isolation_machine_counters; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_machine_counters ON public.machine_counters USING (("tenantId" = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: machines tenant_isolation_machines; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_machines ON public.machines USING (("tenantId" = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: notifications tenant_isolation_notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_notifications ON public.notifications USING (("tenantId" = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: intervention_planned_materials tenant_isolation_planned_materials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_planned_materials ON public.intervention_planned_materials USING (("tenantId" = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: sites tenant_isolation_sites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_sites ON public.sites USING (("tenantId" = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: stock_inventory_items tenant_isolation_stock_inventory_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_stock_inventory_items ON public.stock_inventory_items USING (("tenantId" = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: stock_inventory_sessions tenant_isolation_stock_inventory_sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_stock_inventory_sessions ON public.stock_inventory_sessions USING (("tenantId" = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: stock_item_suppliers tenant_isolation_stock_item_suppliers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_stock_item_suppliers ON public.stock_item_suppliers USING (("tenantId" = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: stock_items tenant_isolation_stock_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_stock_items ON public.stock_items USING (("tenantId" = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: stock_movements tenant_isolation_stock_movements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_stock_movements ON public.stock_movements USING (("tenantId" = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: stock_transfer_requests tenant_isolation_stock_transfers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_stock_transfers ON public.stock_transfer_requests USING (("tenantId" = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: suppliers tenant_isolation_suppliers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_suppliers ON public.suppliers USING (("tenantId" = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: tenant_roles tenant_isolation_tenant_roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_tenant_roles ON public.tenant_roles USING (("tenantId" = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: tenant_users tenant_isolation_tenant_users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_tenant_users ON public.tenant_users USING (("tenantId" = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: user_sites tenant_isolation_user_sites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_user_sites ON public.user_sites USING (("tenantId" = current_setting('app.current_tenant_id'::text, true)));


--
-- Name: tenant_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tenant_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: tenant_users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

--
-- Name: user_sites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_sites ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict ASKrcx22eDBoRMQK5wdHM8BPEp9ojHpao2VxM30NnEehMygVpnDaPaWkDkiuD9P

