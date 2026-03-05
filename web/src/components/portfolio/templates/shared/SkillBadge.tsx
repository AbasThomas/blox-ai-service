import type { IconType } from 'react-icons';
import {
  SiAffinitydesigner,
  SiAffinityphoto,
  SiAngular,
  SiBlender,
  SiCanva,
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
  SiGooglecloud,
  SiGraphql,
  SiGimp,
  SiHtml5,
  SiInkscape,
  SiJavascript,
  SiKubernetes,
  SiOpenjdk,
  SiLaravel,
  SiMongodb,
  SiMysql,
  SiNextdotjs,
  SiNodedotjs,
  SiPostgresql,
  SiPython,
  SiReact,
  SiRedis,
  SiRust,
  SiSketch,
  SiSpring,
  SiTailwindcss,
  SiTypescript,
  SiUnity,
  SiVuedotjs,
  SiWebflow,
  SiCss,
  SiLinux,
  SiUbuntu,
  SiNestjs,
  SiPrisma,
  SiSupabase,
  SiVercel,
  SiNetlify,
} from 'react-icons/si';
import { FaPenRuler, FaPaintbrush, FaCube } from 'react-icons/fa6';
import { FiCode } from 'react-icons/fi';
import {
  TbBrandAdobe,
  TbBrandAdobeAfterEffect,
  TbBrandAdobeIllustrator,
  TbBrandAdobeIndesign,
  TbBrandAdobePhotoshop,
  TbBrandAdobePremier,
  TbBrandAdobeXd,
  TbBrandAws,
  TbBrandAzure,
} from 'react-icons/tb';

export type SkillPersona = 'developer' | 'designer' | 'general';

interface SkillIconMatch {
  icon: IconType;
  colorClass: string;
  hex?: string;
}

