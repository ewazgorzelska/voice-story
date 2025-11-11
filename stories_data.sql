SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict 0Gg17l1LuTwNWL4OEn6wbiitzRCUlKTmta4GNy0pYF4VYP6Fp0qLH1hfA4Ap6rK

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
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', '32d3f62a-c571-4708-93b3-b5ffda00abfe', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"user@123.com","user_id":"9d619ae5-34eb-4d42-96ad-5c35109eb329","user_phone":""}}', '2025-10-19 12:12:14.985542+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e6795f27-1edc-4bce-863e-8b5f34d76498', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"user@456.com","user_id":"1ff57ad0-ed09-43ec-9c80-f31532eb34ed","user_phone":""}}', '2025-11-09 15:59:43.817216+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ffa40671-c916-482b-a946-d55459e3f451', '{"action":"login","actor_id":"1ff57ad0-ed09-43ec-9c80-f31532eb34ed","actor_username":"user@456.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-11-09 16:00:11.820433+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f5f11273-22ba-4330-aae2-f020a3c0687d', '{"action":"login","actor_id":"1ff57ad0-ed09-43ec-9c80-f31532eb34ed","actor_username":"user@456.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-11-09 16:01:01.484762+00', ''),
	('00000000-0000-0000-0000-000000000000', '54e8ad75-a604-4dc3-9a1f-d1d004a906c2', '{"action":"logout","actor_id":"1ff57ad0-ed09-43ec-9c80-f31532eb34ed","actor_username":"user@456.com","actor_via_sso":false,"log_type":"account"}', '2025-11-09 16:10:48.766647+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b1b1ebbf-1225-4da9-a6c1-c1b4b03c0280', '{"action":"login","actor_id":"1ff57ad0-ed09-43ec-9c80-f31532eb34ed","actor_username":"user@456.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-11-09 16:25:32.57917+00', ''),
	('00000000-0000-0000-0000-000000000000', '2e37b214-c9b7-4d91-94ea-a84b533e5888', '{"action":"logout","actor_id":"1ff57ad0-ed09-43ec-9c80-f31532eb34ed","actor_username":"user@456.com","actor_via_sso":false,"log_type":"account"}', '2025-11-09 16:25:38.679705+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a5bc1a03-d2c4-4f93-bee0-d6df07f87bd9', '{"action":"login","actor_id":"1ff57ad0-ed09-43ec-9c80-f31532eb34ed","actor_username":"user@456.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-11-11 10:49:26.4771+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e9de1d02-180f-4423-b6cc-7c4ea358e12d', '{"action":"logout","actor_id":"1ff57ad0-ed09-43ec-9c80-f31532eb34ed","actor_username":"user@456.com","actor_via_sso":false,"log_type":"account"}', '2025-11-11 10:50:30.823256+00', ''),
	('00000000-0000-0000-0000-000000000000', '7bac2f17-e2f1-4298-9db1-896e6b95ad31', '{"action":"login","actor_id":"1ff57ad0-ed09-43ec-9c80-f31532eb34ed","actor_username":"user@456.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-11-11 10:52:32.960564+00', ''),
	('00000000-0000-0000-0000-000000000000', '27a7126f-2781-4c5c-94de-8c1a2bcdc2ff', '{"action":"logout","actor_id":"1ff57ad0-ed09-43ec-9c80-f31532eb34ed","actor_username":"user@456.com","actor_via_sso":false,"log_type":"account"}', '2025-11-11 10:56:00.336329+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ca56f144-f5fb-4bbc-bc9e-ca2eadd5e3eb', '{"action":"user_signedup","actor_id":"a59139a3-c86a-4da1-bb29-c1ef074584ad","actor_username":"ewa.zgorzelska@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-11-11 11:15:58.794493+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e3f5a307-8bfc-4947-a39c-216861cb22ec', '{"action":"login","actor_id":"a59139a3-c86a-4da1-bb29-c1ef074584ad","actor_username":"ewa.zgorzelska@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-11-11 11:15:58.79781+00', ''),
	('00000000-0000-0000-0000-000000000000', '2038e7c8-bfed-4fbe-b2a0-45a9389bfec8', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"ewa.zgorzelska@gmail.com","user_id":"a59139a3-c86a-4da1-bb29-c1ef074584ad","user_phone":""}}', '2025-11-11 11:38:14.496639+00', ''),
	('00000000-0000-0000-0000-000000000000', '0bd40c0b-e373-45f5-9149-32e74027e5a9', '{"action":"user_signedup","actor_id":"953e565e-38f9-4dc4-8f72-2282ae470d07","actor_username":"ewa.zgorzelska@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2025-11-11 11:38:44.809659+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b38f868e-be0e-4ec9-89cb-0a52043f38e4', '{"action":"login","actor_id":"953e565e-38f9-4dc4-8f72-2282ae470d07","actor_username":"ewa.zgorzelska@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-11-11 11:38:44.812044+00', ''),
	('00000000-0000-0000-0000-000000000000', '9ea0e79b-48c7-4a19-857d-3ff07ddf0b0d', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"ewa.zgorzelska@gmail.com","user_id":"953e565e-38f9-4dc4-8f72-2282ae470d07","user_phone":""}}', '2025-11-11 11:40:08.208013+00', '');


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '9d619ae5-34eb-4d42-96ad-5c35109eb329', 'authenticated', 'authenticated', 'user@123.com', '$2a$10$6ctIS0/Zby/NS.hIohG0pOveBiEUQYCxYpxFiTJxK7gg4LziIxoUu', '2025-10-19 12:12:14.987692+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2025-10-19 12:12:14.98141+00', '2025-10-19 12:12:14.988268+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '1ff57ad0-ed09-43ec-9c80-f31532eb34ed', 'authenticated', 'authenticated', 'user@456.com', '$2a$10$/M4CTMuHdsjAOQmG.ntVme/xk7sRKshd5ktwjR3M9pJI6jyCvobMm', '2025-11-09 15:59:43.819746+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-11-11 10:52:32.961233+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2025-11-09 15:59:43.814734+00', '2025-11-11 10:52:32.962968+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('9d619ae5-34eb-4d42-96ad-5c35109eb329', '9d619ae5-34eb-4d42-96ad-5c35109eb329', '{"sub": "9d619ae5-34eb-4d42-96ad-5c35109eb329", "email": "user@123.com", "email_verified": false, "phone_verified": false}', 'email', '2025-10-19 12:12:14.983962+00', '2025-10-19 12:12:14.984058+00', '2025-10-19 12:12:14.984058+00', '592f8b59-3ae5-40bd-a57c-810d7ce00af5'),
	('1ff57ad0-ed09-43ec-9c80-f31532eb34ed', '1ff57ad0-ed09-43ec-9c80-f31532eb34ed', '{"sub": "1ff57ad0-ed09-43ec-9c80-f31532eb34ed", "email": "user@456.com", "email_verified": false, "phone_verified": false}', 'email', '2025-11-09 15:59:43.816276+00', '2025-11-09 15:59:43.816307+00', '2025-11-09 15:59:43.816307+00', 'a5e68d06-1075-4a4b-98a4-118ebef2c022');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: stories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."stories" ("id", "title", "slug", "content", "version", "updated_at") VALUES
	('d3b94b3d-378c-41f9-83b3-91cee188e48f', 'Cinderella', 'cinderella', 'Once upon a time, there was a kind and beautiful girl named Cinderella. She lived with her wicked stepmother and two stepsisters who treated her very badly. They made her do all the housework and would not let her go to the royal ball.

One day, the King announced a grand ball at the palace. All the young ladies in the kingdom were invited. Cinderella''s stepsisters were very excited and spent days choosing their dresses. But when Cinderella asked if she could go, her stepmother said no.

On the night of the ball, Cinderella was left home alone, crying in the garden. Suddenly, her Fairy Godmother appeared! With a wave of her magic wand, she turned a pumpkin into a magnificent coach, mice into horses, and Cinderella''s old dress into a beautiful ball gown. She even gave Cinderella a pair of sparkling glass slippers.

"You may go to the ball," said the Fairy Godmother, "but you must return before midnight, when the magic will end."

At the ball, everyone wondered who the beautiful stranger was. The Prince danced with Cinderella all evening and fell in love with her. But when the clock struck midnight, Cinderella had to run away. In her hurry, she lost one of her glass slippers on the palace steps.

The next day, the Prince searched the entire kingdom for the girl who fit the glass slipper. When he arrived at Cinderella''s house, her stepsisters tried to squeeze their feet into the tiny slipper, but it was no use. Then Cinderella tried it on, and of course, it fit perfectly!

The Prince recognized her as the beautiful girl from the ball. He asked her to marry him, and she said yes. Cinderella forgave her stepmother and stepsisters, and everyone lived happily ever after.', 1, '2025-11-11 15:38:57.806634+00'),
	('eaa50185-5d6f-46b3-9c55-82861039ea14', 'Little Red Riding Hood', 'little-red-riding-hood', 'Once upon a time, there was a sweet little girl who everyone loved. Her grandmother had made her a red velvet hood, and she loved it so much that she wore it everywhere. That''s why everyone called her Little Red Riding Hood.

One day, her mother said, "Little Red Riding Hood, your grandmother is sick. Please take this basket of food to her cottage in the woods. But remember—don''t stray from the path, and don''t talk to strangers!"

Little Red Riding Hood promised to be careful and set off through the forest. As she walked along the path, she met a big wolf. "Where are you going, little girl?" asked the wolf in his friendliest voice.

"I''m going to my grandmother''s cottage," she replied innocently. "She''s not feeling well, so I''m bringing her some food."

The clever wolf thought of a wicked plan. He told Little Red Riding Hood to pick some flowers for her grandmother, then he ran ahead to the cottage. When he arrived, he knocked on the door.

"Who is it?" called Grandmother.

"It''s Little Red Riding Hood!" said the wolf, copying her voice. The grandmother opened the door, and the wolf gobbled her up! Then he put on her nightgown and nightcap and climbed into her bed.

When Little Red Riding Hood arrived at the cottage, she thought her grandmother looked very strange. "Grandmother, what big eyes you have!" she said.

"All the better to see you with, my dear," replied the wolf.

"Grandmother, what big ears you have!"

"All the better to hear you with, my dear."

"Grandmother, what big teeth you have!"

"All the better to eat you with!" And the wolf jumped out of bed!

Just then, a brave woodcutter who was passing by heard Little Red Riding Hood''s screams. He rushed into the cottage and saved her and her grandmother. The wolf ran away and was never seen again.

From that day on, Little Red Riding Hood always remembered her mother''s advice: never stray from the path, and never talk to strangers.', 1, '2025-11-11 15:38:57.806634+00'),
	('1eb8bfd2-7a04-4e4d-8043-e080cf9a593b', 'The Three Little Pigs', 'the-three-little-pigs', 'Once upon a time, there were three little pigs who decided it was time to leave home and build houses of their own.

The first little pig was lazy. He quickly built his house out of straw because it was easy. "This will do just fine!" he said, and then he played all day.

The second little pig built his house out of sticks. It took a little more time than the straw house, but not much. Soon he was done too, and he went off to play with his brother.

The third little pig was hardworking and wise. He spent many days building his house out of bricks. His brothers laughed at him for working so hard, but he didn''t mind. He knew his house would be strong and safe.

One day, a big bad wolf came to the forest. He was hungry and looking for something to eat. He came to the first little pig''s house and said:

"Little pig, little pig, let me come in!"

"Not by the hair on my chinny chin chin!" replied the first little pig.

"Then I''ll huff, and I''ll puff, and I''ll blow your house in!" And that''s exactly what the wolf did. The straw house fell down, and the first little pig ran to his brother''s stick house.

The wolf followed him. "Little pigs, little pigs, let me come in!"

"Not by the hair on our chinny chin chins!" they replied.

"Then I''ll huff, and I''ll puff, and I''ll blow your house in!" The wolf huffed and puffed, and the stick house fell down too! The two little pigs ran as fast as they could to their brother''s brick house.

The wolf came to the brick house. "Little pigs, little pigs, let me come in!"

"Not by the hair on our chinny chin chins!"

"Then I''ll huff, and I''ll puff, and I''ll blow your house in!"

The wolf huffed and puffed, and huffed and puffed, but he could not blow down the brick house. It was too strong!

Finally, the wolf tried to climb down the chimney. But the clever third little pig had put a big pot of boiling water in the fireplace. When the wolf fell down the chimney, he landed in the hot water and ran away, never to return.

The three little pigs lived safely in the brick house. The first two pigs learned an important lesson about the value of hard work and doing things properly.', 1, '2025-11-11 15:38:57.806634+00'),
	('4b20ef10-c1d8-41e9-9ff2-830f6f964b3d', 'Goldilocks and the Three Bears', 'goldilocks-and-the-three-bears', 'Once upon a time, there was a little girl named Goldilocks. She had beautiful golden hair and loved to explore the forest near her home.

One morning, while walking through the woods, Goldilocks came upon a cottage. She knocked on the door, but no one answered. The door was unlocked, so she opened it and went inside.

Inside the cottage, she saw three bowls of porridge on the table. She was very hungry, so she tasted the porridge from the first bowl.

"This porridge is too hot!" she exclaimed.

So she tasted the porridge from the second bowl.

"This porridge is too cold," she said.

So she tasted the last bowl of porridge.

"Ahhh, this porridge is just right," she said happily, and she ate it all up.

After eating, Goldilocks felt tired and saw three chairs in the living room. She sat in the first chair.

"This chair is too big!" she said.

So she sat in the second chair.

"This chair is too big too!" she whined.

So she tried the last chair.

"Ahhh, this chair is just right," she sighed. But just as she settled down, the chair broke into pieces!

Goldilocks went upstairs and found three beds. She lay down on the first bed.

"This bed is too hard!" she complained.

So she lay down on the second bed.

"This bed is too soft!" she whined.

Then she lay down on the third bed.

"Ahhh, this bed is just right," she said, and fell fast asleep.

The cottage belonged to three bears. There was Papa Bear, who was very big, Mama Bear, who was middle-sized, and Baby Bear, who was small. They had gone for a walk while their porridge cooled down.

When they came home, Papa Bear growled, "Someone''s been eating my porridge!"

Mama Bear said, "Someone''s been eating my porridge too!"

Baby Bear cried, "Someone''s been eating my porridge, and they ate it all up!"

Then they went into the living room.

"Someone''s been sitting in my chair!" said Papa Bear.

"Someone''s been sitting in my chair too!" said Mama Bear.

"Someone''s been sitting in my chair, and they''ve broken it all to pieces!" cried Baby Bear.

They went upstairs to the bedroom.

"Someone''s been sleeping in my bed!" said Papa Bear.

"Someone''s been sleeping in my bed too!" said Mama Bear.

"Someone''s been sleeping in my bed, and she''s still there!" shouted Baby Bear.

Just then, Goldilocks woke up and saw the three bears. She was so frightened that she jumped up, ran down the stairs, and out the door. She ran all the way home and never went back to the cottage in the woods again.

From that day on, Goldilocks learned to never go into someone else''s house without permission.', 1, '2025-11-11 15:38:57.806634+00'),
	('f73b1ac4-55b4-4468-9e0d-fcc35fabf80c', 'Jack and the Beanstalk', 'jack-and-the-beanstalk', 'Once upon a time, there was a poor boy named Jack who lived with his mother. They were so poor that one day, his mother told him to sell their only cow at the market.

On the way to market, Jack met a strange old man who offered to trade the cow for five magic beans. "These beans are special," said the old man. "Plant them, and wonderful things will happen!"

Jack thought this sounded exciting, so he made the trade. But when he got home, his mother was furious! "You silly boy! We needed money, not beans!" She threw the beans out the window and sent Jack to bed without supper.

The next morning, Jack looked out the window and couldn''t believe his eyes. The magic beans had grown into an enormous beanstalk that reached up into the clouds! Without thinking twice, Jack began to climb.

He climbed and climbed until he reached the top, where he found himself in a strange land high above the earth. In the distance, he saw a magnificent castle. Jack was curious, so he walked up to the castle and knocked on the door.

A kind giant''s wife answered. "Quick! Come inside before my husband sees you!" she said. "He loves to eat boys for breakfast!" She hid Jack in the oven just as the giant came home.

"Fee-fi-fo-fum! I smell the blood of an Englishman!" roared the giant.

"Nonsense," said his wife. "You smell your breakfast cooking." The giant sat down to eat.

After his meal, the giant counted his gold coins and then fell asleep. Jack crept out of the oven, grabbed a bag of gold, and climbed down the beanstalk as fast as he could. His mother was overjoyed when she saw the gold!

But Jack was brave and curious, so he climbed the beanstalk again. This time, he waited for the giant to fall asleep, then took a hen that laid golden eggs. The giant''s wife tried to warn him not to come back.

Jack climbed the beanstalk one more time. This time, he took a magic harp that played beautiful music. But the harp cried out, "Master! Master!" and woke the giant!

The giant chased Jack down the beanstalk. Jack climbed down as fast as he could, shouting to his mother to bring an axe. As soon as Jack reached the ground, he chopped down the beanstalk. The giant fell down with it and was never seen again.

Jack and his mother lived happily ever after with their gold coins, magic hen, and singing harp. And Jack learned that sometimes taking chances can lead to wonderful adventures—but you should always be careful too!', 1, '2025-11-11 15:38:57.806634+00');


--
-- Data for Name: story_generations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: generation_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: voice_samples; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") VALUES
	('voice-samples', 'voice-samples', NULL, '2025-11-11 15:24:17.82208+00', '2025-11-11 15:24:17.82208+00', true, false, NULL, NULL, NULL, 'STANDARD'),
	('story-audio', 'story-audio', NULL, '2025-11-11 15:24:17.827402+00', '2025-11-11 15:24:17.827402+00', true, false, 52428800, '{audio/mpeg,audio/mp3}', NULL, 'STANDARD');


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: iceberg_namespaces; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: iceberg_tables; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: prefixes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 39, true);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--

SELECT pg_catalog.setval('"supabase_functions"."hooks_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

-- \unrestrict 0Gg17l1LuTwNWL4OEn6wbiitzRCUlKTmta4GNy0pYF4VYP6Fp0qLH1hfA4Ap6rK

RESET ALL;
