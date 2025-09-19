export type TableFields = {
  game_id: number;
  game_name: string;
  release_year: number;
};

export type TableFields2 = {
  game_id: number;
  description: string;
};

export type PublisherFields = {
  game_id: number;
  publisher_name: string;
};

export type PlatformFields = {
  game_id: number;
  platform_name: string;
};

export type ComplexJoinFields = {
  game_id: number;
  developer_id: number;
  description: string;
};