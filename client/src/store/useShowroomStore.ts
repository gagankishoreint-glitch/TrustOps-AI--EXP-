import { create } from 'zustand';

export interface ShowroomData {
  id: string;
  name: string;
  city: string;
  score: number;
  status: 'Healthy' | 'Stable' | 'Caution' | 'Critical';
  risk: 'Low' | 'Medium' | 'High' | 'Severe';
  activeNodes: number;
  region: string;
}

interface ShowroomStore {
  showrooms: Record<string, ShowroomData>;
  updateShowroomScore: (id: string, score: number) => void;
}

export const useShowroomStore = create<ShowroomStore>((set) => ({
  showrooms: {
    'mumbai':    { id: 'mumbai',    name: 'Mumbai HQ',            city: 'Mumbai',    score: 97, status: 'Healthy', risk: 'Low',    activeNodes: 32, region: 'West India'  },
    'delhi':     { id: 'delhi',     name: 'Delhi NCR',            city: 'Delhi',     score: 100,status: 'Healthy', risk: 'Low',    activeNodes: 28, region: 'North India' },
    'bangalore': { id: 'bangalore', name: 'Bangalore Tech Park',  city: 'Bangalore', score: 89, status: 'Stable',  risk: 'Low',    activeNodes: 41, region: 'South India' },
    'hyderabad': { id: 'hyderabad', name: 'Hyderabad Deccan',     city: 'Hyderabad', score: 78, status: 'Caution', risk: 'Medium', activeNodes: 19, region: 'Deccan'      },
  },
  updateShowroomScore: (id, score) => set((state) => {
    let status: ShowroomData['status'] = 'Healthy';
    let risk: ShowroomData['risk'] = 'Low';

    if (score < 60)      { status = 'Critical'; risk = 'Severe'; }
    else if (score < 75) { status = 'Caution';  risk = 'Medium'; }
    else if (score < 90) { status = 'Stable';   risk = 'Low';    }
    else                 { status = 'Healthy';   risk = 'Low';    }

    return {
      showrooms: {
        ...state.showrooms,
        [id]: { ...state.showrooms[id], score: Math.round(score), status, risk }
      }
    };
  })
}));
