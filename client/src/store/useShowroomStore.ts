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

export interface HistoryEvent {
  id: string;
  timestamp: string;
  location: string;
  event: string;
  impact: string;
  status: 'Resolved' | 'Monitoring' | 'Action Required';
  severity: 'Low' | 'Medium' | 'High';
}

interface ShowroomStore {
  showrooms: Record<string, ShowroomData>;
  fleetHistory: HistoryEvent[];
  updateShowroomScore: (id: string, score: number) => void;
  addHistoryEvent: (event: Omit<HistoryEvent, 'id'>) => void;
  jitterFleet: () => void;
}

export const useShowroomStore = create<ShowroomStore>((set) => ({
  showrooms: {
    'mumbai':    { id: 'mumbai',    name: 'Mumbai HQ',            city: 'Mumbai',    score: 97, status: 'Healthy', risk: 'Low',    activeNodes: 32, region: 'West India'  },
    'delhi':     { id: 'delhi',     name: 'Delhi NCR',            city: 'Delhi',     score: 100,status: 'Healthy', risk: 'Low',    activeNodes: 28, region: 'North India' },
    'bangalore': { id: 'bangalore', name: 'Bangalore Tech Park',  city: 'Bangalore', score: 89, status: 'Stable',  risk: 'Low',    activeNodes: 41, region: 'South India' },
    'hyderabad': { id: 'hyderabad', name: 'Hyderabad Deccan',     city: 'Hyderabad', score: 78, status: 'Caution', risk: 'Medium', activeNodes: 19, region: 'Deccan'      },
  },
  fleetHistory: [],

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
  }),

  addHistoryEvent: (event) => set((state) => {
    const lastEvent = state.fleetHistory[0];
    if (lastEvent && lastEvent.event === event.event && lastEvent.location === event.location) {
      if (Date.now() - new Date(lastEvent.timestamp).getTime() < 10000) return state;
    }

    return {
      fleetHistory: [
        { ...event, id: `event-${Date.now()}` },
        ...state.fleetHistory
      ].slice(0, 50)
    };
  }),

  jitterFleet: () => set((state) => {
    const nextShowrooms = { ...state.showrooms };
    Object.keys(nextShowrooms).forEach((key) => {
      const nodeJitter = Math.random() > 0.5 ? 1 : -1;
      nextShowrooms[key].activeNodes = Math.max(5, nextShowrooms[key].activeNodes + nodeJitter);
      
      if (Math.random() > 0.8) {
        const scoreJitter = (Math.random() - 0.5) * 2;
        nextShowrooms[key].score = Math.min(100, Math.max(10, nextShowrooms[key].score + scoreJitter));
      }
    });

    return { showrooms: nextShowrooms };
  })
}));