const SKILL_ICON_MAP: Record<string, SkillIconMatch> = {
  // Frontend frameworks
  react: { icon: SiReact, colorClass: 'text-cyan-400', hex: '#61DAFB' },
  javascript: { icon: SiJavascript, colorClass: 'text-yellow-400', hex: '#F7DF1E' },
  typescript: { icon: SiTypescript, colorClass: 'text-blue-400', hex: '#3178C6' },
  'next.js': { icon: SiNextdotjs, colorClass: 'text-slate-100', hex: '#000000' },
  nextjs: { icon: SiNextdotjs, colorClass: 'text-slate-100', hex: '#000000' },
  vue: { icon: SiVuedotjs, colorClass: 'text-emerald-400', hex: '#4FC08D' },
  'vue.js': { icon: SiVuedotjs, colorClass: 'text-emerald-400', hex: '#4FC08D' },
  angular: { icon: SiAngular, colorClass: 'text-rose-500', hex: '#DD0031' },
  html: { icon: SiHtml5, colorClass: 'text-orange-500', hex: '#E34F26' },
  css: { icon: SiCss, colorClass: 'text-blue-500', hex: '#1572B6' },
  tailwind: { icon: SiTailwindcss, colorClass: 'text-cyan-400', hex: '#06B6D4' },
  tailwindcss: { icon: SiTailwindcss, colorClass: 'text-cyan-400', hex: '#06B6D4' },

  // Backend
  'node.js': { icon: SiNodedotjs, colorClass: 'text-green-500', hex: '#339933' },
  nodejs: { icon: SiNodedotjs, colorClass: 'text-green-500', hex: '#339933' },
  express: { icon: SiExpress, colorClass: 'text-slate-300', hex: '#000000' },
  nestjs: { icon: SiNestjs, colorClass: 'text-rose-500', hex: '#E0234E' },
  django: { icon: SiDjango, colorClass: 'text-emerald-500', hex: '#092E20' },
  laravel: { icon: SiLaravel, colorClass: 'text-rose-500', hex: '#FF2D20' },
  spring: { icon: SiSpring, colorClass: 'text-green-500', hex: '#6DB33F' },
  java: { icon: SiOpenjdk, colorClass: 'text-orange-400', hex: '#ED8B00' },
  python: { icon: SiPython, colorClass: 'text-yellow-400', hex: '#3776AB' },
  rust: { icon: SiRust, colorClass: 'text-orange-500', hex: '#000000' },
  go: { icon: SiGo, colorClass: 'text-cyan-400', hex: '#00ACD7' },
  graphql: { icon: SiGraphql, colorClass: 'text-pink-400', hex: '#E10098' },

  // Mobile
  flutter: { icon: SiFlutter, colorClass: 'text-sky-400', hex: '#02569B' },

  // Database
  postgresql: { icon: SiPostgresql, colorClass: 'text-blue-400', hex: '#336791' },
  postgres: { icon: SiPostgresql, colorClass: 'text-blue-400', hex: '#336791' },
  mysql: { icon: SiMysql, colorClass: 'text-blue-500', hex: '#4479A1' },
  redis: { icon: SiRedis, colorClass: 'text-red-400', hex: '#DC382D' },
  mongodb: { icon: SiMongodb, colorClass: 'text-green-500', hex: '#47A248' },
  firebase: { icon: SiFirebase, colorClass: 'text-amber-400', hex: '#FFCA28' },
  prisma: { icon: SiPrisma, colorClass: 'text-slate-300', hex: '#2D3748' },
  supabase: { icon: SiSupabase, colorClass: 'text-emerald-400', hex: '#3ECF8E' },

  // DevOps / Cloud
  docker: { icon: SiDocker, colorClass: 'text-blue-400', hex: '#2496ED' },
  kubernetes: { icon: SiKubernetes, colorClass: 'text-blue-500', hex: '#326CE5' },
  aws: { icon: TbBrandAws, colorClass: 'text-orange-400', hex: '#FF9900' },
  'amazon web services': { icon: TbBrandAws, colorClass: 'text-orange-400', hex: '#FF9900' },
  azure: { icon: TbBrandAzure, colorClass: 'text-blue-400', hex: '#0078D4' },
  'microsoft azure': { icon: TbBrandAzure, colorClass: 'text-blue-400', hex: '#0078D4' },
  'google cloud': { icon: SiGooglecloud, colorClass: 'text-blue-400', hex: '#4285F4' },
  gcp: { icon: SiGooglecloud, colorClass: 'text-blue-400', hex: '#4285F4' },
  vercel: { icon: SiVercel, colorClass: 'text-slate-100', hex: '#000000' },
  netlify: { icon: SiNetlify, colorClass: 'text-teal-400', hex: '#00C7B7' },
  linux: { icon: SiLinux, colorClass: 'text-yellow-400', hex: '#FCC624' },
  ubuntu: { icon: SiUbuntu, colorClass: 'text-orange-500', hex: '#E95420' },

  // Version control
  git: { icon: SiGit, colorClass: 'text-orange-500', hex: '#F05032' },
  github: { icon: SiGithub, colorClass: 'text-slate-200', hex: '#181717' },

  // Design tools — Adobe
  'adobe photoshop': { icon: TbBrandAdobePhotoshop, colorClass: 'text-blue-400', hex: '#31A8FF' },
  photoshop: { icon: TbBrandAdobePhotoshop, colorClass: 'text-blue-400', hex: '#31A8FF' },
  'adobe illustrator': { icon: TbBrandAdobeIllustrator, colorClass: 'text-orange-400', hex: '#FF9A00' },
  illustrator: { icon: TbBrandAdobeIllustrator, colorClass: 'text-orange-400', hex: '#FF9A00' },
  'adobe premiere': { icon: TbBrandAdobePremier, colorClass: 'text-violet-400', hex: '#9999FF' },
  'premiere pro': { icon: TbBrandAdobePremier, colorClass: 'text-violet-400', hex: '#9999FF' },
  premiere: { icon: TbBrandAdobePremier, colorClass: 'text-violet-400', hex: '#9999FF' },
  'after effects': { icon: TbBrandAdobeAfterEffect, colorClass: 'text-violet-400', hex: '#9999FF' },
  aftereffects: { icon: TbBrandAdobeAfterEffect, colorClass: 'text-violet-400', hex: '#9999FF' },
  'adobe after effects': { icon: TbBrandAdobeAfterEffect, colorClass: 'text-violet-400', hex: '#9999FF' },
  'adobe indesign': { icon: TbBrandAdobeIndesign, colorClass: 'text-pink-400', hex: '#FF3366' },
  indesign: { icon: TbBrandAdobeIndesign, colorClass: 'text-pink-400', hex: '#FF3366' },
  lightroom: { icon: TbBrandAdobe, colorClass: 'text-blue-300', hex: '#31A8FF' },
  'adobe lightroom': { icon: TbBrandAdobe, colorClass: 'text-blue-300', hex: '#31A8FF' },
  audition: { icon: TbBrandAdobe, colorClass: 'text-teal-400', hex: '#00E4BB' },
  'adobe audition': { icon: TbBrandAdobe, colorClass: 'text-teal-400', hex: '#00E4BB' },
  'adobe xd': { icon: TbBrandAdobeXd, colorClass: 'text-fuchsia-400', hex: '#FF61F6' },
  xd: { icon: TbBrandAdobeXd, colorClass: 'text-fuchsia-400', hex: '#FF61F6' },

  // Design tools — Other
  figma: { icon: SiFigma, colorClass: 'text-pink-400', hex: '#F24E1E' },
  sketch: { icon: SiSketch, colorClass: 'text-orange-400', hex: '#F7B500' },
  canva: { icon: SiCanva, colorClass: 'text-cyan-400', hex: '#00C4CC' },
  blender: { icon: SiBlender, colorClass: 'text-orange-400', hex: '#E87D0D' },
  framer: { icon: SiFramer, colorClass: 'text-violet-300', hex: '#0055FF' },
  webflow: { icon: SiWebflow, colorClass: 'text-indigo-400', hex: '#4353FF' },
  'affinity photo': { icon: SiAffinityphoto, colorClass: 'text-cyan-400', hex: '#7E4DD2' },
  'affinity designer': { icon: SiAffinitydesigner, colorClass: 'text-orange-400', hex: '#1B72BE' },
  gimp: { icon: SiGimp, colorClass: 'text-slate-300', hex: '#5C5543' },
  inkscape: { icon: SiInkscape, colorClass: 'text-slate-300', hex: '#000000' },
  coreldraw: { icon: FaPenRuler, colorClass: 'text-green-400', hex: '#008200' },
  'corel draw': { icon: FaPenRuler, colorClass: 'text-green-400', hex: '#008200' },
  procreate: { icon: FaPaintbrush, colorClass: 'text-slate-300', hex: '#000000' },
  'cinema 4d': { icon: FaCube, colorClass: 'text-blue-300', hex: '#011A6A' },
  c4d: { icon: FaCube, colorClass: 'text-blue-300', hex: '#011A6A' },
  maya: { icon: FaCube, colorClass: 'text-sky-400', hex: '#0078D4' },
  '3ds max': { icon: FaCube, colorClass: 'text-blue-500', hex: '#0696D7' },
  unity: { icon: SiUnity, colorClass: 'text-slate-200', hex: '#000000' },
};

