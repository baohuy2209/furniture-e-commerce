export interface Event {
    event_id: number;
    event_name: string;
    description: string;
    date: {
        day: number;
        month: number;
        year: number;
    };
    time: string;
    location: string;
    thumbnail_image: string;
    event_status: 'UPCOMING' | 'ONGOING' | 'PAST';
    event_type: 'WORKSHOP' | 'EXHIBITION' | 'LAUNCH' | 'POP-UP';
    price: number;
    max_participants: number;
    is_featured?: boolean;
    stats?: {
        attendees?: number;
        brands?: number;
        workshops?: number;
    };
    highlights?: string[];
    timeline?: {
        time: string;
        title: string;
        description: string;
    }[];
}
