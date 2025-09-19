import { describe, it, expect } from 'vitest';
import { QueryBuilder } from '../src/index';
import { TableFields, TableFields2 } from './test-types';

describe('WHERE functionality', () => {
  it('should generate simple where clause with equality', () => {
    const query = QueryBuilder.from<TableFields>('games', 'g')
      .where({ game_id: 1 })
      .select(['game_id', 'game_name']);

    const sql = query.toString();
    expect(sql).toBe('SELECT game_id, game_name FROM games AS g WHERE g.game_id = 1');
  });

  it('should generate where clause with string value', () => {
    const query = QueryBuilder.from<TableFields>('games', 'g')
      .where({ game_name: 'Tetris' })
      .select(['game_id', 'game_name']);

    const sql = query.toString();
    expect(sql).toBe("SELECT game_id, game_name FROM games AS g WHERE g.game_name = 'Tetris'");
  });

  it('should generate where clause with multiple conditions', () => {
    const query = QueryBuilder.from<TableFields>('games', 'g')
      .where({ game_id: 1, release_year: 2020 })
      .select(['game_id', 'game_name']);

    const sql = query.toString();
    expect(sql).toBe('SELECT game_id, game_name FROM games AS g WHERE g.game_id = 1 AND g.release_year = 2020');
  });

  it('should generate where clause with comparison operators', () => {
    const query = QueryBuilder.from<TableFields>('games', 'g')
      .where({ release_year: { $gt: 2000 } })
      .select(['game_id', 'game_name']);

    const sql = query.toString();
    expect(sql).toBe('SELECT game_id, game_name FROM games AS g WHERE g.release_year > 2000');
  });

  it('should generate where clause with IN operator', () => {
    const query = QueryBuilder.from<TableFields>('games', 'g')
      .where({ release_year: { $in: [2019, 2020, 2021] } })
      .select(['game_id', 'game_name']);

    const sql = query.toString();
    expect(sql).toBe('SELECT game_id, game_name FROM games AS g WHERE g.release_year IN (2019, 2020, 2021)');
  });

  it('should work with joins and where clauses', () => {
    const query = QueryBuilder.from<TableFields>('games', 'g')
      .leftJoin<TableFields2>('developers', 'd')
      .on({ game_id: 'game_id' })
      .where({ game_id: 1 })
      .select({
        game_id: 'id',
        game_name: 'name',
        description: 'desc'
      });

    const sql = query.toString();
    expect(sql).toBe("SELECT game_id AS id, game_name AS name, description AS desc FROM games AS g LEFT JOIN developers AS d ON g.game_id = d.game_id WHERE d.game_id = 1");
  });

  it('should support chaining multiple where clauses', () => {
    const query = QueryBuilder.from<TableFields>('games', 'g')
      .where({ release_year: { $gt: 2000 } })
      .where({ game_name: 'Tetris' })
      .select(['game_id', 'game_name']);

    const sql = query.toString();
    expect(sql).toBe("SELECT game_id, game_name FROM games AS g WHERE g.release_year > 2000 AND g.game_name = 'Tetris'");
  });

  it('should handle all comparison operators', () => {
    const query1 = QueryBuilder.from<TableFields>('games', 'g')
      .where({ release_year: { $lt: 2000 } })
      .select(['game_name']);
    expect(query1.toString()).toBe('SELECT game_name FROM games AS g WHERE g.release_year < 2000');

    const query2 = QueryBuilder.from<TableFields>('games', 'g')
      .where({ release_year: { $gte: 2000 } })
      .select(['game_name']);
    expect(query2.toString()).toBe('SELECT game_name FROM games AS g WHERE g.release_year >= 2000');

    const query3 = QueryBuilder.from<TableFields>('games', 'g')
      .where({ release_year: { $lte: 2000 } })
      .select(['game_name']);
    expect(query3.toString()).toBe('SELECT game_name FROM games AS g WHERE g.release_year <= 2000');

    const query4 = QueryBuilder.from<TableFields>('games', 'g')
      .where({ release_year: { $ne: 2000 } })
      .select(['game_name']);
    expect(query4.toString()).toBe('SELECT game_name FROM games AS g WHERE g.release_year != 2000');
  });

  it('should generate where clause with LIKE operator', () => {
    const query = QueryBuilder.from<TableFields>('games', 'g')
      .where({ game_name: { $like: '%Tetris%' } })
      .select(['game_id', 'game_name']);

    const sql = query.toString();
    expect(sql).toBe("SELECT game_id, game_name FROM games AS g WHERE g.game_name LIKE '%Tetris%'");
  });

  it('should handle LIKE with different patterns', () => {
    const query1 = QueryBuilder.from<TableFields>('games', 'g')
      .where({ game_name: { $like: 'Super%' } })
      .select(['game_name']);
    expect(query1.toString()).toBe("SELECT game_name FROM games AS g WHERE g.game_name LIKE 'Super%'");

    const query2 = QueryBuilder.from<TableFields>('games', 'g')
      .where({ game_name: { $like: '%Mario' } })
      .select(['game_name']);
    expect(query2.toString()).toBe("SELECT game_name FROM games AS g WHERE g.game_name LIKE '%Mario'");

    const query3 = QueryBuilder.from<TableFields>('games', 'g')
      .where({ game_name: { $like: '_etris' } })
      .select(['game_name']);
    expect(query3.toString()).toBe("SELECT game_name FROM games AS g WHERE g.game_name LIKE '_etris'");
  });

  it('should work with LIKE and other conditions', () => {
    const query = QueryBuilder.from<TableFields>('games', 'g')
      .where({
        game_name: { $like: '%Mario%' },
        release_year: { $gt: 1990 }
      })
      .select(['game_id', 'game_name']);

    const sql = query.toString();
    expect(sql).toBe("SELECT game_id, game_name FROM games AS g WHERE g.game_name LIKE '%Mario%' AND g.release_year > 1990");
  });

  it('should generate where clause with $eq operator', () => {
    const query = QueryBuilder.from<TableFields>('games', 'g')
      .where({ game_id: { $eq: 1 } })
      .select(['game_id', 'game_name']);

    const sql = query.toString();
    expect(sql).toBe('SELECT game_id, game_name FROM games AS g WHERE g.game_id = 1');
  });

  it('should handle $eq with string values', () => {
    const query = QueryBuilder.from<TableFields>('games', 'g')
      .where({ game_name: { $eq: 'Tetris' } })
      .select(['game_id', 'game_name']);

    const sql = query.toString();
    expect(sql).toBe("SELECT game_id, game_name FROM games AS g WHERE g.game_name = 'Tetris'");
  });

  it('should produce same result for $eq and direct value', () => {
    const query1 = QueryBuilder.from<TableFields>('games', 'g')
      .where({ game_id: 1 })
      .select(['game_id', 'game_name']);

    const query2 = QueryBuilder.from<TableFields>('games', 'g')
      .where({ game_id: { $eq: 1 } })
      .select(['game_id', 'game_name']);

    const sql1 = query1.toString();
    const sql2 = query2.toString();

    expect(sql1).toBe(sql2);
    expect(sql1).toBe('SELECT game_id, game_name FROM games AS g WHERE g.game_id = 1');
  });

  it('should work with $eq and other operators', () => {
    const query = QueryBuilder.from<TableFields>('games', 'g')
      .where({
        game_id: { $eq: 1 },
        release_year: { $gt: 2000 }
      })
      .select(['game_id', 'game_name']);

    const sql = query.toString();
    expect(sql).toBe('SELECT game_id, game_name FROM games AS g WHERE g.game_id = 1 AND g.release_year > 2000');
  });

  describe('OR conditions', () => {
    it('should generate OR condition with simple equality', () => {
      const query = QueryBuilder.from<TableFields>('games', 'g')
        .where({ game_id: 1 })
        .or({ game_id: 2 })
        .select(['game_id', 'game_name']);

      const sql = query.toString();
      expect(sql).toBe('SELECT game_id, game_name FROM games AS g WHERE (g.game_id = 1) OR (g.game_id = 2)');
    });

    it('should generate OR condition with operators', () => {
      const query = QueryBuilder.from<TableFields>('games', 'g')
        .where({ release_year: { $gt: 2020 } })
        .or({ game_name: { $like: '%Mario%' } })
        .select(['game_id', 'game_name']);

      const sql = query.toString();
      expect(sql).toBe("SELECT game_id, game_name FROM games AS g WHERE (g.release_year > 2020) OR (g.game_name LIKE '%Mario%')");
    });

    it('should handle multiple OR conditions', () => {
      const query = QueryBuilder.from<TableFields>('games', 'g')
        .where({ game_id: 1 })
        .or({ game_id: 2 })
        .or({ game_name: 'Tetris' })
        .select(['game_id', 'game_name']);

      const sql = query.toString();
      expect(sql).toBe("SELECT game_id, game_name FROM games AS g WHERE (g.game_id = 1) OR (g.game_id = 2) OR (g.game_name = 'Tetris')");
    });

    it('should handle complex OR conditions with multiple fields', () => {
      const query = QueryBuilder.from<TableFields>('games', 'g')
        .where({ game_id: 1, release_year: 2020 })
        .or({ game_name: 'Tetris', release_year: { $gt: 2019 } })
        .select(['game_id', 'game_name']);

      const sql = query.toString();
      expect(sql).toBe("SELECT game_id, game_name FROM games AS g WHERE (g.game_id = 1 AND g.release_year = 2020) OR (g.game_name = 'Tetris' AND g.release_year > 2019)");
    });

    it('should handle OR with joins', () => {
      const query = QueryBuilder.from<TableFields>('games', 'g')
        .leftJoin<TableFields2>('developers', 'd')
        .on({ game_id: 'game_id' })
        .where({ game_id: 1 })
        .or({ description: { $like: '%action%' } })
        .select({
          game_id: 'id',
          game_name: 'name',
          description: 'desc'
        });

      const sql = query.toString();
      expect(sql).toBe("SELECT game_id AS id, game_name AS name, description AS desc FROM games AS g LEFT JOIN developers AS d ON g.game_id = d.game_id WHERE (d.game_id = 1) OR (d.description LIKE '%action%')");
    });

    it('should handle chained where and or conditions', () => {
      const query = QueryBuilder.from<TableFields>('games', 'g')
        .where({ release_year: { $gt: 2000 } })
        .where({ game_id: { $lt: 100 } })
        .or({ game_name: 'Classic Game' })
        .select(['game_id', 'game_name']);

      const sql = query.toString();
      expect(sql).toBe("SELECT game_id, game_name FROM games AS g WHERE (g.release_year > 2000 AND g.game_id < 100) OR (g.game_name = 'Classic Game')");
    });

    it('should handle inline OR syntax with simple conditions', () => {
      const query = QueryBuilder.from<TableFields>('games', 'g')
        .where({
          game_id: 1,
          or: [
            { game_id: 2 },
            { game_name: 'Tetris' }
          ]
        })
        .select(['game_id', 'game_name']);

      const sql = query.toString();
      expect(sql).toBe("SELECT game_id, game_name FROM games AS g WHERE (g.game_id = 1) OR (g.game_id = 2) OR (g.game_name = 'Tetris')");
    });

    it('should handle inline OR syntax with operators', () => {
      const query = QueryBuilder.from<TableFields>('games', 'g')
        .where({
          release_year: { $gt: 2020 },
          or: [
            { game_name: { $like: '%Mario%' } },
            { release_year: { $lt: 1990 } }
          ]
        })
        .select(['game_id', 'game_name']);

      const sql = query.toString();
      expect(sql).toBe("SELECT game_id, game_name FROM games AS g WHERE (g.release_year > 2020) OR (g.game_name LIKE '%Mario%') OR (g.release_year < 1990)");
    });

    it('should handle inline OR with multiple fields per condition', () => {
      const query = QueryBuilder.from<TableFields>('games', 'g')
        .where({
          game_id: 1,
          or: [
            { game_name: 'Tetris', release_year: 1984 },
            { game_name: 'Pac-Man', release_year: 1980 }
          ]
        })
        .select(['game_id', 'game_name']);

      const sql = query.toString();
      expect(sql).toBe("SELECT game_id, game_name FROM games AS g WHERE (g.game_id = 1) OR (g.game_name = 'Tetris' AND g.release_year = 1984) OR (g.game_name = 'Pac-Man' AND g.release_year = 1980)");
    });

    it('should combine inline OR and chained OR methods', () => {
      const query = QueryBuilder.from<TableFields>('games', 'g')
        .where({
          game_id: 1,
          or: [
            { game_name: 'Tetris' }
          ]
        })
        .or({ release_year: { $gt: 2020 } })
        .select(['game_id', 'game_name']);

      const sql = query.toString();
      expect(sql).toBe("SELECT game_id, game_name FROM games AS g WHERE (g.game_id = 1) OR (g.game_name = 'Tetris') OR (g.release_year > 2020)");
    });

    it('should handle inline OR with joins', () => {
      const query = QueryBuilder.from<TableFields>('games', 'g')
        .leftJoin<TableFields2>('developers', 'd')
        .on({ game_id: 'game_id' })
        .where({
          game_id: 1,
          or: [
            { description: { $like: '%action%' } }
          ]
        })
        .select({
          game_id: 'id',
          game_name: 'name',
          description: 'desc'
        });

      const sql = query.toString();
      expect(sql).toBe("SELECT game_id AS id, game_name AS name, description AS desc FROM games AS g LEFT JOIN developers AS d ON g.game_id = d.game_id WHERE (d.game_id = 1) OR (d.description LIKE '%action%')");
    });
  });
});