
INSERT INTO public.entity_types VALUES (1, 'group', NULL);
INSERT INTO public.entity_types VALUES (2, 'user', NULL);


INSERT INTO public.group_types VALUES (1, 'community');
INSERT INTO public.group_types VALUES (2, 'family');


INSERT INTO public.group_user_roles VALUES (1, 'admin', NULL);
INSERT INTO public.group_user_roles VALUES (2, 'member', NULL);
INSERT INTO public.group_user_roles VALUES (3, 'super', NULL);
INSERT INTO public.group_user_roles VALUES (4, 'guest', NULL);


INSERT INTO public.photo_types VALUES (1, 'logo', NULL);
INSERT INTO public.photo_types VALUES (2, 'primary', NULL);
INSERT INTO public.photo_types VALUES (3, 'other', NULL);


INSERT INTO public.user_user_relation_types VALUES (1, 'acquaintance', NULL, 'other');
INSERT INTO public.user_user_relation_types VALUES (2, 'friend', NULL, 'other');
INSERT INTO public.user_user_relation_types VALUES (3, 'family', NULL, 'other');
INSERT INTO public.user_user_relation_types VALUES (4, 'parent', NULL, 'family');
INSERT INTO public.user_user_relation_types VALUES (5, 'spouse', NULL, 'family');
INSERT INTO public.user_user_relation_types VALUES (6, 'partner', NULL, 'family');

