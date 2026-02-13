export interface Event {
    id: number;
    title: string;
    description: string;
    date: {
        day: number;
        month: number;
        year: number;
    };
    time: string;
    location: string;
    image: string;
    status: 'UPCOMING' | 'ONGOING' | 'PAST';
    type: 'WORKSHOP' | 'EXHIBITION' | 'LAUNCH' | 'POP-UP'; // Added specific event types
    price: number;
    stats?: {
        attendees?: number;
        brands?: number;
        workshops?: number;
    };
    isFeatured?: boolean;
    highlights?: string[];
    timeline?: {
        time: string;
        title: string;
        description: string;
    }[];
}
