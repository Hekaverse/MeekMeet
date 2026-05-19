-- ============================================
-- Seed data for development
-- ============================================

-- Sample circles
INSERT INTO circles (slug, name, description, location, meeting_place, is_active)
VALUES
  ('sydney-north', 'Sydney North Circle', 'A warm gathering for the northside community.', 'Sydney, NSW', 'St. Marks Community Hall', true),
  ('melbourne-east', 'Melbourne East Circle', 'Quiet souls meeting in the eastern suburbs.', 'Melbourne, VIC', 'Richmond Baptist Church', true),
  ('brisbane-south', 'Brisbane South Circle', 'Under the new moon in Brisbane south.', 'Brisbane, QLD', 'Grace Chapel, Woolloongabba', true);

-- Sample questions for Sydney North
INSERT INTO circle_questions (circle_id, content, order_index)
SELECT id, 'What burden are you carrying that you long to lay down?', 0
FROM circles WHERE slug = 'sydney-north';

INSERT INTO circle_questions (circle_id, content, order_index)
SELECT id, 'Where have you seen God''s faithfulness this month?', 1
FROM circles WHERE slug = 'sydney-north';

INSERT INTO circle_questions (circle_id, content, order_index)
SELECT id, 'What does it mean to you to inherit the earth?', 2
FROM circles WHERE slug = 'sydney-north';

-- Sample routine for Sydney North
INSERT INTO circle_routines (circle_id, title, description, duration_minutes, order_index)
SELECT id, 'Opening Prayer', 'A moment of silence and opening prayer.', 10, 0
FROM circles WHERE slug = 'sydney-north';

INSERT INTO circle_routines (circle_id, title, description, duration_minutes, order_index)
SELECT id, 'Scripture Reading', 'Reading and reflection on the evening''s passage.', 15, 1
FROM circles WHERE slug = 'sydney-north';

INSERT INTO circle_routines (circle_id, title, description, duration_minutes, order_index)
SELECT id, 'Circle Questions', 'Guided discussion through the prepared questions.', 45, 2
FROM circles WHERE slug = 'sydney-north';

INSERT INTO circle_routines (circle_id, title, description, duration_minutes, order_index)
SELECT id, 'Sharing & Prayer', 'Open sharing and communal prayer.', 30, 3
FROM circles WHERE slug = 'sydney-north';

INSERT INTO circle_routines (circle_id, title, description, duration_minutes, order_index)
SELECT id, 'Closing Blessing', 'A sending blessing for the week ahead.', 10, 4
FROM circles WHERE slug = 'sydney-north';
