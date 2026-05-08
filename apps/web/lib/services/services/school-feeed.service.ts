// src/services/schools-feed.service.ts
import { graphql } from "../graphql";

export interface SchoolNode {
  id: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  address?: string | null;
  city?: string | null;
  averageRating: number;
  favoritesCount: number;
  isVerified: boolean;
  monthlyPrice?: number | null;
  gallery?: string[] | null;
}

export interface SchoolEdge {
  node: SchoolNode;
  cursor: string;
}

export interface SchoolsConnection {
  edges: SchoolEdge[];
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
}

export interface SchoolsFeedFilters {
  educationalLevel?: string;
  city?: string;
  state?: string;
  categoryId?: string;
  schedule?: string;
  languages?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: 'favorites' | 'rating' | 'recent';
  onlyVerified?: boolean;
  latitude?: number;
  longitude?: number;
}

export interface PaginationInput {
  first: number;
  after?: string;
}

export const schoolsFeedService = {
  async list(params: {
    filters?: SchoolsFeedFilters;
    pagination: PaginationInput;
  }): Promise<SchoolsConnection> {
    const query = `
      query SchoolsFeed($filters: SchoolsFeedInput, $pagination: PaginationInput) {
        schoolsFeed(filters: $filters, pagination: $pagination) {
          edges {
            node {
              id
              name
              description
              logoUrl
              coverImageUrl
              address
              city
              state
              averageRating
              favoritesCount
              isVerified
              monthlyPrice
            }
            cursor
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;

    const sortByMap: Record<NonNullable<SchoolsFeedFilters["sortBy"]>, string> = {
      recent: "RECENT",
      rating: "RATING",
      favorites: "FAVORITES",
    };

    const normalizedFilters = params.filters
      ? {
          search: params.filters.search,
          city: params.filters.city,
          state: params.filters.state,
          educationalLevel: params.filters.educationalLevel,
          categoryId: params.filters.categoryId,
          schedule: params.filters.schedule,
          languages: params.filters.languages,
          minPrice: params.filters.minPrice,
          maxPrice: params.filters.maxPrice,
          onlyVerified: params.filters.onlyVerified,
          latitude: params.filters.latitude,
          longitude: params.filters.longitude,
          sortBy: params.filters.sortBy
            ? sortByMap[params.filters.sortBy]
            : undefined,
        }
      : undefined;

    const data = await graphql<{
      schoolsFeed: SchoolsConnection;
    }>(query, {
      filters: normalizedFilters,
      pagination: params.pagination,
    });

    return data.schoolsFeed;
  },
};