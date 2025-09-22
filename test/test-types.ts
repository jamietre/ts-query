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

// Types with conflicting field names for testing aliasFields
export type GameFields = {
  id: number;
  name: string;
  release_year: number;
  created_at: string;
};

export type DeveloperFields = {
  id: number;
  name: string; // Conflict with GameFields.name
  founded_year: number;
  created_at: string; // Conflict with GameFields.created_at
};
