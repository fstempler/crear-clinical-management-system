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
  chevron: <path d="m9 18 6-6-6-6" />,
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
