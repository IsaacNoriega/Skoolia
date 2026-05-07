import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/services/api";
import { messagesService } from "@/lib/services/services/messages.service";
import type { Lead } from "@/lib/types/lead";

export function useLeads(targetId: string, originType: "SCHOOL" | "COURSE", participantId?: string, includeCourses = false) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch interaction leads
      const fetchInteractionLeads = async () => {
        if (originType === "SCHOOL" && includeCourses) {
          // Fetch both school and course leads in parallel
          const [schoolLeads, courseLeads] = await Promise.all([
            api<Lead[]>(`/leads/school?schoolId=${targetId}`),
            api<Lead[]>(`/leads/courses`)
          ]);
          return [...schoolLeads, ...courseLeads];
        }

        const endpoint = originType === "SCHOOL" 
          ? `/leads/school?schoolId=${targetId}` 
          : `/leads/courses`; 
        
        return await api<Lead[]>(endpoint);
      };

      const interactionLeads = await fetchInteractionLeads();

      // Fetch message threads as additional leads
      let messageThreads: any[] = [];
      const threadParticipantId = participantId || targetId;
      
      try {
        if (originType === "SCHOOL") {
          messageThreads = await messagesService.listSchoolThreads(threadParticipantId);
        } else {
          messageThreads = await messagesService.listCourseThreadsByOwner(threadParticipantId);
        }
      } catch (err) {
        console.warn("Could not fetch message threads for leads:", err);
      }

      // Merge logic:
      // 1. Start with interaction leads
      // 2. Add message threads that don't have an interaction lead yet
      const mergedLeads: Lead[] = [...interactionLeads];
      
      messageThreads.forEach((thread: any) => {
        const existing = mergedLeads.find(l => l.userId === thread.publicUserId);
        if (!existing) {
          // Create a synthetic lead from the thread
          mergedLeads.push({
            id: `thread-${thread.id}`,
            userId: thread.publicUserId,
            userName: thread.publicUserName,
            targetId: targetId,
            originType: originType,
            status: (thread.leadStatus as any) || "NUEVO",
            lastTrigger: "CONTACT",
            metadata: {
              notes: thread.lastMessage ? [thread.lastMessage] : [],
              tags: [],
            },
            createdAt: thread.lastMessageAt,
            updatedAt: thread.lastMessageAt,
          });
        } else {
          // Update existing lead if thread has more recent info?
          // For now, just ensure userName is set
          if (!existing.userName) existing.userName = thread.publicUserName;
        }
      });

      setLeads(mergedLeads.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
    } catch (err) {
      console.error("Failed to fetch leads:", err);
      setError("No se pudieron cargar los leads.");
    } finally {
      setLoading(false);
    }
  }, [targetId, originType]);

  useEffect(() => {
    if (targetId) {
      fetchLeads();
    }
  }, [targetId, fetchLeads]);

  return { leads, loading, error, refresh: fetchLeads };
}
