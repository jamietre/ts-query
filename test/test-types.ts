import { TableFieldsBase } from "../src/index.js";

export type TableFields = {
  game_id: number;
  game_name: string;
  release_year: number;
} & TableFieldsBase;

export type TableFields2 = {
  game_id: number;
  description: string;
} & TableFieldsBase;

export type PublisherFields = {
  game_id: number;
  publisher_name: string;
} & TableFieldsBase;

export type PlatformFields = {
  game_id: number;
  platform_name: string;
} & TableFieldsBase;

export type ComplexJoinFields = {
  game_id: number;
  developer_id: number;
  description: string;
} & TableFieldsBase;
