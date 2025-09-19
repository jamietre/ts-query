import { describe, it, expect } from 'vitest';
import { QueryBuilder } from '../src/index';
import { TableFields, TableFields2, PublisherFields } from './test-types';

describe('Basic Query Functionality', () => {
  it('should create a basic query with from method', () => {
    const query = QueryBuilder.from<TableFields>('games', 'g');

    expect(query.tableName).toBe('games');
    expect(query.tableAlias).toBe('g');
  });

  it('should generate SQL for simple select with array of fields', () => {
    const query = QueryBuilder.from<TableFields>('games', 'g')
      .select(['game_id', 'game_name']);

    const sql = query.toString();
    expect(sql).toBe('SELECT game_id, game_name FROM games AS g');
  });

  it('should generate SQL for simple select with field mapping', () => {
    const query = QueryBuilder.from<TableFields>('games', 'g')
      .select({
        game_id: 'id',
        game_name: 'name'
      });

    const sql = query.toString();
    expect(sql).toBe('SELECT game_id AS id, game_name AS name FROM games AS g');
  });

  it('should handle select with same field name and alias', () => {
    const query = QueryBuilder.from<TableFields>('games', 'g')
      .select({
        game_id: 'game_id', // Same name as alias
        game_name: 'title'   // Different alias
      });

    const sql = query.toString();
    expect(sql).toBe('SELECT game_id, game_name AS title FROM games AS g');
  });

  it('should handle mixed array with strings and objects', () => {
    const query = QueryBuilder.from<TableFields>('games', 'g')
      .select([
        'game_id',               // string field name
        { game_name: 'title' },  // object with alias
        'release_year'           // another string field name
      ]);

    const sql = query.toString();
    expect(sql).toBe('SELECT game_id, game_name AS title, release_year FROM games AS g');
  });

  it('should handle array with only objects', () => {
    const query = QueryBuilder.from<TableFields>('games', 'g')
      .select([
        { game_id: 'id' },
        { game_name: 'name' },
        { release_year: 'year' }
      ]);

    const sql = query.toString();
    expect(sql).toBe('SELECT game_id AS id, game_name AS name, release_year AS year FROM games AS g');
  });

  it('should handle mixed array with multiple fields in objects', () => {
    const query = QueryBuilder.from<TableFields>('games', 'g')
      .select([
        'game_id',
        { game_name: 'title', release_year: 'year' }
      ]);

    const sql = query.toString();
    expect(sql).toBe('SELECT game_id, game_name AS title, release_year AS year FROM games AS g');
  });

  it('should handle multiple joins in sequence', () => {
    const query = QueryBuilder.from<TableFields>('games', 'g')
      .leftJoin<TableFields2>('developers', 'd')
      .on({ game_id: 'game_id' })
      .leftJoin<PublisherFields>('publishers', 'p')
      .on({ game_id: 'game_id' })
      .select({
        game_id: 'id',
        game_name: 'name',
        description: 'desc',
        publisher_name: 'publisher'
      });

    const sql = query.toString();
    expect(sql).toBe('SELECT game_id AS id, game_name AS name, description AS desc, publisher_name AS publisher FROM games AS g LEFT JOIN developers AS d ON g.game_id = d.game_id LEFT JOIN publishers AS p ON d.game_id = p.game_id');
  });

  it('should match the example usage from the prompt', () => {
    const query = QueryBuilder.from<TableFields>("games", "g")
      .leftJoin<TableFields2>("developers", "d")
      .on({ game_id: "game_id" })
      .select({
        game_id: "id",
      });

    const sql = query.toString();
    expect(sql).toBe('SELECT game_id AS id FROM games AS g LEFT JOIN developers AS d ON g.game_id = d.game_id');
  });
});