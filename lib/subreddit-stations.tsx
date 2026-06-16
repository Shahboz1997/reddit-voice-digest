import type { ReactElement, ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function IconBase({ className, children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      {...props}
    >
      {children}
    </svg>
  );
}

function IconProductivity(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </IconBase>
  );
}

function IconFinance(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </IconBase>
  );
}

function IconEntrepreneur(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </IconBase>
  );
}

function IconInvesting(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </IconBase>
  );
}

function IconTechnology(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect height="14" rx="2" width="20" x="2" y="3" />
      <path d="M8 21h8M12 17v4" />
    </IconBase>
  );
}

function IconHealth(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </IconBase>
  );
}

function IconFuturology(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      <path d="M19 3v4M21 5h-4" />
    </IconBase>
  );
}

function IconDefault(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8M12 8v8" />
    </IconBase>
  );
}

export interface SubredditStationMeta {
  label: string;
  Icon: (props: IconProps) => ReactElement;
}

const STATION_BY_NAME: Record<string, SubredditStationMeta> = {
  productivity: { label: "Productivity", Icon: IconProductivity },
  lifeprotips: { label: "Life Pro Tips", Icon: IconProductivity },
  getdisciplined: { label: "Get Disciplined", Icon: IconProductivity },
  getmotivated: { label: "Get Motivated", Icon: IconProductivity },
  selfimprovement: { label: "Self Improvement", Icon: IconProductivity },
  decidingtobebetter: { label: "Be Better", Icon: IconProductivity },
  notion: { label: "Notion", Icon: IconTechnology },
  todoist: { label: "Todoist", Icon: IconProductivity },
  personalfinance: { label: "Personal Finance", Icon: IconFinance },
  entrepreneur: { label: "Entrepreneur", Icon: IconEntrepreneur },
  investing: { label: "Investing", Icon: IconInvesting },
  stocks: { label: "Stocks", Icon: IconInvesting },
  startups: { label: "Startups", Icon: IconEntrepreneur },
  technology: { label: "Technology", Icon: IconTechnology },
  programming: { label: "Programming", Icon: IconTechnology },
  webdev: { label: "Web Dev", Icon: IconTechnology },
  machinelearning: { label: "Machine Learning", Icon: IconTechnology },
  datascience: { label: "Data Science", Icon: IconTechnology },
  learnprogramming: { label: "Learn Code", Icon: IconTechnology },
  apple: { label: "Apple", Icon: IconTechnology },
  android: { label: "Android", Icon: IconTechnology },
  health: { label: "Health", Icon: IconHealth },
  fitness: { label: "Fitness", Icon: IconHealth },
  nutrition: { label: "Nutrition", Icon: IconHealth },
  mentalhealth: { label: "Mental Health", Icon: IconHealth },
  futurology: { label: "Futurology", Icon: IconFuturology },
  science: { label: "Science", Icon: IconFuturology },
  space: { label: "Space", Icon: IconFuturology },
  askscience: { label: "Ask Science", Icon: IconFuturology },
  todayilearned: { label: "Today I Learned", Icon: IconFuturology },
  explainlikeimfive: { label: "ELI5", Icon: IconFuturology },
  askreddit: { label: "Ask Reddit", Icon: IconDefault },
  nostupidquestions: { label: "No Stupid Qs", Icon: IconDefault },
  worldnews: { label: "World News", Icon: IconDefault },
  news: { label: "News", Icon: IconDefault },
  jobs: { label: "Jobs", Icon: IconEntrepreneur },
  books: { label: "Books", Icon: IconDefault },
  gaming: { label: "Gaming", Icon: IconDefault },
  funny: { label: "Funny", Icon: IconDefault },
  aww: { label: "Aww", Icon: IconDefault },
};

export function getSubredditStation(name: string): SubredditStationMeta {
  const key = name.toLowerCase();
  return (
    STATION_BY_NAME[key] ?? {
      label: name.charAt(0).toUpperCase() + name.slice(1),
      Icon: IconDefault,
    }
  );
}
