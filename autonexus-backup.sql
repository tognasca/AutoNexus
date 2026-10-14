--
-- PostgreSQL database cluster dump
--

\restrict EN4aebEjJhWJcTzVSgf3fENOlbUBlFC1fZXgxOSljQufC1lKHyGLnq4yXe43xKF

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Roles
--

CREATE ROLE autonexus;
ALTER ROLE autonexus WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:dpdYQVUZi8kTu86QEOMDdQ==$A6LBRcYkNezn7zWvCj/jqKwm2UdhawEsemlMxhwCH/A=:dxiHcQm0zKHFpKCPit2z6KpaD52M4XhsAmxpNsV8D9Q=';

--
-- User Configurations
--








\unrestrict EN4aebEjJhWJcTzVSgf3fENOlbUBlFC1fZXgxOSljQufC1lKHyGLnq4yXe43xKF

--
-- Databases
--

--
-- Database "template1" dump
--

\connect template1

--
-- PostgreSQL database dump
--

\restrict gSXZhYMmq3MfsGntcqqiQG8IffUCb2yY38d5zvPQ355BD8dc43TuEzUu5jaTtxj

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

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
-- PostgreSQL database dump complete
--

\unrestrict gSXZhYMmq3MfsGntcqqiQG8IffUCb2yY38d5zvPQ355BD8dc43TuEzUu5jaTtxj

--
-- Database "autonexus" dump
--

--
-- PostgreSQL database dump
--

\restrict YK2BLfMwod8Td8bQCrUdAUsqeddl1b2Q0DZg5TNdhK9ZWB7e6gMBdUN3fJlNuBw

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

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
-- Name: autonexus; Type: DATABASE; Schema: -; Owner: autonexus
--

CREATE DATABASE autonexus WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE autonexus OWNER TO autonexus;

\unrestrict YK2BLfMwod8Td8bQCrUdAUsqeddl1b2Q0DZg5TNdhK9ZWB7e6gMBdUN3fJlNuBw
\connect autonexus
\restrict YK2BLfMwod8Td8bQCrUdAUsqeddl1b2Q0DZg5TNdhK9ZWB7e6gMBdUN3fJlNuBw

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: BankConfigs; Type: TABLE; Schema: public; Owner: autonexus
--

CREATE TABLE public."BankConfigs" (
    id uuid NOT NULL,
    "bankCode" text NOT NULL,
    name text NOT NULL,
    "defaultMonthlyRate" numeric NOT NULL,
    "apiUrl" text NOT NULL,
    "apiKey" text NOT NULL,
    "apiSecret" text,
    "merchantId" text,
    "isActive" boolean NOT NULL,
    "isSandbox" boolean NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone,
    "tenantId" uuid DEFAULT '00000000-0000-0000-0000-000000000001'::uuid NOT NULL
);


ALTER TABLE public."BankConfigs" OWNER TO autonexus;

--
-- Name: BuyerAccessLinks; Type: TABLE; Schema: public; Owner: autonexus
--

CREATE TABLE public."BuyerAccessLinks" (
    id uuid NOT NULL,
    "vehicleId" uuid NOT NULL,
    token text NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "isRevoked" boolean NOT NULL,
    "createdByUserId" uuid NOT NULL,
    "buyerName" text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone,
    "tenantId" uuid DEFAULT '00000000-0000-0000-0000-000000000001'::uuid NOT NULL
);


ALTER TABLE public."BuyerAccessLinks" OWNER TO autonexus;

--
-- Name: CompanyDocuments; Type: TABLE; Schema: public; Owner: autonexus
--

CREATE TABLE public."CompanyDocuments" (
    id uuid NOT NULL,
    title text NOT NULL,
    category text NOT NULL,
    "fileUrl" text NOT NULL,
    amount numeric,
    "referenceDate" timestamp with time zone,
    notes text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone,
    "tenantId" uuid DEFAULT '00000000-0000-0000-0000-000000000001'::uuid NOT NULL
);


ALTER TABLE public."CompanyDocuments" OWNER TO autonexus;

--
-- Name: ElectronicAcceptances; Type: TABLE; Schema: public; Owner: autonexus
--

CREATE TABLE public."ElectronicAcceptances" (
    id uuid NOT NULL,
    "vehicleId" uuid NOT NULL,
    "buyerAccessLinkId" uuid,
    "buyerName" text NOT NULL,
    "buyerDocument" text NOT NULL,
    "ipAddress" text NOT NULL,
    "acceptedAt" timestamp with time zone NOT NULL,
    "termVersion" text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone,
    "tenantId" uuid DEFAULT '00000000-0000-0000-0000-000000000001'::uuid NOT NULL
);


ALTER TABLE public."ElectronicAcceptances" OWNER TO autonexus;

--
-- Name: VehicleBrands; Type: TABLE; Schema: public; Owner: autonexus
--

CREATE TABLE public."VehicleBrands" (
    id uuid NOT NULL,
    name text NOT NULL,
    "order" integer NOT NULL,
    "isActive" boolean NOT NULL
);


ALTER TABLE public."VehicleBrands" OWNER TO autonexus;

--
-- Name: VehicleModels; Type: TABLE; Schema: public; Owner: autonexus
--

CREATE TABLE public."VehicleModels" (
    id uuid NOT NULL,
    "vehicleBrandId" uuid NOT NULL,
    name text NOT NULL,
    "isActive" boolean NOT NULL
);


ALTER TABLE public."VehicleModels" OWNER TO autonexus;

--
-- Name: __EFMigrationsHistory; Type: TABLE; Schema: public; Owner: autonexus
--

CREATE TABLE public."__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL
);


ALTER TABLE public."__EFMigrationsHistory" OWNER TO autonexus;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: autonexus
--

