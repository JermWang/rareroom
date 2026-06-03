insert into public.cards (id, name, set_name, card_number, rarity, type, generation, image_url, official_metadata_source) values
('00000000-0000-0000-0000-000000000101', 'Charizard', 'Base Set', '4/102', 'Rare Holo', 'Fire', 'Base', 'https://images.pokemontcg.io/base1/4_hires.png', 'pokemontcg.io'),
('00000000-0000-0000-0000-000000000102', 'Umbreon VMAX', 'Evolving Skies', '215/203', 'Alt Art Secret', 'Darkness', 'Sword & Shield', 'https://images.pokemontcg.io/swsh7/215_hires.png', 'pokemontcg.io'),
('00000000-0000-0000-0000-000000000103', 'Blastoise', 'Base Set', '2/102', 'Rare Holo', 'Water', 'Base', 'https://images.pokemontcg.io/base1/2_hires.png', 'pokemontcg.io'),
('00000000-0000-0000-0000-000000000104', 'Mewtwo', 'Base Set', '10/102', 'Rare Holo', 'Psychic', 'Base', 'https://images.pokemontcg.io/base1/10_hires.png', 'pokemontcg.io'),
('00000000-0000-0000-0000-000000000105', 'Pikachu', 'Base Set', '58/102', 'Common', 'Lightning', 'Base', 'https://images.pokemontcg.io/base1/58_hires.png', 'pokemontcg.io'),
('00000000-0000-0000-0000-000000000106', 'Venusaur', 'Base Set', '15/102', 'Rare Holo', 'Grass', 'Base', 'https://images.pokemontcg.io/base1/15_hires.png', 'pokemontcg.io')
on conflict (name, set_name, card_number) do update set
  rarity = excluded.rarity,
  type = excluded.type,
  generation = excluded.generation,
  image_url = excluded.image_url,
  official_metadata_source = excluded.official_metadata_source;
