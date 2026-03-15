import { GOLD, MIDGREY } from "../../constants/colors";

export const CompassIcon = ({ size=24, color=GOLD }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="7"/>
    <polygon points="12,4 13.5,11 12,10 10.5,11" fill={color} stroke="none"/>
    <polygon points="12,20 10.5,13 12,14 13.5,13" fill={MIDGREY} stroke="none"/>
    <polygon points="20,12 13,10.5 14,12 13,13.5" fill={MIDGREY} stroke="none"/>
    <polygon points="4,12 11,13.5 10,12 11,10.5"  fill={MIDGREY} stroke="none"/>
  </svg>
);

export const CrossIcon = ({ size=18, color=GOLD }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="3" x2="12" y2="21"/><line x1="5" y1="9" x2="19" y2="9"/>
  </svg>
);

export const HeartIcon = ({ filled, size=16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? GOLD : "none"} stroke={GOLD} strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

export const EyeIcon = ({ show }) => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={MIDGREY} strokeWidth="2" strokeLinecap="round">
    {show
      ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
      : <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
          <line x1="1" y1="1" x2="23" y2="23"/></>
    }
  </svg>
);

export const HomeIcon    = ({ a }) => <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={a?GOLD:MIDGREY} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>;
export const BookIcon    = ({ a }) => <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={a?GOLD:MIDGREY} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
export const AdvisorIcon = ({ a }) => {
  const c = a ? GOLD : MIDGREY;
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="7"/>
      <polygon points="12,4 13.5,11 12,10 10.5,11" fill={c} stroke="none"/>
      <polygon points="12,20 10.5,13 12,14 13.5,13" fill={a ? MIDGREY : "rgba(122,118,114,0.4)"} stroke="none"/>
      <polygon points="20,12 13,10.5 14,12 13,13.5" fill={a ? MIDGREY : "rgba(122,118,114,0.4)"} stroke="none"/>
      <polygon points="4,12 11,13.5 10,12 11,10.5"  fill={a ? MIDGREY : "rgba(122,118,114,0.4)"} stroke="none"/>
    </svg>
  );
};
export const UsersIcon   = ({ a }) => <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={a?GOLD:MIDGREY} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
export const ProfileIcon = ({ a }) => <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={a?GOLD:MIDGREY} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;

export const GoogleLogo = () => (
  <svg width={20} height={20} viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);