CREATE TABLE public.audit_logs (
    id uuid NOT NULL,
    "userId" uuid,
    operation character varying(100) NOT NULL,
    resource character varying(100) NOT NULL,
    "resourceId" character varying(100),
    details character varying(4000),
    "executedAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone,
    "tenantId" uuid DEFAULT '00000000-0000-0000-0000-000000000001'::uuid NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO autonexus;

--
-- Name: cost_categories; Type: TABLE; Schema: public; Owner: autonexus
--

CREATE TABLE public.cost_categories (
    id uuid NOT NULL,
    name character varying(100) NOT NULL,
    description character varying(250),
    "isActive" boolean NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone,
    "tenantId" uuid DEFAULT '00000000-0000-0000-0000-000000000001'::uuid NOT NULL
);


ALTER TABLE public.cost_categories OWNER TO autonexus;

--
-- Name: costs; Type: TABLE; Schema: public; Owner: autonexus
--

CREATE TABLE public.costs (
    id uuid NOT NULL,
    "vehicleId" uuid NOT NULL,
    "costCategoryId" uuid NOT NULL,
    description character varying(250) NOT NULL,
    value numeric(18,2) NOT NULL,
    "costDate" timestamp with time zone NOT NULL,
    "responsibleUserId" uuid NOT NULL,
    notes character varying(1000),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone,
    "tenantId" uuid DEFAULT '00000000-0000-0000-0000-000000000001'::uuid NOT NULL
);


ALTER TABLE public.costs OWNER TO autonexus;

--
-- Name: document_categories; Type: TABLE; Schema: public; Owner: autonexus
--

CREATE TABLE public.document_categories (
    id uuid NOT NULL,
    name character varying(100) NOT NULL,
    description character varying(250),
    "isActive" boolean NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone,
    "tenantId" uuid DEFAULT '00000000-0000-0000-0000-000000000001'::uuid NOT NULL
);


ALTER TABLE public.document_categories OWNER TO autonexus;

--
-- Name: fipe_histories; Type: TABLE; Schema: public; Owner: autonexus
--

CREATE TABLE public.fipe_histories (
    id uuid NOT NULL,
    "vehicleId" uuid NOT NULL,
    "fipeValue" numeric(18,2) NOT NULL,
    "referenceMonth" integer NOT NULL,
    "referenceYear" integer NOT NULL,
    "consultationDate" timestamp with time zone NOT NULL,
    source character varying(100),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone,
    "tenantId" uuid DEFAULT '00000000-0000-0000-0000-000000000001'::uuid NOT NULL
);


ALTER TABLE public.fipe_histories OWNER TO autonexus;

--
-- Name: legal_documents; Type: TABLE; Schema: public; Owner: autonexus
--

CREATE TABLE public.legal_documents (
    id uuid NOT NULL,
    type integer NOT NULL,
    version integer NOT NULL,
    content text NOT NULL,
    "isActive" boolean NOT NULL,
    "publishedAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone
);


ALTER TABLE public.legal_documents OWNER TO autonexus;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: autonexus
--

CREATE TABLE public.payments (
    id uuid NOT NULL,
    "subscriptionId" uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency character varying(3) NOT NULL,
    method integer NOT NULL,
    status integer NOT NULL,
    provider character varying(50) NOT NULL,
    "externalPaymentId" character varying(200),
    "failureReason" character varying(500),
    "paidAt" timestamp with time zone,
    "planId" uuid,
    "billingCycle" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone,
    "tenantId" uuid DEFAULT '00000000-0000-0000-0000-000000000001'::uuid NOT NULL
);


ALTER TABLE public.payments OWNER TO autonexus;

--
-- Name: plans; Type: TABLE; Schema: public; Owner: autonexus
--

CREATE TABLE public.plans (
    id uuid NOT NULL,
    name character varying(100) NOT NULL,
    price numeric(10,2) NOT NULL,
    "isActive" boolean NOT NULL,
    "maxUsers" integer,
    "maxVehicles" integer,
    "maxStorageMb" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone,
    "annualPrice" numeric(10,2),
    "trialDays" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.plans OWNER TO autonexus;

--
-- Name: tenant_settings; Type: TABLE; Schema: public; Owner: autonexus
--

CREATE TABLE public.tenant_settings (
    id uuid NOT NULL,
    "companyName" character varying(200) NOT NULL,
    "logoUrl" character varying(500),
    "primaryColor" character varying(20) NOT NULL,
    "timeZone" character varying(100) NOT NULL,
    currency character varying(10) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone,
    "tenantId" uuid DEFAULT '00000000-0000-0000-0000-000000000001'::uuid NOT NULL
);


ALTER TABLE public.tenant_settings OWNER TO autonexus;

--
-- Name: tenant_subscriptions; Type: TABLE; Schema: public; Owner: autonexus
--

CREATE TABLE public.tenant_subscriptions (
    id uuid NOT NULL,
    "planId" uuid NOT NULL,
    status integer NOT NULL,
    "startDate" timestamp with time zone NOT NULL,
    "endDate" timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone,
    "tenantId" uuid DEFAULT '00000000-0000-0000-0000-000000000001'::uuid NOT NULL,
    "billingCycle" integer DEFAULT 0 NOT NULL,
    "cancelledAt" timestamp with time zone,
    "currentPeriodEnd" timestamp with time zone,
    "externalSubscriptionId" character varying(200),
    "paymentMethod" integer,
    "paymentProvider" character varying(50),
    "trialEndsAt" timestamp with time zone,
    "trialReminderSentAt" timestamp with time zone
);


ALTER TABLE public.tenant_subscriptions OWNER TO autonexus;

--
-- Name: tenants; Type: TABLE; Schema: public; Owner: autonexus
--

CREATE TABLE public.tenants (
    id uuid NOT NULL,
    name character varying(200) NOT NULL,
    slug character varying(100) NOT NULL,
    "isActive" boolean NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone
);


ALTER TABLE public.tenants OWNER TO autonexus;

--
-- Name: trades; Type: TABLE; Schema: public; Owner: autonexus
--

CREATE TABLE public.trades (
    id uuid NOT NULL,
    "receivedVehicleId" uuid NOT NULL,
    "deliveredVehicleId" uuid NOT NULL,
    "receivedVehicleFipe" numeric(18,2) NOT NULL,
    "deliveredVehicleFipe" numeric(18,2) NOT NULL,
    "receivedVehicleNegotiatedValue" numeric(18,2) NOT NULL,
    "deliveredVehicleNegotiatedValue" numeric(18,2) NOT NULL,
    "estimatedResaleCost" numeric(18,2) NOT NULL,
    "differenceValue" numeric(18,2) NOT NULL,
    "differencePaidByUs" boolean NOT NULL,
    indicator integer NOT NULL,
    "tradeDate" timestamp with time zone NOT NULL,
    "responsibleUserId" uuid NOT NULL,
    notes character varying(2000),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone,
    "tenantId" uuid DEFAULT '00000000-0000-0000-0000-000000000001'::uuid NOT NULL
);


ALTER TABLE public.trades OWNER TO autonexus;

--
-- Name: user_consents; Type: TABLE; Schema: public; Owner: autonexus
--

CREATE TABLE public.user_consents (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "documentType" integer NOT NULL,
    "documentVersion" integer NOT NULL,
    "acceptedAt" timestamp with time zone NOT NULL,
    "ipAddress" character varying(64),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone,
    "tenantId" uuid DEFAULT '00000000-0000-0000-0000-000000000001'::uuid NOT NULL
);


ALTER TABLE public.user_consents OWNER TO autonexus;

--
-- Name: users; Type: TABLE; Schema: public; Owner: autonexus
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    name character varying(150) NOT NULL,
    email character varying(150) NOT NULL,
    "passwordHash" character varying(500) NOT NULL,
    profile integer NOT NULL,
    "isActive" boolean NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone,
    "tenantId" uuid DEFAULT '00000000-0000-0000-0000-000000000001'::uuid NOT NULL
);


ALTER TABLE public.users OWNER TO autonexus;

--
-- Name: vehicle_documents; Type: TABLE; Schema: public; Owner: autonexus
--

CREATE TABLE public.vehicle_documents (
    id uuid NOT NULL,
    "vehicleId" uuid NOT NULL,
    "documentCategoryId" uuid NOT NULL,
    name character varying(150) NOT NULL,
    "fileName" character varying(255) NOT NULL,
    "storagePath" character varying(1000) NOT NULL,
    "mimeType" character varying(100) NOT NULL,
    "fileSize" bigint NOT NULL,
    "uploadedByUserId" uuid NOT NULL,
    notes character varying(1000),
    "showInCatalog" boolean NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone,
    "tenantId" uuid DEFAULT '00000000-0000-0000-0000-000000000001'::uuid NOT NULL
);


ALTER TABLE public.vehicle_documents OWNER TO autonexus;

--
-- Name: vehicle_photos; Type: TABLE; Schema: public; Owner: autonexus
--

CREATE TABLE public.vehicle_photos (
    id uuid NOT NULL,
    "vehicleId" uuid NOT NULL,
    "fileName" character varying(255) NOT NULL,
    "storagePath" character varying(1000) NOT NULL,
    "mimeType" character varying(100) NOT NULL,
    "fileSize" bigint NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "isMain" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone,
    "tenantId" uuid DEFAULT '00000000-0000-0000-0000-000000000001'::uuid NOT NULL
);


ALTER TABLE public.vehicle_photos OWNER TO autonexus;

--
-- Name: vehicle_types; Type: TABLE; Schema: public; Owner: autonexus
--

CREATE TABLE public.vehicle_types (
    id uuid NOT NULL,
    name character varying(50) NOT NULL,
    description character varying(250),
    "isActive" boolean NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone
);


ALTER TABLE public.vehicle_types OWNER TO autonexus;

--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: autonexus
--

CREATE TABLE public.vehicles (
    id uuid NOT NULL,
    "vehicleTypeId" uuid NOT NULL,
    brand character varying(100) NOT NULL,
    model character varying(100) NOT NULL,
    version character varying(100),
    "manufacturingYear" integer NOT NULL,
    "modelYear" integer NOT NULL,
    plate character varying(10),
    chassis character varying(30),
    renavam character varying(20),
    mileage integer NOT NULL,
    color character varying(50),
    fuel integer,
    transmission integer,
    status integer NOT NULL,
    "purchaseValue" numeric(18,2) NOT NULL,
    "listedValue" numeric(18,2),
    "saleValue" numeric(18,2),
    notes character varying(2000),
    "soldByUserId" uuid,
    "soldAt" timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone,
    "tenantId" uuid DEFAULT '00000000-0000-0000-0000-000000000001'::uuid NOT NULL
);


ALTER TABLE public.vehicles OWNER TO autonexus;

--
-- Name: webhook_events; Type: TABLE; Schema: public; Owner: autonexus
--

CREATE TABLE public.webhook_events (
    id uuid NOT NULL,
    provider character varying(50) NOT NULL,
    "externalEventId" character varying(200) NOT NULL,
    "eventType" character varying(100) NOT NULL,
    "rawPayload" text,
    "processedSuccessfully" boolean NOT NULL,
    "processingError" character varying(1000),
    "receivedAt" timestamp with time zone NOT NULL,
    "processedAt" timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone
);


ALTER TABLE public.webhook_events OWNER TO autonexus;

--
-- Data for Name: BankConfigs; Type: TABLE DATA; Schema: public; Owner: autonexus
--

COPY public."BankConfigs" (id, "bankCode", name, "defaultMonthlyRate", "apiUrl", "apiKey", "apiSecret", "merchantId", "isActive", "isSandbox", "createdAt", "updatedAt", "tenantId") FROM stdin;
0a63a800-a0a3-46b9-929b-56602f3ba025	itau	Itaú Veículos	1.55	https://api.itau.com.br/sandbox	SANDBOX_KEY_ITAU	SANDBOX_SECRET	STORE_123	t	t	2026-09-25 20:43:06.262752+00	\N	00000000-0000-0000-0000-000000000001
6097bd09-9a22-416a-ae24-9d35f8773117	bradesco	Bradesco Financiamentos	1.62	https://api.bradesco.com.br/sandbox	SANDBOX_KEY_BRADESCO	SANDBOX_SECRET	STORE_123	t	t	2026-09-25 20:43:06.262755+00	\N	00000000-0000-0000-0000-000000000001
7d1a24a4-00fe-4f08-8347-168c416bbdd6	bv	Banco BV	1.79	https://api.bv.com.br/sandbox	SANDBOX_KEY_BV	SANDBOX_SECRET	STORE_123	t	t	2026-09-25 20:43:06.262755+00	\N	00000000-0000-0000-0000-000000000001
e0257b9a-7854-4b26-b93a-234c33c4c841	santander	Santander Financiamentos	1.49	https://api.santander.com.br/sandbox	SANDBOX_KEY_SANTANDER	SANDBOX_SECRET	STORE_123	t	t	2026-09-25 20:43:06.262443+00	\N	00000000-0000-0000-0000-000000000001
\.


--
-- Data for Name: BuyerAccessLinks; Type: TABLE DATA; Schema: public; Owner: autonexus
--

COPY public."BuyerAccessLinks" (id, "vehicleId", token, "expiresAt", "isRevoked", "createdByUserId", "buyerName", "createdAt", "updatedAt", "tenantId") FROM stdin;
\.


--
-- Data for Name: CompanyDocuments; Type: TABLE DATA; Schema: public; Owner: autonexus
--

COPY public."CompanyDocuments" (id, title, category, "fileUrl", amount, "referenceDate", notes, "createdAt", "updatedAt", "tenantId") FROM stdin;
\.


--
-- Data for Name: ElectronicAcceptances; Type: TABLE DATA; Schema: public; Owner: autonexus
--

COPY public."ElectronicAcceptances" (id, "vehicleId", "buyerAccessLinkId", "buyerName", "buyerDocument", "ipAddress", "acceptedAt", "termVersion", "createdAt", "updatedAt", "tenantId") FROM stdin;
\.


--
-- Data for Name: VehicleBrands; Type: TABLE DATA; Schema: public; Owner: autonexus
--

COPY public."VehicleBrands" (id, name, "order", "isActive") FROM stdin;
1f5b4ff1-a02a-420a-911f-86e355a35f17	Honda	7	t
28d10884-ab02-42cd-b89d-7c3eb32e0be7	Volkswagen	3	t
4472eec2-c83d-4430-ab28-8735360407ad	Citroën	17	t
48c0ea79-2f9c-4248-8ad8-8579f8e514f0	Fiat	2	t
64a906d9-c5d2-462e-b660-c303766fe00d	RAM	20	t
64da6de1-5593-4829-bc16-be7ac5a8f6ee	Audi	15	t
6edba199-7eb2-4123-9d23-746928d0d272	BMW	13	t
74aea47c-7469-4b49-91e0-c2c978ba757e	Porsche	22	t
76cbb4d0-b20e-43d5-b5ed-30771e370afd	Renault	9	t
77947292-f35c-44be-9b71-0f093e680b6f	Ford	6	t
7cb37cb7-468e-45e2-9871-cab3629bbd68	Mercedes-Benz	14	t
94edec9e-914e-4e08-85c9-eb5c362e6232	Hyundai	5	t
9ebe2634-cc9d-438c-9fd1-6c6cda4160fa	GWM	12	t
bdb9161a-a1c7-4868-b67c-abe688b73705	Peugeot	16	t
c244825a-9a5c-4ace-ae00-3eb119cd7867	Caoa Chery	18	t
c4555ea1-f504-4c37-a62f-d6156c32f309	Mitsubishi	19	t
c761954b-2664-40b7-9d26-59a6e4f58795	Chevrolet	1	t
c7e073b9-4fa0-4255-b6c9-897041946cdb	Jeep	8	t
c802851f-f168-471c-96f6-55c9fc7b85d8	Nissan	10	t
d0390c7f-a8f3-4d39-9cc1-4bb82aed317a	BYD	11	t
e1026e28-dd6b-4080-8ccc-1e6e28f1ba76	Toyota	4	t
fba78d55-fd0e-4593-94a7-cb34b45c9005	Volvo	21	t
\.


--
-- Data for Name: VehicleModels; Type: TABLE DATA; Schema: public; Owner: autonexus
--

COPY public."VehicleModels" (id, "vehicleBrandId", name, "isActive") FROM stdin;
0153402a-099b-421e-b876-69e48459850f	c4555ea1-f504-4c37-a62f-d6156c32f309	Eclipse Cross	t
01673dba-e3ac-45be-b219-42533c9c9009	28d10884-ab02-42cd-b89d-7c3eb32e0be7	Up!	t
0254d3e0-f017-4bee-a299-3a5fc7a2f178	6edba199-7eb2-4123-9d23-746928d0d272	Série 1	t
030b17de-e67c-4557-91fe-d14d01975d13	94edec9e-914e-4e08-85c9-eb5c362e6232	Creta	t
048ff496-0e37-4043-b1f0-0f14351bd093	28d10884-ab02-42cd-b89d-7c3eb32e0be7	Voyage	t
063ebcd5-a063-44d7-b8af-b90796a8ad36	c244825a-9a5c-4ace-ae00-3eb119cd7867	iCar	t
06e9daef-132b-40a5-909a-45da68581dc3	28d10884-ab02-42cd-b89d-7c3eb32e0be7	Fox	t
0822f2a4-223e-4ef2-8301-33884887b437	4472eec2-c83d-4430-ab28-8735360407ad	C4 Cactus	t
0b9e78c7-9daa-4df6-bebb-1a686ba72ebe	c761954b-2664-40b7-9d26-59a6e4f58795	Onix	t
0e7ec3c5-05d2-4a02-b222-77ae5ca1243c	7cb37cb7-468e-45e2-9871-cab3629bbd68	Classe A	t
1344920b-ad35-4c29-86e3-57802f9e6183	c761954b-2664-40b7-9d26-59a6e4f58795	Cruze	t
15039d08-f176-4966-bf5f-87e504738d97	76cbb4d0-b20e-43d5-b5ed-30771e370afd	Captur	t
1803627a-aed5-491b-ac59-4ba62cebd07e	48c0ea79-2f9c-4248-8ad8-8579f8e514f0	Uno	t
1a441a79-8fe4-40b1-ab75-3db7c2427374	64a906d9-c5d2-462e-b660-c303766fe00d	3500	t
1ab5749e-d633-46be-819e-91e303c6d63f	e1026e28-dd6b-4080-8ccc-1e6e28f1ba76	Yaris	t
1bd5a8a5-0fb7-4a80-9954-45dc9af0ee9e	bdb9161a-a1c7-4868-b67c-abe688b73705	Partner	t
1bfd662a-c33f-463d-8dc1-fee03ffe3af7	e1026e28-dd6b-4080-8ccc-1e6e28f1ba76	Corolla	t
1d429e38-f3b4-464e-9388-7b6670bb5e79	7cb37cb7-468e-45e2-9871-cab3629bbd68	GLC	t
1e6b8527-ef0d-4f5e-bc13-260038a81a2f	28d10884-ab02-42cd-b89d-7c3eb32e0be7	T-Cross	t
24dee420-07c0-4cd6-b9b8-d62cde321da1	c761954b-2664-40b7-9d26-59a6e4f58795	Prisma	t
259bcd28-6c4d-48da-a1e4-1e6a974888b8	bdb9161a-a1c7-4868-b67c-abe688b73705	2008	t
264e483f-f34b-4568-acee-6cff3eb4d101	94edec9e-914e-4e08-85c9-eb5c362e6232	IX35	t
269bc80d-c57b-46b1-b9f7-cccf71a9576f	1f5b4ff1-a02a-420a-911f-86e355a35f17	Civic	t
2783c66b-fd7a-4205-83b2-6ce44df02852	28d10884-ab02-42cd-b89d-7c3eb32e0be7	Nivus	t
28779cf5-8183-4eed-b14c-4c6f29ef4a40	c802851f-f168-471c-96f6-55c9fc7b85d8	Sentra	t
28d58233-c2d5-4571-9cb5-188152fb669e	c7e073b9-4fa0-4255-b6c9-897041946cdb	Renegade	t
297dd454-c998-400e-b5c6-88f11b62ed53	64da6de1-5593-4829-bc16-be7ac5a8f6ee	Q3	t
2b27118b-f9a3-4cd2-be26-3d73ed9847b4	c244825a-9a5c-4ace-ae00-3eb119cd7867	Tiggo 5x	t
2b8ee42f-42f5-4c60-bcfa-7a0968a3d9ff	6edba199-7eb2-4123-9d23-746928d0d272	Série 3 (320i)	t
2e32c4a7-d452-4f99-a518-9b1066c04fa4	76cbb4d0-b20e-43d5-b5ed-30771e370afd	Sandero	t
2f00310b-4dea-47e9-89b9-eee21349db04	1f5b4ff1-a02a-420a-911f-86e355a35f17	ZR-V	t
3097c33e-86ec-4421-ba5d-f2afaf2a03ee	6edba199-7eb2-4123-9d23-746928d0d272	X5	t
30fbef65-a63f-47c4-bdf4-294288305522	48c0ea79-2f9c-4248-8ad8-8579f8e514f0	Palio	t
396bc175-6357-4f93-a2ec-144903d9687b	bdb9161a-a1c7-4868-b67c-abe688b73705	208	t
3adb7ee3-d9d9-4040-b2ee-e45cde93ce65	c4555ea1-f504-4c37-a62f-d6156c32f309	L200 Triton	t
3adeba17-9823-4002-8b57-8135127ead68	bdb9161a-a1c7-4868-b67c-abe688b73705	Expert	t
3bfbecf3-6823-457e-a9fd-58bd1c587430	94edec9e-914e-4e08-85c9-eb5c362e6232	Santa Fe	t
3cf62aa2-2c8e-479c-9a57-ad6c2259072b	c761954b-2664-40b7-9d26-59a6e4f58795	Celta	t
3d5915d1-d115-4e18-879d-df514b888dc8	fba78d55-fd0e-4593-94a7-cb34b45c9005	XC60	t
3ebefd9d-6c0a-4943-801c-1519b4522998	4472eec2-c83d-4430-ab28-8735360407ad	C3	t
3f12252f-fcb2-4f35-b76f-40774f5e122a	64da6de1-5593-4829-bc16-be7ac5a8f6ee	A3	t
41111396-ebac-44f9-b264-5afbfa2bf290	64a906d9-c5d2-462e-b660-c303766fe00d	Rampage	t
416cb5db-0a12-4abb-9816-7acef4f7d88f	c761954b-2664-40b7-9d26-59a6e4f58795	Trailblazer	t
464dd2f9-2a02-4716-9630-29ded57d0677	48c0ea79-2f9c-4248-8ad8-8579f8e514f0	Ducato	t
466ee71d-5cf0-4312-8408-51e376942ce4	c761954b-2664-40b7-9d26-59a6e4f58795	Spin	t
490696a0-e6c1-4c0c-a95e-9fe0b380a716	64a906d9-c5d2-462e-b660-c303766fe00d	1500	t
4a26b950-d9b3-42eb-8db3-33c434c70f4f	76cbb4d0-b20e-43d5-b5ed-30771e370afd	Kardian	t
4a799725-2d86-464a-9577-79e9d4277dc0	c4555ea1-f504-4c37-a62f-d6156c32f309	Pajero Full	t
4f027585-58c7-49e2-995a-4b99f40e6322	c244825a-9a5c-4ace-ae00-3eb119cd7867	Tiggo 2	t
52a42822-c325-48c8-8ff7-c24c79adfffc	c7e073b9-4fa0-4255-b6c9-897041946cdb	Compass	t
5338ce1e-6ead-47f8-800d-b808d64810e0	48c0ea79-2f9c-4248-8ad8-8579f8e514f0	Mobi	t
53c3260e-a2c0-4b57-80ce-47ea90d77c9e	48c0ea79-2f9c-4248-8ad8-8579f8e514f0	Idea	t
541ede16-77e3-4a35-8969-3a471a7d91df	c761954b-2664-40b7-9d26-59a6e4f58795	Equinox	t
550eee98-82f0-4a7f-8803-2d7c9b85aa6d	c761954b-2664-40b7-9d26-59a6e4f58795	S10	t
5706688d-bbd9-4082-95cb-2f96185a6689	74aea47c-7469-4b49-91e0-c2c978ba757e	Taycan	t
5719f4e2-78c6-43af-85fe-21a6e1d31f32	77947292-f35c-44be-9b71-0f093e680b6f	Mustang	t
5c8a2dc2-327a-40cf-8962-08462e4b5292	48c0ea79-2f9c-4248-8ad8-8579f8e514f0	Cronos	t
5f9d74e8-6904-4e27-9bab-a28da6032c6e	74aea47c-7469-4b49-91e0-c2c978ba757e	Macan	t
62471c67-7621-4007-8783-f85d92c7f080	d0390c7f-a8f3-4d39-9cc1-4bb82aed317a	King	t
66101c9b-0195-46fe-aad9-0af4653b83e1	c802851f-f168-471c-96f6-55c9fc7b85d8	Kicks	t
67bf9799-a5ba-47a1-95d7-b89aaffa5b43	c761954b-2664-40b7-9d26-59a6e4f58795	Corsa	t
68711f7e-8ad4-43cd-b1ee-f995c7dd619c	76cbb4d0-b20e-43d5-b5ed-30771e370afd	Kwid	t
6f3d4d88-034d-4f6d-ad78-74acf2f40861	6edba199-7eb2-4123-9d23-746928d0d272	M5	t
7034b411-8fc7-4834-b36b-6631d4e18263	7cb37cb7-468e-45e2-9871-cab3629bbd68	GLA	t
713ddec5-3fd5-482d-b41f-6407136e92ce	28d10884-ab02-42cd-b89d-7c3eb32e0be7	Polo	t
7388f925-bd76-4781-bfb2-6aa7908678b7	28d10884-ab02-42cd-b89d-7c3eb32e0be7	Taos	t
7536c101-6ee1-49a6-a4b2-b079db1bc01f	74aea47c-7469-4b49-91e0-c2c978ba757e	Panamera	t
757005ee-64d1-4a2f-a00c-c24376fe6025	c244825a-9a5c-4ace-ae00-3eb119cd7867	Tiggo 3x	t
75efc499-2591-4c4e-8aeb-333333c68813	94edec9e-914e-4e08-85c9-eb5c362e6232	HR	t
78a34316-5343-4a63-a73f-79da4dce09dc	1f5b4ff1-a02a-420a-911f-86e355a35f17	HR-V	t
7b829fc4-2f97-4ae3-9255-c4bc8a5d376c	fba78d55-fd0e-4593-94a7-cb34b45c9005	XC40	t
7bc60d0d-4821-453e-9a0e-f725b0d7c5ff	e1026e28-dd6b-4080-8ccc-1e6e28f1ba76	Camry	t
7c23c6d9-dee1-4dec-91f6-c562ea90998a	48c0ea79-2f9c-4248-8ad8-8579f8e514f0	Toro	t
7d4638e9-642b-48ca-9b74-ff499957313d	d0390c7f-a8f3-4d39-9cc1-4bb82aed317a	Dolphin	t
7ed56f28-f189-4420-a4d4-4da8dd472a19	e1026e28-dd6b-4080-8ccc-1e6e28f1ba76	Etios	t
7f27ea2f-96a9-474d-8f98-72beb569f9ba	76cbb4d0-b20e-43d5-b5ed-30771e370afd	Clio	t
8105e781-4ef9-4f47-b7ce-3ade9f4a14a4	48c0ea79-2f9c-4248-8ad8-8579f8e514f0	Pulse	t
812c235f-1df1-4e39-ae82-2c6b18bab6b8	1f5b4ff1-a02a-420a-911f-86e355a35f17	WR-V	t
81c4a583-e84e-476c-bff0-ba8d902fb4cd	d0390c7f-a8f3-4d39-9cc1-4bb82aed317a	Dolphin Mini	t
830e4f10-ad58-4daf-ae8e-79c8be34a597	d0390c7f-a8f3-4d39-9cc1-4bb82aed317a	Tan	t
8314376b-d33b-4874-b0dc-7489a696a2e8	d0390c7f-a8f3-4d39-9cc1-4bb82aed317a	Yuan Plus	t
83807706-1b0d-4d04-9273-85ead6029efa	fba78d55-fd0e-4593-94a7-cb34b45c9005	EX30	t
846ed71d-9188-4f2f-816d-8f8c25a14f76	7cb37cb7-468e-45e2-9871-cab3629bbd68	Classe E	t
8483caef-69fd-43ce-a596-577f129f3846	64da6de1-5593-4829-bc16-be7ac5a8f6ee	e-tron	t
84fa7424-a5b1-4902-92f2-1fb78be21dce	28d10884-ab02-42cd-b89d-7c3eb32e0be7	Golf	t
8649b70b-f2af-491a-8cf4-3ab5209479f0	64da6de1-5593-4829-bc16-be7ac5a8f6ee	A4	t
87b5ebee-9228-47f2-88ef-7643ed166956	c244825a-9a5c-4ace-ae00-3eb119cd7867	Tiggo 8	t
88c8010e-e1cf-4a2e-86fe-60a776012e88	bdb9161a-a1c7-4868-b67c-abe688b73705	3008	t
8baa8762-662c-49ec-b55d-8d873326981d	76cbb4d0-b20e-43d5-b5ed-30771e370afd	Duster	t
8bfeeb7f-c028-4a55-95ed-7b30729e157e	c4555ea1-f504-4c37-a62f-d6156c32f309	ASX	t
8ef8d491-f26e-40a4-a4a7-f53fb1ad1463	e1026e28-dd6b-4080-8ccc-1e6e28f1ba76	SW4	t
8fac6834-dc6d-4401-a83e-b6355bc1f81e	74aea47c-7469-4b49-91e0-c2c978ba757e	Cayenne	t
9455f699-bab6-4ade-bfb8-5520ce899723	76cbb4d0-b20e-43d5-b5ed-30771e370afd	Master	t
9458a3e2-9507-429b-bc8a-ebd003b669d8	28d10884-ab02-42cd-b89d-7c3eb32e0be7	Saveiro	t
9694555a-976b-42cf-8d39-aa3300d07e8f	c802851f-f168-471c-96f6-55c9fc7b85d8	Versa	t
97601b45-f5e8-40b9-b599-0dc1dfee4bf0	48c0ea79-2f9c-4248-8ad8-8579f8e514f0	Strada	t
981aaf75-2f1e-484e-b071-4adacc27de1d	4472eec2-c83d-4430-ab28-8735360407ad	Aircross	t
9d2e620d-bfce-4886-9eec-153ebe5dd4b2	77947292-f35c-44be-9b71-0f093e680b6f	EcoSport	t
9d607a80-cff3-4041-bc05-115274f28695	c244825a-9a5c-4ace-ae00-3eb119cd7867	Tiggo 7	t
9d77ffc6-9e17-46ce-8ca9-d689df5414ec	c802851f-f168-471c-96f6-55c9fc7b85d8	Frontier	t
9d7f003c-464e-49c4-a481-6d0089380347	4472eec2-c83d-4430-ab28-8735360407ad	Jumpy	t
9f0d379d-ba02-493b-91a3-fc2be2035a91	6edba199-7eb2-4123-9d23-746928d0d272	X6	t
a052104d-499a-4df4-a8f3-afe2390a64be	94edec9e-914e-4e08-85c9-eb5c362e6232	HB20	t
a0bdd0d1-c5ba-4ab2-84c4-3e6ae8ddc213	77947292-f35c-44be-9b71-0f093e680b6f	Fusion	t
a3627044-52c8-47b7-b8fe-418e31d6f13f	28d10884-ab02-42cd-b89d-7c3eb32e0be7	Gol	t
a54413b4-adae-46d4-ad28-98d9b8cc4af8	c7e073b9-4fa0-4255-b6c9-897041946cdb	Wrangler	t
a58515ce-6c8a-4766-a614-ef533dbba607	76cbb4d0-b20e-43d5-b5ed-30771e370afd	Oroch	t
a58f25a1-d037-4ca3-9282-ef16dd68d31c	e1026e28-dd6b-4080-8ccc-1e6e28f1ba76	Corolla Cross	t
a7879727-8df2-4a41-8d7c-1f82627a1c0f	c761954b-2664-40b7-9d26-59a6e4f58795	Vectra	t
a860ac9d-842a-4474-9358-516d12f18019	94edec9e-914e-4e08-85c9-eb5c362e6232	Azera	t
adc068ac-a736-4da7-a574-6c1484698f8e	64da6de1-5593-4829-bc16-be7ac5a8f6ee	A5	t
af1e115b-0a53-4444-8a89-0c3e200efc72	d0390c7f-a8f3-4d39-9cc1-4bb82aed317a	Song Plus	t
b5f12824-cb8a-4ab6-b237-21a6ce8d6fe8	94edec9e-914e-4e08-85c9-eb5c362e6232	Tucson	t
b7a22e6a-33d7-44ea-8bf5-9ba439e1cd76	76cbb4d0-b20e-43d5-b5ed-30771e370afd	Logan	t
ba2e51c9-4afa-4bad-9e11-03dfc3266c93	9ebe2634-cc9d-438c-9fd1-6c6cda4160fa	Haval H6	t
ba96d1cc-7b70-41bc-af49-8c6f28448b5d	c7e073b9-4fa0-4255-b6c9-897041946cdb	Grand Cherokee	t
bcb0d8c2-2628-40a3-ac49-ffb10404b8dc	6edba199-7eb2-4123-9d23-746928d0d272	X1	t
bea05ccd-066c-4fcf-92d0-30b195d687c0	7cb37cb7-468e-45e2-9871-cab3629bbd68	Sprinter	t
c2313eb1-1c3d-4c39-820a-cbb7dc03ecd4	94edec9e-914e-4e08-85c9-eb5c362e6232	HB20S	t
c25cee7e-0dcf-43d7-bc92-114468023b3c	77947292-f35c-44be-9b71-0f093e680b6f	Fiesta	t
c28ec5b6-3101-47c8-91a4-8215a79db17c	d0390c7f-a8f3-4d39-9cc1-4bb82aed317a	Han	t
c3248353-ae97-4839-a86f-f0298e589947	28d10884-ab02-42cd-b89d-7c3eb32e0be7	Amarok	t
c6bb5358-a0ef-4cb9-a206-4099c59d39bd	e1026e28-dd6b-4080-8ccc-1e6e28f1ba76	RAV4	t
c71b0580-a711-4c71-85cc-ca25ea904e2a	77947292-f35c-44be-9b71-0f093e680b6f	Territory	t
c74fd2c1-8473-421e-be23-7f80e8893b10	1f5b4ff1-a02a-420a-911f-86e355a35f17	Fit	t
c985a163-9f54-4d14-9144-092e79b6c2cb	77947292-f35c-44be-9b71-0f093e680b6f	Focus	t
ca1d941f-6688-4980-851a-8c313ac700e6	e1026e28-dd6b-4080-8ccc-1e6e28f1ba76	Hilux	t
cb352966-4856-4157-8511-161e5493ba6a	28d10884-ab02-42cd-b89d-7c3eb32e0be7	Jetta	t
ccc0d7b2-546f-4103-9297-98b5d5fd9b20	1f5b4ff1-a02a-420a-911f-86e355a35f17	CR-V	t
ceb7aa1b-7b3e-4938-b67b-1af55964d418	48c0ea79-2f9c-4248-8ad8-8579f8e514f0	Fastback	t
cef60ad1-df0e-41ee-add6-96fa12ec4926	c4555ea1-f504-4c37-a62f-d6156c32f309	Outlander	t
cfadd288-a80d-47b0-b032-075c2aa166fb	c761954b-2664-40b7-9d26-59a6e4f58795	Montana	t
d64beeba-7d0b-46a9-8b07-7a4a2631b352	48c0ea79-2f9c-4248-8ad8-8579f8e514f0	Doblò	t
defbf537-3251-4d67-99ea-96ac1105682e	48c0ea79-2f9c-4248-8ad8-8579f8e514f0	Punto	t
e27e5249-d071-4411-85db-8ccb56b10abc	77947292-f35c-44be-9b71-0f093e680b6f	Ka	t
e35b4305-fb1e-4785-87b6-512828d9807d	c761954b-2664-40b7-9d26-59a6e4f58795	Astra	t
e478ce2f-3bcf-4c46-854d-152766705db5	64a906d9-c5d2-462e-b660-c303766fe00d	2500	t
e643246e-7034-4b9c-8652-502684e177f3	6edba199-7eb2-4123-9d23-746928d0d272	M3	t
e775fceb-343a-415c-b1eb-530cd109057a	48c0ea79-2f9c-4248-8ad8-8579f8e514f0	Argo	t
e8e1cdc2-f923-4254-bae6-1ef25be139fb	c761954b-2664-40b7-9d26-59a6e4f58795	Tracker	t
eb25441c-1550-418f-ba66-f103fd3a6a74	48c0ea79-2f9c-4248-8ad8-8579f8e514f0	Fiorino	t
ebea20b3-1e49-41d5-8d45-e267bd441014	c244825a-9a5c-4ace-ae00-3eb119cd7867	Arrizo 6	t
ec4445a6-1bcd-4afc-8327-b7c856197156	77947292-f35c-44be-9b71-0f093e680b6f	Maverick	t
ed540747-2b15-4d1d-86ba-a1d2950a8e5c	7cb37cb7-468e-45e2-9871-cab3629bbd68	Classe C	t
eec3167d-1282-4fdd-a75c-afd66417f5c0	c7e073b9-4fa0-4255-b6c9-897041946cdb	Commander	t
eec4cfc7-d9e8-42c9-a256-6c35f711dd1f	74aea47c-7469-4b49-91e0-c2c978ba757e	911	t
ef07fed6-4315-4210-b01a-c825a86c412e	28d10884-ab02-42cd-b89d-7c3eb32e0be7	Tiguan	t
efa4fd1b-e2a5-4359-9a9c-a6a5b9d177ab	9ebe2634-cc9d-438c-9fd1-6c6cda4160fa	Tank 300	t
f223c568-8d2f-428e-9d60-2370f7bcbc01	28d10884-ab02-42cd-b89d-7c3eb32e0be7	Virtus	t
f4c055a6-aa35-4886-8a56-c73a10b5a04e	6edba199-7eb2-4123-9d23-746928d0d272	X3	t
f4c11e88-bc2b-4b60-acb7-efc4415c7d95	fba78d55-fd0e-4593-94a7-cb34b45c9005	XC90	t
f627fd3a-1bf3-49ee-a9f3-aaff1fda912f	64da6de1-5593-4829-bc16-be7ac5a8f6ee	Q5	t
f6dc9fb8-b821-460a-9479-2f2ec90ec605	48c0ea79-2f9c-4248-8ad8-8579f8e514f0	Siena	t
f78ff771-5793-422e-b72c-88145e48b93b	c761954b-2664-40b7-9d26-59a6e4f58795	Cobalt	t
f831eda8-8cc6-44d0-b006-47dd3e376a69	1f5b4ff1-a02a-420a-911f-86e355a35f17	City	t
f8a34d49-545a-44bf-98d4-edef06db03f0	77947292-f35c-44be-9b71-0f093e680b6f	Ranger	t
f94c5d54-32da-47be-a453-b5e9cd82ca06	c802851f-f168-471c-96f6-55c9fc7b85d8	March	t
f95efd59-1cfc-4822-aff2-77fd8c545c40	fba78d55-fd0e-4593-94a7-cb34b45c9005	C40	t
fab9ba42-4c5b-439c-bb0b-942c76b17437	77947292-f35c-44be-9b71-0f093e680b6f	Bronco	t
fb1c79e3-e03b-42a1-ad43-c4eea994a818	9ebe2634-cc9d-438c-9fd1-6c6cda4160fa	Ora 03	t
fe380e35-aea8-4ce0-a8cd-e3492aca0afc	d0390c7f-a8f3-4d39-9cc1-4bb82aed317a	Seal	t
\.


--
-- Data for Name: __EFMigrationsHistory; Type: TABLE DATA; Schema: public; Owner: autonexus
--

COPY public."__EFMigrationsHistory" ("MigrationId", "ProductVersion") FROM stdin;
20260925202811_InitialCreate	9.0.12
20261013143443_BillingSaas	9.0.12
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: autonexus
--

COPY public.audit_logs (id, "userId", operation, resource, "resourceId", details, "executedAt", "createdAt", "updatedAt", "tenantId") FROM stdin;
4e5e69ca-b361-4d17-a764-39646174d3aa	78ad5484-d827-4c50-94d1-997c5d16d321	Login	User	78ad5484-d827-4c50-94d1-997c5d16d321	\N	2026-10-06 20:25:14.410734+00	2026-10-06 20:25:14.410529+00	\N	00000000-0000-0000-0000-000000000001
89623784-6398-46a1-ae11-40209ea45129	78ad5484-d827-4c50-94d1-997c5d16d321	Login	User	78ad5484-d827-4c50-94d1-997c5d16d321	\N	2026-10-06 22:18:42.763845+00	2026-10-06 22:18:42.763844+00	\N	00000000-0000-0000-0000-000000000001
04a734d4-6cf9-4415-b9cb-455aa3a24cfd	78ad5484-d827-4c50-94d1-997c5d16d321	Login	User	78ad5484-d827-4c50-94d1-997c5d16d321	\N	2026-10-12 13:21:17.291911+00	2026-10-12 13:21:17.291911+00	\N	00000000-0000-0000-0000-000000000001
b36e5ad8-d4ac-4b30-9f3e-ef1b07828a44	78ad5484-d827-4c50-94d1-997c5d16d321	Login	User	78ad5484-d827-4c50-94d1-997c5d16d321	\N	2026-10-13 14:36:19.432103+00	2026-10-13 14:36:19.431808+00	\N	00000000-0000-0000-0000-000000000001
04601eaf-ffa6-4418-9fa3-ed2714f5d3a1	9e2442bb-5ffa-4b43-afb6-cd3b73578da9	CriarEmpresa	Tenant	1fd52e97-cdcf-4049-af16-354eea64b9d0	Cadastro self-service, plano Starter, aceite de termos v1/privacidade v1/cookies v1	2026-10-13 14:37:56.137282+00	2026-10-13 14:37:56.137281+00	\N	1fd52e97-cdcf-4049-af16-354eea64b9d0
90eda4d9-5f8d-4ac4-9c59-13cd5dc182e7	78ad5484-d827-4c50-94d1-997c5d16d321	Login	User	78ad5484-d827-4c50-94d1-997c5d16d321	\N	2026-10-13 21:08:37.39459+00	2026-10-13 21:08:37.39459+00	\N	00000000-0000-0000-0000-000000000001
\.


--
-- Data for Name: cost_categories; Type: TABLE DATA; Schema: public; Owner: autonexus
--

COPY public.cost_categories (id, name, description, "isActive", "createdAt", "updatedAt", "tenantId") FROM stdin;
1bd70962-bf55-4d2e-8705-c1ace36f0a17	Reparo	Consertos mecânicos e elétricos	t	2026-09-25 20:43:05.588732+00	\N	00000000-0000-0000-0000-000000000001
1e620ade-942e-4504-9bc2-2641770e1747	Transporte	Frete e guincho	t	2026-09-25 20:43:05.588755+00	\N	00000000-0000-0000-0000-000000000001
2b0b162e-8632-4b9e-89d1-cecd2af7dcd3	Peças	Substituição de componentes	t	2026-09-25 20:43:05.588732+00	\N	00000000-0000-0000-0000-000000000001
2e80a90a-7429-4ff3-9f51-60ccbccfb086	Taxas	Taxas operacionais e administrativas	t	2026-09-25 20:43:05.588755+00	\N	00000000-0000-0000-0000-000000000001
9b9d6529-3ebe-46c6-a6aa-323c4815d583	Pintura	Serviços de pintura	t	2026-09-25 20:43:05.588733+00	\N	00000000-0000-0000-0000-000000000001
a12889cd-59c9-4fe8-80ff-388b854fd07c	Documentação	Emplacamento, IPVA, taxas e transferência	t	2026-09-25 20:43:05.588755+00	\N	00000000-0000-0000-0000-000000000001
b43752f7-c301-4b6a-b538-9bf23d16f133	Funilaria	Lanternagem e martelinho de ouro	t	2026-09-25 20:43:05.588755+00	\N	00000000-0000-0000-0000-000000000001
c17f5ff1-09fe-4e31-8c87-ef47d6d8aa1c	Manutenção	Revisão e manutenção preventiva	t	2026-09-25 20:43:05.588731+00	\N	00000000-0000-0000-0000-000000000001
d48c336d-8972-42c0-8221-5551552528c8	Outro	Outros custos operacionais	t	2026-09-25 20:43:05.588755+00	\N	00000000-0000-0000-0000-000000000001
e78cc3e5-c96b-4aa7-888e-6d22208fc6f5	Compra	Valor de aquisição inicial	t	2026-09-25 20:43:05.588673+00	\N	00000000-0000-0000-0000-000000000001
\.


--
-- Data for Name: costs; Type: TABLE DATA; Schema: public; Owner: autonexus
--

COPY public.costs (id, "vehicleId", "costCategoryId", description, value, "costDate", "responsibleUserId", notes, "createdAt", "updatedAt", "tenantId") FROM stdin;
\.


--
-- Data for Name: document_categories; Type: TABLE DATA; Schema: public; Owner: autonexus
--

COPY public.document_categories (id, name, description, "isActive", "createdAt", "updatedAt", "tenantId") FROM stdin;
1bf4ea32-c29c-4874-885f-2472444d93c9	Recibos	Recibos de pagamento	t	2026-09-25 20:43:05.605722+00	\N	00000000-0000-0000-0000-000000000001
26870833-27dc-4077-9cb7-fe7f054296e2	Comprovantes	Comprovantes diversos	t	2026-09-25 20:43:05.605722+00	\N	00000000-0000-0000-0000-000000000001
2c58161f-3e70-4048-a491-4207144700c9	Laudo	Laudo cautelar e pericial	t	2026-09-25 20:43:05.605648+00	\N	00000000-0000-0000-0000-000000000001
3da591b5-ea81-4201-ab86-8d2163746f35	Transferência	Comprovante de transferência/ATPV-e	t	2026-09-25 20:43:05.605721+00	\N	00000000-0000-0000-0000-000000000001
67b4657f-5217-4491-9dbe-04c00e441428	Outros	Demais documentos anexos	t	2026-09-25 20:43:05.60573+00	\N	00000000-0000-0000-0000-000000000001
b56b125f-bf42-43f8-9cea-4e830a3d98fc	Documento de Leilão	Termos e notas de leilão	t	2026-09-25 20:43:05.605721+00	\N	00000000-0000-0000-0000-000000000001
d01acaaf-bd57-4544-bf73-e52a72276956	Documento do Veículo	CRLV e documentação oficial	t	2026-09-25 20:43:05.605721+00	\N	00000000-0000-0000-0000-000000000001
\.


--
-- Data for Name: fipe_histories; Type: TABLE DATA; Schema: public; Owner: autonexus
--

COPY public.fipe_histories (id, "vehicleId", "fipeValue", "referenceMonth", "referenceYear", "consultationDate", source, "createdAt", "updatedAt", "tenantId") FROM stdin;
\.


--
-- Data for Name: legal_documents; Type: TABLE DATA; Schema: public; Owner: autonexus
--

COPY public.legal_documents (id, type, version, content, "isActive", "publishedAt", "createdAt", "updatedAt") FROM stdin;
00000000-0000-0000-0000-0000000000c1	1	1	# Termos de Uso — AutoNexus\n\n**[RASCUNHO ESTRUTURAL — PENDENTE DE REVISÃO JURÍDICA. NÃO USAR COMO TERMO FINAL.]**\n\n1. Identificação do prestador de serviço\n[Razão social], inscrita no CNPJ sob o nº [CNPJ], com sede em [endereço completo] ("AutoNexus" ou "nós"), disponibiliza a plataforma AutoNexus ("Plataforma") como um serviço de software como serviço (SaaS) para gestão de compra, venda e troca de veículos.\n\n2. Aceite\nAo criar uma conta ou utilizar a Plataforma, você ("Cliente" ou "Usuário") declara ter lido, compreendido e aceitado estes Termos de Uso e a Política de Privacidade vigente.\n\n3. Cadastro e conta\n3.1. O Cliente é responsável pela veracidade das informações fornecidas no cadastro da empresa e dos usuários.\n3.2. O Cliente é responsável por manter a confidencialidade das credenciais de acesso de seus usuários.\n\n4. Planos, preços e pagamento\n4.1. O uso da Plataforma é condicionado à contratação de um plano pago, podendo haver período de teste gratuito (trial) conforme indicado no momento da contratação.\n4.2. Os valores vigentes de cada plano são exibidos na página de preços da Plataforma e podem ser alterados mediante aviso prévio.\n4.3. Os pagamentos são processados por gateway de pagamento terceirizado([gateway de pagamento]). O AutoNexus não armazena dados completos de cartão de crédito.\n\n5. Cancelamento\n5.1. O Cliente pode cancelar sua assinatura a qualquer momento através do painel da conta.\n5.2. O cancelamento não gera reembolso automático de período já pago, ressalvadas as hipóteses legais aplicáveis (ex.: direito de arrependimento em até 7 dias, art. 49 do CDC).\n\n6. Dados do Cliente\n6.1. Os dados inseridos pelo Cliente na Plataforma (veículos, clientes, documentos, etc.) permanecem de propriedade do Cliente.\n6.2. Em caso de cancelamento, os dados são mantidos pelo período descrito na Política de Privacidade antes de eventual exclusão/anonimização.\n\n7. Limitação de responsabilidade\n[A ser definido com apoio jurídico — cláusula padrão de limitação de responsabilidade proporcional ao valor pago, exclusão de danos indiretos, etc.]\n\n8. Foro\nFica eleito o foro da comarca de [cidade/UF] para dirimir eventuais controvérsias oriundas destes Termos, com renúncia a qualquer outro, por mais privilegiado que seja.\n\n9. Contato\nDúvidas sobre estes Termos podem ser enviadas para [e-mail de contato].\n\nVersão 1 — [data de publicação real a definir]	t	2026-01-01 00:00:00+00	2026-01-01 00:00:00+00	\N
00000000-0000-0000-0000-0000000000c2	2	1	# Política de Privacidade — AutoNexus\n\n**[RASCUNHO ESTRUTURAL — PENDENTE DE REVISÃO JURÍDICA. NÃO USAR COMO POLÍTICA FINAL.]**\n\nEsta Política de Privacidade descreve como o AutoNexus coleta, usa, armazena e protege dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).\n\n1. Controlador de dados\n[Razão social], CNPJ [CNPJ]. Encarregado de Dados (DPO): [nome/e-mail do encarregado — a definir].\n\n2. Dados coletados\n2.1. Dados de cadastro: nome, e-mail, telefone, dados da empresa (razão social, CNPJ, endereço).\n2.2. Dados de uso: veículos cadastrados, clientes, documentos, histórico de navegação na Plataforma.\n2.3. Dados de pagamento: processados pelo gateway de pagamento — o AutoNexus não armazena número completo de cartão de crédito.\n\n3. Finalidade do tratamento\nPrestação do serviço contratado, comunicação sobre a conta e cobrança, cumprimento de obrigações legais/regulatórias, prevenção a fraude e melhoria da Plataforma.\n\n4. Base legal\nExecução de contrato (art. 7º, V, LGPD), cumprimento de obrigação legal (art. 7º, II) e, quando aplicável, consentimento (art. 7º, I).\n\n5. Compartilhamento de dados\nDados podem ser compartilhados com: gateway de pagamento ([Mercado Pago]), provedor de e-mail transacional ([Resend]), provedores de infraestrutura (hospedagem/banco de dados), e autoridades quando exigido por lei.\n\n6. Direitos do titular\nNos termos do art. 18 da LGPD, o titular pode solicitar: confirmação de tratamento, acesso, correção, anonimização/eliminação, portabilidade, informação sobre compartilhamento, e revogação de consentimento. Solicitações podem ser enviadas para [e-mail de contato do encarregado].\n\n7. Retenção e eliminação\nDados são mantidos enquanto a conta estiver ativa e pelo prazo adicional necessário para cumprimento de obrigações legais/fiscais após o cancelamento. Após esse prazo, podem ser anonimizados ou eliminados mediante solicitação do titular, observadas as exceções legais.\n\n8. Segurança\nAdotamos medidas técnicas e organizacionais para proteger os dados, incluindo isolamento lógico entre empresas clientes (multi-tenancy) e controle de acesso por autenticação.\n\n9. Cookies\nVeja a Política de Cookies para detalhes sobre o uso de cookies e tecnologias similares.\n\n10. Alterações\nEsta política pode ser atualizada; a versão vigente estará sempre disponível na Plataforma, com indicação da data/versão.\n\nVersão 1 — [data de publicação real a definir]	t	2026-01-01 00:00:00+00	2026-01-01 00:00:00+00	\N
00000000-0000-0000-0000-0000000000c3	3	1	# Política de Cookies — AutoNexus\n\n**[RASCUNHO ESTRUTURAL — PENDENTE DE REVISÃO JURÍDICA.]**\n\n1. O que são cookies\nPequenos arquivos armazenados no navegador do usuário para permitir o funcionamento e a melhoria da Plataforma.\n\n2. Cookies utilizados\n2.1. Essenciais: necessários para autenticação e funcionamento básico (ex.: manter a sessão do usuário logado). Não podem ser desativados sem comprometer o funcionamento da Plataforma.\n2.2. Desempenho/analytics: [a definir caso sejam adicionadas ferramentas de analytics].\n\n3. Gerenciamento de cookies\nO usuário pode gerenciar/bloquear cookies diretamente nas configurações do navegador, ciente de que isso pode afetar o funcionamento da Plataforma.\n\n4. Alterações\nEsta política pode ser atualizada; a versão vigente estará sempre disponível na Plataforma.\n\nVersão 1 — [data de publicação real a definir]	t	2026-01-01 00:00:00+00	2026-01-01 00:00:00+00	\N
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: autonexus
--

COPY public.payments (id, "subscriptionId", amount, currency, method, status, provider, "externalPaymentId", "failureReason", "paidAt", "planId", "billingCycle", "createdAt", "updatedAt", "tenantId") FROM stdin;
\.


--
-- Data for Name: plans; Type: TABLE DATA; Schema: public; Owner: autonexus
--

COPY public.plans (id, name, price, "isActive", "maxUsers", "maxVehicles", "maxStorageMb", "createdAt", "updatedAt", "annualPrice", "trialDays") FROM stdin;
00000000-0000-0000-0000-0000000000f1	Starter	49.90	t	\N	\N	\N	2026-01-01 00:00:00+00	\N	499.00	7
00000000-0000-0000-0000-0000000000f2	Profissional	99.90	t	\N	\N	\N	2026-01-01 00:00:00+00	\N	999.00	7
00000000-0000-0000-0000-0000000000f3	Premium	199.90	t	\N	\N	\N	2026-01-01 00:00:00+00	\N	1999.00	7
00000000-0000-0000-0000-0000000000f4	Enterprise (legado)	0.00	f	\N	\N	\N	2026-01-01 00:00:00+00	\N	\N	0
\.


--
-- Data for Name: tenant_settings; Type: TABLE DATA; Schema: public; Owner: autonexus
--

COPY public.tenant_settings (id, "companyName", "logoUrl", "primaryColor", "timeZone", currency, "createdAt", "updatedAt", "tenantId") FROM stdin;
00000000-0000-0000-0000-0000000000b1	Empresa Padrão	\N	#15171B	America/Sao_Paulo	BRL	2026-01-01 00:00:00+00	\N	00000000-0000-0000-0000-000000000001
8e0cc0ad-1eff-476a-8f1b-b14dc34fdb3a	TT	\N	#15171B	America/Sao_Paulo	BRL	2026-10-13 14:37:56.092597+00	\N	1fd52e97-cdcf-4049-af16-354eea64b9d0
\.


--
-- Data for Name: tenant_subscriptions; Type: TABLE DATA; Schema: public; Owner: autonexus
--

COPY public.tenant_subscriptions (id, "planId", status, "startDate", "endDate", "createdAt", "updatedAt", "tenantId", "billingCycle", "cancelledAt", "currentPeriodEnd", "externalSubscriptionId", "paymentMethod", "paymentProvider", "trialEndsAt", "trialReminderSentAt") FROM stdin;
00000000-0000-0000-0000-0000000000a1	00000000-0000-0000-0000-0000000000f1	2	2026-01-01 00:00:00+00	\N	2026-01-01 00:00:00+00	\N	00000000-0000-0000-0000-000000000001	1	\N	\N	\N	\N	\N	\N	\N
49c56a03-dac5-4f58-b773-e1708617ee2a	00000000-0000-0000-0000-0000000000f1	1	2026-10-13 14:37:56.129657+00	\N	2026-10-13 14:37:56.129359+00	\N	1fd52e97-cdcf-4049-af16-354eea64b9d0	1	\N	\N	\N	\N	\N	2026-10-20 14:37:56.129735+00	\N
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: autonexus
--

COPY public.tenants (id, name, slug, "isActive", "createdAt", "updatedAt") FROM stdin;
00000000-0000-0000-0000-000000000001	Empresa Padrão	default	t	2026-01-01 00:00:00+00	\N
1fd52e97-cdcf-4049-af16-354eea64b9d0	TT	tt	t	2026-10-13 14:37:55.339033+00	\N
\.


--
-- Data for Name: trades; Type: TABLE DATA; Schema: public; Owner: autonexus
--

COPY public.trades (id, "receivedVehicleId", "deliveredVehicleId", "receivedVehicleFipe", "deliveredVehicleFipe", "receivedVehicleNegotiatedValue", "deliveredVehicleNegotiatedValue", "estimatedResaleCost", "differenceValue", "differencePaidByUs", indicator, "tradeDate", "responsibleUserId", notes, "createdAt", "updatedAt", "tenantId") FROM stdin;
\.


--
-- Data for Name: user_consents; Type: TABLE DATA; Schema: public; Owner: autonexus
--

COPY public.user_consents (id, "userId", "documentType", "documentVersion", "acceptedAt", "ipAddress", "createdAt", "updatedAt", "tenantId") FROM stdin;
37a900d9-c037-4989-a57e-6e627fe41f3c	9e2442bb-5ffa-4b43-afb6-cd3b73578da9	1	1	2026-10-13 14:37:56.098338+00	127.0.0.1	2026-10-13 14:37:56.097924+00	\N	1fd52e97-cdcf-4049-af16-354eea64b9d0
5a5af040-721f-4000-95e2-0210d839875e	9e2442bb-5ffa-4b43-afb6-cd3b73578da9	3	1	2026-10-13 14:37:56.128896+00	127.0.0.1	2026-10-13 14:37:56.128895+00	\N	1fd52e97-cdcf-4049-af16-354eea64b9d0
f919e3bd-a9ab-4128-bfb8-3dabc3ca38ab	9e2442bb-5ffa-4b43-afb6-cd3b73578da9	2	1	2026-10-13 14:37:56.127759+00	127.0.0.1	2026-10-13 14:37:56.127758+00	\N	1fd52e97-cdcf-4049-af16-354eea64b9d0
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: autonexus
--

COPY public.users (id, name, email, "passwordHash", profile, "isActive", "createdAt", "updatedAt", "tenantId") FROM stdin;
78ad5484-d827-4c50-94d1-997c5d16d321	Administrador	admin@autonexus.com	$2a$12$o.IGS3hKzXhYboUr/cxSkOs6icA9hmNmDrDqSqLdjq4/u.Y0/o/wq	1	t	2026-09-25 20:43:05.962729+00	\N	00000000-0000-0000-0000-000000000001
a8650c9f-b88a-485e-a540-1fca9994ccf1	Super Admin	superadmin@autonexus.com	$2a$12$u4V6gUtVsEUNKaa87WHem.li.slggAVXrfWnf7iHhKZ7spL.UEL4q	0	t	2026-09-25 20:43:06.256333+00	\N	00000000-0000-0000-0000-000000000001
9e2442bb-5ffa-4b43-afb6-cd3b73578da9	TATIANE	tatiane@autonexus.com	$2a$12$4vf2aBvshRcJvFg1drLEse3J5fIruA2xn6qWerUr7ebWS9bqnuzlq	1	t	2026-10-13 14:37:56.090654+00	\N	1fd52e97-cdcf-4049-af16-354eea64b9d0
\.


--
-- Data for Name: vehicle_documents; Type: TABLE DATA; Schema: public; Owner: autonexus
--

COPY public.vehicle_documents (id, "vehicleId", "documentCategoryId", name, "fileName", "storagePath", "mimeType", "fileSize", "uploadedByUserId", notes, "showInCatalog", "createdAt", "updatedAt", "tenantId") FROM stdin;
\.


--
-- Data for Name: vehicle_photos; Type: TABLE DATA; Schema: public; Owner: autonexus
--

COPY public.vehicle_photos (id, "vehicleId", "fileName", "storagePath", "mimeType", "fileSize", "order", "isMain", "createdAt", "updatedAt", "tenantId") FROM stdin;
60a3022e-d04e-46c1-a6e9-44542e401bea	03306c49-2cec-4330-96af-ecb17c2d441e	toyota-corolla-2.0-vvtie-flex-altis-direct-shift-wmimagem1807399762.jpg	/uploads/tenants/1fd52e97-cdcf-4049-af16-354eea64b9d0/vehicles/03306c49-2cec-4330-96af-ecb17c2d441e/f2688abe-4a89-45b5-83cd-a309aa64fed7.jpg	image/jpeg	37689	0	t	2026-10-13 14:38:58.008088+00	\N	1fd52e97-cdcf-4049-af16-354eea64b9d0
\.


--
-- Data for Name: vehicle_types; Type: TABLE DATA; Schema: public; Owner: autonexus
--

COPY public.vehicle_types (id, name, description, "isActive", "createdAt", "updatedAt") FROM stdin;
2fe18fa2-3cfa-47ca-b241-42e9a8ea1d04	Jetski	Motos aquáticas	t	2026-09-25 20:43:05.543356+00	\N
9ca2dfd9-251b-4d64-ba0a-7c683f06c593	Moto	Motocicletas e ciclomotores	t	2026-09-25 20:43:05.543355+00	\N
a0ce638a-e93f-4512-9e53-d841a63640e9	Caminhão	Veículos pesados e de carga	t	2026-09-25 20:43:05.543356+00	\N
b1fe5de3-00e0-48ae-b093-33c72a5a9549	Carro	Automóveis de passeio	t	2026-09-25 20:43:05.543262+00	\N
df7b6c05-b5bc-44a0-b5f6-d0ead343d369	Outros	Demais categorias de veículos	t	2026-09-25 20:43:05.543356+00	\N
\.


--
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: autonexus
--

COPY public.vehicles (id, "vehicleTypeId", brand, model, version, "manufacturingYear", "modelYear", plate, chassis, renavam, mileage, color, fuel, transmission, status, "purchaseValue", "listedValue", "saleValue", notes, "soldByUserId", "soldAt", "createdAt", "updatedAt", "tenantId") FROM stdin;
03306c49-2cec-4330-96af-ecb17c2d441e	a0ce638a-e93f-4512-9e53-d841a63640e9	Fiat	Fastback	1.0 Turbo Flex	2026	2026	TRETET222			1522222	Preto	3	2	1	52000.00	85000.00	\N	🚗 FIAT FASTBACK - 2026\r\n\n✨ DESTAQUES DO VEÍCULO:\r\n• Ano: 2026\r\n• Quilometragem: 1.522.222 km\r\n• Cor: Preto\r\n• Combustível: 3\r\n• Câmbio: 2\r\n\n💎 DIFERENCIAIS DA NOSSA LOJA:\r\n✅ Veículo 100% periciado e aprovado\r\n✅ Garantia e procedência garantida\r\n✅ Aceitamos seu usado na troca com a melhor avaliação\r\n✅ Financiamento facilitado em até 60x sem burocracia\r\n\n💰 VALOR PROMOCIONAL: R$ 85.000,00\r\n\n📲 Entre em contato agora mesmo via WhatsApp e agende seu Test-Drive!	\N	\N	2026-10-13 14:38:50.187219+00	2026-10-13 14:38:50.195692+00	1fd52e97-cdcf-4049-af16-354eea64b9d0
\.


--
-- Data for Name: webhook_events; Type: TABLE DATA; Schema: public; Owner: autonexus
--

COPY public.webhook_events (id, provider, "externalEventId", "eventType", "rawPayload", "processedSuccessfully", "processingError", "receivedAt", "processedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Name: BankConfigs PK_BankConfigs; Type: CONSTRAINT; Schema: public; Owner: autonexus
--

ALTER TABLE ONLY public."BankConfigs"
    ADD CONSTRAINT "PK_BankConfigs" PRIMARY KEY (id);


--
-- Name: BuyerAccessLinks PK_BuyerAccessLinks; Type: CONSTRAINT; Schema: public; Owner: autonexus
--

ALTER TABLE ONLY public."BuyerAccessLinks"
    ADD CONSTRAINT "PK_BuyerAccessLinks" PRIMARY KEY (id);


--
-- Name: CompanyDocuments PK_CompanyDocuments; Type: CONSTRAINT; Schema: public; Owner: autonexus
--

ALTER TABLE ONLY public."CompanyDocuments"
    ADD CONSTRAINT "PK_CompanyDocuments" PRIMARY KEY (id);


--
-- Name: ElectronicAcceptances PK_ElectronicAcceptances; Type: CONSTRAINT; Schema: public; Owner: autonexus
--

ALTER TABLE ONLY public."ElectronicAcceptances"
    ADD CONSTRAINT "PK_ElectronicAcceptances" PRIMARY KEY (id);


--
-- Name: VehicleBrands PK_VehicleBrands; Type: CONSTRAINT; Schema: public; Owner: autonexus
--

ALTER TABLE ONLY public."VehicleBrands"
    ADD CONSTRAINT "PK_VehicleBrands" PRIMARY KEY (id);


--
-- Name: VehicleModels PK_VehicleModels; Type: CONSTRAINT; Schema: public; Owner: autonexus
--

ALTER TABLE ONLY public."VehicleModels"
    ADD CONSTRAINT "PK_VehicleModels" PRIMARY KEY (id);


--
-- Name: __EFMigrationsHistory PK___EFMigrationsHistory; Type: CONSTRAINT; Schema: public; Owner: autonexus
--

ALTER TABLE ONLY public."__EFMigrationsHistory"
    ADD CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId");


--
-- Name: audit_logs PK_audit_logs; Type: CONSTRAINT; Schema: public; Owner: autonexus
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "PK_audit_logs" PRIMARY KEY (id);


--
-- Name: cost_categories PK_cost_categories; Type: CONSTRAINT; Schema: public; Owner: autonexus
--

ALTER TABLE ONLY public.cost_categories
    ADD CONSTRAINT "PK_cost_categories" PRIMARY KEY (id);


--
-- Name: costs PK_costs; Type: CONSTRAINT; Schema: public; Owner: autonexus
--

ALTER TABLE ONLY public.costs
    ADD CONSTRAINT "PK_costs" PRIMARY KEY (id);


--
-- Name: document_categories PK_document_categories; Type: CONSTRAINT; Schema: public; Owner: autonexus
--

ALTER TABLE ONLY public.document_categories
    ADD CONSTRAINT "PK_document_categories" PRIMARY KEY (id);


--
-- Name: fipe_histories PK_fipe_histories; Type: CONSTRAINT; Schema: public; Owner: autonexus
--

ALTER TABLE ONLY public.fipe_histories
    ADD CONSTRAINT "PK_fipe_histories" PRIMARY KEY (id);


--
-- Name: legal_documents PK_legal_documents; Type: CONSTRAINT; Schema: public; Owner: autonexus
--

ALTER TABLE ONLY public.legal_documents
    ADD CONSTRAINT "PK_legal_documents" PRIMARY KEY (id);


--
-- Name: payments PK_payments; Type: CONSTRAINT; Schema: public; Owner: autonexus
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "PK_payments" PRIMARY KEY (id);


--
-- Name: plans PK_plans; Type: CONSTRAINT; Schema: public; Owner: autonexus
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT "PK_plans" PRIMARY KEY (id);


--
-- Name: tenant_settings PK_tenant_settings; Type: CONSTRAINT; Schema: public; Owner: autonexus
--

ALTER TABLE ONLY public.tenant_settings
    ADD CONSTRAINT "PK_tenant_settings" PRIMARY KEY (id);


--
-- Name: tenant_subscriptions PK_tenant_subscriptions; Type: CONSTRAINT; Schema: public; Owner: autonexus
--

ALTER TABLE ONLY public.tenant_subscriptions
    ADD CONSTRAINT "PK_tenant_subscriptions" PRIMARY KEY (id);


--
-- Name: tenants PK_tenants; Type: CONSTRAINT; Schema: public; Owner: autonexus
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT "PK_tenants" PRIMARY KEY (id);


--
-- Name: trades PK_trades; Type: CONSTRAINT; Schema: public; Owner: autonexus
--

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT "PK_trades" PRIMARY KEY (id);


--
-- Name: user_consents PK_user_consents; Type: CONSTRAINT; Schema: public; Owner: autonexus
--

ALTER TABLE ONLY public.user_consents
    ADD CONSTRAINT "PK_user_consents" PRIMARY KEY (id);


--
-- Name: users PK_users; Type: CONSTRAINT; Schema: public; Owner: autonexus
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_users" PRIMARY KEY (id);


--
-- Name: vehicle_documents PK_vehicle_documents; Type: CONSTRAINT; Schema: public; Owner: autonexus
--

ALTER TABLE ONLY public.vehicle_documents
    ADD CONSTRAINT "PK_vehicle_documents" PRIMARY KEY (id);


--
-- Name: vehicle_photos PK_vehicle_photos; Type: CONSTRAINT; Schema: public; Owner: autonexus
--

ALTER TABLE ONLY public.vehicle_photos
    ADD CONSTRAINT "PK_vehicle_photos" PRIMARY KEY (id);


--
-- Name: vehicle_types PK_vehicle_types; Type: CONSTRAINT; Schema: public; Owner: autonexus
--

ALTER TABLE ONLY public.vehicle_types
    ADD CONSTRAINT "PK_vehicle_types" PRIMARY KEY (id);


--
-- Name: vehicles PK_vehicles; Type: CONSTRAINT; Schema: public; Owner: autonexus
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT "PK_vehicles" PRIMARY KEY (id);


--
-- Name: webhook_events PK_webhook_events; Type: CONSTRAINT; Schema: public; Owner: autonexus
--

ALTER TABLE ONLY public.webhook_events
    ADD CONSTRAINT "PK_webhook_events" PRIMARY KEY (id);


--
-- Name: IX_BankConfigs_tenantId; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE INDEX "IX_BankConfigs_tenantId" ON public."BankConfigs" USING btree ("tenantId");


--
-- Name: IX_BuyerAccessLinks_tenantId; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE INDEX "IX_BuyerAccessLinks_tenantId" ON public."BuyerAccessLinks" USING btree ("tenantId");


--
-- Name: IX_BuyerAccessLinks_vehicleId; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE INDEX "IX_BuyerAccessLinks_vehicleId" ON public."BuyerAccessLinks" USING btree ("vehicleId");


--
-- Name: IX_CompanyDocuments_tenantId; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE INDEX "IX_CompanyDocuments_tenantId" ON public."CompanyDocuments" USING btree ("tenantId");


--
-- Name: IX_ElectronicAcceptances_tenantId; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE INDEX "IX_ElectronicAcceptances_tenantId" ON public."ElectronicAcceptances" USING btree ("tenantId");


--
-- Name: IX_ElectronicAcceptances_vehicleId; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE INDEX "IX_ElectronicAcceptances_vehicleId" ON public."ElectronicAcceptances" USING btree ("vehicleId");


--
-- Name: IX_VehicleModels_vehicleBrandId; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE INDEX "IX_VehicleModels_vehicleBrandId" ON public."VehicleModels" USING btree ("vehicleBrandId");


--
-- Name: IX_audit_logs_executedAt; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE INDEX "IX_audit_logs_executedAt" ON public.audit_logs USING btree ("executedAt");


--
-- Name: IX_audit_logs_resource; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE INDEX "IX_audit_logs_resource" ON public.audit_logs USING btree (resource);


--
-- Name: IX_audit_logs_tenantId; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE INDEX "IX_audit_logs_tenantId" ON public.audit_logs USING btree ("tenantId");


--
-- Name: IX_cost_categories_tenantId; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE INDEX "IX_cost_categories_tenantId" ON public.cost_categories USING btree ("tenantId");


--
-- Name: IX_costs_costCategoryId; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE INDEX "IX_costs_costCategoryId" ON public.costs USING btree ("costCategoryId");


--
-- Name: IX_costs_tenantId; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE INDEX "IX_costs_tenantId" ON public.costs USING btree ("tenantId");


--
-- Name: IX_costs_vehicleId; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE INDEX "IX_costs_vehicleId" ON public.costs USING btree ("vehicleId");


--
-- Name: IX_document_categories_tenantId; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE INDEX "IX_document_categories_tenantId" ON public.document_categories USING btree ("tenantId");


--
-- Name: IX_fipe_histories_tenantId; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE INDEX "IX_fipe_histories_tenantId" ON public.fipe_histories USING btree ("tenantId");


--
-- Name: IX_fipe_histories_vehicleId_referenceMonth_referenceYear; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE INDEX "IX_fipe_histories_vehicleId_referenceMonth_referenceYear" ON public.fipe_histories USING btree ("vehicleId", "referenceMonth", "referenceYear");


--
-- Name: IX_legal_documents_type_version; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE UNIQUE INDEX "IX_legal_documents_type_version" ON public.legal_documents USING btree (type, version);


--
-- Name: IX_payments_externalPaymentId; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE INDEX "IX_payments_externalPaymentId" ON public.payments USING btree ("externalPaymentId");


--
-- Name: IX_payments_subscriptionId; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE INDEX "IX_payments_subscriptionId" ON public.payments USING btree ("subscriptionId");


--
-- Name: IX_payments_tenantId; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE INDEX "IX_payments_tenantId" ON public.payments USING btree ("tenantId");


--
-- Name: IX_tenant_settings_tenantId; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE UNIQUE INDEX "IX_tenant_settings_tenantId" ON public.tenant_settings USING btree ("tenantId");


--
-- Name: IX_tenant_subscriptions_externalSubscriptionId; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE INDEX "IX_tenant_subscriptions_externalSubscriptionId" ON public.tenant_subscriptions USING btree ("externalSubscriptionId");


--
-- Name: IX_tenant_subscriptions_planId; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE INDEX "IX_tenant_subscriptions_planId" ON public.tenant_subscriptions USING btree ("planId");


--
-- Name: IX_tenant_subscriptions_status; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE INDEX "IX_tenant_subscriptions_status" ON public.tenant_subscriptions USING btree (status);


--
-- Name: IX_tenant_subscriptions_tenantId; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE INDEX "IX_tenant_subscriptions_tenantId" ON public.tenant_subscriptions USING btree ("tenantId");


--
-- Name: IX_tenants_slug; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE UNIQUE INDEX "IX_tenants_slug" ON public.tenants USING btree (slug);


--
-- Name: IX_trades_deliveredVehicleId; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE INDEX "IX_trades_deliveredVehicleId" ON public.trades USING btree ("deliveredVehicleId");


--
-- Name: IX_trades_receivedVehicleId; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE INDEX "IX_trades_receivedVehicleId" ON public.trades USING btree ("receivedVehicleId");


--
-- Name: IX_trades_tenantId; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE INDEX "IX_trades_tenantId" ON public.trades USING btree ("tenantId");


--
-- Name: IX_user_consents_tenantId; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE INDEX "IX_user_consents_tenantId" ON public.user_consents USING btree ("tenantId");


--
-- Name: IX_user_consents_userId; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE INDEX "IX_user_consents_userId" ON public.user_consents USING btree ("userId");


--
-- Name: IX_users_email; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE UNIQUE INDEX "IX_users_email" ON public.users USING btree (email);


--
-- Name: IX_users_tenantId; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE INDEX "IX_users_tenantId" ON public.users USING btree ("tenantId");


--
-- Name: IX_vehicle_documents_documentCategoryId; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE INDEX "IX_vehicle_documents_documentCategoryId" ON public.vehicle_documents USING btree ("documentCategoryId");


--
-- Name: IX_vehicle_documents_tenantId; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE INDEX "IX_vehicle_documents_tenantId" ON public.vehicle_documents USING btree ("tenantId");


--
-- Name: IX_vehicle_documents_vehicleId; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE INDEX "IX_vehicle_documents_vehicleId" ON public.vehicle_documents USING btree ("vehicleId");


--
-- Name: IX_vehicle_photos_tenantId; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE INDEX "IX_vehicle_photos_tenantId" ON public.vehicle_photos USING btree ("tenantId");


--
-- Name: IX_vehicle_photos_vehicleId; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE INDEX "IX_vehicle_photos_vehicleId" ON public.vehicle_photos USING btree ("vehicleId");


--
-- Name: IX_vehicles_brand; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE INDEX "IX_vehicles_brand" ON public.vehicles USING btree (brand);


--
-- Name: IX_vehicles_model; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE INDEX "IX_vehicles_model" ON public.vehicles USING btree (model);


--
-- Name: IX_vehicles_plate; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE INDEX "IX_vehicles_plate" ON public.vehicles USING btree (plate);


--
-- Name: IX_vehicles_soldByUserId; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE INDEX "IX_vehicles_soldByUserId" ON public.vehicles USING btree ("soldByUserId");


--
-- Name: IX_vehicles_status; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE INDEX "IX_vehicles_status" ON public.vehicles USING btree (status);


--
-- Name: IX_vehicles_tenantId; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE INDEX "IX_vehicles_tenantId" ON public.vehicles USING btree ("tenantId");


--
-- Name: IX_vehicles_vehicleTypeId; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE INDEX "IX_vehicles_vehicleTypeId" ON public.vehicles USING btree ("vehicleTypeId");


--
-- Name: IX_webhook_events_provider_externalEventId; Type: INDEX; Schema: public; Owner: autonexus
--

CREATE UNIQUE INDEX "IX_webhook_events_provider_externalEventId" ON public.webhook_events USING btree (provider, "externalEventId");


--
-- Name: BuyerAccessLinks FK_BuyerAccessLinks_vehicles_vehicleId; Type: FK CONSTRAINT; Schema: public; Owner: autonexus
--

ALTER TABLE ONLY public."BuyerAccessLinks"
    ADD CONSTRAINT "FK_BuyerAccessLinks_vehicles_vehicleId" FOREIGN KEY ("vehicleId") REFERENCES public.vehicles(id) ON DELETE CASCADE;


--
-- Name: ElectronicAcceptances FK_ElectronicAcceptances_vehicles_vehicleId; Type: FK CONSTRAINT; Schema: public; Owner: autonexus
--

ALTER TABLE ONLY public."ElectronicAcceptances"
    ADD CONSTRAINT "FK_ElectronicAcceptances_vehicles_vehicleId" FOREIGN KEY ("vehicleId") REFERENCES public.vehicles(id) ON DELETE CASCADE;


--
-- Name: VehicleModels FK_VehicleModels_VehicleBrands_vehicleBrandId; Type: FK CONSTRAINT; Schema: public; Owner: autonexus
--

ALTER TABLE ONLY public."VehicleModels"
    ADD CONSTRAINT "FK_VehicleModels_VehicleBrands_vehicleBrandId" FOREIGN KEY ("vehicleBrandId") REFERENCES public."VehicleBrands"(id) ON DELETE CASCADE;


--
-- Name: costs FK_costs_cost_categories_costCategoryId; Type: FK CONSTRAINT; Schema: public; Owner: autonexus
--

ALTER TABLE ONLY public.costs
    ADD CONSTRAINT "FK_costs_cost_categories_costCategoryId" FOREIGN KEY ("costCategoryId") REFERENCES public.cost_categories(id) ON DELETE RESTRICT;


--
-- Name: costs FK_costs_vehicles_vehicleId; Type: FK CONSTRAINT; Schema: public; Owner: autonexus
--

ALTER TABLE ONLY public.costs
    ADD CONSTRAINT "FK_costs_vehicles_vehicleId" FOREIGN KEY ("vehicleId") REFERENCES public.vehicles(id) ON DELETE CASCADE;


--
-- Name: fipe_histories FK_fipe_histories_vehicles_vehicleId; Type: FK CONSTRAINT; Schema: public; Owner: autonexus
--

ALTER TABLE ONLY public.fipe_histories
    ADD CONSTRAINT "FK_fipe_histories_vehicles_vehicleId" FOREIGN KEY ("vehicleId") REFERENCES public.vehicles(id) ON DELETE CASCADE;


--
-- Name: trades FK_trades_vehicles_deliveredVehicleId; Type: FK CONSTRAINT; Schema: public; Owner: autonexus
--

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT "FK_trades_vehicles_deliveredVehicleId" FOREIGN KEY ("deliveredVehicleId") REFERENCES public.vehicles(id) ON DELETE RESTRICT;


--
-- Name: trades FK_trades_vehicles_receivedVehicleId; Type: FK CONSTRAINT; Schema: public; Owner: autonexus
--

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT "FK_trades_vehicles_receivedVehicleId" FOREIGN KEY ("receivedVehicleId") REFERENCES public.vehicles(id) ON DELETE RESTRICT;


--
-- Name: vehicle_documents FK_vehicle_documents_document_categories_documentCategoryId; Type: FK CONSTRAINT; Schema: public; Owner: autonexus
--

ALTER TABLE ONLY public.vehicle_documents
    ADD CONSTRAINT "FK_vehicle_documents_document_categories_documentCategoryId" FOREIGN KEY ("documentCategoryId") REFERENCES public.document_categories(id) ON DELETE RESTRICT;


--
-- Name: vehicle_documents FK_vehicle_documents_vehicles_vehicleId; Type: FK CONSTRAINT; Schema: public; Owner: autonexus
--

ALTER TABLE ONLY public.vehicle_documents
    ADD CONSTRAINT "FK_vehicle_documents_vehicles_vehicleId" FOREIGN KEY ("vehicleId") REFERENCES public.vehicles(id) ON DELETE CASCADE;


--
-- Name: vehicle_photos FK_vehicle_photos_vehicles_vehicleId; Type: FK CONSTRAINT; Schema: public; Owner: autonexus
--

ALTER TABLE ONLY public.vehicle_photos
    ADD CONSTRAINT "FK_vehicle_photos_vehicles_vehicleId" FOREIGN KEY ("vehicleId") REFERENCES public.vehicles(id) ON DELETE CASCADE;


--
-- Name: vehicles FK_vehicles_users_soldByUserId; Type: FK CONSTRAINT; Schema: public; Owner: autonexus
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT "FK_vehicles_users_soldByUserId" FOREIGN KEY ("soldByUserId") REFERENCES public.users(id);


--
-- Name: vehicles FK_vehicles_vehicle_types_vehicleTypeId; Type: FK CONSTRAINT; Schema: public; Owner: autonexus
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT "FK_vehicles_vehicle_types_vehicleTypeId" FOREIGN KEY ("vehicleTypeId") REFERENCES public.vehicle_types(id) ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict YK2BLfMwod8Td8bQCrUdAUsqeddl1b2Q0DZg5TNdhK9ZWB7e6gMBdUN3fJlNuBw

--
-- Database "postgres" dump
--

\connect postgres

--
-- PostgreSQL database dump
--

\restrict kiOOrdxFdwm5xjaowR0D7jAve6ZCReHHdpba896z8yadet75g1Yh2FmObUDFATq

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

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
-- PostgreSQL database dump complete
--

\unrestrict kiOOrdxFdwm5xjaowR0D7jAve6ZCReHHdpba896z8yadet75g1Yh2FmObUDFATq

--
-- PostgreSQL database cluster dump complete
--

