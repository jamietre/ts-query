import { describe, it, expect } from 'vitest';
import { queryBuilder, Query } from '../src/index';
import { TableFields, TableFields2, PublisherFields } from './test-types';

describe('Automatic alias generation', () => {
  it('should auto-generate aliases for tables', () => {
    const query = queryBuilder.from<TableFields>('games')
      .select(['game_id', 'game_name']);

    const sql = query.toString();
    expect(sql).toMatch(/SELECT game_id, game_name FROM games AS t\d+/);
  });

  it('should auto-generate aliases for joins', () => {
    const query = queryBuilder.from<TableFields>('games')
      .leftJoin<TableFields2>('developers')
      .on({ game_id: 'game_id' })
      .select({
        game_id: 'id',
        game_name: 'name',
        description: 'desc'
      });

    const sql = query.toString();
    expect(sql).toMatch(/SELECT game_id AS id, game_name AS name, description AS desc FROM games AS t\d+ LEFT JOIN developers AS t\d+ ON t\d+\.game_id = t\d+\.game_id/);
  });

  it('should auto-generate aliases for subqueries', () => {
    const subquery = queryBuilder.from<TableFields>('games')
      .where({ release_year: { $gt: 2000 } });

    const query = queryBuilder.from(subquery)
      .select(['*']);

    const sql = query.toString();
    expect(sql).toMatch(/SELECT \* FROM \(SELECT \* FROM games AS t\d+ WHERE t\d+\.release_year > 2000\) AS t\d+/);
  });

  it('should allow mixing explicit and auto-generated aliases', () => {
    const query = queryBuilder.from<TableFields>('games', 'g')
      .leftJoin<TableFields2>('developers')
      .on({ game_id: 'game_id' })
      .select({
        game_id: 'id',
        game_name: 'name'
      });

    const sql = query.toString();
    expect(sql).toMatch(/SELECT game_id AS id, game_name AS name FROM games AS g LEFT JOIN developers AS t\d+ ON g\.game_id = t\d+\.game_id/);
  });

  it('should handle multiple joins with auto-generated aliases', () => {
    const query = queryBuilder.from<TableFields>('games')
      .join<TableFields2>('developers')
      .on({ game_id: 'game_id' })
      .leftJoin<PublisherFields>('publishers')
      .on({ game_id: 'game_id' })
      .select({
        game_id: 'id',
        game_name: 'name',
        description: 'desc',
        publisher_name: 'publisher'
      });

    const sql = query.toString();
    expect(sql).toMatch(/SELECT game_id AS id, game_name AS name, description AS desc, publisher_name AS publisher FROM games AS t\d+ INNER JOIN developers AS t\d+ ON t\d+\.game_id = t\d+\.game_id LEFT JOIN publishers AS t\d+ ON t\d+\.game_id = t\d+\.game_id/);
  });

  it('should handle explicit aliases with auto-generated subquery alias', () => {
    const subquery = queryBuilder.from<TableFields>('games', 'g')
      .where({ release_year: { $gt: 2000 } });

    const query = queryBuilder.from(subquery)
      .select(['*']);

    const sql = query.toString();
    expect(sql).toMatch(/SELECT \* FROM \(SELECT \* FROM games AS g WHERE g\.release_year > 2000\) AS t\d+/);
  });

  it('should handle auto-generated table alias with explicit subquery alias', () => {
    const subquery = queryBuilder.from<TableFields>('games')
      .where({ release_year: { $gt: 2000 } });

    const query = queryBuilder.from(subquery, 'recent_games')
      .select(['*']);

    const sql = query.toString();
    expect(sql).toMatch(/SELECT \* FROM \(SELECT \* FROM games AS t\d+ WHERE t\d+\.release_year > 2000\) AS recent_games/);
  });
});