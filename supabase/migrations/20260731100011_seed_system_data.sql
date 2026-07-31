-- System-Stammdaten: Default-Kategorien und Kategorisierungsregeln für den
-- deutschen Markt. Als Migration (nicht als seed.sql), damit sie auch in
-- Produktion deterministisch vorhanden sind.

insert into public.categories (slug, name, icon, color, kind, is_system, sort_order) values
  ('essen',          'Essen & Lebensmittel', 'shopping-basket',  '#f97316', 'expense', true, 10),
  ('freizeit',       'Freizeit',             'party-popper',     '#ec4899', 'expense', true, 20),
  ('shopping',       'Shopping',             'shopping-bag',     '#8b5cf6', 'expense', true, 30),
  ('mobilitaet',     'Mobilität',            'car-front',        '#0ea5e9', 'expense', true, 40),
  ('bildung',        'Schule/Weiterbildung', 'graduation-cap',   '#14b8a6', 'expense', true, 50),
  ('arbeit',         'Arbeit',               'briefcase',        '#22c55e', 'income',  true, 60),
  ('versicherungen', 'Versicherungen',       'shield-check',     '#64748b', 'expense', true, 70),
  ('wohnen',         'Wohnen',               'house',            '#eab308', 'expense', true, 80),
  ('abonnements',    'Abonnements',          'repeat',           '#6366f1', 'expense', true, 90),
  ('sonstiges',      'Sonstiges',            'circle-dashed',    '#94a3b8', 'expense', true, 999);

