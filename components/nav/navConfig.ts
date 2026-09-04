import { 
  DsrtHome, DsrtProjects, DsrtVentures, DsrtLookingFor, DsrtMail, 
  DsrtCommunity, DsrtNetwork, DsrtMyCommunities, DsrtEvents, DsrtResources, DsrtSettings 
} from '../icons/DsrtIcons'
import { CocoIcon } from '../icons/CocoIcon'

export type NavSubItem = { id: string; label: string; href: string }
export type NavItem = { 
  id: string; 
  label: string; 
  href: string; 
  icon: any; 
  group: 'main' | 'community' | 'explore' | 'footer';
  badgeKey?: 'messages' | 'invitations' | 'inbox';
  children?: NavSubItem[] 
}

export const dsrtNavigation: NavItem[] = [
  // --- MAIN ---
  {
    id: 'home', label: 'Home', href: '/home', icon: DsrtHome, group: 'main',
    children: [
      { id: 'feed', label: 'Feed', href: '/feed' },
      { id: 'following', label: 'Following', href: '/following' },
      { id: 'trending', label: 'Trending', href: '/trending' },
      { id: 'pulse', label: 'Pulse', href: '/pulse' },
    ]
  },
  {
    id: 'projects', label: 'Projects', href: '/projects', icon: DsrtProjects, group: 'main',
    children: [
      { id: 'dashboard', label: 'Dashboard', href: '/projects' },
      { id: 'explore', label: 'Explore', href: '/projects/explore' },
      { id: 'saved', label: 'Saved', href: '/projects/saved' },
    ]
  },
  {
    id: 'ventures', label: 'Ventures', href: '/ventures', icon: DsrtVentures, group: 'main',
    children: [
      { id: 'my', label: 'My Ventures', href: '/ventures/my' },
      { id: 'explore', label: 'Explore', href: '/ventures/explore' },
      { id: 'following', label: 'Following', href: '/ventures/following' },
      { id: 'drafts', label: 'Drafts', href: '/ventures/drafts' },
    ]
  },
  {
    id: 'looking-for', label: 'Looking For', href: '/looking-for', icon: DsrtLookingFor, group: 'main',
    children: [
      { id: 'explore', label: 'Explore', href: '/looking-for' },
      { id: 'my-applications', label: 'My Applications', href: '/looking-for/my-applications' },
      { id: 'my-opportunities', label: 'My Opportunities', href: '/looking-for/my-opportunities' },
      { id: 'invitations', label: 'Invitations', href: '/looking-for/invitations' },
    ]
  },
  {
    id: 'mail', label: 'DSRT Mail', href: '/inbox', icon: DsrtMail, badgeKey: 'inbox', group: 'main',
    children: [
      { id: 'inbox', label: 'Inbox', href: '/inbox' },
      { id: 'settings', label: 'Settings', href: '/inbox/settings' },
    ]
  },
  {
    id: 'coco', label: 'COCO', href: '/coco', icon: CocoIcon, group: 'main'
  },

  // --- COMMUNITY HUB ---
  {
    id: 'community', label: 'Discover', href: '/community', icon: DsrtCommunity, group: 'community',
    children: [
      { id: 'discover', label: 'Discover', href: '/community' },
    ]
  },
  {
    id: 'network', label: 'My Network', href: '/my-network', icon: DsrtNetwork, badgeKey: 'invitations', group: 'community'
  },
  {
    id: 'my-communities', label: 'My Communities', href: '/my-communities', icon: DsrtMyCommunities, group: 'community'
  },

  // --- EXPLORE ---
  {
    id: 'events', label: 'Events', href: '/events', icon: DsrtEvents, group: 'explore'
  },
  {
    id: 'resources', label: 'Resources', href: '/resources', icon: DsrtResources, group: 'explore'
  },
]