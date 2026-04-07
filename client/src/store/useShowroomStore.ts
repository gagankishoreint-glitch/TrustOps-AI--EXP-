import { create } from 'zustand';

export interface ShowroomData {
  id: string;
  name: string;
  score: number;
  status: 'Healthy' | 'Stable' | 'Caution' | 'Critical';
  risk: 'Low' | 'Medium' | 'High' | 'Severe';
  activeNodes: number;
}

interface ShowroomStore {
  showrooms: Record<string, ShowroomData>;
  updateShowroomScore: (id: string, score: number) => void;
}

export const useShowroomStore = create<ShowroomStore>((set) => ({
  showrooms: {
    'tokyo': { id: 'tokyo', name: 'Showroom A (Tokyo)', score: 98, status: 'Stable', risk: 'Low', activeNodes: 24 },
    'london': { id: 'london', name: 'Showroom B (London)', score: 100, status: 'Healthy', risk: 'Low', activeNodes: 12 },
    'sf': { id: 'sf', name: 'Showroom C (San Francisco)', score: 95, status: 'Stable', risk: 'Low', activeNodes: 18 },
    'berlin': { id: 'berlin', name: 'Showroom D (Berlin)', score: 85, status: 'Caution', risk: 'Medium', activeNodes: 14 }
  },
  updateShowroomScore: (id, score) => set((state) => {
    let status: ShowroomData['status'] = 'Healthy';
    let risk: ShowroomData['risk'] = 'Low';
    
    if (score < 60) {
      status = 'Critical';
      risk = 'Severe';
    } else if (score < 80) {
      status = 'Caution';
      risk = 'Medium';
    } else if (score < 96) {
      status = 'Stable';
      risk = 'Low';
    }

    return {
      showrooms: {
        ...state.showrooms,
        [id]: {
          ...state.showrooms[id],
          score: Math.round(score),
          status,
          risk
        }
      }
    };
  })
}));
