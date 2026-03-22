export type PokemonListItem = {
  id: number;
  name: string;
  sprite: string;
};

export type PokemonDetail = {
  id: number;
  name: string;
  sprite: string;
  type: string[];
  hp: number;
  attack: number;
  defense: number;
  speed: number;
};

