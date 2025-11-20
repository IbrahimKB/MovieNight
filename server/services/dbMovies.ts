import prisma from "../utils/prisma.js";

export const dbMovies = {
  async getAll() {
    return prisma.movie.findMany({
      orderBy: { createdAt: "desc" },
    });
  },

  async search(query: string, limit: number = 20) {
    return prisma.movie.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { genres: { has: query } },
        ],
      },
      take: limit,
    });
  },

  async getById(id: string) {
    return prisma.movie.findUnique({ where: { id } });
  },

  async create(movie: any) {
    return prisma.movie.create({
      data: {
        ...movie,
        releaseDate: movie.releaseDate
          ? new Date(movie.releaseDate)
          : null,
      },
    });
  },

  async update(id: string, data: any) {
    return prisma.movie.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  },

  async delete(id: string) {
    return prisma.movie.delete({ where: { id } });
  },
};
