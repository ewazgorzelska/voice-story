--
-- PostgreSQL database dump
--

\restrict mWAPQg3mknEb9mnH9lmlXUH1hlwVzDYGSjvfhAAxL5Sdphcf5bFHaIpdGQWZCco

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: tenants; Type: TABLE DATA; Schema: _realtime; Owner: -
--

COPY "_realtime"."tenants" ("id", "name", "external_id", "jwt_secret", "max_concurrent_users", "inserted_at", "updated_at", "max_events_per_second", "postgres_cdc_default", "max_bytes_per_second", "max_channels_per_client", "max_joins_per_second", "suspend", "jwt_jwks", "notify_private_alpha", "private_only", "migrations_ran", "broadcast_adapter", "max_presence_events_per_second", "max_payload_size_in_kb") FROM stdin;
f23d1b17-0326-4d2d-afe7-2ae732f95fff	realtime-dev	realtime-dev	iNjicxc4+llvc9wovDvqymwfnj9teWMlyOIbJ8Fh6j2WNU8CIJ2ZgjR6MUIKqSmeDmvpsKLsZ9jgXJmQPpwL8w==	200	2025-11-11 10:28:27	2025-11-11 10:28:27	100	postgres_cdc_rls	100000	100	100	f	{"keys": [{"k": "c3VwZXItc2VjcmV0LWp3dC10b2tlbi13aXRoLWF0LWxlYXN0LTMyLWNoYXJhY3RlcnMtbG9uZw", "kty": "oct"}]}	f	f	64	gen_rpc	10000	3000
\.


--
-- Data for Name: extensions; Type: TABLE DATA; Schema: _realtime; Owner: -
--

COPY "_realtime"."extensions" ("id", "type", "settings", "tenant_external_id", "inserted_at", "updated_at") FROM stdin;
7ccc965e-7e24-4967-81dd-bbcd91068b19	postgres_cdc_rls	{"region": "us-east-1", "db_host": "wCo6J0d++cd7ShJsrZOBRCeYvzBGkLKnZAcHA4WOWEc=", "db_name": "sWBpZNdjggEPTQVlI52Zfw==", "db_port": "+enMDFi1J/3IrrquHHwUmA==", "db_user": "uxbEq/zz8DXVD53TOI1zmw==", "slot_name": "supabase_realtime_replication_slot", "db_password": "sWBpZNdjggEPTQVlI52Zfw==", "publication": "supabase_realtime", "ssl_enforced": false, "poll_interval_ms": 100, "poll_max_changes": 100, "poll_max_record_bytes": 1048576}	realtime-dev	2025-11-11 10:28:27	2025-11-11 10:28:27
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: _realtime; Owner: -
--

COPY "_realtime"."schema_migrations" ("version", "inserted_at") FROM stdin;
20210706140551	2025-10-16 10:55:45
20220329161857	2025-10-16 10:55:45
20220410212326	2025-10-16 10:55:45
20220506102948	2025-10-16 10:55:45
20220527210857	2025-10-16 10:55:45
20220815211129	2025-10-16 10:55:45
20220815215024	2025-10-16 10:55:45
20220818141501	2025-10-16 10:55:45
20221018173709	2025-10-16 10:55:45
20221102172703	2025-10-16 10:55:45
20221223010058	2025-10-16 10:55:45
20230110180046	2025-10-16 10:55:45
20230810220907	2025-10-16 10:55:45
20230810220924	2025-10-16 10:55:45
20231024094642	2025-10-16 10:55:45
20240306114423	2025-10-16 10:55:45
20240418082835	2025-10-16 10:55:45
20240625211759	2025-10-16 10:55:45
20240704172020	2025-10-16 10:55:45
20240902173232	2025-10-16 10:55:45
20241106103258	2025-10-16 10:55:45
20250424203323	2025-10-16 10:55:45
20250613072131	2025-10-16 10:55:45
20250711044927	2025-10-16 10:55:45
20250811121559	2025-10-16 10:55:45
\.


