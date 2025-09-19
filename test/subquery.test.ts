import { describe, it, expect } from 'vitest';
import { QueryBuilder } from '../src/index';
import { TableFields, TableFields2 } from './test-types';

describe('Subquery functionality', () => {
  it('should handle simple subquery with alias', () => {
    const subquery = QueryBuilder.from<TableFields>('games', 'g')
      .where({ release_year: { $gt: 2000 } });

    const query = QueryBuilder.from<TableFields>('outer_games', 'og')
      .where({ game_id: 1 })
      .select(subquery, 'recent_games_count');

    const sql = query.toString();
    expect(sql).toBe('SELECT (SELECT * FROM games AS g WHERE g.release_year > 2000) AS recent_games_count FROM outer_games AS og WHERE og.game_id = 1');
  });

  it('should handle subquery with join in main query', () => {
    const subquery = QueryBuilder.from<TableFields>('games', 'g')
      .where({ release_year: { $gt: 2020 } });

    const query = QueryBuilder.from<TableFields>('games', 'g')
      .leftJoin<TableFields2>('developers', 'd')
      .on({ game_id: 'game_id' })
      .where({ game_id: 1 })
      .select(subquery, 'recent_count');

    const sql = query.toString();
    expect(sql).toBe('SELECT (SELECT * FROM games AS g WHERE g.release_year > 2020) AS recent_count FROM games AS g LEFT JOIN developers AS d ON g.game_id = d.game_id WHERE d.game_id = 1');
  });

  it('should handle subquery with complex conditions', () => {
    const subquery = QueryBuilder.from<TableFields>('games', 'g')
      .where({
        release_year: { $gt: 2000 },
        or: [
          { game_name: { $like: '%Mario%' } }
        ]
      });

    const query = QueryBuilder.from<TableFields>('summary', 's')
      .select(subquery, 'mario_or_recent');

    const sql = query.toString();
    expect(sql).toBe("SELECT (SELECT * FROM games AS g WHERE (g.release_year > 2000) OR (g.game_name LIKE '%Mario%')) AS mario_or_recent FROM summary AS s");
  });

  it('should handle subquery with joins inside subquery', () => {
    const subquery = QueryBuilder.from<TableFields>('games', 'g')
      .innerJoin<TableFields2>('developers', 'd')
      .on({ game_id: 'game_id' })
      .where({ game_id: 1 });

    const query = QueryBuilder.from<TableFields>('reports', 'r')
      .select(subquery, 'game_with_dev');

    const sql = query.toString();
    expect(sql).toBe('SELECT (SELECT * FROM games AS g INNER JOIN developers AS d ON g.game_id = d.game_id WHERE d.game_id = 1) AS game_with_dev FROM reports AS r');
  });

  it('should handle multiple subqueries (though each select can only have one)', () => {
    const subquery1 = QueryBuilder.from<TableFields>('games', 'g')
      .where({ release_year: { $gt: 2020 } });

    const subquery2 = QueryBuilder.from<TableFields>('games', 'g')
      .where({ release_year: { $lt: 1990 } });

    const query1 = QueryBuilder.from<TableFields>('summary', 's')
      .select(subquery1, 'recent_games');

    const query2 = QueryBuilder.from<TableFields>('summary', 's')
      .select(subquery2, 'old_games');

    const sql1 = query1.toString();
    const sql2 = query2.toString();

    expect(sql1).toBe('SELECT (SELECT * FROM games AS g WHERE g.release_year > 2020) AS recent_games FROM summary AS s');
    expect(sql2).toBe('SELECT (SELECT * FROM games AS g WHERE g.release_year < 1990) AS old_games FROM summary AS s');
  });

  it('should handle subquery with OR conditions using chained method', () => {
    const subquery = QueryBuilder.from<TableFields>('games', 'g')
      .where({ release_year: { $gt: 2020 } })
      .or({ game_name: { $like: '%Classic%' } });

    const query = QueryBuilder.from<TableFields>('stats', 'st')
      .select(subquery, 'filtered_games');

    const sql = query.toString();
    expect(sql).toBe("SELECT (SELECT * FROM games AS g WHERE (g.release_year > 2020) OR (g.game_name LIKE '%Classic%')) AS filtered_games FROM stats AS st");
  });
});