import { prisma } from "../utils/prisma.js";
import { Suggestion } from "../models/types.js";
import { generateId } from "../utils/storage.js";

export const dbSuggestions = {
  /** ------------------------------------------------------------------
   * Get all suggestions for a given user (they were suggested TO)
   * ------------------------------------------------------------------*/
  async getForUser(userId: string): Promise<Suggestion[]> {
    return prisma.suggestion.findMany({
      where: {
        suggestedTo: { has: userId },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /** ------------------------------------------------------------------
   * Get all suggestions created BY a user
   * ------------------------------------------------------------------*/
  async getByCreator(userId: string): Promise<Suggestion[]> {
    return prisma.suggestion.findMany({
      where: { suggestedBy: userId },
      orderBy: { createdAt: "desc" },
    });
  },

  /** ------------------------------------------------------------------
   * Get suggestions for a given movie
   * ------------------------------------------------------------------*/
  async getByMovie(movieId: string): Promise<Suggestion[]> {
    return prisma.suggestion.findMany({
      where: { movieId },
    });
  },

  /** ------------------------------------------------------------------
   * Create a new suggestion
   * ------------------------------------------------------------------*/
  async create(data: {
    movieId: string;
    suggestedBy: string;
    suggestedTo: string[];
    desireRating: number;
    comment?: string;
  }): Promise<Suggestion> {
    return prisma.suggestion.create({
      data: {
        id: generateId(),
        ...data,
      },
    });
  },

  /** ------------------------------------------------------------------
   * Update suggestion status
   * ------------------------------------------------------------------*/
  async updateStatus(
    suggestionId: string,
    status: "pending" | "accepted" | "rejected"
  ): Promise<Suggestion> {
    return prisma.suggestion.update({
      where: { id: suggestionId },
      data: { status },
    });
  },

  /** ------------------------------------------------------------------
   * Delete a suggestion
   * ------------------------------------------------------------------*/
  async delete(suggestionId: string): Promise<Suggestion> {
    return prisma.suggestion.delete({
      where: { id: suggestionId },
    });
  },
};