-- Keyword-Regeln. match_value ist immer lowercase; die Rule-Engine vergleicht
-- gegen die kleingeschriebene Kombination aus Händlername und Verwendungszweck.
insert into public.category_rules (category_id, match_type, match_value, priority, source)
select c.id, 'keyword'::public.rule_match_type, v.keyword, v.priority, 'system'
from (values
  -- Essen & Lebensmittel
  ('essen', 'rewe', 100), ('essen', 'edeka', 100), ('essen', 'aldi', 100),
  ('essen', 'lidl', 100), ('essen', 'kaufland', 100), ('essen', 'penny', 100),
  ('essen', 'netto marken', 100), ('essen', 'norma', 100), ('essen', 'real,-', 100),
  ('essen', 'denns', 100), ('essen', 'alnatura', 100), ('essen', 'bioc', 90),
  ('essen', 'baecker', 90), ('essen', 'bäcker', 90), ('essen', 'backwerk', 90),
  ('essen', 'metzgerei', 90), ('essen', 'getraenke', 90), ('essen', 'getränke',  90),
  ('essen', 'mcdonald', 90), ('essen', 'burger king', 90), ('essen', 'subway', 90),
  ('essen', 'kfc', 90), ('essen', 'lieferando', 90), ('essen', 'wolt', 90),
  ('essen', 'uber eats', 90), ('essen', 'dominos', 90), ('essen', 'restaurant', 80),
  ('essen', 'pizzeria', 80), ('essen', 'cafe', 70), ('essen', 'starbucks', 90),
  ('essen', 'gorillas', 90), ('essen', 'flink', 85), ('essen', 'picnic', 90),

  -- Mobilität
  ('mobilitaet', 'deutsche bahn', 100), ('mobilitaet', 'db vertrieb', 100),
  ('mobilitaet', 'db fernverkehr', 100), ('mobilitaet', 'flixbus', 100),
  ('mobilitaet', 'bvg', 100), ('mobilitaet', 'mvg', 100), ('mobilitaet', 'hvv', 100),
  ('mobilitaet', 'rmv', 100), ('mobilitaet', 'vrr', 100), ('mobilitaet', 'vvs', 100),
  ('mobilitaet', 'deutschlandticket', 100), ('mobilitaet', 'shell', 95),
  ('mobilitaet', 'aral', 95), ('mobilitaet', 'esso', 95), ('mobilitaet', 'total energies', 95),
  ('mobilitaet', 'jet tankstelle', 95), ('mobilitaet', 'tankstelle', 85),
  ('mobilitaet', 'uber', 90), ('mobilitaet', 'freenow', 90), ('mobilitaet', 'bolt', 85),
  ('mobilitaet', 'tier mobility', 90), ('mobilitaet', 'lime', 85), ('mobilitaet', 'nextbike', 90),
  ('mobilitaet', 'sixt', 90), ('mobilitaet', 'europcar', 90), ('mobilitaet', 'adac', 85),
  ('mobilitaet', 'parkhaus', 85), ('mobilitaet', 'werkstatt', 80), ('mobilitaet', 'tuev', 85),
  ('mobilitaet', 'tüv', 85), ('mobilitaet', 'kfz-steuer', 95), ('mobilitaet', 'lufthansa', 90),
  ('mobilitaet', 'ryanair', 90), ('mobilitaet', 'eurowings', 90),

  -- Wohnen
  ('wohnen', 'miete', 110), ('wohnen', 'kaltmiete', 110), ('wohnen', 'warmmiete', 110),
  ('wohnen', 'nebenkosten', 105), ('wohnen', 'hausgeld', 105), ('wohnen', 'wohnung', 90),
  ('wohnen', 'stadtwerke', 100), ('wohnen', 'vattenfall', 100), ('wohnen', 'e.on', 100),
  ('wohnen', 'eon energie', 100), ('wohnen', 'rwe', 100), ('wohnen', 'enbw', 100),
  ('wohnen', 'yello strom', 100), ('wohnen', 'lichtblick', 100), ('wohnen', 'strom', 85),
  ('wohnen', 'gasversorgung', 95), ('wohnen', 'wasserwerke', 95),
  ('wohnen', 'telekom', 95), ('wohnen', 'vodafone', 95), ('wohnen', '1&1', 95),
  ('wohnen', 'o2 germany', 95), ('wohnen', 'pyur', 95), ('wohnen', 'rundfunk', 100),
  ('wohnen', 'ard zdf', 100), ('wohnen', 'ikea', 85), ('wohnen', 'obi', 85),
  ('wohnen', 'bauhaus', 85), ('wohnen', 'hornbach', 85), ('wohnen', 'toom', 85),

  -- Abonnements
  ('abonnements', 'netflix', 110), ('abonnements', 'spotify', 110),
  ('abonnements', 'disney', 110), ('abonnements', 'amazon prime', 110),
  ('abonnements', 'apple.com/bill', 105), ('abonnements', 'itunes', 100),
  ('abonnements', 'google one', 105), ('abonnements', 'youtube premium', 110),
  ('abonnements', 'dazn', 110), ('abonnements', 'sky deutschland', 110),
  ('abonnements', 'wow tv', 105), ('abonnements', 'paramount', 105),
  ('abonnements', 'audible', 110), ('abonnements', 'adobe', 105),
  ('abonnements', 'microsoft 365', 110), ('abonnements', 'dropbox', 105),
  ('abonnements', 'icloud', 105), ('abonnements', 'notion labs', 105),
  ('abonnements', 'openai', 105), ('abonnements', 'anthropic', 105),
  ('abonnements', 'fitnessstudio', 100), ('abonnements', 'mcfit', 105),
  ('abonnements', 'fitx', 105), ('abonnements', 'urban sports', 105),
  ('abonnements', 'abo ', 70),

  -- Shopping
  ('shopping', 'amazon', 90), ('shopping', 'zalando', 100), ('shopping', 'otto', 95),
  ('shopping', 'about you', 100), ('shopping', 'h&m', 100), ('shopping', 'zara', 100),
  ('shopping', 'c&a', 100), ('shopping', 'primark', 100), ('shopping', 'tk maxx', 100),
  ('shopping', 'douglas', 100), ('shopping', 'dm-drogerie', 100), ('shopping', 'rossmann', 100),
  ('shopping', 'mueller ', 90), ('shopping', 'saturn', 100), ('shopping', 'mediamarkt', 100),
  ('shopping', 'media markt', 100), ('shopping', 'cyberport', 100), ('shopping', 'notebooksbilliger', 100),
  ('shopping', 'apple store', 100), ('shopping', 'ebay', 90), ('shopping', 'etsy', 95),
  ('shopping', 'shein', 100), ('shopping', 'temu', 100), ('shopping', 'decathlon', 100),
  ('shopping', 'thalia', 95), ('shopping', 'hugendubel', 95),

  -- Freizeit
  ('freizeit', 'kino', 95), ('freizeit', 'cinemaxx', 100), ('freizeit', 'cineplex', 100),
  ('freizeit', 'uci kinowelt', 100), ('freizeit', 'theater', 90), ('freizeit', 'museum', 90),
  ('freizeit', 'eventim', 100), ('freizeit', 'ticketmaster', 100), ('freizeit', 'konzert', 90),
  ('freizeit', 'schwimmbad', 95), ('freizeit', 'therme', 95), ('freizeit', 'zoo', 90),
  ('freizeit', 'freizeitpark', 95), ('freizeit', 'bar ', 70), ('freizeit', 'club ', 70),
  ('freizeit', 'steam games', 100), ('freizeit', 'playstation', 100),
  ('freizeit', 'nintendo', 100), ('freizeit', 'xbox', 100), ('freizeit', 'epic games', 100),
  ('freizeit', 'booking.com', 95), ('freizeit', 'airbnb', 95), ('freizeit', 'hotel', 80),
  ('freizeit', 'sportverein', 90),

  -- Schule/Weiterbildung
  ('bildung', 'studienbeitrag', 110), ('bildung', 'semesterbeitrag', 110),
  ('bildung', 'universitaet', 100), ('bildung', 'universität', 100),
  ('bildung', 'hochschule', 100), ('bildung', 'fachhochschule', 100),
  ('bildung', 'volkshochschule', 100), ('bildung', 'sprachschule', 100),
  ('bildung', 'fahrschule', 100), ('bildung', 'nachhilfe', 100),
  ('bildung', 'udemy', 100), ('bildung', 'coursera', 100), ('bildung', 'skillshare', 100),
  ('bildung', 'bafoeg', 100), ('bildung', 'bafög', 100), ('bildung', 'schulgeld', 100),
  ('bildung', 'lehrbuch', 90),

  -- Versicherungen
  ('versicherungen', 'versicherung', 110), ('versicherungen', 'allianz', 105),
  ('versicherungen', 'axa', 105), ('versicherungen', 'huk', 105),
  ('versicherungen', 'ergo ', 105), ('versicherungen', 'debeka', 105),
  ('versicherungen', 'signal iduna', 105), ('versicherungen', 'devk', 105),
  ('versicherungen', 'r+v', 105), ('versicherungen', 'generali', 105),
  ('versicherungen', 'cosmos direkt', 105), ('versicherungen', 'krankenkasse', 110),
  ('versicherungen', 'aok', 105), ('versicherungen', 'techniker krankenkasse', 110),
  ('versicherungen', 'barmer', 105), ('versicherungen', 'dak', 105),
  ('versicherungen', 'haftpflicht', 105), ('versicherungen', 'hausrat', 105),
  ('versicherungen', 'rechtsschutz', 105),

  -- Arbeit / Einnahmen
  ('arbeit', 'gehalt', 120), ('arbeit', 'lohn', 120), ('arbeit', 'lohn/gehalt', 120),
  ('arbeit', 'bezuege', 115), ('arbeit', 'bezüge', 115), ('arbeit', 'entgelt', 115),
  ('arbeit', 'honorar', 110), ('arbeit', 'rechnung nr', 90),
  ('arbeit', 'ausbildungsverguetung', 115), ('arbeit', 'ausbildungsvergütung', 115),
  ('arbeit', 'praktikumsverguetung', 115), ('arbeit', 'minijob', 110),
  ('arbeit', 'kindergeld', 110), ('arbeit', 'steuererstattung', 110),
  ('arbeit', 'finanzamt', 100)
) as v(slug, keyword, priority)
join public.categories c on c.slug = v.slug and c.user_id is null;