--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") FROM stdin;
00000000-0000-0000-0000-000000000000	32d3f62a-c571-4708-93b3-b5ffda00abfe	{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"user@123.com","user_id":"9d619ae5-34eb-4d42-96ad-5c35109eb329","user_phone":""}}	2025-10-19 12:12:14.985542+00	
00000000-0000-0000-0000-000000000000	e6795f27-1edc-4bce-863e-8b5f34d76498	{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"user@456.com","user_id":"1ff57ad0-ed09-43ec-9c80-f31532eb34ed","user_phone":""}}	2025-11-09 15:59:43.817216+00	
00000000-0000-0000-0000-000000000000	ffa40671-c916-482b-a946-d55459e3f451	{"action":"login","actor_id":"1ff57ad0-ed09-43ec-9c80-f31532eb34ed","actor_username":"user@456.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-11-09 16:00:11.820433+00	
00000000-0000-0000-0000-000000000000	f5f11273-22ba-4330-aae2-f020a3c0687d	{"action":"login","actor_id":"1ff57ad0-ed09-43ec-9c80-f31532eb34ed","actor_username":"user@456.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-11-09 16:01:01.484762+00	
00000000-0000-0000-0000-000000000000	54e8ad75-a604-4dc3-9a1f-d1d004a906c2	{"action":"logout","actor_id":"1ff57ad0-ed09-43ec-9c80-f31532eb34ed","actor_username":"user@456.com","actor_via_sso":false,"log_type":"account"}	2025-11-09 16:10:48.766647+00	
00000000-0000-0000-0000-000000000000	b1b1ebbf-1225-4da9-a6c1-c1b4b03c0280	{"action":"login","actor_id":"1ff57ad0-ed09-43ec-9c80-f31532eb34ed","actor_username":"user@456.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-11-09 16:25:32.57917+00	
00000000-0000-0000-0000-000000000000	2e37b214-c9b7-4d91-94ea-a84b533e5888	{"action":"logout","actor_id":"1ff57ad0-ed09-43ec-9c80-f31532eb34ed","actor_username":"user@456.com","actor_via_sso":false,"log_type":"account"}	2025-11-09 16:25:38.679705+00	
00000000-0000-0000-0000-000000000000	a5bc1a03-d2c4-4f93-bee0-d6df07f87bd9	{"action":"login","actor_id":"1ff57ad0-ed09-43ec-9c80-f31532eb34ed","actor_username":"user@456.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-11-11 10:49:26.4771+00	
00000000-0000-0000-0000-000000000000	e9de1d02-180f-4423-b6cc-7c4ea358e12d	{"action":"logout","actor_id":"1ff57ad0-ed09-43ec-9c80-f31532eb34ed","actor_username":"user@456.com","actor_via_sso":false,"log_type":"account"}	2025-11-11 10:50:30.823256+00	
00000000-0000-0000-0000-000000000000	7bac2f17-e2f1-4298-9db1-896e6b95ad31	{"action":"login","actor_id":"1ff57ad0-ed09-43ec-9c80-f31532eb34ed","actor_username":"user@456.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-11-11 10:52:32.960564+00	
00000000-0000-0000-0000-000000000000	27a7126f-2781-4c5c-94de-8c1a2bcdc2ff	{"action":"logout","actor_id":"1ff57ad0-ed09-43ec-9c80-f31532eb34ed","actor_username":"user@456.com","actor_via_sso":false,"log_type":"account"}	2025-11-11 10:56:00.336329+00	
00000000-0000-0000-0000-000000000000	ca56f144-f5fb-4bbc-bc9e-ca2eadd5e3eb	{"action":"user_signedup","actor_id":"a59139a3-c86a-4da1-bb29-c1ef074584ad","actor_username":"ewa.zgorzelska@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}	2025-11-11 11:15:58.794493+00	
00000000-0000-0000-0000-000000000000	e3f5a307-8bfc-4947-a39c-216861cb22ec	{"action":"login","actor_id":"a59139a3-c86a-4da1-bb29-c1ef074584ad","actor_username":"ewa.zgorzelska@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-11-11 11:15:58.79781+00	
00000000-0000-0000-0000-000000000000	2038e7c8-bfed-4fbe-b2a0-45a9389bfec8	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"ewa.zgorzelska@gmail.com","user_id":"a59139a3-c86a-4da1-bb29-c1ef074584ad","user_phone":""}}	2025-11-11 11:38:14.496639+00	
00000000-0000-0000-0000-000000000000	0bd40c0b-e373-45f5-9149-32e74027e5a9	{"action":"user_signedup","actor_id":"953e565e-38f9-4dc4-8f72-2282ae470d07","actor_username":"ewa.zgorzelska@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}	2025-11-11 11:38:44.809659+00	
00000000-0000-0000-0000-000000000000	b38f868e-be0e-4ec9-89cb-0a52043f38e4	{"action":"login","actor_id":"953e565e-38f9-4dc4-8f72-2282ae470d07","actor_username":"ewa.zgorzelska@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-11-11 11:38:44.812044+00	
00000000-0000-0000-0000-000000000000	9ea0e79b-48c7-4a19-857d-3ff07ddf0b0d	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"ewa.zgorzelska@gmail.com","user_id":"953e565e-38f9-4dc4-8f72-2282ae470d07","user_phone":""}}	2025-11-11 11:40:08.208013+00	
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY "auth"."flow_state" ("id", "user_id", "auth_code", "code_challenge_method", "code_challenge", "provider_type", "provider_access_token", "provider_refresh_token", "created_at", "updated_at", "authentication_method", "auth_code_issued_at") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") FROM stdin;
00000000-0000-0000-0000-000000000000	9d619ae5-34eb-4d42-96ad-5c35109eb329	authenticated	authenticated	user@123.com	$2a$10$6ctIS0/Zby/NS.hIohG0pOveBiEUQYCxYpxFiTJxK7gg4LziIxoUu	2025-10-19 12:12:14.987692+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2025-10-19 12:12:14.98141+00	2025-10-19 12:12:14.988268+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	1ff57ad0-ed09-43ec-9c80-f31532eb34ed	authenticated	authenticated	user@456.com	$2a$10$/M4CTMuHdsjAOQmG.ntVme/xk7sRKshd5ktwjR3M9pJI6jyCvobMm	2025-11-09 15:59:43.819746+00	\N		\N		\N			\N	2025-11-11 10:52:32.961233+00	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2025-11-09 15:59:43.814734+00	2025-11-11 10:52:32.962968+00	\N	\N			\N		0	\N		\N	f	\N	f
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") FROM stdin;
9d619ae5-34eb-4d42-96ad-5c35109eb329	9d619ae5-34eb-4d42-96ad-5c35109eb329	{"sub": "9d619ae5-34eb-4d42-96ad-5c35109eb329", "email": "user@123.com", "email_verified": false, "phone_verified": false}	email	2025-10-19 12:12:14.983962+00	2025-10-19 12:12:14.984058+00	2025-10-19 12:12:14.984058+00	592f8b59-3ae5-40bd-a57c-810d7ce00af5
1ff57ad0-ed09-43ec-9c80-f31532eb34ed	1ff57ad0-ed09-43ec-9c80-f31532eb34ed	{"sub": "1ff57ad0-ed09-43ec-9c80-f31532eb34ed", "email": "user@456.com", "email_verified": false, "phone_verified": false}	email	2025-11-09 15:59:43.816276+00	2025-11-09 15:59:43.816307+00	2025-11-09 15:59:43.816307+00	a5e68d06-1075-4a4b-98a4-118ebef2c022
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY "auth"."instances" ("id", "uuid", "raw_base_config", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY "auth"."oauth_clients" ("id", "client_secret_hash", "registration_type", "redirect_uris", "grant_types", "client_name", "client_uri", "logo_uri", "created_at", "updated_at", "deleted_at", "client_type") FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id") FROM stdin;
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") FROM stdin;
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY "auth"."mfa_factors" ("id", "user_id", "friendly_name", "factor_type", "status", "created_at", "updated_at", "secret", "phone", "last_challenged_at", "web_authn_credential", "web_authn_aaguid") FROM stdin;
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY "auth"."mfa_challenges" ("id", "factor_id", "created_at", "verified_at", "ip_address", "otp_code", "web_authn_session_data") FROM stdin;
\.


--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY "auth"."oauth_authorizations" ("id", "authorization_id", "client_id", "user_id", "redirect_uri", "scope", "state", "resource", "code_challenge", "code_challenge_method", "response_type", "status", "authorization_code", "created_at", "expires_at", "approved_at") FROM stdin;
\.


--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY "auth"."oauth_consents" ("id", "user_id", "client_id", "scopes", "granted_at", "revoked_at") FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY "auth"."one_time_tokens" ("id", "user_id", "token_type", "token_hash", "relates_to", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") FROM stdin;
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY "auth"."sso_providers" ("id", "resource_id", "created_at", "updated_at", "disabled") FROM stdin;
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY "auth"."saml_providers" ("id", "sso_provider_id", "entity_id", "metadata_xml", "metadata_url", "attribute_mapping", "created_at", "updated_at", "name_id_format") FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY "auth"."saml_relay_states" ("id", "sso_provider_id", "request_id", "for_email", "redirect_to", "created_at", "updated_at", "flow_state_id") FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY "auth"."schema_migrations" ("version") FROM stdin;
20171026211738
20171026211808
20171026211834
20180103212743
20180108183307
20180119214651
20180125194653
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
20220811173540
20221003041349
20221003041400
20221011041400
20221020193600
20221021073300
20221021082433
20221027105023
20221114143122
20221114143410
20221125140132
20221208132122
20221215195500
20221215195800
20221215195900
20230116124310
20230116124412
20230131181311
20230322519590
20230402418590
20230411005111
20230508135423
20230523124323
20230818113222
20230914180801
20231027141322
20231114161723
20231117164230
20240115144230
20240214120130
20240306115329
20240314092811
20240427152123
20240612123726
20240729123726
20240802193726
20240806073726
20241009103726
20250717082212
20250731150234
20250804100000
20250901200500
20250903112500
20250904133000
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY "auth"."sso_domains" ("id", "sso_provider_id", "domain", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: stories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."stories" ("id", "title", "slug", "content", "version", "updated_at") FROM stdin;
\.


--
-- Data for Name: story_generations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."story_generations" ("id", "user_id", "story_id", "status", "progress", "result_url", "metadata", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: generation_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."generation_logs" ("id", "generation_id", "event", "occurred_at") FROM stdin;
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."profiles" ("user_id", "created_at") FROM stdin;
\.


--
-- Data for Name: voice_samples; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."voice_samples" ("id", "user_id", "elevenlabs_voice_id", "verification_phrase", "verified", "created_at") FROM stdin;
\.


--
-- Data for Name: messages_2025_11_08; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY "realtime"."messages_2025_11_08" ("topic", "extension", "payload", "event", "private", "updated_at", "inserted_at", "id") FROM stdin;
\.


--
-- Data for Name: messages_2025_11_09; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY "realtime"."messages_2025_11_09" ("topic", "extension", "payload", "event", "private", "updated_at", "inserted_at", "id") FROM stdin;
\.


--
-- Data for Name: messages_2025_11_10; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY "realtime"."messages_2025_11_10" ("topic", "extension", "payload", "event", "private", "updated_at", "inserted_at", "id") FROM stdin;
\.


--
-- Data for Name: messages_2025_11_11; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY "realtime"."messages_2025_11_11" ("topic", "extension", "payload", "event", "private", "updated_at", "inserted_at", "id") FROM stdin;
\.


--
-- Data for Name: messages_2025_11_12; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY "realtime"."messages_2025_11_12" ("topic", "extension", "payload", "event", "private", "updated_at", "inserted_at", "id") FROM stdin;
\.


--
-- Data for Name: messages_2025_11_13; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY "realtime"."messages_2025_11_13" ("topic", "extension", "payload", "event", "private", "updated_at", "inserted_at", "id") FROM stdin;
\.


--
-- Data for Name: messages_2025_11_14; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY "realtime"."messages_2025_11_14" ("topic", "extension", "payload", "event", "private", "updated_at", "inserted_at", "id") FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY "realtime"."schema_migrations" ("version", "inserted_at") FROM stdin;
20211116024918	2025-10-16 10:55:46
20211116045059	2025-10-16 10:55:46
20211116050929	2025-10-16 10:55:46
20211116051442	2025-10-16 10:55:46
20211116212300	2025-10-16 10:55:46
20211116213355	2025-10-16 10:55:46
20211116213934	2025-10-16 10:55:46
20211116214523	2025-10-16 10:55:46
20211122062447	2025-10-16 10:55:46
20211124070109	2025-10-16 10:55:46
20211202204204	2025-10-16 10:55:46
20211202204605	2025-10-16 10:55:46
20211210212804	2025-10-16 10:55:46
20211228014915	2025-10-16 10:55:46
20220107221237	2025-10-16 10:55:46
20220228202821	2025-10-16 10:55:46
20220312004840	2025-10-16 10:55:46
20220603231003	2025-10-16 10:55:46
20220603232444	2025-10-16 10:55:46
20220615214548	2025-10-16 10:55:46
20220712093339	2025-10-16 10:55:46
20220908172859	2025-10-16 10:55:46
20220916233421	2025-10-16 10:55:46
20230119133233	2025-10-16 10:55:46
20230128025114	2025-10-16 10:55:46
20230128025212	2025-10-16 10:55:46
20230227211149	2025-10-16 10:55:46
20230228184745	2025-10-16 10:55:46
20230308225145	2025-10-16 10:55:46
20230328144023	2025-10-16 10:55:46
20231018144023	2025-10-16 10:55:46
20231204144023	2025-10-16 10:55:46
20231204144024	2025-10-16 10:55:46
20231204144025	2025-10-16 10:55:46
20240108234812	2025-10-16 10:55:46
20240109165339	2025-10-16 10:55:46
20240227174441	2025-10-16 10:55:46
20240311171622	2025-10-16 10:55:47
20240321100241	2025-10-16 10:55:47
20240401105812	2025-10-16 10:55:47
20240418121054	2025-10-16 10:55:47
20240523004032	2025-10-16 10:55:47
20240618124746	2025-10-16 10:55:47
20240801235015	2025-10-16 10:55:47
20240805133720	2025-10-16 10:55:47
20240827160934	2025-10-16 10:55:47
20240919163303	2025-10-16 10:55:47
20240919163305	2025-10-16 10:55:47
20241019105805	2025-10-16 10:55:47
20241030150047	2025-10-16 10:55:47
20241108114728	2025-10-16 10:55:47
20241121104152	2025-10-16 10:55:47
20241130184212	2025-10-16 10:55:47
20241220035512	2025-10-16 10:55:47
20241220123912	2025-10-16 10:55:47
20241224161212	2025-10-16 10:55:47
20250107150512	2025-10-16 10:55:47
20250110162412	2025-10-16 10:55:47
20250123174212	2025-10-16 10:55:47
20250128220012	2025-10-16 10:55:47
20250506224012	2025-10-16 10:55:47
20250523164012	2025-10-16 10:55:47
20250714121412	2025-10-16 10:55:47
20250905041441	2025-10-16 10:55:47
\.


--
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY "realtime"."subscription" ("id", "subscription_id", "entity", "filters", "claims", "created_at") FROM stdin;
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") FROM stdin;
\.


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY "storage"."buckets_analytics" ("id", "type", "format", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: iceberg_namespaces; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY "storage"."iceberg_namespaces" ("id", "bucket_id", "name", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: iceberg_tables; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY "storage"."iceberg_tables" ("id", "namespace_id", "bucket_id", "name", "location", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY "storage"."migrations" ("id", "name", "hash", "executed_at") FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2025-10-16 10:57:12.791437
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2025-10-16 10:57:12.795013
2	storage-schema	5c7968fd083fcea04050c1b7f6253c9771b99011	2025-10-16 10:57:12.797135
3	pathtoken-column	2cb1b0004b817b29d5b0a971af16bafeede4b70d	2025-10-16 10:57:12.80565
4	add-migrations-rls	427c5b63fe1c5937495d9c635c263ee7a5905058	2025-10-16 10:57:12.810788
5	add-size-functions	79e081a1455b63666c1294a440f8ad4b1e6a7f84	2025-10-16 10:57:12.812602
6	change-column-name-in-get-size	f93f62afdf6613ee5e7e815b30d02dc990201044	2025-10-16 10:57:12.815341
7	add-rls-to-buckets	e7e7f86adbc51049f341dfe8d30256c1abca17aa	2025-10-16 10:57:12.817896
8	add-public-to-buckets	fd670db39ed65f9d08b01db09d6202503ca2bab3	2025-10-16 10:57:12.81968
9	fix-search-function	3a0af29f42e35a4d101c259ed955b67e1bee6825	2025-10-16 10:57:12.821683
10	search-files-search-function	68dc14822daad0ffac3746a502234f486182ef6e	2025-10-16 10:57:12.824098
11	add-trigger-to-auto-update-updated_at-column	7425bdb14366d1739fa8a18c83100636d74dcaa2	2025-10-16 10:57:12.826845
12	add-automatic-avif-detection-flag	8e92e1266eb29518b6a4c5313ab8f29dd0d08df9	2025-10-16 10:57:12.829688
13	add-bucket-custom-limits	cce962054138135cd9a8c4bcd531598684b25e7d	2025-10-16 10:57:12.831722
14	use-bytes-for-max-size	941c41b346f9802b411f06f30e972ad4744dad27	2025-10-16 10:57:12.833803
15	add-can-insert-object-function	934146bc38ead475f4ef4b555c524ee5d66799e5	2025-10-16 10:57:12.844536
16	add-version	76debf38d3fd07dcfc747ca49096457d95b1221b	2025-10-16 10:57:12.84675
17	drop-owner-foreign-key	f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101	2025-10-16 10:57:12.848536
18	add_owner_id_column_deprecate_owner	e7a511b379110b08e2f214be852c35414749fe66	2025-10-16 10:57:12.850739
19	alter-default-value-objects-id	02e5e22a78626187e00d173dc45f58fa66a4f043	2025-10-16 10:57:12.853321
20	list-objects-with-delimiter	cd694ae708e51ba82bf012bba00caf4f3b6393b7	2025-10-16 10:57:12.855162
21	s3-multipart-uploads	8c804d4a566c40cd1e4cc5b3725a664a9303657f	2025-10-16 10:57:12.858022
22	s3-multipart-uploads-big-ints	9737dc258d2397953c9953d9b86920b8be0cdb73	2025-10-16 10:57:12.865004
23	optimize-search-function	9d7e604cddc4b56a5422dc68c9313f4a1b6f132c	2025-10-16 10:57:12.871459
24	operation-function	8312e37c2bf9e76bbe841aa5fda889206d2bf8aa	2025-10-16 10:57:12.874217
25	custom-metadata	d974c6057c3db1c1f847afa0e291e6165693b990	2025-10-16 10:57:12.876445
26	objects-prefixes	ef3f7871121cdc47a65308e6702519e853422ae2	2025-10-16 10:57:12.878396
27	search-v2	33b8f2a7ae53105f028e13e9fcda9dc4f356b4a2	2025-10-16 10:57:12.886335
28	object-bucket-name-sorting	ba85ec41b62c6a30a3f136788227ee47f311c436	2025-10-16 10:57:12.893487
29	create-prefixes	a7b1a22c0dc3ab630e3055bfec7ce7d2045c5b7b	2025-10-16 10:57:12.89682
30	update-object-levels	6c6f6cc9430d570f26284a24cf7b210599032db7	2025-10-16 10:57:12.899487
31	objects-level-index	33f1fef7ec7fea08bb892222f4f0f5d79bab5eb8	2025-10-16 10:57:12.904308
32	backward-compatible-index-on-objects	2d51eeb437a96868b36fcdfb1ddefdf13bef1647	2025-10-16 10:57:12.909846
33	backward-compatible-index-on-prefixes	fe473390e1b8c407434c0e470655945b110507bf	2025-10-16 10:57:12.915814
34	optimize-search-function-v1	82b0e469a00e8ebce495e29bfa70a0797f7ebd2c	2025-10-16 10:57:12.917369
35	add-insert-trigger-prefixes	63bb9fd05deb3dc5e9fa66c83e82b152f0caf589	2025-10-16 10:57:12.921215
36	optimise-existing-functions	81cf92eb0c36612865a18016a38496c530443899	2025-10-16 10:57:12.923135
37	add-bucket-name-length-trigger	3944135b4e3e8b22d6d4cbb568fe3b0b51df15c1	2025-10-16 10:57:12.928281
38	iceberg-catalog-flag-on-buckets	19a8bd89d5dfa69af7f222a46c726b7c41e462c5	2025-10-16 10:57:12.930757
39	add-search-v2-sort-support	39cf7d1e6bf515f4b02e41237aba845a7b492853	2025-10-16 10:57:12.93987
40	fix-prefix-race-conditions-optimized	fd02297e1c67df25a9fc110bf8c8a9af7fb06d1f	2025-10-16 10:57:12.942859
41	add-object-level-update-trigger	44c22478bf01744b2129efc480cd2edc9a7d60e9	2025-10-16 10:57:12.948531
42	rollback-prefix-triggers	f2ab4f526ab7f979541082992593938c05ee4b47	2025-10-16 10:57:12.951937
43	fix-object-level	ab837ad8f1c7d00cc0b7310e989a23388ff29fc6	2025-10-16 10:57:12.955019
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY "storage"."objects" ("id", "bucket_id", "name", "owner", "created_at", "updated_at", "last_accessed_at", "metadata", "version", "owner_id", "user_metadata", "level") FROM stdin;
\.


--
-- Data for Name: prefixes; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY "storage"."prefixes" ("bucket_id", "name", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY "storage"."s3_multipart_uploads" ("id", "in_progress_size", "upload_signature", "bucket_id", "key", "version", "owner_id", "created_at", "user_metadata") FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY "storage"."s3_multipart_uploads_parts" ("id", "upload_id", "size", "part_number", "bucket_id", "key", "etag", "owner_id", "version", "created_at") FROM stdin;
\.


--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: -
--

COPY "supabase_functions"."hooks" ("id", "hook_table_id", "hook_name", "created_at", "request_id") FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: supabase_functions; Owner: -
--

COPY "supabase_functions"."migrations" ("version", "inserted_at") FROM stdin;
initial	2025-10-16 10:54:34.356607+00
20210809183423_update_grants	2025-10-16 10:54:34.356607+00
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: supabase_migrations; Owner: -
--

COPY "supabase_migrations"."schema_migrations" ("version", "statements", "name") FROM stdin;
20251019000000	{"-- Migration: Initial Schema Setup\n-- Purpose: Create core tables, enums, indexes, and RLS policies for the voice-story application\n-- Affected tables: profiles, voice_samples, stories, story_generations, generation_logs\n-- Special considerations: Enables RLS on all tables with granular policies for anon and authenticated roles\n\n-- ============================================================================\n-- 1. EXTENSIONS\n-- ============================================================================\n\n-- enable pgcrypto for gen_random_uuid()\ncreate extension if not exists pgcrypto","-- ============================================================================\n-- 2. CUSTOM TYPES\n-- ============================================================================\n\n-- custom enum for tracking story generation status\ncreate type generation_status as enum ('pending', 'in_progress', 'completed', 'failed')","-- ============================================================================\n-- 3. TABLES\n-- ============================================================================\n\n-- profiles table: stores additional user metadata beyond auth.users\n-- 1:1 relationship with auth.users\ncreate table profiles (\n  user_id uuid primary key references auth.users(id) on delete cascade,\n  created_at timestamptz not null default now()\n  -- future columns: display_name, avatar_url, etc.\n)","-- enable row level security on profiles\nalter table profiles enable row level security","-- voice_samples table: stores user voice samples for ElevenLabs integration\n-- each user can have one voice sample (enforced by unique constraint)\ncreate table voice_samples (\n  id uuid primary key default gen_random_uuid(),\n  user_id uuid not null references auth.users(id) on delete cascade,\n  elevenlabs_voice_id text not null,\n  verification_phrase text not null,\n  verified boolean not null default false,\n  created_at timestamptz not null default now(),\n  -- ensure one voice sample per user\n  unique (user_id)\n)","-- enable row level security on voice_samples\nalter table voice_samples enable row level security","-- stories table: stores story content that can be generated into audio\n-- stories are versioned and accessed via slugs\ncreate table stories (\n  id uuid primary key default gen_random_uuid(),\n  title text not null,\n  slug text not null unique,\n  content text not null,\n  version integer not null default 1,\n  updated_at timestamptz not null default now()\n)","-- enable row level security on stories\nalter table stories enable row level security","-- story_generations table: tracks user requests to generate audio from stories\n-- stores generation status, progress, and result metadata\ncreate table story_generations (\n  id uuid primary key default gen_random_uuid(),\n  user_id uuid not null references auth.users(id) on delete cascade,\n  story_id uuid not null references stories(id) on delete cascade,\n  status generation_status not null default 'pending',\n  progress integer not null default 0 check (progress between 0 and 100),\n  result_url text not null default '',\n  metadata jsonb,\n  created_at timestamptz not null default now(),\n  updated_at timestamptz not null default now()\n)","-- enable row level security on story_generations\nalter table story_generations enable row level security","-- generation_logs table: audit log for generation events\n-- tracks detailed events during the generation process\ncreate table generation_logs (\n  id uuid primary key default gen_random_uuid(),\n  generation_id uuid not null references story_generations(id) on delete cascade,\n  event text not null,\n  occurred_at timestamptz not null default now()\n)","-- enable row level security on generation_logs\nalter table generation_logs enable row level security","-- ============================================================================\n-- 4. INDEXES\n-- ============================================================================\n\n-- index for looking up voice samples by user\ncreate index idx_voice_samples_user_id on voice_samples(user_id)","-- index for looking up story generations by user\ncreate index idx_story_generations_user_id on story_generations(user_id)","-- index for looking up story generations by story\ncreate index idx_story_generations_story_id on story_generations(story_id)","-- index for looking up generation logs by generation\ncreate index idx_generation_logs_generation_id on generation_logs(generation_id)","-- note: jsonb/gin indexing on story_generations.metadata deferred until query patterns emerge\n\n-- ============================================================================\n-- 5. ROW LEVEL SECURITY POLICIES\n-- ============================================================================\n\n-- profiles policies\n-- ----------------\n\n-- anon users cannot select profiles\ncreate policy profiles_select_anon on profiles\n  for select\n  to anon\n  using (false)","-- authenticated users can select their own profile\ncreate policy profiles_select_authenticated on profiles\n  for select\n  to authenticated\n  using (auth.uid() = user_id)","-- anon users cannot insert profiles\ncreate policy profiles_insert_anon on profiles\n  for insert\n  to anon\n  with check (false)","-- authenticated users can insert their own profile\ncreate policy profiles_insert_authenticated on profiles\n  for insert\n  to authenticated\n  with check (auth.uid() = user_id)","-- anon users cannot update profiles\ncreate policy profiles_update_anon on profiles\n  for update\n  to anon\n  using (false)\n  with check (false)","-- authenticated users can update their own profile\ncreate policy profiles_update_authenticated on profiles\n  for update\n  to authenticated\n  using (auth.uid() = user_id)\n  with check (auth.uid() = user_id)","-- anon users cannot delete profiles\ncreate policy profiles_delete_anon on profiles\n  for delete\n  to anon\n  using (false)","-- authenticated users can delete their own profile\ncreate policy profiles_delete_authenticated on profiles\n  for delete\n  to authenticated\n  using (auth.uid() = user_id)","-- voice_samples policies\n-- ----------------------\n\n-- anon users cannot select voice samples\ncreate policy voice_samples_select_anon on voice_samples\n  for select\n  to anon\n  using (false)","-- authenticated users can select their own voice samples\ncreate policy voice_samples_select_authenticated on voice_samples\n  for select\n  to authenticated\n  using (auth.uid() = user_id)","-- anon users cannot insert voice samples\ncreate policy voice_samples_insert_anon on voice_samples\n  for insert\n  to anon\n  with check (false)","-- authenticated users can insert their own voice samples\ncreate policy voice_samples_insert_authenticated on voice_samples\n  for insert\n  to authenticated\n  with check (auth.uid() = user_id)","-- anon users cannot update voice samples\ncreate policy voice_samples_update_anon on voice_samples\n  for update\n  to anon\n  using (false)\n  with check (false)","-- authenticated users can update their own voice samples\ncreate policy voice_samples_update_authenticated on voice_samples\n  for update\n  to authenticated\n  using (auth.uid() = user_id)\n  with check (auth.uid() = user_id)","-- anon users cannot delete voice samples\ncreate policy voice_samples_delete_anon on voice_samples\n  for delete\n  to anon\n  using (false)","-- authenticated users can delete their own voice samples\ncreate policy voice_samples_delete_authenticated on voice_samples\n  for delete\n  to authenticated\n  using (auth.uid() = user_id)","-- stories policies\n-- ---------------\n-- stories are publicly readable but not modifiable by users (admin-managed content)\n\n-- anon users can select all stories (public access)\ncreate policy stories_select_anon on stories\n  for select\n  to anon\n  using (true)","-- authenticated users can select all stories (public access)\ncreate policy stories_select_authenticated on stories\n  for select\n  to authenticated\n  using (true)","-- anon users cannot insert stories\ncreate policy stories_insert_anon on stories\n  for insert\n  to anon\n  with check (false)","-- authenticated users cannot insert stories (admin-only)\ncreate policy stories_insert_authenticated on stories\n  for insert\n  to authenticated\n  with check (false)","-- anon users cannot update stories\ncreate policy stories_update_anon on stories\n  for update\n  to anon\n  using (false)\n  with check (false)","-- authenticated users cannot update stories (admin-only)\ncreate policy stories_update_authenticated on stories\n  for update\n  to authenticated\n  using (false)\n  with check (false)","-- anon users cannot delete stories\ncreate policy stories_delete_anon on stories\n  for delete\n  to anon\n  using (false)","-- authenticated users cannot delete stories (admin-only)\ncreate policy stories_delete_authenticated on stories\n  for delete\n  to authenticated\n  using (false)","-- story_generations policies\n-- --------------------------\n\n-- anon users cannot select story generations\ncreate policy story_generations_select_anon on story_generations\n  for select\n  to anon\n  using (false)","-- authenticated users can select their own story generations\ncreate policy story_generations_select_authenticated on story_generations\n  for select\n  to authenticated\n  using (auth.uid() = user_id)","-- anon users cannot insert story generations\ncreate policy story_generations_insert_anon on story_generations\n  for insert\n  to anon\n  with check (false)","-- authenticated users can insert their own story generations\ncreate policy story_generations_insert_authenticated on story_generations\n  for insert\n  to authenticated\n  with check (auth.uid() = user_id)","-- anon users cannot update story generations\ncreate policy story_generations_update_anon on story_generations\n  for update\n  to anon\n  using (false)\n  with check (false)","-- authenticated users can update their own story generations\ncreate policy story_generations_update_authenticated on story_generations\n  for update\n  to authenticated\n  using (auth.uid() = user_id)\n  with check (auth.uid() = user_id)","-- anon users cannot delete story generations\ncreate policy story_generations_delete_anon on story_generations\n  for delete\n  to anon\n  using (false)","-- authenticated users can delete their own story generations\ncreate policy story_generations_delete_authenticated on story_generations\n  for delete\n  to authenticated\n  using (auth.uid() = user_id)","-- generation_logs policies\n-- ------------------------\n-- users can only access logs for their own generations\n\n-- anon users cannot select generation logs\ncreate policy generation_logs_select_anon on generation_logs\n  for select\n  to anon\n  using (false)","-- authenticated users can select logs for their own generations\ncreate policy generation_logs_select_authenticated on generation_logs\n  for select\n  to authenticated\n  using (\n    exists (\n      select 1 from story_generations sg\n      where sg.id = generation_logs.generation_id\n        and sg.user_id = auth.uid()\n    )\n  )","-- anon users cannot insert generation logs\ncreate policy generation_logs_insert_anon on generation_logs\n  for insert\n  to anon\n  with check (false)","-- authenticated users can insert logs for their own generations\ncreate policy generation_logs_insert_authenticated on generation_logs\n  for insert\n  to authenticated\n  with check (\n    exists (\n      select 1 from story_generations sg\n      where sg.id = generation_logs.generation_id\n        and sg.user_id = auth.uid()\n    )\n  )","-- anon users cannot update generation logs\ncreate policy generation_logs_update_anon on generation_logs\n  for update\n  to anon\n  using (false)\n  with check (false)","-- authenticated users can update logs for their own generations\ncreate policy generation_logs_update_authenticated on generation_logs\n  for update\n  to authenticated\n  using (\n    exists (\n      select 1 from story_generations sg\n      where sg.id = generation_logs.generation_id\n        and sg.user_id = auth.uid()\n    )\n  )\n  with check (\n    exists (\n      select 1 from story_generations sg\n      where sg.id = generation_logs.generation_id\n        and sg.user_id = auth.uid()\n    )\n  )","-- anon users cannot delete generation logs\ncreate policy generation_logs_delete_anon on generation_logs\n  for delete\n  to anon\n  using (false)","-- authenticated users can delete logs for their own generations\ncreate policy generation_logs_delete_authenticated on generation_logs\n  for delete\n  to authenticated\n  using (\n    exists (\n      select 1 from story_generations sg\n      where sg.id = generation_logs.generation_id\n        and sg.user_id = auth.uid()\n    )\n  )"}	initial_schema
20251019000001	{"-- Migration: Disable All RLS Policies and RLS on Tables\n-- Purpose: Drop all RLS policies and disable RLS on tables from the initial schema migration\n-- Affected tables: profiles, voice_samples, stories, story_generations, generation_logs\n-- Note: This completely disables row level security on all tables\n\n-- ============================================================================\n-- DROP ALL RLS POLICIES\n-- ============================================================================\n\n-- profiles policies\n-- ----------------\ndrop policy if exists profiles_select_anon on profiles","drop policy if exists profiles_select_authenticated on profiles","drop policy if exists profiles_insert_anon on profiles","drop policy if exists profiles_insert_authenticated on profiles","drop policy if exists profiles_update_anon on profiles","drop policy if exists profiles_update_authenticated on profiles","drop policy if exists profiles_delete_anon on profiles","drop policy if exists profiles_delete_authenticated on profiles","-- voice_samples policies\n-- ----------------------\ndrop policy if exists voice_samples_select_anon on voice_samples","drop policy if exists voice_samples_select_authenticated on voice_samples","drop policy if exists voice_samples_insert_anon on voice_samples","drop policy if exists voice_samples_insert_authenticated on voice_samples","drop policy if exists voice_samples_update_anon on voice_samples","drop policy if exists voice_samples_update_authenticated on voice_samples","drop policy if exists voice_samples_delete_anon on voice_samples","drop policy if exists voice_samples_delete_authenticated on voice_samples","-- stories policies\n-- ---------------\ndrop policy if exists stories_select_anon on stories","drop policy if exists stories_select_authenticated on stories","drop policy if exists stories_insert_anon on stories","drop policy if exists stories_insert_authenticated on stories","drop policy if exists stories_update_anon on stories","drop policy if exists stories_update_authenticated on stories","drop policy if exists stories_delete_anon on stories","drop policy if exists stories_delete_authenticated on stories","-- story_generations policies\n-- --------------------------\ndrop policy if exists story_generations_select_anon on story_generations","drop policy if exists story_generations_select_authenticated on story_generations","drop policy if exists story_generations_insert_anon on story_generations","drop policy if exists story_generations_insert_authenticated on story_generations","drop policy if exists story_generations_update_anon on story_generations","drop policy if exists story_generations_update_authenticated on story_generations","drop policy if exists story_generations_delete_anon on story_generations","drop policy if exists story_generations_delete_authenticated on story_generations","-- generation_logs policies\n-- ------------------------\ndrop policy if exists generation_logs_select_anon on generation_logs","drop policy if exists generation_logs_select_authenticated on generation_logs","drop policy if exists generation_logs_insert_anon on generation_logs","drop policy if exists generation_logs_insert_authenticated on generation_logs","drop policy if exists generation_logs_update_anon on generation_logs","drop policy if exists generation_logs_update_authenticated on generation_logs","drop policy if exists generation_logs_delete_anon on generation_logs","drop policy if exists generation_logs_delete_authenticated on generation_logs","-- ============================================================================\n-- DISABLE RLS ON ALL TABLES\n-- ============================================================================\n\nalter table profiles disable row level security","alter table voice_samples disable row level security","alter table stories disable row level security","alter table story_generations disable row level security","alter table generation_logs disable row level security"}	disable_all_policies
\.


--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: -
--

COPY "vault"."secrets" ("id", "name", "description", "secret", "key_id", "nonce", "created_at", "updated_at") FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: -
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 39, true);


--
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: -
--

SELECT pg_catalog.setval('"realtime"."subscription_id_seq"', 1, false);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: -
--

SELECT pg_catalog.setval('"supabase_functions"."hooks_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

\unrestrict mWAPQg3mknEb9mnH9lmlXUH1hlwVzDYGSjvfhAAxL5Sdphcf5bFHaIpdGQWZCco

