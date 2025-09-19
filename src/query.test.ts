import { describe, it, expect } from 'vitest';
import { BaseQuery, Query } from './query';

type TableFields = {
  game_id: number;
  game_name: string;
  release_year: number;
};

type TableFields2 = {
  game_id: number;
  description: string;
};

describe('BaseQuery', () => {
  it('should create a basic query with from method', () => {
    const query = BaseQuery.from<TableFields>('games', 'g');

    expect(query.tableName).toBe('games');
    expect(query.tableAlias).toBe('g');
  });

  it('should generate SQL for simple select with array of fields', () => {
    const query = BaseQuery.from<TableFields>('games', 'g')
      .select(['game_id', 'game_name']);

    const sql = query.toString();
    expect(sql).toBe('SELECT game_id, game_name FROM games AS g');
  });

  it('should generate SQL for simple select with field mapping', () => {
    const query = BaseQuery.from<TableFields>('games', 'g')
      .select({
        game_id: 'id',
        game_name: 'name'
      });

    const sql = query.toString();
    expect(sql).toBe('SELECT game_id AS id, game_name AS name FROM games AS g');
  });

  it('should generate SQL for left join with on condition', () => {
    const query = BaseQuery.from<TableFields>('games', 'g')
      .leftJoin<TableFields2>('developers', 'd')
      .on({ game_id: 'game_id' })
      .select({
        game_id: 'id',
      });

    const sql = query.toString();
    expect(sql).toBe('SELECT game_id AS id FROM games AS g LEFT JOIN developers AS d ON g.game_id = d.game_id');
  });

  it('should handle multiple joins in sequence', () => {
    type PublisherFields = {
      game_id: number;
      publisher_name: string;
    };

    const query = BaseQuery.from<TableFields>('games', 'g')
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

  it('should handle select with same field name and alias', () => {
    const query = BaseQuery.from<TableFields>('games', 'g')
      .select({
        game_id: 'game_id', // Same name as alias
        game_name: 'title'   // Different alias
      });

    const sql = query.toString();
    expect(sql).toBe('SELECT game_id, game_name AS title FROM games AS g');
  });

  it('should handle multiple join conditions', () => {
    type ComplexJoinFields = {
      game_id: number;
      developer_id: number;
      description: string;
    };

    const query = BaseQuery.from<TableFields>('games', 'g')
      .leftJoin<ComplexJoinFields>('game_developers', 'gd')
      .on({ game_id: 'game_id' })
      .select({
        game_id: 'id',
        game_name: 'name',
        description: 'desc'
      });

    const sql = query.toString();
    expect(sql).toBe('SELECT game_id AS id, game_name AS name, description AS desc FROM games AS g LEFT JOIN game_developers AS gd ON g.game_id = gd.game_id');
  });

  it('should match the example usage from the prompt', () => {
    const query = BaseQuery.from<TableFields>("games", "g")
      .leftJoin<TableFields2>("developers", "d")
      .on({ game_id: "game_id" })
      .select({
        game_id: "id",
      });

    const sql = query.toString();
    expect(sql).toBe('SELECT game_id AS id FROM games AS g LEFT JOIN developers AS d ON g.game_id = d.game_id');
  });

  it('should handle triple joins correctly', () => {
    type PublisherFields = {
      game_id: number;
      publisher_name: string;
    };

    type PlatformFields = {
      game_id: number;
      platform_name: string;
    };

    const query = BaseQuery.from<TableFields>('games', 'g')
      .leftJoin<TableFields2>('developers', 'd')
      .on({ game_id: 'game_id' })
      .leftJoin<PublisherFields>('publishers', 'p')
      .on({ game_id: 'game_id' })
      .leftJoin<PlatformFields>('platforms', 'pl')
      .on({ game_id: 'game_id' })
      .select({
        game_id: 'id',
        game_name: 'name',
        platform_name: 'platform'
      });

    const sql = query.toString();
    expect(sql).toBe('SELECT game_id AS id, game_name AS name, platform_name AS platform FROM games AS g LEFT JOIN developers AS d ON g.game_id = d.game_id LEFT JOIN publishers AS p ON d.game_id = p.game_id LEFT JOIN platforms AS pl ON p.game_id = pl.game_id');
  });

  describe('WHERE functionality', () => {
    it('should generate simple where clause with equality', () => {
      const query = BaseQuery.from<TableFields>('games', 'g')
        .where({ game_id: 1 })
        .select(['game_id', 'game_name']);

      const sql = query.toString();
      expect(sql).toBe('SELECT game_id, game_name FROM games AS g WHERE g.game_id = 1');
    });

    it('should generate where clause with string value', () => {
      const query = BaseQuery.from<TableFields>('games', 'g')
        .where({ game_name: 'Tetris' })
        .select(['game_id', 'game_name']);

      const sql = query.toString();
      expect(sql).toBe("SELECT game_id, game_name FROM games AS g WHERE g.game_name = 'Tetris'");
    });

    it('should generate where clause with multiple conditions', () => {
      const query = BaseQuery.from<TableFields>('games', 'g')
        .where({ game_id: 1, release_year: 2020 })
        .select(['game_id', 'game_name']);

      const sql = query.toString();
      expect(sql).toBe('SELECT game_id, game_name FROM games AS g WHERE g.game_id = 1 AND g.release_year = 2020');
    });

    it('should generate where clause with comparison operators', () => {
      const query = BaseQuery.from<TableFields>('games', 'g')
        .where({ release_year: { $gt: 2000 } })
        .select(['game_id', 'game_name']);

      const sql = query.toString();
      expect(sql).toBe('SELECT game_id, game_name FROM games AS g WHERE g.release_year > 2000');
    });

    it('should generate where clause with IN operator', () => {
      const query = BaseQuery.from<TableFields>('games', 'g')
        .where({ release_year: { $in: [2019, 2020, 2021] } })
        .select(['game_id', 'game_name']);

      const sql = query.toString();
      expect(sql).toBe('SELECT game_id, game_name FROM games AS g WHERE g.release_year IN (2019, 2020, 2021)');
    });

    it('should work with joins and where clauses', () => {
      const query = BaseQuery.from<TableFields>('games', 'g')
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
      const query = BaseQuery.from<TableFields>('games', 'g')
        .where({ release_year: { $gt: 2000 } })
        .where({ game_name: 'Tetris' })
        .select(['game_id', 'game_name']);

      const sql = query.toString();
      expect(sql).toBe("SELECT game_id, game_name FROM games AS g WHERE g.release_year > 2000 AND g.game_name = 'Tetris'");
    });

    it('should handle all comparison operators', () => {
      const query1 = BaseQuery.from<TableFields>('games', 'g')
        .where({ release_year: { $lt: 2000 } })
        .select(['game_name']);
      expect(query1.toString()).toBe('SELECT game_name FROM games AS g WHERE g.release_year < 2000');

      const query2 = BaseQuery.from<TableFields>('games', 'g')
        .where({ release_year: { $gte: 2000 } })
        .select(['game_name']);
      expect(query2.toString()).toBe('SELECT game_name FROM games AS g WHERE g.release_year >= 2000');

      const query3 = BaseQuery.from<TableFields>('games', 'g')
        .where({ release_year: { $lte: 2000 } })
        .select(['game_name']);
      expect(query3.toString()).toBe('SELECT game_name FROM games AS g WHERE g.release_year <= 2000');

      const query4 = BaseQuery.from<TableFields>('games', 'g')
        .where({ release_year: { $ne: 2000 } })
        .select(['game_name']);
      expect(query4.toString()).toBe('SELECT game_name FROM games AS g WHERE g.release_year != 2000');
    });

    it('should generate where clause with LIKE operator', () => {
      const query = BaseQuery.from<TableFields>('games', 'g')
        .where({ game_name: { $like: '%Tetris%' } })
        .select(['game_id', 'game_name']);

      const sql = query.toString();
      expect(sql).toBe("SELECT game_id, game_name FROM games AS g WHERE g.game_name LIKE '%Tetris%'");
    });

    it('should handle LIKE with different patterns', () => {
      const query1 = BaseQuery.from<TableFields>('games', 'g')
        .where({ game_name: { $like: 'Super%' } })
        .select(['game_name']);
      expect(query1.toString()).toBe("SELECT game_name FROM games AS g WHERE g.game_name LIKE 'Super%'");

      const query2 = BaseQuery.from<TableFields>('games', 'g')
        .where({ game_name: { $like: '%Mario' } })
        .select(['game_name']);
      expect(query2.toString()).toBe("SELECT game_name FROM games AS g WHERE g.game_name LIKE '%Mario'");

      const query3 = BaseQuery.from<TableFields>('games', 'g')
        .where({ game_name: { $like: '_etris' } })
        .select(['game_name']);
      expect(query3.toString()).toBe("SELECT game_name FROM games AS g WHERE g.game_name LIKE '_etris'");
    });

    it('should work with LIKE and other conditions', () => {
      const query = BaseQuery.from<TableFields>('games', 'g')
        .where({
          game_name: { $like: '%Mario%' },
          release_year: { $gt: 1990 }
        })
        .select(['game_id', 'game_name']);

      const sql = query.toString();
      expect(sql).toBe("SELECT game_id, game_name FROM games AS g WHERE g.game_name LIKE '%Mario%' AND g.release_year > 1990");
    });

    it('should generate where clause with $eq operator', () => {
      const query = BaseQuery.from<TableFields>('games', 'g')
        .where({ game_id: { $eq: 1 } })
        .select(['game_id', 'game_name']);

      const sql = query.toString();
      expect(sql).toBe('SELECT game_id, game_name FROM games AS g WHERE g.game_id = 1');
    });

    it('should handle $eq with string values', () => {
      const query = BaseQuery.from<TableFields>('games', 'g')
        .where({ game_name: { $eq: 'Tetris' } })
        .select(['game_id', 'game_name']);

      const sql = query.toString();
      expect(sql).toBe("SELECT game_id, game_name FROM games AS g WHERE g.game_name = 'Tetris'");
    });

    it('should produce same result for $eq and direct value', () => {
      const query1 = BaseQuery.from<TableFields>('games', 'g')
        .where({ game_id: 1 })
        .select(['game_id', 'game_name']);

      const query2 = BaseQuery.from<TableFields>('games', 'g')
        .where({ game_id: { $eq: 1 } })
        .select(['game_id', 'game_name']);

      const sql1 = query1.toString();
      const sql2 = query2.toString();

      expect(sql1).toBe(sql2);
      expect(sql1).toBe('SELECT game_id, game_name FROM games AS g WHERE g.game_id = 1');
    });

    it('should work with $eq and other operators', () => {
      const query = BaseQuery.from<TableFields>('games', 'g')
        .where({
          game_id: { $eq: 1 },
          release_year: { $gt: 2000 }
        })
        .select(['game_id', 'game_name']);

      const sql = query.toString();
      expect(sql).toBe('SELECT game_id, game_name FROM games AS g WHERE g.game_id = 1 AND g.release_year > 2000');
    });

    it('should generate OR condition with simple equality', () => {
      const query = BaseQuery.from<TableFields>('games', 'g')
        .where({ game_id: 1 })
        .or({ game_id: 2 })
        .select(['game_id', 'game_name']);

      const sql = query.toString();
      expect(sql).toBe('SELECT game_id, game_name FROM games AS g WHERE (g.game_id = 1) OR (g.game_id = 2)');
    });

    it('should generate OR condition with operators', () => {
      const query = BaseQuery.from<TableFields>('games', 'g')
        .where({ release_year: { $gt: 2020 } })
        .or({ game_name: { $like: '%Mario%' } })
        .select(['game_id', 'game_name']);

      const sql = query.toString();
      expect(sql).toBe("SELECT game_id, game_name FROM games AS g WHERE (g.release_year > 2020) OR (g.game_name LIKE '%Mario%')");
    });

    it('should handle multiple OR conditions', () => {
      const query = BaseQuery.from<TableFields>('games', 'g')
        .where({ game_id: 1 })
        .or({ game_id: 2 })
        .or({ game_name: 'Tetris' })
        .select(['game_id', 'game_name']);

      const sql = query.toString();
      expect(sql).toBe("SELECT game_id, game_name FROM games AS g WHERE (g.game_id = 1) OR (g.game_id = 2) OR (g.game_name = 'Tetris')");
    });

    it('should handle complex OR conditions with multiple fields', () => {
      const query = BaseQuery.from<TableFields>('games', 'g')
        .where({ game_id: 1, release_year: 2020 })
        .or({ game_name: 'Tetris', release_year: { $gt: 2019 } })
        .select(['game_id', 'game_name']);

      const sql = query.toString();
      expect(sql).toBe("SELECT game_id, game_name FROM games AS g WHERE (g.game_id = 1 AND g.release_year = 2020) OR (g.game_name = 'Tetris' AND g.release_year > 2019)");
    });

    it('should handle OR with joins', () => {
      const query = BaseQuery.from<TableFields>('games', 'g')
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
      const query = BaseQuery.from<TableFields>('games', 'g')
        .where({ release_year: { $gt: 2000 } })
        .where({ game_id: { $lt: 100 } })
        .or({ game_name: 'Classic Game' })
        .select(['game_id', 'game_name']);

      const sql = query.toString();
      expect(sql).toBe("SELECT game_id, game_name FROM games AS g WHERE (g.release_year > 2000 AND g.game_id < 100) OR (g.game_name = 'Classic Game')");
    });

    it('should handle inline OR syntax with simple conditions', () => {
      const query = BaseQuery.from<TableFields>('games', 'g')
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
      const query = BaseQuery.from<TableFields>('games', 'g')
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
      const query = BaseQuery.from<TableFields>('games', 'g')
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
      const query = BaseQuery.from<TableFields>('games', 'g')
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
      const query = BaseQuery.from<TableFields>('games', 'g')
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

  describe('JOIN functionality', () => {
    it('should generate INNER JOIN with join method', () => {
      const query = BaseQuery.from<TableFields>('games', 'g')
        .join<TableFields2>('developers', 'd')
        .on({ game_id: 'game_id' })
        .select({
          game_id: 'id',
          game_name: 'name',
          description: 'desc'
        });

      const sql = query.toString();
      expect(sql).toBe('SELECT game_id AS id, game_name AS name, description AS desc FROM games AS g INNER JOIN developers AS d ON g.game_id = d.game_id');
    });

    it('should generate INNER JOIN with innerJoin method', () => {
      const query = BaseQuery.from<TableFields>('games', 'g')
        .innerJoin<TableFields2>('developers', 'd')
        .on({ game_id: 'game_id' })
        .select({
          game_id: 'id',
          game_name: 'name',
          description: 'desc'
        });

      const sql = query.toString();
      expect(sql).toBe('SELECT game_id AS id, game_name AS name, description AS desc FROM games AS g INNER JOIN developers AS d ON g.game_id = d.game_id');
    });

    it('should handle multiple INNER JOINs', () => {
      type PublisherFields = {
        game_id: number;
        publisher_name: string;
      };

      const query = BaseQuery.from<TableFields>('games', 'g')
        .join<TableFields2>('developers', 'd')
        .on({ game_id: 'game_id' })
        .innerJoin<PublisherFields>('publishers', 'p')
        .on({ game_id: 'game_id' })
        .select({
          game_id: 'id',
          game_name: 'name',
          description: 'desc',
          publisher_name: 'publisher'
        });

      const sql = query.toString();
      expect(sql).toBe('SELECT game_id AS id, game_name AS name, description AS desc, publisher_name AS publisher FROM games AS g INNER JOIN developers AS d ON g.game_id = d.game_id INNER JOIN publishers AS p ON d.game_id = p.game_id');
    });

    it('should handle mixed join types', () => {
      type PublisherFields = {
        game_id: number;
        publisher_name: string;
      };

      const query = BaseQuery.from<TableFields>('games', 'g')
        .join<TableFields2>('developers', 'd')
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
      expect(sql).toBe('SELECT game_id AS id, game_name AS name, description AS desc, publisher_name AS publisher FROM games AS g INNER JOIN developers AS d ON g.game_id = d.game_id LEFT JOIN publishers AS p ON d.game_id = p.game_id');
    });

    it('should work with INNER JOIN and WHERE clauses', () => {
      const query = BaseQuery.from<TableFields>('games', 'g')
        .innerJoin<TableFields2>('developers', 'd')
        .on({ game_id: 'game_id' })
        .where({ game_id: 1 })
        .select({
          game_id: 'id',
          game_name: 'name',
          description: 'desc'
        });

      const sql = query.toString();
      expect(sql).toBe("SELECT game_id AS id, game_name AS name, description AS desc FROM games AS g INNER JOIN developers AS d ON g.game_id = d.game_id WHERE d.game_id = 1");
    });

    it('should work with INNER JOIN and OR conditions', () => {
      const query = BaseQuery.from<TableFields>('games', 'g')
        .join<TableFields2>('developers', 'd')
        .on({ game_id: 'game_id' })
        .where({ game_id: 1 })
        .or({ description: { $like: '%indie%' } })
        .select({
          game_id: 'id',
          game_name: 'name',
          description: 'desc'
        });

      const sql = query.toString();
      expect(sql).toBe("SELECT game_id AS id, game_name AS name, description AS desc FROM games AS g INNER JOIN developers AS d ON g.game_id = d.game_id WHERE (d.game_id = 1) OR (d.description LIKE '%indie%')");
    });

    it('should verify that join and innerJoin produce identical results', () => {
      const query1 = BaseQuery.from<TableFields>('games', 'g')
        .join<TableFields2>('developers', 'd')
        .on({ game_id: 'game_id' })
        .select(['game_id', 'game_name']);

      const query2 = BaseQuery.from<TableFields>('games', 'g')
        .innerJoin<TableFields2>('developers', 'd')
        .on({ game_id: 'game_id' })
        .select(['game_id', 'game_name']);

      const sql1 = query1.toString();
      const sql2 = query2.toString();

      expect(sql1).toBe(sql2);
      expect(sql1).toBe('SELECT game_id, game_name FROM games AS g INNER JOIN developers AS d ON g.game_id = d.game_id');
    });
  });

  describe('Subquery functionality', () => {
    it('should handle simple subquery with alias', () => {
      const subquery = BaseQuery.from<TableFields>('games', 'g')
        .where({ release_year: { $gt: 2000 } });

      const query = BaseQuery.from<TableFields>('outer_games', 'og')
        .where({ game_id: 1 })
        .select(subquery, 'recent_games_count');

      const sql = query.toString();
      expect(sql).toBe('SELECT (SELECT * FROM games AS g WHERE g.release_year > 2000) AS recent_games_count FROM outer_games AS og WHERE og.game_id = 1');
    });

    it('should handle subquery with join in main query', () => {
      const subquery = BaseQuery.from<TableFields>('games', 'g')
        .where({ release_year: { $gt: 2020 } });

      const query = BaseQuery.from<TableFields>('games', 'g')
        .leftJoin<TableFields2>('developers', 'd')
        .on({ game_id: 'game_id' })
        .where({ game_id: 1 })
        .select(subquery, 'recent_count');

      const sql = query.toString();
      expect(sql).toBe('SELECT (SELECT * FROM games AS g WHERE g.release_year > 2020) AS recent_count FROM games AS g LEFT JOIN developers AS d ON g.game_id = d.game_id WHERE d.game_id = 1');
    });

    it('should handle subquery with complex conditions', () => {
      const subquery = BaseQuery.from<TableFields>('games', 'g')
        .where({
          release_year: { $gt: 2000 },
          or: [
            { game_name: { $like: '%Mario%' } }
          ]
        });

      const query = BaseQuery.from<TableFields>('summary', 's')
        .select(subquery, 'mario_or_recent');

      const sql = query.toString();
      expect(sql).toBe("SELECT (SELECT * FROM games AS g WHERE (g.release_year > 2000) OR (g.game_name LIKE '%Mario%')) AS mario_or_recent FROM summary AS s");
    });

    it('should handle subquery with joins inside subquery', () => {
      const subquery = BaseQuery.from<TableFields>('games', 'g')
        .innerJoin<TableFields2>('developers', 'd')
        .on({ game_id: 'game_id' })
        .where({ game_id: 1 });

      const query = BaseQuery.from<TableFields>('reports', 'r')
        .select(subquery, 'game_with_dev');

      const sql = query.toString();
      expect(sql).toBe('SELECT (SELECT * FROM games AS g INNER JOIN developers AS d ON g.game_id = d.game_id WHERE d.game_id = 1) AS game_with_dev FROM reports AS r');
    });

    it('should handle multiple subqueries (though each select can only have one)', () => {
      const subquery1 = BaseQuery.from<TableFields>('games', 'g')
        .where({ release_year: { $gt: 2020 } });

      const subquery2 = BaseQuery.from<TableFields>('games', 'g')
        .where({ release_year: { $lt: 1990 } });

      const query1 = BaseQuery.from<TableFields>('summary', 's')
        .select(subquery1, 'recent_games');

      const query2 = BaseQuery.from<TableFields>('summary', 's')
        .select(subquery2, 'old_games');

      const sql1 = query1.toString();
      const sql2 = query2.toString();

      expect(sql1).toBe('SELECT (SELECT * FROM games AS g WHERE g.release_year > 2020) AS recent_games FROM summary AS s');
      expect(sql2).toBe('SELECT (SELECT * FROM games AS g WHERE g.release_year < 1990) AS old_games FROM summary AS s');
    });

    it('should handle subquery with OR conditions using chained method', () => {
      const subquery = BaseQuery.from<TableFields>('games', 'g')
        .where({ release_year: { $gt: 2020 } })
        .or({ game_name: { $like: '%Classic%' } });

      const query = BaseQuery.from<TableFields>('stats', 'st')
        .select(subquery, 'filtered_games');

      const sql = query.toString();
      expect(sql).toBe("SELECT (SELECT * FROM games AS g WHERE (g.release_year > 2020) OR (g.game_name LIKE '%Classic%')) AS filtered_games FROM stats AS st");
    });
  });

  describe('Automatic alias generation', () => {
    it('should auto-generate aliases for tables', () => {
      const query = BaseQuery.from<TableFields>('games')
        .select(['game_id', 'game_name']);

      const sql = query.toString();
      expect(sql).toMatch(/SELECT game_id, game_name FROM games AS t\d+/);
    });

    it('should auto-generate aliases for joins', () => {
      const query = BaseQuery.from<TableFields>('games')
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
      const subquery = BaseQuery.from<TableFields>('games')
        .where({ release_year: { $gt: 2000 } });

      const query = BaseQuery.from<TableFields>('summary')
        .select(subquery as Query<any>);

      const sql = query.toString();
      expect(sql).toMatch(/SELECT \(SELECT \* FROM games AS t\d+ WHERE t\d+\.release_year > 2000\) AS s\d+ FROM summary AS t\d+/);
    });

    it('should allow mixing explicit and auto-generated aliases', () => {
      const query = BaseQuery.from<TableFields>('games', 'g')
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
      type PublisherFields = {
        game_id: number;
        publisher_name: string;
      };

      const query = BaseQuery.from<TableFields>('games')
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
      const subquery = BaseQuery.from<TableFields>('games', 'g')
        .where({ release_year: { $gt: 2000 } });

      const query = BaseQuery.from<TableFields>('summary', 's')
        .select(subquery as Query<any>);

      const sql = query.toString();
      expect(sql).toMatch(/SELECT \(SELECT \* FROM games AS g WHERE g\.release_year > 2000\) AS s\d+ FROM summary AS s/);
    });

    it('should handle auto-generated table alias with explicit subquery alias', () => {
      const subquery = BaseQuery.from<TableFields>('games')
        .where({ release_year: { $gt: 2000 } });

      const query = BaseQuery.from<TableFields>('summary')
        .select(subquery, 'recent_games');

      const sql = query.toString();
      expect(sql).toMatch(/SELECT \(SELECT \* FROM games AS t\d+ WHERE t\d+\.release_year > 2000\) AS recent_games FROM summary AS t\d+/);
    });
  });
});