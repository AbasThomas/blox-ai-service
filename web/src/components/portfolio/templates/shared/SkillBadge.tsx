import type { IconType } from 'react-icons';
import {
  SiAffinitydesigner,
  SiAffinityphoto,
  SiAngular,
  SiDjango,
  SiDocker,
  SiExpress,
  SiFigma,
  SiFirebase,
  SiFlutter,
  SiFramer,
  SiGit,
  SiGithub,
  SiGo,
  SiGraphql,
  SiHtml5,
  SiJavascript,
  SiOpenjdk,
  SiLaravel,
  SiMysql,
  SiNextdotjs,
  SiNodedotjs,
  SiPostgresql,
  SiReact,
  SiRedis,
  SiSketch,
  SiSpring,
  SiTailwindcss,
  SiTypescript,
  SiVuedotjs,
  SiWebflow,
  SiXdadevelopers,
} from 'react-icons/si';
import { FaPenRuler, FaPaintbrush } from 'react-icons/fa6';
import { FiCode } from 'react-icons/fi';

export type SkillPersona = 'developer' | 'designer' | 'general';

interface SkillIconMatch {
  icon: IconType;
  colorClass: string;
}

const SKILL_ICON_MAP: Record<string, SkillIconMatch> = {
  react: { icon: SiReact, colorClass: 'text-cyan-400' },
  javascript: { icon: SiJavascript, colorClass: 'text-yellow-400' },
  typescript: { icon: SiTypescript, colorClass: 'text-blue-400' },
  'node.js': { icon: SiNodedotjs, colorClass: 'text-green-500' },
  nodejs: { icon: SiNodedotjs, colorClass: 'text-green-500' },
  java: { icon: SiOpenjdk, colorClass: 'text-orange-400' },
  spring: { icon: SiSpring, colorClass: 'text-green-500' },
  django: { icon: SiDjango, colorClass: 'text-emerald-500' },
  express: { icon: SiExpress, colorClass: 'text-slate-300' },
  graphql: { icon: SiGraphql, colorClass: 'text-pink-400' },
  nextjs: { icon: SiNextdotjs, colorClass: 'text-slate-100' },
  'next.js': { icon: SiNextdotjs, colorClass: 'text-slate-100' },
  vue: { icon: SiVuedotjs, colorClass: 'text-emerald-400' },
  'vue.js': { icon: SiVuedotjs, colorClass: 'text-emerald-400' },
  angular: { icon: SiAngular, colorClass: 'text-rose-500' },
  docker: { icon: SiDocker, colorClass: 'text-blue-400' },
  go: { icon: SiGo, colorClass: 'text-cyan-400' },
  git: { icon: SiGit, colorClass: 'text-orange-500' },
  github: { icon: SiGithub, colorClass: 'text-slate-200' },
  html: { icon: SiHtml5, colorClass: 'text-orange-500' },
  postgresql: { icon: SiPostgresql, colorClass: 'text-blue-400' },
  postgres: { icon: SiPostgresql, colorClass: 'text-blue-400' },
  mysql: { icon: SiMysql, colorClass: 'text-blue-500' },
  redis: { icon: SiRedis, colorClass: 'text-red-400' },
  firebase: { icon: SiFirebase, colorClass: 'text-amber-400' },
  flutter: { icon: SiFlutter, colorClass: 'text-sky-400' },
  figma: { icon: SiFigma, colorClass: 'text-pink-400' },
  'adobe xd': { icon: SiXdadevelopers, colorClass: 'text-fuchsia-400' },
  sketch: { icon: SiSketch, colorClass: 'text-orange-400' },
  photoshop: { icon: FaPaintbrush, colorClass: 'text-blue-400' },
  illustrator: { icon: FaPenRuler, colorClass: 'text-amber-400' },
  'affinity photo': { icon: SiAffinityphoto, colorClass: 'text-cyan-400' },
  'affinity designer': { icon: SiAffinitydesigner, colorClass: 'text-orange-400' },
  framer: { icon: SiFramer, colorClass: 'text-violet-300' },
  webflow: { icon: SiWebflow, colorClass: 'text-indigo-400' },
  tailwind: { icon: SiTailwindcss, colorClass: 'text-cyan-400' },
  tailwindcss: { icon: SiTailwindcss, colorClass: 'text-cyan-400' },
  laravel: { icon: SiLaravel, colorClass: 'text-rose-500' },
};

const DESIGNER_TOKENS = ['figma', 'adobe', 'ux', 'ui', 'sketch', 'framer', 'webflow'];
const DEVELOPER_TOKENS = ['react', 'node', 'typescript', 'javascript', 'api', 'backend', 'frontend', 'java', 'docker'];

export function detectSkillPersona(skills: string[]): SkillPersona {
  if (skills.length === 0) return 'general';
  const lower = skills.map((skill) => skill.toLowerCase());
  const designerHits = lower.filter((skill) => DESIGNER_TOKENS.some((token) => skill.includes(token))).length;
  const developerHits = lower.filter((skill) => DEVELOPER_TOKENS.some((token) => skill.includes(token))).length;
  if (designerHits > developerHits) return 'designer';
  if (developerHits > designerHits) return 'developer';
  return 'general';
}

function getSkillIcon(skill: string): SkillIconMatch {
  const normalized = skill.toLowerCase().trim();
  return SKILL_ICON_MAP[normalized] ?? { icon: FiCode, colorClass: 'text-slate-400' };
}

interface SkillBadgeProps {
  skill: string;
  persona?: SkillPersona;
  className?: string;
  iconClassName?: string;
}

export function SkillBadge({
  skill,
  persona = 'general',
  className = '',
  iconClassName = '',
}: SkillBadgeProps) {
  const { icon: Icon, colorClass } = getSkillIcon(skill);
  const personaTone =
    persona === 'designer'
      ? 'bg-pink-500/10 border-pink-400/25 text-slate-100'
      : persona === 'developer'
        ? 'bg-emerald-500/10 border-emerald-400/25 text-slate-100'
        : 'bg-slate-500/10 border-slate-400/20 text-slate-100';

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${personaTone} ${className}`}
    >
      <Icon className={`h-4 w-4 ${colorClass} ${iconClassName}`} aria-hidden="true" />
      <span>{skill}</span>
    </span>
  );
}
