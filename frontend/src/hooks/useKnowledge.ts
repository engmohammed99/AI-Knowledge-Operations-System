import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

// --- Types ---
export interface Insight {
  id: string;
  category: 'issue' | 'decision' | 'conflict';
  title: string;
  description: string;
  source_document_ids: string[];
  createdAt: string;
}

export interface Document {
  id: string;
  filename: string;
  status: 'pending' | 'processed' | 'failed';
}

export interface AIResponse {
  answer: string;
  sources: string[];
  confidence: number;
  reasoning: string;
}

// --- Hooks ---

// 1. Fetch all uploaded documents
export const useDocuments = () => {
  return useQuery({
    queryKey: ['documents'],
    queryFn: async (): Promise<Document[]> => {
      const response = await api.get('/docs');
      return response.data.data;
    },
    // Poll every 5 seconds to auto-update "pending" to "processed"
    refetchInterval: 5000, 
  });
};

// 2. Upload a new file
export const useUploadFile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('documents', file);
      const response = await api.post('/ingest/files', formData);
      return response.data;
    },
    onSuccess: () => {
      // Instantly refresh the document list on the left sidebar
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
};

// 3. Ask the AI a question
export const useAskQuestion = () => {
  return useMutation({
    mutationFn: async (question: string): Promise<AIResponse> => {
      const response = await api.post('/ai/query', { question });
      return response.data.data;
    },
  });
};

export const useInsights = () => {
  return useQuery({
    queryKey: ['insights'],
    queryFn: async (): Promise<Insight[]> => {
      // Assuming you mapped the endpoint to /api/insights
      const response = await api.get('/docs/insights'); 
      return response.data.data;
    },
    refetchInterval: 60000, // Check for new insights every minute
  });
};
