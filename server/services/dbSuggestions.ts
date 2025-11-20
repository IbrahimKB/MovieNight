import { sql } from "../db/sql.js";
import { Suggestion } from "../models/types.js";
import { randomUUID } from "crypto";

export const dbSuggestions = {
  // All suggestions sent TO a user
  async getForUser(userId: string): Promise<Suggestion[]> {
    const result = await sql`
      SELECT *
      FROM "Suggestion"
      WHERE ${userId} = ANY("suggestedTo")
      ORDER BY "createdAt" DESC;
    `;
    return result;
  },

  // All suggestions created BY a user
  async getByCreator(userId: string): Promise<Suggestion[]> {
    const result = await sql`
      SELECT *
      FROM "Suggestion"
      WHERE "suggestedBy" = ${userId}
      ORDER BY "createdAt" DESC;
    `;
    return result;
  },

  // Suggestions matching a movie
  async getByMovie(movieId: string): Promise<Suggestion[]> {
    const result = await sql`
      SELECT *
      FROM "Suggestion"
      WHERE "movieId" = ${movieId};
    `;
    return result;
  },

  // Create a new suggestion
  async create(data: {
    movieId: string;
    suggestedBy: string;
    suggestedTo: string[];
    desireRating: number;
    comment?: string;
  }): Promise<Suggestion> {
    const id = randomUUID();

    const result = await sql`
      INSERT INTO "Suggestion" (
        id,
        "movieId",
        "suggestedBy",
        "suggestedTo",
        "desireRating",
        comment
      )
      VALUES (
        ${id},
        ${data.movieId},
        ${data.suggestedBy},
        ${data.suggestedTo},
        ${data.desireRating},
        ${data.comment ?? null}
      )
      RETURNING *;
    `;
    return result[0];
  },

  // Update a suggestion status
  async updateStatus(
    suggestionId: string,
    status: "pending" | "accepted" | "rejected"
  ): Promise<Suggestion> {
    const result = await sql`
      UPDATE "Suggestion"
      SET status = ${status}
      WHERE id = ${suggestionId}
      RETURNING *;
    `;
    return result[0];
  },

  // Delete a suggestion
  async delete(suggestionId: string): Promise<Suggestion> {
    const result = await sql`
      DELETE FROM "Suggestion"
      WHERE id = ${suggestionId}
      RETURNING *;
    `;
    return result[0];
  },
};
