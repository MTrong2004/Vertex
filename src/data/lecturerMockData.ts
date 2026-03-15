export type TaskStatus = 'todo' | 'in-progress' | 'ready-for-review' | 'approved';
export type TaskPriority = 'high' | 'medium' | 'low';
export type ReviewStatus = 'on-track' | 'at-risk' | 'overdue';

export interface LecturerTask {
  id: string;
  title: string;
  assignee: string;
  deadline: string;
  priority: TaskPriority;
  status: TaskStatus;
}

export interface TimelineMilestone {
  week: string;
  milestone: string;
  date: string;
  done: boolean;
}

export interface GroupComment {
  id: string;
  author: string;
  role: 'lecturer' | 'student';
  text: string;
  time: string;
  taskRef?: string;
}

export interface LecturerGroup {
  id: string;
  name: string;
  className: string;
  progress: number;
  deadline: string;
  members: number;
  avatarInitials: string[];
  reviewStatus: ReviewStatus;
  description: string;
  tasks: LecturerTask[];
  timeline: TimelineMilestone[];
  comments: GroupComment[];
}

const makeTasks = (prefix: string, progress: number): LecturerTask[] => [
  { id: `${prefix}-t1`, title: 'Research & Brief', assignee: 'Minh', deadline: 'Mar 10', priority: 'high', status: progress >= 25 ? 'approved' : 'todo' },
  { id: `${prefix}-t2`, title: 'Concept Development', assignee: 'Lan', deadline: 'Mar 14', priority: 'high', status: progress >= 50 ? 'approved' : progress >= 25 ? 'in-progress' : 'todo' },
  { id: `${prefix}-t3`, title: 'Design Execution', assignee: 'Hung', deadline: 'Mar 18', priority: 'medium', status: progress >= 80 ? 'approved' : progress >= 50 ? 'ready-for-review' : progress >= 25 ? 'in-progress' : 'todo' },
  { id: `${prefix}-t4`, title: 'Typography & Layout', assignee: 'Trang', deadline: 'Mar 19', priority: 'medium', status: progress >= 85 ? 'approved' : progress >= 60 ? 'ready-for-review' : 'todo' },
  { id: `${prefix}-t5`, title: 'Final Revisions', assignee: 'Minh', deadline: 'Mar 20', priority: 'low', status: progress >= 95 ? 'approved' : 'todo' },
  { id: `${prefix}-t6`, title: 'Export & Submission', assignee: 'Lan', deadline: 'Mar 21', priority: 'low', status: progress >= 100 ? 'approved' : 'todo' },
];

const makeTimeline = (deadline: string, progress: number): TimelineMilestone[] => [
  { week: 'Week 1', milestone: 'Research & Brief',     date: 'Mar 1',    done: progress > 20  },
  { week: 'Week 2', milestone: 'Concept Development',  date: 'Mar 8',    done: progress > 45  },
  { week: 'Week 3', milestone: 'Design Execution',     date: 'Mar 15',   done: progress > 70  },
  { week: 'Week 4', milestone: 'Final Presentation',   date: deadline,   done: progress >= 100 },
];

const makeComments = (groupName: string): GroupComment[] => [
  { id: 'c1', author: 'Nguyen Thi Lan',    role: 'student',   text: `${groupName} — concept draft is done, ready for feedback.`, time: '2 days ago' },
  { id: 'c2', author: 'Dr. Tran Van Minh', role: 'lecturer',  text: 'Please improve typographic hierarchy on the cover page.', time: '1 day ago', taskRef: 'Design Execution' },
  { id: 'c3', author: 'Ho Duc Hung',       role: 'student',   text: 'Updated as requested, resubmitted for review.', time: '5 hours ago', taskRef: 'Design Execution' },
];

const g = (
  id: string, name: string, className: string, progress: number,
  deadline: string, members: number, initials: string[], status: ReviewStatus, desc: string,
): LecturerGroup => ({
  id, name, className, progress, deadline, members, avatarInitials: initials,
  reviewStatus: status, description: desc,
  tasks: makeTasks(id, progress),
  timeline: makeTimeline(deadline, progress),
  comments: makeComments(name),
});

