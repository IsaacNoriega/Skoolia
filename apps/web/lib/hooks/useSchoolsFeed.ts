import { useQuery } from '@tanstack/react-query';
import { schoolsFeedService, SchoolsFeedFilters, SchoolsConnection } from '@/lib/services/services/school-feeed.service';

export function useSchoolsFeed(params: SchoolsFeedFilters = {}) {
  return useQuery<SchoolsConnection>({
    queryKey: ['schools-feed', params],
    queryFn: async () => {
      return schoolsFeedService.list({
        filters: params,
        pagination: { first: 24 },
      });
    },
    refetchInterval: 10000, // Refresca cada 10s para cambios reactivos
    refetchOnWindowFocus: true,
  });
}

