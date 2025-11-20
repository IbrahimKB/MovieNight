import { sql } from "../db/sql.js";
import { Movie } from "../models/types.js";

export const dbMovies = {
  /** ------------------------------------------------------------------
   * Get all movies
   * ------------------------------------------------------------------*/
  async getAll(): Promise<Movie[]> {
    const result = await sql<Movie>(
      `
      SELECT *
      FROM movienight."Movie"
      ORDER BY "createdAt" DESC;
      `
    );
    return result.rows;
  },

  /** ------------------------------------------------------------------
   * Search movies (title, description, genres)
   * ------------------------------------------------------------------*/
  async search(query: string, limit: number = 20): Promise<Movie[]> {
    const like = `%${query}%`;

    const result = await sql<Movie>(
      `
      SELECT *
      FROM movienight."Movie"
      WHERE
        title ILIKE $1
        OR description ILIKE $1
        OR EXISTS (
          SELECT 1
          FROM unnest("genres") g
          WHERE g ILIKE $1
        )
      ORDER BY "createdAt" DESC
      LIMIT $2;
      `,
      [like, limit]
    );

    return result.rows;
  },

  /** ------------------------------------------------------------------
   * Get by ID
   * ------------------------------------------------------------------*/
  async getById(id: string): Promise<Movie | null> {
    const result = await sql<Movie>(
      `
      SELECT *
      FROM movienight."Movie"
      WHERE id = $1::uuid
      LIMIT 1;
      `,
      [id]
    );

    return result.rows[0] ?? null;
  },

  /** ------------------------------------------------------------------
   * Create movie (generic insert from object)
   * NOTE: This assumes the 'movie' object keys match column names.
   * ------------------------------------------------------------------*/
  async create(movie: Record<string, any>): Promise<Movie> {
    const keys = Object.keys(movie);
    if (keys.length === 0) {
      throw new Error("Cannot create a movie with no fields");
    }

    const columns = keys.map((k) => `"${k}"`).join(", ");
    const params = keys.map((_, i) => `$${i + 1}`);
    const values = keys.map((k) => movie[k]);

    const result = await sql<Movie>(
      `
      INSERT INTO movienight."Movie" (${columns})
      VALUES (${params.join(", ")})
      RETURNING *;
      `,
      values
    );

    return result.rows[0];
  },

  /** ------------------------------------------------------------------
   * Update movie
   * ------------------------------------------------------------------*/
  async update(id: string, data: Record<string, any>): Promise<Movie> {
    const keys = Object.keys(data);

    if (keys.length === 0) {
      throw new Error("No fields to update");
    }

    const setClauses = keys.map((k, idx) => `"${k}" = $${idx + 1}`);
    const values = keys.map((k) => data[k]);

    // push id as last param
    values.push(id);

    const result = await sql<Movie>(
      `
      UPDATE movienight."Movie"
      SET ${setClauses.join(", ")},
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $${keys.length + 1}::uuid
      RETURNING *;
      `,
      values
    );

    if (result.rows.length === 0) {
      throw new Error("Movie not found");
    }

    return result.rows[0];
  },

  /** ------------------------------------------------------------------
   * Delete movie
   * ------------------------------------------------------------------*/
  async delete(id: string): Promise<Movie> {
    const result = await sql<Movie>(
      `
      DELETE FROM movienight."Movie"
      WHERE id = $1::uuid
      RETURNING *;
      `,
      [id]
    );

    if (result.rows.length === 0) {
      throw new Error("Movie not found");
    }

    return result.rows[0];
  },
};
