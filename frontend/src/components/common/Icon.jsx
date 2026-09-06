const icons = {
  home: (
    <>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v11h14V10M9 21v-7h6v7" />
    </>
  ),
  patients: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c.5-3.5 2.3-5 5.5-5s5 1.5 5.5 5M16 7a3 3 0 0 1 0 6M17 14c2.3.4 3.6 1.8 4 5" />
    </>
  ),
  activity: (
    <>
      <path d="M4 4v6h6" />
      <path d="M5.5 17a8 8 0 1 0 .5-11l-2 4" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  professional: (
    <>
      <circle cx="12" cy="7" r="4" />
      <path d="M5 21v-2a7 7 0 0 1 14 0v2M9 14l3 3 3-3" />
    </>
  ),
  account: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  logout: (
    <>
      <path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14M5 12h14" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </>
  ),
  close: (
    <>
      <path d="m5 5 14 14M19 5 5 19" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </>
  ),
  clear: (
    <>
      <path d="m6 6 12 12M18 6 6 18" />
    </>
  ),
  filter: (
    <>
      <path d="M4 6h16M7 12h10M10 18h4" />
    </>
  ),
  phone: (
    <path d="M6.6 3h3l1.5 4-2 1.4a15 15 0 0 0 6.5 6.5l1.4-2 4 1.5v3c0 2-1.6 3.6-3.6 3.6A14.4 14.4 0 0 1 3 6.6C3 4.6 4.6 3 6.6 3Z" />
  ),
  chevron: <path d="m9 18 6-6-6-6" />,
  "arrow-left": (
    <>
      <path d="m15 18-6-6 6-6" />
      <path d="M9 12h11" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16 9" />
    </>
  ),
  edit: (
    <>
      <path d="M13 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-8" />
      <path d="m10 14 1-4 7-7 3 3-7 7-4 1Z" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </>
  ),
  retry: (
    <>
      <path d="M20 7v5h-5" />
      <path d="M18 16a8 8 0 1 1 1-8l1 4" />
    </>
  ),
  file: (
    <>
      <path d="M6 2h8l4 4v16H6z" />
      <path d="M14 2v5h5M9 12h6M9 16h6" />
    </>
  ),
  folder: (
    <path d="M3 6h7l2 2h9v11H3z" />
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  shield: (
    <path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6z" />
  ),
};
export function Icon({ name, size = 24, className }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}
