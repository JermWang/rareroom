-- Real Pokémon cards sourced from the Pokémon TCG API (pokemontcg.io).
-- Images served from images.pokemontcg.io. Fan-made demo data.
insert into public.cards (id, name, set_name, card_number, rarity, type, generation, image_url, official_metadata_source) values
('00000000-0000-0000-0000-000000000004', 'Charizard', 'Base Set', '4/102', 'Rare Holo', 'Fire', 'Base', 'https://images.pokemontcg.io/base1/4_hires.png', 'pokemontcg.io:base1-4'),
('00000000-0000-0000-0000-000000000002', 'Blastoise', 'Base Set', '2/102', 'Rare Holo', 'Water', 'Base', 'https://images.pokemontcg.io/base1/2_hires.png', 'pokemontcg.io:base1-2'),
('00000000-0000-0000-0000-000000000015', 'Venusaur', 'Base Set', '15/102', 'Rare Holo', 'Grass', 'Base', 'https://images.pokemontcg.io/base1/15_hires.png', 'pokemontcg.io:base1-15'),
('00000000-0000-0000-0000-000000000010', 'Mewtwo', 'Base Set', '10/102', 'Rare Holo', 'Psychic', 'Base', 'https://images.pokemontcg.io/base1/10_hires.png', 'pokemontcg.io:base1-10'),
('00000000-0000-0000-0000-000000000006', 'Gyarados', 'Base Set', '6/102', 'Rare Holo', 'Water', 'Base', 'https://images.pokemontcg.io/base1/6_hires.png', 'pokemontcg.io:base1-6'),
('00000000-0000-0000-0000-000000000058', 'Pikachu', 'Base Set', '58/102', 'Common', 'Lightning', 'Base', 'https://images.pokemontcg.io/base1/58_hires.png', 'pokemontcg.io:base1-58'),
('00000000-0000-0000-0000-000000000215', 'Umbreon VMAX', 'Evolving Skies', '215/203', 'Alt Art Secret', 'Darkness', 'Sword & Shield', 'https://images.pokemontcg.io/swsh7/215_hires.png', 'pokemontcg.io:swsh7-215'),
('00000000-0000-0000-0000-000000000218', 'Rayquaza VMAX', 'Evolving Skies', '218/203', 'Alt Art Secret', 'Dragon', 'Sword & Shield', 'https://images.pokemontcg.io/swsh7/218_hires.png', 'pokemontcg.io:swsh7-218'),
('00000000-0000-0000-0000-000000000271', 'Gengar VMAX', 'Fusion Strike', '271/264', 'Alt Art Secret', 'Darkness', 'Sword & Shield', 'https://images.pokemontcg.io/swsh8/271_hires.png', 'pokemontcg.io:swsh8-271'),
('00000000-0000-0000-0000-000000000107', 'Charizard VMAX', 'Shining Fates', 'SV107/122', 'Shiny Vault', 'Fire', 'Sword & Shield', 'https://images.pokemontcg.io/swsh45sv/SV107_hires.png', 'pokemontcg.io:swsh45sv-SV107'),
('00000000-0000-0000-0000-000000000186', 'Lugia V', 'Silver Tempest', '186/195', 'Alt Art', 'Colorless', 'Sword & Shield', 'https://images.pokemontcg.io/swsh12/186_hires.png', 'pokemontcg.io:swsh12-186'),
('00000000-0000-0000-0000-000000000014', 'Raichu', 'Base Set', '14/102', 'Rare Holo', 'Lightning', 'Base', 'https://images.pokemontcg.io/base1/14_hires.png', 'pokemontcg.io:base1-14');