export const mockLecturerGroups: LecturerGroup[] = [
  // ── Multimedia Capstone ───────────────────────────────────────────
  g('g01', 'Poster Campaign',        'Multimedia Capstone', 65, 'Mar 20', 4, ['NL','HD','MT','TP'], 'on-track',  'Brand awareness poster series for a local NGO.'),
  g('g02', 'Animation Short',        'Multimedia Capstone', 40, 'Mar 18', 5, ['BQ','LH','NM','TA','VD'], 'at-risk', '60-second animated explainer for a start-up product.'),
  g('g03', 'Social Media Pack',      'Multimedia Capstone', 75, 'Mar 22', 4, ['PH','QN','TL','MV'], 'on-track',  'Full Instagram/Facebook content pack for a fashion brand.'),
  g('g04', 'UI/UX Prototype',        'Multimedia Capstone', 30, 'Mar 19', 5, ['AN','BT','CH','DL','EV'], 'at-risk', 'Mobile app UI prototype for a food delivery service.'),
  g('g05', 'Photography Series',     'Multimedia Capstone', 90, 'Mar 17', 3, ['FN','GH','HI'], 'on-track',       '10-piece urban photography campaign with editorial copy.'),
  g('g06', 'Branding Identity',      'Multimedia Capstone', 55, 'Mar 23', 4, ['IJ','JK','KL','LM'], 'on-track',  'Full branding package for a new cafe chain.'),
  g('g07', 'Video Commercial',       'Multimedia Capstone', 20, 'Mar 18', 5, ['MN','NO','OP','PQ','QR'], 'overdue','30-second TV commercial for a consumer electronics brand.'),
  g('g08', 'Magazine Layout',        'Multimedia Capstone', 80, 'Mar 24', 4, ['RS','ST','TU','UV'], 'on-track',  '16-page editorial magazine layout for a student publication.'),
  g('g09', 'Motion Graphics',        'Multimedia Capstone', 48, 'Mar 20', 3, ['VW','WX','XY'], 'at-risk',        'Motion graphics intro sequence for a podcast channel.'),
  g('g10', 'Infographic Series',     'Multimedia Capstone', 70, 'Mar 21', 4, ['YZ','ZA','AB','BC'], 'on-track',  'Data-driven infographic series on climate change.'),

  // ── Poster Design ─────────────────────────────────────────────────
  g('g11', 'Film Festival Poster',   'Poster Design', 85, 'Mar 18', 4, ['CD','DE','EF','FG'], 'on-track',   'Official poster design for the annual uni film festival.'),
  g('g12', 'Music Gig Series',       'Poster Design', 35, 'Mar 19', 5, ['GH','HI','IJ','JK','KL'], 'at-risk','Series of 5 concert posters for a campus music event.'),
  g('g13', 'Tech Conference',        'Poster Design', 60, 'Mar 22', 4, ['LM','MN','NO','OP'], 'on-track',   'Event branding and poster suite for a tech summit.'),
  g('g14', 'Charity Campaign',       'Poster Design', 10, 'Mar 17', 3, ['PQ','QR','RS'], 'overdue',          'Awareness poster campaign for a children\'s charity.'),
  g('g15', 'Sports Day',             'Poster Design', 92, 'Mar 20', 5, ['ST','TU','UV','VW','WX'], 'on-track', 'Promotional materials for university annual sports day.'),
  g('g16', 'Cultural Expo',          'Poster Design', 50, 'Mar 23', 4, ['XY','YZ','ZA','AB'], 'on-track',   'Exhibition identity and navigational posters for cultural expo.'),
  g('g17', 'Mental Health Awareness','Poster Design', 25, 'Mar 18', 3, ['BC','CD','DE'], 'overdue',           'Public awareness poster set on mental health themes.'),
  g('g18', 'Startup Pitch Deck',     'Poster Design', 78, 'Mar 24', 5, ['EF','FG','GH','HI','IJ'], 'on-track','Visual identity and pitch collateral for a student startup.'),
  g('g19', 'Sustainability Week',    'Poster Design', 45, 'Mar 21', 4, ['JK','KL','LM','MN'], 'at-risk',     'Eco-themed poster series for campus sustainability campaign.'),
  g('g20', 'Food & Culture Fest',    'Poster Design', 68, 'Mar 22', 4, ['NO','OP','PQ','QR'], 'on-track',   'Event promotion materials for annual food and culture festival.'),
];

export const LECTURER_CLASSES = ['Multimedia Capstone', 'Poster Design'] as const;

export const lecturerNotifications = [
  { id: 'n1', text: 'Group 2 submitted "Design Execution" for review',   time: '10 min ago', read: false, type: 'review' },
  { id: 'n2', text: 'Group 7 is overdue — Video Commercial delayed',     time: '1 hour ago',  read: false, type: 'overdue' },
  { id: 'n3', text: 'Group 5 reached milestone: Photography Series 90%', time: '3 hours ago', read: false, type: 'milestone' },
  { id: 'n4', text: 'Group 14 missed deadline — Charity Campaign',       time: '1 day ago',   read: true,  type: 'overdue' },
  { id: 'n5', text: 'Group 11 submitted final poster for approval',      time: '2 days ago',  read: true,  type: 'review' },
];