const DESIGNER_TOKENS = ['figma', 'adobe', 'ux', 'ui', 'sketch', 'framer', 'webflow', 'canva', 'blender', 'procreate', 'illustrator', 'photoshop', 'indesign', 'lightroom', 'premiere', 'after effects', 'affinity', 'gimp', 'inkscape', 'coreldraw', 'cinema', 'maya'];
const DEVELOPER_TOKENS = ['react', 'node', 'typescript', 'javascript', 'api', 'backend', 'frontend', 'java', 'docker', 'python', 'rust', 'go', 'kubernetes', 'aws', 'azure', 'cloud', 'mongodb', 'postgresql', 'nestjs', 'django', 'laravel'];

export function detectSkillPersona(skills: string[]): SkillPersona {
  if (skills.length === 0) return 'general';
  const lower = skills.map((s) => s.toLowerCase());
  const designerHits = lower.filter((s) => DESIGNER_TOKENS.some((t) => s.includes(t))).length;
  const developerHits = lower.filter((s) => DEVELOPER_TOKENS.some((t) => s.includes(t))).length;
  if (designerHits > developerHits) return 'designer';
  if (developerHits > designerHits) return 'developer';
  return 'general';
}

export function getSkillIconData(skill: string): SkillIconMatch {
  const normalized = skill.toLowerCase().trim();
  return SKILL_ICON_MAP[normalized] ?? { icon: FiCode, colorClass: 'text-slate-400', hex: '#64748b' };
}

function getSkillIcon(skill: string): SkillIconMatch {
  return getSkillIconData(skill);
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
